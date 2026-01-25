import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/dbConnect';
import Document from '@/lib/db/models/Document';
import Case from '@/lib/db/models/Case';
import { DocumentStatus } from '@/lib/db/types/enums';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;

    // Handle both JSON and FormData
    let caseId: string;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      caseId = body.caseId;
    } else {
      const formData = await req.formData();
      caseId = formData.get('caseId') as string;
    }

    if (!documentId || !mongoose.Types.ObjectId.isValid(documentId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    if (!caseId || !mongoose.Types.ObjectId.isValid(caseId)) {
      return NextResponse.json({ error: 'Invalid case ID' }, { status: 400 });
    }

    await dbConnect();

    // Verify case exists
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Update document
    const updatedDoc = await Document.findByIdAndUpdate(
      documentId,
      {
        caseId: new mongoose.Types.ObjectId(caseId),
        status: DocumentStatus.ASSIGNED,
        assignedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Increment case document count
    await Case.findByIdAndUpdate(caseId, { $inc: { documentCount: 1 } });

    // Redirect back to documents page if form submission
    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(new URL(`/app/case/${caseId}/documents`, req.url));
    }

    return NextResponse.json({
      success: true,
      document: updatedDoc,
    });
  } catch (error: any) {
    console.error('Assign document error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign document' },
      { status: 500 }
    );
  }
}