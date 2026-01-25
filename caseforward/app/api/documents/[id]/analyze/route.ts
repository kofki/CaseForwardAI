/**
 * Document Analysis API Route
 * 
 * Triggers AI analysis on a document:
 * 1. Extracts entities from document text
 * 2. Matches to existing case (or suggests matches)
 * 3. Triggers Round Table discussion if case is assigned
 * 4. Creates Action Card for swipe queue
 * 
 * POST /api/documents/[id]/analyze
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import { Document } from '@/lib/db/models';
import { analyzeDocument, DocumentAnalysisResult } from '@/lib/agents/document-analysis.service';
import { DocumentStatus } from '@/lib/db/types/enums';

interface AnalyzeResponse {
  success: boolean;
  message?: string;
  result?: DocumentAnalysisResult;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<AnalyzeResponse>> {
  try {
    const { id: documentId } = await params;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid document ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch document
    const doc = await Document.findById(documentId);
    if (!doc) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if document has extracted text
    if (!doc.extractedContent?.text) {
      return NextResponse.json(
        { success: false, message: 'Document has no extracted text. Extraction may have failed.' },
        { status: 400 }
      );
    }

    // Check if already processed
    if (doc.status === DocumentStatus.PROCESSED || doc.status === DocumentStatus.REVIEWED) {
      return NextResponse.json(
        { success: false, message: `Document already ${doc.status}` },
        { status: 409 }
      );
    }

    // Parse optional body for caseId override
    let body: { caseId?: string; forceRoundTable?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional
    }

    // Run analysis
    const result = await analyzeDocument({
      documentId,
      caseId: body.caseId || doc.caseId?.toString(),
      extractedText: doc.extractedContent.text,
      forceRoundTable: body.forceRoundTable,
    });

    return NextResponse.json({
      success: true,
      result,
      message: result.roundTableSessionId
        ? 'Analysis complete. Action card created.'
        : 'Document analyzed. Case assignment required.',
    });

  } catch (error: any) {
    console.error('Document analysis error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
