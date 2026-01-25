/**
 * Case Matching Service
 * 
 * Matches documents to existing cases based on extracted entities.
 * Uses fuzzy matching on client names, DOB, incident dates, and claim numbers.
 */

import connectDB from '@/lib/db/connect';
import { Case } from '@/lib/db/models';
import { EntityExtractionResult } from './entity-extraction.service';

// ============================================
// Types
// ============================================

export interface CaseMatch {
  caseId: string;
  caseNumber: string;
  clientName: string;
  confidence: number;
  matchReason: string;
}

interface CaseDocument {
  _id: string;
  caseNumber: string;
  client: {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    email?: string;
    phone?: string;
  };
  incident: {
    date?: Date;
    location?: {
      address?: string;
      city?: string;
      state?: string;
    };
  };
  insurance?: {
    defendantPolicy?: {
      claimNumber?: string;
      carrier?: string;
    };
  };
  status: string;
}

// ============================================
// Case Matching Logic
// ============================================

export async function findMatchingCases(entities: EntityExtractionResult): Promise<CaseMatch[]> {
  await connectDB();
  
  // If we have nothing to match on, return empty
  if (!entities.patientName && !entities.claimNumber && !entities.dateOfInjury) {
    return [];
  }
  
  // Build search criteria
  const searchCriteria: any[] = [];
  
  // Search by claim number (highest confidence)
  if (entities.claimNumber) {
    searchCriteria.push({
      'insurance.defendantPolicy.claimNumber': entities.claimNumber,
    });
  }
  
  // Search by case number
  if (entities.caseNumber) {
    searchCriteria.push({
      caseNumber: { $regex: entities.caseNumber, $options: 'i' },
    });
  }
  
  // We'll search broadly and then score matches
  const query: any = {
    status: { $nin: ['closed', 'settled'] }, // Only active cases
  };
  
  if (searchCriteria.length > 0) {
    query.$or = searchCriteria;
  }
  
  // Fetch candidate cases
  const candidates = await Case.find(query)
    .select('caseNumber client incident insurance status')
    .limit(20)
    .lean() as unknown as CaseDocument[];
  
  // If no candidates from specific search, try name-based search
  if (candidates.length === 0 && entities.patientName) {
    const nameParts = entities.patientName.split(' ').filter(Boolean);
    const nameQuery: any = {
      status: { $nin: ['closed', 'settled'] },
    };
    
    if (nameParts.length >= 2) {
      // Try to match first and last name
      nameQuery.$or = [
        {
          'client.firstName': { $regex: nameParts[0], $options: 'i' },
          'client.lastName': { $regex: nameParts[nameParts.length - 1], $options: 'i' },
        },
        {
          'client.firstName': { $regex: nameParts[nameParts.length - 1], $options: 'i' },
          'client.lastName': { $regex: nameParts[0], $options: 'i' },
        },
      ];
    } else {
      nameQuery.$or = [
        { 'client.firstName': { $regex: nameParts[0], $options: 'i' } },
        { 'client.lastName': { $regex: nameParts[0], $options: 'i' } },
      ];
    }
    
    const nameCandidates = await Case.find(nameQuery)
      .select('caseNumber client incident insurance status')
      .limit(20)
      .lean() as unknown as CaseDocument[];
    
    candidates.push(...nameCandidates);
  }
  
  // Score each candidate
  const matches: CaseMatch[] = [];
  
  for (const candidate of candidates) {
    const { score, reason } = scoreMatch(candidate, entities);
    
    if (score > 0.3) { // Minimum threshold
      matches.push({
        caseId: candidate._id.toString(),
        caseNumber: candidate.caseNumber,
        clientName: `${candidate.client.firstName} ${candidate.client.lastName}`,
        confidence: score,
        matchReason: reason,
      });
    }
  }
  
  // Sort by confidence descending
  matches.sort((a, b) => b.confidence - a.confidence);
  
  // Deduplicate
  const seen = new Set<string>();
  const deduped = matches.filter(m => {
    if (seen.has(m.caseId)) return false;
    seen.add(m.caseId);
    return true;
  });
  
  return deduped.slice(0, 5); // Top 5 matches
}

/**
 * Score how well a case matches the extracted entities
 */
function scoreMatch(
  candidate: CaseDocument,
  entities: EntityExtractionResult
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];
  
  // Claim number match (highest weight)
  if (entities.claimNumber && 
      candidate.insurance?.defendantPolicy?.claimNumber === entities.claimNumber) {
    score += 0.5;
    reasons.push('Claim number match');
  }
  
  // Name matching
  if (entities.patientName) {
    const fullName = `${candidate.client.firstName} ${candidate.client.lastName}`.toLowerCase();
    const extractedName = entities.patientName.toLowerCase();
    
    const nameScore = calculateNameSimilarity(fullName, extractedName);
    if (nameScore > 0.8) {
      score += 0.35;
      reasons.push('Strong name match');
    } else if (nameScore > 0.5) {
      score += 0.2;
      reasons.push('Partial name match');
    }
  }
  
  // DOB match
  if (entities.patientDOB && candidate.client.dateOfBirth) {
    const extractedDOB = new Date(entities.patientDOB);
    const candidateDOB = new Date(candidate.client.dateOfBirth);
    
    if (isSameDay(extractedDOB, candidateDOB)) {
      score += 0.25;
      reasons.push('DOB match');
    }
  }
  
  // Incident date match
  if (entities.dateOfInjury && candidate.incident.date) {
    const extractedDate = new Date(entities.dateOfInjury);
    const incidentDate = new Date(candidate.incident.date);
    
    const daysDiff = Math.abs(extractedDate.getTime() - incidentDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff === 0) {
      score += 0.2;
      reasons.push('Incident date match');
    } else if (daysDiff <= 7) {
      score += 0.1;
      reasons.push('Incident date within week');
    }
  }
  
  // Location match (basic)
  if (entities.incidentLocation && candidate.incident.location) {
    const location = [
      candidate.incident.location.address,
      candidate.incident.location.city,
      candidate.incident.location.state,
    ].filter(Boolean).join(' ').toLowerCase();
    
    if (location.includes(entities.incidentLocation.toLowerCase()) ||
        entities.incidentLocation.toLowerCase().includes(location)) {
      score += 0.1;
      reasons.push('Location match');
    }
  }
  
  return {
    score: Math.min(score, 1), // Cap at 1.0
    reason: reasons.join(', ') || 'No specific match criteria',
  };
}

/**
 * Calculate similarity between two names using Levenshtein-like comparison
 */
function calculateNameSimilarity(name1: string, name2: string): number {
  const words1 = name1.split(/\s+/).filter(Boolean);
  const words2 = name2.split(/\s+/).filter(Boolean);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  let matchedWords = 0;
  
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || 
          word1.startsWith(word2) || 
          word2.startsWith(word1) ||
          levenshteinDistance(word1, word2) <= 2) {
        matchedWords++;
        break;
      }
    }
  }
  
  return matchedWords / Math.max(words1.length, words2.length);
}

/**
 * Simple Levenshtein distance
 */
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  
  if (m === 0) return n;
  if (n === 0) return m;
  
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Check if two dates are the same day
 */
function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}
