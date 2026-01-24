// lib/db/models/Action.ts

import mongoose, { Schema, Document } from 'mongoose';
import {
  ActionType,
  ActionStatus,
  ActionPriority,
  AgentType,
  InputSourceType,
  ACTION_TYPES,
  ACTION_STATUSES,
  ACTION_PRIORITIES,
  AGENT_TYPES,
  INPUT_SOURCE_TYPES,
} from '../types/enums';

export interface IAction extends Document {
  caseId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  actionType: ActionType;
  status: ActionStatus;
  priority: ActionPriority;

  source: {
    type: InputSourceType;
    reference?: string;
    documentId?: mongoose.Types.ObjectId;
    rawContent?: string;
    triggeredAt: Date;
  };

  aiAnalysis: {
    evidenceFindings: {
      missingDocuments: string[];
      flags: string[];
      keyFacts: string[];
    };

    clientCommunication: {
      draftType: 'email' | 'text' | 'letter';
      draftSubject?: string;
      draftContent: string;
      tone: string;
      callToAction?: string;
    };

    roundTable: {
      evidenceAnalyzerSays: string;
      clientGuruSays: string;
      consensus: string;
    };

    confidence: number;
  };

  review: {
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: string;
    reviewedAt?: Date;
    feedback?: string;
    modifications?: string;
    rating?: number;
  };

  execution: {
    executedAt?: Date;
    executedBy?: string;
    result?: string;
    notes?: string;
  };

  auditTraceId: string;

  dueDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const ActionSchema = new Schema<IAction>(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Action title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    actionType: {
      type: String,
      required: [true, 'Action type is required'],
      enum: {
        values: ACTION_TYPES,
        message: '{VALUE} is not a valid action type',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      default: ActionStatus.PENDING,
      enum: {
        values: ACTION_STATUSES,
        message: '{VALUE} is not a valid action status',
      },
      index: true,
    },
    priority: {
      type: Number,
      required: true,
      default: ActionPriority.MEDIUM,
      enum: {
        values: ACTION_PRIORITIES,
        message: '{VALUE} is not a valid priority',
      },
      index: true,
    },
    source: {
      type: {
        type: String,
        required: [true, 'Source type is required'],
        enum: {
          values: INPUT_SOURCE_TYPES,
          message: '{VALUE} is not a valid source type',
        },
      },
      reference: String,
      documentId: {
        type: Schema.Types.ObjectId,
        ref: 'Document',
      },
      rawContent: String,
      triggeredAt: {
        type: Date,
        default: Date.now,
      },
    },
    aiAnalysis: {
      evidenceFindings: {
        missingDocuments: {
          type: [String],
          default: [],
        },
        flags: {
          type: [String],
          default: [],
        },
        keyFacts: {
          type: [String],
          default: [],
        },
      },
      clientCommunication: {
        draftType: {
          type: String,
          enum: ['email', 'text', 'letter'],
        },
        draftSubject: String,
        draftContent: String,
        tone: String,
        callToAction: String,
      },
      roundTable: {
        evidenceAnalyzerSays: String,
        clientGuruSays: String,
        consensus: String,
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
      },
    },
    review: {
      status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'approved', 'rejected'],
      },
      reviewedBy: String,
      reviewedAt: Date,
      feedback: String,
      modifications: String,
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
    },

    execution: {
      executedAt: Date,
      executedBy: String,
      result: String,
      notes: String,
    },
    auditTraceId: {
      type: String,
      required: [true, 'Audit trace ID is required'],
      index: true,
    },
    dueDate: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'actions',
  }
);

ActionSchema.index({ status: 1, priority: 1, createdAt: 1 });

ActionSchema.index({ caseId: 1, status: 1, createdAt: -1 });

ActionSchema.index({ 'review.status': 1, 'review.reviewedAt': -1 });

ActionSchema.index({ status: 1, dueDate: 1 });

export default mongoose.models.Action ||
  mongoose.model<IAction>('Action', ActionSchema);