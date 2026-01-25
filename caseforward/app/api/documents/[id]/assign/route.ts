import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import { Document, Case, AuditLog } from '@/lib/db/models';
import {
  DocumentStatus,
  AuditEventType,
  SeverityLevel,
  AgentType,
} from '@/lib/db/types/enums';

interface AssignRequest {
  caseId: string;
  assignedBy?: string;
}

interface AssignResponse {
  success: boolean;
  message?: string;
  documentId?: string;
  caseId?: string;
  status?: DocumentStatus;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<AssignResponse>> {
  try {
    const documentId = params.id;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid document ID' },
        { status: 400 }
      );
    }

    const body: AssignRequest = await req.json();
    const { caseId, assignedBy = 'system' } = body;

    if (!caseId || !mongoose.Types.ObjectId.isValid(caseId)) {
      return NextResponse.json(
        { success: false, message: 'Valid caseId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const doc = await Document.findById(documentId);
    if (!doc) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      );
    }

    if (doc.caseId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Document is already assigned to a case',
          caseId: doc.caseId.toString(),
        },
        { status: 409 }
      );
    }

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return NextResponse.json(
        { success: false, message: 'Case not found' },
        { status: 404 }
      );
    }

    const updatedDoc = await Document.findByIdAndUpdate(
      documentId,
      {
        caseId: new mongoose.Types.ObjectId(caseId),
        status: DocumentStatus.PROCESSING,
        assignedAt: new Date(),
        assignedBy,
      },
      { new: true }
    );

    await Case.findByIdAndUpdate(caseId, {
      $inc: { documentCount: 1 },
    });

    await AuditLog.create({
      eventType: AuditEventType.DOCUMENT_ASSIGNED,
      severity: SeverityLevel.INFO,
      agentType: AgentType.SYSTEM,
      agentId: assignedBy,
      documentId: new mongoose.Types.ObjectId(documentId),
      caseId: new mongoose.Types.ObjectId(caseId),
      message: `Document assigned to case ${caseDoc.caseNumber}`,
      success: true,
      details: {
        documentTitle: doc.title,
        caseNumber: caseDoc.caseNumber,
        clientName: `${caseDoc.client.firstName} ${caseDoc.client.lastName}`,
      },
    });

    return NextResponse.json({
      success: true,
      documentId,
      caseId,
      status: DocumentStatus.PROCESSING,
      message: 'Document assigned and queued for analysis',
    });

  } catch (error: any) {
    console.error('Assignment error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Assignment failed' },
      { status: 500 }
    );
  }
}
