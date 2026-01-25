import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import { Document, Case, AuditLog } from '@/lib/db/models';
import {
  DocumentStatus,
  DocumentCategory,
  InputSource,
  AuditEventType,
  SeverityLevel,
  AgentType,
} from '@/lib/db/types/enums';
import { uploadToR2, computeFileHash } from '@/lib/storage/r2';
import { extractContent, isSupportedMimeType } from '@/lib/db/extractors';
import { categorizeDocument } from '@/lib/agents/services/document-categorization.service';

interface IntakeResponse {
  success: boolean;
  documentId?: string;
  status?: DocumentStatus;
  message?: string;
  suggestedCases?: Array<{
    caseId: string;
    caseNumber: string;
    clientName: string;
    confidence: number;
    matchReasons: string[];
  }>;
  aiCategorization?: {
    suggestedCategory: string;
    confidence: number;
    suggestedTitle?: string;
    reasoning?: string;
  };
}

export async function POST(req: Request): Promise<NextResponse<IntakeResponse>> {
  const startTime = Date.now();

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const caseId = formData.get('caseId') as string | null;
    const category = formData.get('category') as string | null;
    const title = formData.get('title') as string | null;
    const uploadedBy = formData.get('uploadedBy') as string || 'system';
    const inputSource = formData.get('inputSource') as string || InputSource.WEB_UPLOAD;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    if (!isSupportedMimeType(file.type)) {
      return NextResponse.json(
        { success: false, message: `Unsupported file type: ${file.type}` },
        { status: 400 }
      );
    }

    if (caseId && !mongoose.Types.ObjectId.isValid(caseId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid caseId format' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileHash = await computeFileHash(arrayBuffer);

    await connectDB();
    const existingDoc = await Document.findOne({ 'file.hash': fileHash });
    if (existingDoc) {
      return NextResponse.json(
        {
          success: false,
          message: 'This file has already been uploaded',
          documentId: existingDoc._id.toString(),
        },
        { status: 409 }
      );
    }

    const uploadResult = await uploadToR2(
      new Blob([arrayBuffer], { type: file.type }),
      file.name,
      { folder: 'documents' }
    );

    if (!uploadResult.success || !uploadResult.objectKey) {
      return NextResponse.json(
        { success: false, message: uploadResult.error || 'Failed to upload file' },
        { status: 502 }
      );
    }

    const documentData = {
      caseId: caseId ? new mongoose.Types.ObjectId(caseId) : null,
      status: DocumentStatus.EXTRACTING,
      title: title || file.name,
      category: category as DocumentCategory || DocumentCategory.OTHER,
      inputSource: inputSource as InputSource,
      file: {
        originalName: file.name,
        storagePath: uploadResult.objectKey,
        storageProvider: 'r2' as const,
        mimeType: file.type,
        size: file.size,
        hash: fileHash,
      },
      uploadedBy,
      uploadedAt: new Date(),
    };

    const doc = await Document.create(documentData);

    await AuditLog.create({
      eventType: AuditEventType.DOCUMENT_UPLOADED,
      severity: SeverityLevel.INFO,
      agentType: AgentType.SYSTEM,
      agentId: uploadedBy,
      documentId: doc._id,
      caseId: caseId ? new mongoose.Types.ObjectId(caseId) : undefined,
      message: `Document uploaded: ${file.name}`,
      success: true,
      details: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        hasCase: !!caseId,
      },
    });

    try {
      const extractedContent = await extractContent(
        Buffer.from(arrayBuffer),
        file.type
      );

      await Document.findByIdAndUpdate(doc._id, {
        status: caseId ? DocumentStatus.PROCESSING : DocumentStatus.ANALYZING,
        extractedContent,
        'metadata.pageCount': extractedContent.pageCount,
      });

      await AuditLog.create({
        eventType: AuditEventType.DOCUMENT_EXTRACTED,
        severity: SeverityLevel.INFO,
        agentType: AgentType.SYSTEM,
        agentId: 'extractor',
        documentId: doc._id,
        caseId: caseId ? new mongoose.Types.ObjectId(caseId) : undefined,
        message: `Content extracted: ${extractedContent.textLength} chars, ${extractedContent.pageCount} pages`,
        success: true,
        details: {
          textLength: extractedContent.textLength,
          pageCount: extractedContent.pageCount,
          hasImages: extractedContent.hasImages,
          extractionMethod: extractedContent.extractionMethod,
        },
      });

      // AI Document Categorization (suggestion only - user can override)
      try {
        const categorizationResult = await categorizeDocument(
          extractedContent.text || '',
          file.name,
          file.type
        );

        // Update document with AI-suggested category (stored in aiAnalysis)
        await Document.findByIdAndUpdate(doc._id, {
          // Only update category if user didn't specify one
          ...(category ? {} : { category: categorizationResult.category }),
          'aiAnalysis.suggestedCategory': categorizationResult.category,
          'aiAnalysis.categoryConfidence': categorizationResult.confidence,
          'aiAnalysis.suggestedTitle': categorizationResult.suggestedTitle,
          'aiAnalysis.categoryReasoning': categorizationResult.reasoning,
          'aiAnalysis.extractedEntities': categorizationResult.extractedEntities,
        });

        await AuditLog.create({
          eventType: AuditEventType.DOCUMENT_ANALYZED,
          severity: SeverityLevel.INFO,
          agentType: AgentType.EVIDENCE_ANALYZER,
          agentId: 'categorizer',
          documentId: doc._id,
          caseId: caseId ? new mongoose.Types.ObjectId(caseId) : undefined,
          message: `AI categorized as ${categorizationResult.category} (${Math.round(categorizationResult.confidence * 100)}% confidence)`,
          success: true,
          details: {
            category: categorizationResult.category,
            confidence: categorizationResult.confidence,
            reasoning: categorizationResult.reasoning,
          },
        });
      } catch (categorizationError) {
        console.warn('AI categorization failed, using default:', categorizationError);
        // Non-blocking - document upload continues even if categorization fails
      }

      if (caseId) {
        await Case.findByIdAndUpdate(caseId, {
          $inc: { documentCount: 1 },
        });

        // Trigger document analysis for case-assigned documents
        try {
          if (extractedContent.text && extractedContent.textLength > 0) {
            const { analyzeDocument } = await import('@/lib/agents/document-analysis.service');
            await analyzeDocument({
              documentId: doc._id.toString(),
              caseId: caseId,
              extractedText: extractedContent.text,
            });
            console.log(`[Intake] Document ${doc._id} analysis completed`);
          }
        } catch (analysisError) {
          console.warn('[Intake] Document analysis failed, document will remain in processing:', analysisError);
          // Non-blocking - document upload continues even if analysis fails
        }
      }

    } catch (extractError) {
      console.error('Extraction error:', extractError);

      await Document.findByIdAndUpdate(doc._id, {
        status: DocumentStatus.EXTRACTION_FAILED,
        lastError: extractError instanceof Error ? extractError.message : 'Extraction failed',
        $inc: { errorCount: 1 },
      });

      return NextResponse.json({
        success: true,
        documentId: doc._id.toString(),
        status: DocumentStatus.EXTRACTION_FAILED,
        message: 'File uploaded but content extraction failed',
      });
    }

    let finalStatus: DocumentStatus;
    let suggestedCases: IntakeResponse['suggestedCases'];

    if (caseId) {
      finalStatus = DocumentStatus.PROCESSING;
    } else {
      finalStatus = DocumentStatus.ANALYZING;

      await Document.findByIdAndUpdate(doc._id, {
        status: DocumentStatus.PENDING_ASSIGNMENT,
      });
      finalStatus = DocumentStatus.PENDING_ASSIGNMENT;
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      documentId: doc._id.toString(),
      status: finalStatus,
      suggestedCases,
      message: caseId
        ? 'Document uploaded and queued for analysis'
        : 'Document uploaded. Please assign to a case.',
    });

  } catch (error: any) {
    console.error('Intake error:', error);

    if (error.code === 11000 && error.keyPattern?.['file.hash']) {
      return NextResponse.json(
        { success: false, message: 'This file has already been uploaded' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
