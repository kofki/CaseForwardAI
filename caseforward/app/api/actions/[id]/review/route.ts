import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import { Action, Feedback, AuditLog, Case } from '@/lib/db/models';
import {
  ActionStatus,
  RejectionReason,
  AuditEventType,
  SeverityLevel,
  AgentType,
} from '@/lib/db/types/enums';

interface ReviewRequest {
  approved: boolean;
  reviewedBy: string;
  
  rejectionReason?: RejectionReason;
  feedback?: string;
  
  modifiedContent?: any;
}

interface ReviewResponse {
  success: boolean;
  message?: string;
  actionId?: string;
  status?: ActionStatus;
  executionResult?: any;
  auditHash?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ReviewResponse>> {
  try {
    const { id: actionId } = await params;

    if (!mongoose.Types.ObjectId.isValid(actionId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action ID' },
        { status: 400 }
      );
    }

    const body: ReviewRequest = await req.json();
    const { approved, reviewedBy, rejectionReason, feedback, modifiedContent } = body;

    if (!reviewedBy) {
      return NextResponse.json(
        { success: false, message: 'reviewedBy is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const action = await Action.findById(actionId);
    if (!action) {
      return NextResponse.json(
        { success: false, message: 'Action not found' },
        { status: 404 }
      );
    }

    if (action.status !== ActionStatus.AWAITING_REVIEW) {
      return NextResponse.json(
        { success: false, message: `Action already ${action.status}` },
        { status: 409 }
      );
    }

    const reviewedAt = new Date();

    if (approved) {
      await Action.findByIdAndUpdate(actionId, {
        status: ActionStatus.APPROVED,
        review: {
          reviewedBy,
          reviewedAt,
          approved: true,
          modifiedContent,
        },
      });

      // TODO: Execute the action
      // const executionResult = await executeAction(action, modifiedContent);

      // TODO: Log to Solana
      // const auditHash = await logToSolana(action, reviewedBy);

      await Action.findByIdAndUpdate(actionId, {
        status: ActionStatus.EXECUTED,
        execution: {
          executedAt: new Date(),
          success: true,
          // externalId: executionResult.externalId,
          // auditHash,
        },
      });

      await Case.findByIdAndUpdate(action.caseId, {
        $inc: { pendingActionCount: -1 },
      });

      await AuditLog.create({
        eventType: AuditEventType.ACTION_APPROVED,
        severity: SeverityLevel.INFO,
        agentType: AgentType.SYSTEM,
        agentId: reviewedBy,
        actionId: new mongoose.Types.ObjectId(actionId),
        caseId: action.caseId,
        documentId: action.documentId,
        message: `Action approved: ${action.title}`,
        success: true,
        details: {
          actionType: action.type,
          hadModifications: !!modifiedContent,
        },
      });

      return NextResponse.json({
        success: true,
        actionId,
        status: ActionStatus.EXECUTED,
        message: 'Action approved and executed',
        // auditHash,
      });

    } else {
      if (!rejectionReason) {
        return NextResponse.json(
          { success: false, message: 'rejectionReason is required for rejection' },
          { status: 400 }
        );
      }

      await Action.findByIdAndUpdate(actionId, {
        status: ActionStatus.REJECTED,
        review: {
          reviewedBy,
          reviewedAt,
          approved: false,
          feedback,
        },
      });

      await Feedback.create({
        actionId: new mongoose.Types.ObjectId(actionId),
        caseId: action.caseId,
        documentId: action.documentId,
        actionType: action.type,
        agentType: action.aiContext.agentType,
        rejectionReason,
        userComment: feedback,
        feedbackContext: {
          originalContent: action.content,
          inputSummary: action.description,
          aiReasoning: action.aiContext.reasoning,
          aiConfidence: action.aiContext.confidence,
        },
        userId: reviewedBy,
      });

      await Case.findByIdAndUpdate(action.caseId, {
        $inc: { pendingActionCount: -1 },
      });

      await AuditLog.create({
        eventType: AuditEventType.ACTION_REJECTED,
        severity: SeverityLevel.INFO,
        agentType: AgentType.SYSTEM,
        agentId: reviewedBy,
        actionId: new mongoose.Types.ObjectId(actionId),
        caseId: action.caseId,
        documentId: action.documentId,
        message: `Action rejected: ${action.title}`,
        success: true,
        details: {
          actionType: action.type,
          rejectionReason,
          hasFeedback: !!feedback,
        },
      });

      return NextResponse.json({
        success: true,
        actionId,
        status: ActionStatus.REJECTED,
        message: 'Action rejected. Feedback recorded for learning.',
      });
    }

  } catch (error: any) {
    console.error('Review error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Review failed' },
      { status: 500 }
    );
  }
}