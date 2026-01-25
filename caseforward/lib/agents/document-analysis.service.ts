/**
 * Document Analysis Service
 * 
 * This service triggers AI analysis when documents are uploaded.
 * It follows the flow from your diagram:
 * 
 * 1. Document uploaded → R2 storage
 * 2. Metadata saved to MongoDB with status: PENDING_ASSIGNMENT or PROCESSING
 * 3. If caseId exists → trigger Round Table analysis
 * 4. If no caseId → extract entities for matching
 * 5. Round Table generates Action Cards for the swipe queue
 */

import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import { Document, Case, Action } from '@/lib/db/models';
import { DocumentStatus, DocumentCategory, ActionType, ActionStatus, ActionPriority, AgentType } from '@/lib/db/types/enums';
import { runRoundTable } from './round-table-v2';
import { extractEntities, EntityExtractionResult } from './services/entity-extraction.service';
import { findMatchingCases, CaseMatch } from './services/case-matching.service';
import { randomUUID } from 'crypto';

// ============================================
// Types
// ============================================

export interface DocumentAnalysisInput {
  documentId: string;
  caseId?: string;       // Optional - if not provided, we'll try to match
  extractedText: string; // Text from PDF extraction
  forceRoundTable?: boolean;
}

export interface DocumentAnalysisResult {
  documentId: string;
  status: DocumentStatus;
  
  // If case was identified
  caseId?: string;
  caseNumber?: string;
  
  // If no case found, suggest matches
  suggestedCases?: CaseMatch[];
  
  // Entities extracted from document
  entities?: EntityExtractionResult;
  
  // If Round Table was triggered
  roundTableSessionId?: string;
  actionId?: string;
  
  // Summary
  summary?: string;
  keyFindings?: string[];
  flags?: string[];
}

// ============================================
// Main Analysis Pipeline
// ============================================

export class DocumentAnalysisService {
  
  /**
   * Main entry point for document analysis
   */
  async analyze(input: DocumentAnalysisInput): Promise<DocumentAnalysisResult> {
    await connectDB();
    
    const { documentId, caseId, extractedText, forceRoundTable } = input;
    
    console.log(`[DocAnalysis] Starting analysis for document ${documentId}`);
    
    // Step 1: Extract entities from document text
    const entities = await extractEntities(extractedText);
    console.log(`[DocAnalysis] Extracted entities:`, {
      patientName: entities.patientName,
      providerName: entities.providerName,
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
      // Try to find matching cases based on extracted entities
      const matches = await findMatchingCases(entities);
      
      if (matches.length === 1 && matches[0].confidence >= 0.9) {
        // High-confidence single match - auto-assign
        finalCaseId = matches[0].caseId;
        console.log(`[DocAnalysis] Auto-assigned to case ${matches[0].caseNumber} (${matches[0].confidence * 100}% confidence)`);
        
        // Update document with case assignment
        await Document.findByIdAndUpdate(documentId, {
          caseId: new mongoose.Types.ObjectId(finalCaseId),
          status: DocumentStatus.PROCESSING,
        });
      } else if (matches.length > 0) {
        // Multiple matches or low confidence - require human review
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
        
        console.log(`[DocAnalysis] Document requires case assignment. ${matches.length} suggestions.`);
        
        return {
          documentId,
          status: DocumentStatus.PENDING_ASSIGNMENT,
          suggestedCases,
          entities,
          summary: `Document requires case assignment. ${matches.length} potential matches found.`,
        };
      } else {
        // No matches found
        await Document.findByIdAndUpdate(documentId, {
          status: DocumentStatus.PENDING_ASSIGNMENT,
        });
        
        console.log(`[DocAnalysis] No matching cases found. Requires manual assignment.`);
        
        return {
          documentId,
          status: DocumentStatus.PENDING_ASSIGNMENT,
          entities,
          summary: 'No matching cases found. Manual case assignment required.',
        };
      }
    }
    
    // Step 3: Trigger Round Table analysis with case context
    if (finalCaseId || forceRoundTable) {
      return this.triggerRoundTable(documentId, finalCaseId!, extractedText, entities);
    }
    
    return {
      documentId,
      status: DocumentStatus.PENDING_ASSIGNMENT,
      entities,
    };
  }
  
  /**
   * Trigger Round Table analysis for a document with case context
   */
  private async triggerRoundTable(
    documentId: string,
    caseId: string,
    extractedText: string,
    entities: EntityExtractionResult
  ): Promise<DocumentAnalysisResult> {
    
    // Get document and case info for context
    const doc = await Document.findById(documentId);
    const case_ = await Case.findById(caseId);
    
    if (!doc || !case_) {
      throw new Error('Document or case not found');
    }
    
    // Build trigger message based on document type
    const trigger = this.buildTriggerMessage(doc, entities);
    
    console.log(`[DocAnalysis] Triggering Round Table for case ${case_.caseNumber}`);
    
    // Run the Round Table discussion
    const result = await runRoundTable(caseId, trigger, {
      documentId,
      documentText: extractedText.substring(0, 10000), // Limit text size
      config: {
        maxRounds: 2,
        persistActions: true,
        createAuditLog: true,
      },
    });
    
    // Update document with Round Table results
    await Document.findByIdAndUpdate(documentId, {
      status: DocumentStatus.PROCESSED,
      'aiAnalysis.summary': result.actionCard.description,
      'aiAnalysis.keyFindings': result.session.consensus?.sharedConclusions || [],
      'aiAnalysis.flags': result.session.consensus?.dissent || [],
      'aiAnalysis.roundTableSessionId': result.session.sessionId,
      'aiAnalysis.lastAnalyzedAt': new Date(),
    });
    
    return {
      documentId,
      status: DocumentStatus.PROCESSED,
      caseId,
      caseNumber: case_.caseNumber,
      entities,
      roundTableSessionId: result.session.sessionId,
      actionId: result.session.persistedActionId,
      summary: result.actionCard.description,
      keyFindings: result.session.consensus?.sharedConclusions,
      flags: result.session.consensus?.dissent,
    };
  }
  
  /**
   * Build an appropriate trigger message based on document category
   */
  private buildTriggerMessage(doc: any, entities: EntityExtractionResult): string {
    const category = doc.category as DocumentCategory;
    
    const categoryTriggers: Partial<Record<DocumentCategory, string>> = {
      [DocumentCategory.MEDICAL_RECORD]: `New medical records received from ${entities.providerName || 'unknown provider'}. Please analyze for treatment details, diagnoses, and any liability implications.`,
      
      [DocumentCategory.MEDICAL_BILL]: `New medical bill received: ${entities.amounts?.[0] ? `$${entities.amounts[0].toLocaleString()}` : 'amount pending extraction'}. Analyze for reasonableness, check against existing bills, and identify potential lien implications.`,
      
      [DocumentCategory.POLICE_REPORT]: `Police report received. Analyze for liability determination, witness statements, and any factors that could affect the case.`,
      
      [DocumentCategory.WITNESS_STATEMENT]: `New witness statement received. Evaluate credibility, consistency with other evidence, and impact on liability.`,
      
      [DocumentCategory.INSURANCE_POLICY]: `Insurance documentation received. Review for coverage details, policy limits, and subrogation rights.`,
      
      [DocumentCategory.CLIENT_INTAKE]: `Client intake form received. Extract key case details and identify what additional information is needed.`,
      
      [DocumentCategory.DEMAND_LETTER]: `Demand letter received. Review terms, settlement offer, and recommend negotiation strategy.`,
    };
    
    return categoryTriggers[category] || `New document uploaded: "${doc.title}". Please analyze and recommend next steps.`;
  }
}

// ============================================
// Convenience Export
// ============================================

export async function analyzeDocument(input: DocumentAnalysisInput): Promise<DocumentAnalysisResult> {
  const service = new DocumentAnalysisService();
  return service.analyze(input);
}
