/**
 * Document Analysis Service
 * 
 * This service triggers AI analysis when documents are uploaded.
 */

import mongoose from 'mongoose';
import dbConnect from '@/lib/db/dbConnect';
import Document from '@/lib/db/models/Document';
import Case from '@/lib/db/models/Case';
import { DocumentStatus, DocumentCategory } from '@/lib/db/types/enums';

// ============================================
// Types
// ============================================

export interface EntityExtractionResult {
  patientName?: string;
  providerName?: string;
  dates?: string[];
  amounts?: number[];
  addresses?: string[];
  phoneNumbers?: string[];
  caseNumbers?: string[];
}

export interface CaseMatch {
  caseId: string;
  caseNumber: string;
  clientName: string;
  confidence: number;
  matchReason: string;
}

export interface DocumentAnalysisInput {
  documentId: string;
  caseId?: string;
  extractedText: string;
  forceRoundTable?: boolean;
}

export interface DocumentAnalysisResult {
  documentId: string;
  status: DocumentStatus;
  caseId?: string;
  caseNumber?: string;
  suggestedCases?: CaseMatch[];
  entities?: EntityExtractionResult;
  roundTableSessionId?: string;
  actionId?: string;
  summary?: string;
  keyFindings?: string[];
  flags?: string[];
}

// ============================================
// Simple Entity Extraction (placeholder)
// ============================================

async function extractEntities(text: string): Promise<EntityExtractionResult> {
  const entities: EntityExtractionResult = {};
  
  // Extract dates (MM/DD/YYYY or YYYY-MM-DD format)
  const dateRegex = /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})\b/g;
  const dates = text.match(dateRegex);
  if (dates) entities.dates = [...new Set(dates)];
  
  // Extract dollar amounts
  const amountRegex = /\$[\d,]+\.?\d*/g;
  const amounts = text.match(amountRegex);
  if (amounts) {
    entities.amounts = amounts.map(a => parseFloat(a.replace(/[$,]/g, '')));
  }
  
  // Extract phone numbers
  const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
  const phones = text.match(phoneRegex);
  if (phones) entities.phoneNumbers = [...new Set(phones)];
  
  return entities;
}

// ============================================
// Simple Case Matching (placeholder)
// ============================================

async function findMatchingCases(entities: EntityExtractionResult): Promise<CaseMatch[]> {
  // This is a placeholder - in production, you'd use AI or more sophisticated matching
  const cases = await Case.find({ status: { $ne: 'closed' } }).limit(5).lean();
  
  return cases.map((c: any) => ({
    caseId: c._id.toString(),
    caseNumber: c.caseNumber,
    clientName: `${c.client?.firstName || ''} ${c.client?.lastName || ''}`.trim(),
    confidence: 0.5,
    matchReason: 'Potential match based on active status',
  }));
}

// ============================================
// Main Analysis Pipeline
// ============================================

export class DocumentAnalysisService {
  
  async analyze(input: DocumentAnalysisInput): Promise<DocumentAnalysisResult> {
    await dbConnect();
    
    const { documentId, caseId, extractedText } = input;
    
    console.log(`[DocAnalysis] Starting analysis for document ${documentId}`);
    
    // Step 1: Extract entities from document text
    const entities = await extractEntities(extractedText);
    console.log(`[DocAnalysis] Extracted entities:`, {
      dates: entities.dates?.length,
      amounts: entities.amounts?.length,
    });
    
    // Update document with extracted entities
    await Document.findByIdAndUpdate(documentId, {
      'aiAnalysis.extractedEntities': entities,
      'aiAnalysis.analyzedAt': new Date(),
    });
    
    // Step 2: Determine if we have a case or need to find one
    let finalCaseId = caseId;
    let suggestedCases: CaseMatch[] | undefined;
    
    if (!caseId) {
      const matches = await findMatchingCases(entities);
      
      if (matches.length === 1 && matches[0].confidence >= 0.9) {
        finalCaseId = matches[0].caseId;
        console.log(`[DocAnalysis] Auto-assigned to case ${matches[0].caseNumber}`);
        
        await Document.findByIdAndUpdate(documentId, {
          caseId: new mongoose.Types.ObjectId(finalCaseId),
          status: DocumentStatus.PROCESSING,
        });
      } else if (matches.length > 0) {
        suggestedCases = matches;
        
        await Document.findByIdAndUpdate(documentId, {
          status: DocumentStatus.PENDING_ASSIGNMENT,
          'aiAnalysis.suggestedCases': matches.map((m: CaseMatch) => ({
            caseId: m.caseId,
            caseNumber: m.caseNumber,
            clientName: m.clientName,
            confidence: m.confidence,
            matchReason: m.matchReason,
          })),
        });
        
        return {
          documentId,
          status: DocumentStatus.PENDING_ASSIGNMENT,
          suggestedCases,
          entities,
          summary: `Document requires case assignment. ${matches.length} potential matches found.`,
        };
      } else {
        await Document.findByIdAndUpdate(documentId, {
          status: DocumentStatus.PENDING_ASSIGNMENT,
        });
        
        return {
          documentId,
          status: DocumentStatus.PENDING_ASSIGNMENT,
          entities,
          summary: 'No matching cases found. Manual case assignment required.',
        };
      }
    }
    
    // Step 3: Mark as processed (simplified - no Round Table for now)
    if (finalCaseId) {
      const case_ = await Case.findById(finalCaseId);
      
      await Document.findByIdAndUpdate(documentId, {
        status: DocumentStatus.PROCESSED,
        'aiAnalysis.lastAnalyzedAt': new Date(),
      });
      
      return {
        documentId,
        status: DocumentStatus.PROCESSED,
        caseId: finalCaseId,
        caseNumber: case_?.caseNumber,
        entities,
        summary: 'Document analyzed and assigned to case.',
      };
    }
    
    return {
      documentId,
      status: DocumentStatus.PENDING_ASSIGNMENT,
      entities,
    };
  }
}

// ============================================
// Convenience Export
// ============================================

export async function analyzeDocument(input: DocumentAnalysisInput): Promise<DocumentAnalysisResult> {
  const service = new DocumentAnalysisService();
  return service.analyze(input);
}
