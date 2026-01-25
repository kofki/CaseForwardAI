import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import { Document, AuditLog } from '@/lib/db/models';
import {
  DocumentStatus,
  AuditEventType,
  SeverityLevel,
  AgentType,
} from '@/lib/db/types/enums';
import { categorizeDocument, getCategoryEmoji } from '@/lib/agents/services/document-categorization.service';

/**
 * Document Categorization API
 * 
 * POST /api/documents/[id]/categorize
 * 
 * Triggers AI categorization for a document.
 * Updates the document's category based on AI analysis.
 */

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const startTime = Date.now();
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, message: 'Invalid document ID' },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    // Get the document
    const doc = await Document.findById(id);
    
    if (!doc) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if document has extracted content
    if (!doc.extractedContent?.text || doc.extractedContent.textLength === 0) {
      return NextResponse.json(
        { success: false, message: 'Document has no extracted content to categorize' },
        { status: 400 }
      );
    }

    // Update status to analyzing
    await Document.findByIdAndUpdate(id, {
      status: DocumentStatus.ANALYZING,
    });

    console.log(`[Categorize] Starting categorization for document ${id}`);

    // Run AI categorization
    const result = await categorizeDocument(
      doc.extractedContent.text,
      doc.file?.originalName,
      doc.file?.mimeType
    );

    const processingTimeMs = Date.now() - startTime;

    // Update document with categorization result
    await Document.findByIdAndUpdate(id, {
      category: result.category,
      title: result.suggestedTitle || doc.title,
      status: doc.caseId ? DocumentStatus.PROCESSING : DocumentStatus.PENDING_ASSIGNMENT,
      'quickExtraction.documentType': result.category,
      'quickExtraction.documentTypeConfidence': result.confidence,
      'quickExtraction.entities': {
        patientName: result.extractedEntities.patientName ? {
          value: result.extractedEntities.patientName,
          confidence: result.confidence,
        } : undefined,
        providerName: result.extractedEntities.providerName ? {
          value: result.extractedEntities.providerName,
          confidence: result.confidence,
        } : undefined,
        providerType: result.extractedEntities.providerType ? {
          value: result.extractedEntities.providerType,
          confidence: result.confidence,
        } : undefined,
        dates: result.extractedEntities.dateOfService ? [{
          value: result.extractedEntities.dateOfService,
          confidence: result.confidence,
        }] : [],
        amounts: (result.extractedEntities.amounts || []).map(amt => ({
          value: amt,
          confidence: result.confidence,
        })),
        diagnoses: (result.extractedEntities.diagnoses || []).map(dx => ({
          value: dx,
          confidence: result.confidence,
        })),
        procedures: (result.extractedEntities.procedures || []).map(proc => ({
          value: proc,
          confidence: result.confidence,
        })),
        caseNumbers: (result.extractedEntities.caseReferences || []).map(ref => ({
          value: ref,
          confidence: result.confidence,
        })),
      },
      'quickExtraction.extractedAt': new Date(),
      'aiAnalysis.processingTimeMs': processingTimeMs,
    });

    // Create audit log
    await AuditLog.create({
      eventType: AuditEventType.DOCUMENT_ANALYZED,
      severity: SeverityLevel.INFO,
      agentType: AgentType.EVIDENCE_ANALYZER,
      agentId: 'categorization-service',
      documentId: new mongoose.Types.ObjectId(id),
      caseId: doc.caseId,
      message: `Document categorized as ${getCategoryEmoji(result.category)} ${result.category} (${Math.round(result.confidence * 100)}% confidence)`,
      success: true,
      details: {
        category: result.category,
        confidence: result.confidence,
        suggestedTitle: result.suggestedTitle,
        reasoning: result.reasoning,
        processingTimeMs,
      },
    });

    console.log(`[Categorize] Document ${id} categorized as ${result.category} in ${processingTimeMs}ms`);

    return NextResponse.json({
      success: true,
      documentId: id,
      category: result.category,
      confidence: result.confidence,
      suggestedTitle: result.suggestedTitle,
      extractedEntities: result.extractedEntities,
      reasoning: result.reasoning,
      processingTimeMs,
    });

  } catch (error: any) {
    console.error('[Categorize] Error:', error);

    // Update document status to failed
    await Document.findByIdAndUpdate(id, {
      status: DocumentStatus.ANALYSIS_FAILED,
      lastError: error.message || 'Categorization failed',
      $inc: { errorCount: 1 },
    });

    return NextResponse.json(
      { success: false, message: error.message || 'Categorization failed' },
      { status: 500 }
    );
  }
}
