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
import { extractContent, isSupportedMimeType, isSupportedFile, getMimeTypeFromExtension } from '@/lib/db/extractors';

/**
 * Batch Document Intake API
 * 
 * Accepts multiple files at once and queues them for AI processing.
 * Returns a batch ID that can be used to track processing status.
 */

export interface BatchIntakeFile {
  documentId: string;
  fileName: string;
  status: 'uploaded' | 'extracting' | 'queued' | 'failed';
  error?: string;
  mimeType: string;
  size: number;
}

export interface BatchIntakeResponse {
  success: boolean;
  batchId: string;
  caseId?: string;
  totalFiles: number;
  processed: number;
  failed: number;
  files: BatchIntakeFile[];
  message: string;
}

export async function POST(req: Request): Promise<NextResponse<BatchIntakeResponse>> {
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const startTime = Date.now();

  try {
    const formData = await req.formData();
    const files = formData.getAll('files');
    const caseId = formData.get('caseId') as string | null;
    const uploadedBy = formData.get('uploadedBy') as string || 'system';
    const inputSource = formData.get('inputSource') as string || InputSource.WEB_UPLOAD;

    if (!files || files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          batchId,
          totalFiles: 0,
          processed: 0,
          failed: 0,
          files: [],
          message: 'No files provided',
        },
        { status: 400 }
      );
    }

    // Validate caseId if provided
    if (caseId && !mongoose.Types.ObjectId.isValid(caseId)) {
      return NextResponse.json(
        {
          success: false,
          batchId,
          totalFiles: files.length,
          processed: 0,
          failed: 0,
          files: [],
          message: 'Invalid caseId format',
        },
        { status: 400 }
      );
    }

    await connectDB();

    const results: BatchIntakeFile[] = [];
    let processed = 0;
    let failed = 0;

    // Process each file
    for (const fileEntry of files) {
      if (!(fileEntry instanceof File)) {
        continue;
      }

      const file = fileEntry as File;
      const fileName = file.name;

      try {
        // Determine mime type - try extension if mime is generic
        let mimeType = file.type;
        if (!mimeType || mimeType === 'application/octet-stream') {
          const detectedMime = getMimeTypeFromExtension(fileName);
          if (detectedMime) {
            mimeType = detectedMime;
          }
        }

        // Validate file type
        if (!isSupportedMimeType(mimeType) && !isSupportedFile(fileName)) {
          results.push({
            documentId: '',
            fileName,
            status: 'failed',
            error: `Unsupported file type: ${mimeType || 'unknown'}`,
            mimeType: mimeType || 'unknown',
            size: file.size,
          });
          failed++;
          continue;
        }

        // Validate file size (50MB max)
        const MAX_SIZE = 50 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
          results.push({
            documentId: '',
            fileName,
            status: 'failed',
            error: 'File too large (max 50MB)',
            mimeType,
            size: file.size,
          });
          failed++;
          continue;
        }

        // Compute hash for deduplication
        const arrayBuffer = await file.arrayBuffer();
        const fileHash = await computeFileHash(arrayBuffer);

        // Check for duplicates
        const existingDoc = await Document.findOne({ 'file.hash': fileHash });
        if (existingDoc) {
          results.push({
            documentId: existingDoc._id.toString(),
            fileName,
            status: 'failed',
            error: 'Duplicate file already exists',
            mimeType,
            size: file.size,
          });
          failed++;
          continue;
        }

        // Upload to R2
        const uploadResult = await uploadToR2(
          new Blob([arrayBuffer], { type: mimeType }),
          fileName,
          { folder: 'documents' }
        );

        if (!uploadResult.success || !uploadResult.objectKey) {
          results.push({
            documentId: '',
            fileName,
            status: 'failed',
            error: uploadResult.error || 'Upload failed',
            mimeType,
            size: file.size,
          });
          failed++;
          continue;
        }

        // Create document record
        const documentData = {
          caseId: caseId ? new mongoose.Types.ObjectId(caseId) : null,
          status: DocumentStatus.EXTRACTING,
          title: fileName,
          category: DocumentCategory.OTHER, // AI will categorize later
          inputSource: inputSource as InputSource,
          file: {
            originalName: fileName,
            storagePath: uploadResult.objectKey,
            storageProvider: 'r2' as const,
            mimeType,
            size: file.size,
            hash: fileHash,
          },
          uploadedBy,
          uploadedAt: new Date(),
          tags: [`batch:${batchId}`], // Tag with batch ID for tracking
        };

        const doc = await Document.create(documentData);

        // Log upload
        await AuditLog.create({
          eventType: AuditEventType.DOCUMENT_UPLOADED,
          severity: SeverityLevel.INFO,
          agentType: AgentType.SYSTEM,
          agentId: uploadedBy,
          documentId: doc._id,
          caseId: caseId ? new mongoose.Types.ObjectId(caseId) : undefined,
          message: `Batch upload: ${fileName}`,
          success: true,
          details: {
            batchId,
            fileName,
            fileSize: file.size,
            mimeType,
          },
        });

        // Extract content
        try {
          const extractedContent = await extractContent(
            Buffer.from(arrayBuffer),
            mimeType,
            { fileName }
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
            message: `Content extracted: ${extractedContent.textLength} chars`,
            success: true,
            details: {
              batchId,
              textLength: extractedContent.textLength,
              pageCount: extractedContent.pageCount,
              extractionMethod: extractedContent.extractionMethod,
            },
          });

          results.push({
            documentId: doc._id.toString(),
            fileName,
            status: 'queued',
            mimeType,
            size: file.size,
          });
          processed++;

        } catch (extractError) {
          console.error(`Extraction error for ${fileName}:`, extractError);

          await Document.findByIdAndUpdate(doc._id, {
            status: DocumentStatus.EXTRACTION_FAILED,
            lastError: extractError instanceof Error ? extractError.message : 'Extraction failed',
            $inc: { errorCount: 1 },
          });

          results.push({
            documentId: doc._id.toString(),
            fileName,
            status: 'failed',
            error: 'Content extraction failed',
            mimeType,
            size: file.size,
          });
          failed++;
        }

      } catch (fileError) {
        console.error(`Error processing ${fileName}:`, fileError);
        results.push({
          documentId: '',
          fileName,
          status: 'failed',
          error: fileError instanceof Error ? fileError.message : 'Processing failed',
          mimeType: file.type || 'unknown',
          size: file.size,
        });
        failed++;
      }
    }

    // Update case document count if caseId was provided
    if (caseId && processed > 0) {
      await Case.findByIdAndUpdate(caseId, {
        $inc: { documentCount: processed },
      });
    }

    const processingTime = Date.now() - startTime;
    console.log(`[BatchIntake] Processed ${processed}/${files.length} files in ${processingTime}ms`);

    return NextResponse.json({
      success: processed > 0,
      batchId,
      caseId: caseId || undefined,
      totalFiles: files.length,
      processed,
      failed,
      files: results,
      message: processed > 0
        ? `Successfully queued ${processed} file(s) for AI analysis`
        : 'No files were processed successfully',
    });

  } catch (error: any) {
    console.error('Batch intake error:', error);

    return NextResponse.json(
      {
        success: false,
        batchId,
        totalFiles: 0,
        processed: 0,
        failed: 0,
        files: [],
        message: error.message || 'Batch upload failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Check batch processing status
 */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get('batchId');

  if (!batchId) {
    return NextResponse.json(
      { success: false, message: 'batchId is required' },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    // Find all documents with this batch tag
    const documents = await Document.find({
      tags: `batch:${batchId}`,
    }).select('_id title status category file.mimeType file.size aiAnalysis.isProcessed quickExtraction.documentType');

    const statusCounts = {
      uploading: 0,
      extracting: 0,
      analyzing: 0,
      processing: 0,
      processed: 0,
      failed: 0,
      pending: 0,
    };

    const files = documents.map((doc) => {
      const status = doc.status as string;
      if (status.includes('fail')) statusCounts.failed++;
      else if (status === 'processed' || status === 'reviewed') statusCounts.processed++;
      else if (status === 'processing') statusCounts.processing++;
      else if (status === 'analyzing') statusCounts.analyzing++;
      else if (status === 'extracting') statusCounts.extracting++;
      else statusCounts.pending++;

      return {
        documentId: doc._id.toString(),
        fileName: doc.title,
        status: doc.status,
        category: doc.quickExtraction?.documentType || doc.category,
        mimeType: doc.file?.mimeType,
        size: doc.file?.size,
        isProcessed: doc.aiAnalysis?.isProcessed || false,
      };
    });

    const allComplete = statusCounts.processed + statusCounts.failed === documents.length;

    return NextResponse.json({
      success: true,
      batchId,
      totalFiles: documents.length,
      statusCounts,
      allComplete,
      files,
    });

  } catch (error: any) {
    console.error('Batch status error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get batch status' },
      { status: 500 }
    );
  }
}
