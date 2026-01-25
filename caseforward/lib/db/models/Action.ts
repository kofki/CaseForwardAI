import mongoose, { Schema, Document } from 'mongoose';
import {
  ActionType,
  ActionStatus,
  ActionPriority,
  ACTION_TYPES,
  ACTION_STATUSES,
  ACTION_PRIORITIES,
  INPUT_SOURCE_TYPES,
} from '../types/enums';

// --- Mongoose Interface ---

export interface IAction extends Document {
  caseId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  actionType: ActionType | string; // Allow string for legacy/main types
  status: ActionStatus;
  priority: ActionPriority;

  source: {
    type: string;
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

  auditTraceId?: string; // Opt for main compat

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
      required: [false, 'Action title is optional for legacy'],
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
        values: [...ACTION_TYPES, 'approve', 'reject', 'review'], // Extended
        message: '{VALUE} is not a valid action type',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      default: ActionStatus.PENDING,
      index: true,
    },
    priority: {
      type: Number,
      required: true,
      default: ActionPriority.MEDIUM,
      index: true,
    },
    source: {
      type: {
        type: String,
        required: [false, 'Source type is optional'],
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
        missingDocuments: { type: [String], default: [] },
        flags: { type: [String], default: [] },
        keyFacts: { type: [String], default: [] },
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
      rating: Number,
    },
    execution: {
      executedAt: Date,
      executedBy: String,
      result: String,
      notes: String,
    },
    auditTraceId: {
      type: String,
      required: [false, 'Audit trace ID is optional'],
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
    strict: false,
  }
);

ActionSchema.index({ status: 1, priority: 1, createdAt: 1 });
ActionSchema.index({ caseId: 1, status: 1, createdAt: -1 });

// Helper for connection
import { connectToDatabase } from '../connect';

let ActionModel: mongoose.Model<IAction>;
try {
  ActionModel = mongoose.model<IAction>('Action');
} catch {
  ActionModel = mongoose.model<IAction>('Action', ActionSchema);
}

export default ActionModel;

// --- Helper Functions for Main Branch Compatibility ---

export interface Action {
  _id?: string;
  caseId: string;
  type: 'approve' | 'reject' | 'review';
  actionCard: {
    recommendation: 'approve' | 'reject' | 'review';
    reasoning: string;
    confidence: number;
  };
  consensus: {
    clientGuruOpinion: string;
    evidenceAnalyzerOpinion: string;
    finalDecision: string;
  };
  createdAt: Date;
  userId?: string;
}

export async function createAction(action: any) {
  await connectToDatabase();

  // Map 'main' style Action to Mongoose Schema
  const mappedAction = {
    caseId: action.caseId,
    actionType: action.type || 'review', // map type
    title: action.actionCard?.recommendation ? `Action: ${action.actionCard.recommendation}` : 'New Action',
    description: action.actionCard?.reasoning || '',
    aiAnalysis: {
      roundTable: {
        evidenceAnalyzerSays: action.consensus?.evidenceAnalyzerOpinion,
        clientGuruSays: action.consensus?.clientGuruOpinion,
        consensus: action.consensus?.finalDecision
      },
      confidence: action.actionCard?.confidence
    },
    source: {
      type: 'automated',
      triggeredAt: new Date()
    },
    // Spread rest to catch other fields
    ...action
  };

  const newAction = new ActionModel(mappedAction);
  const saved = await newAction.save();
  return {
    ...saved.toObject(),
    _id: saved._id.toString()
  };
}

export async function getActionsByCaseId(caseId: string) {
  await connectToDatabase();
  const actions = await ActionModel.find({ caseId }).sort({ createdAt: -1 }).lean();
  return actions.map(action => ({
    ...action,
    _id: action._id.toString()
  }));
}
