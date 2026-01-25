import mongoose, { Schema, Document as MongoDocument } from 'mongoose';
import {
  RejectionReason,
  ActionType,
  AgentType,
  REJECTION_REASONS,
  ACTION_TYPES,
  AGENT_TYPES,
} from '../types/enums';

export interface IFeedbackContext {
  originalContent: Record<string, any>;

  inputSummary: string;

  aiReasoning: string;
  aiConfidence: number;
}

export interface IUserCorrection {
  correctedContent?: Record<string, any>;

  issues: string[];

  explanation?: string;
}

export interface IFeedback extends MongoDocument {
  actionId: mongoose.Types.ObjectId;
  caseId: mongoose.Types.ObjectId;
  documentId?: mongoose.Types.ObjectId;

  actionType: ActionType;
  agentType: AgentType;

  rejectionReason: RejectionReason;
  userComment?: string;

  feedbackContext: IFeedbackContext;

  userCorrection?: IUserCorrection;

  userId: string;

  processedForTraining: boolean;
  processedAt?: Date;

  createdAt: Date;
}

const FeedbackContextSchema = new Schema<IFeedbackContext>(
  {
    originalContent: { type: Schema.Types.Mixed, required: true },
    inputSummary: { type: String, required: true },
    aiReasoning: { type: String, required: true },
    aiConfidence: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
);

const UserCorrectionSchema = new Schema<IUserCorrection>(
  {
    correctedContent: { type: Schema.Types.Mixed },
    issues: { type: [String], default: [] },
    explanation: { type: String },
  },
  { _id: false }
);

const FeedbackSchema = new Schema<IFeedback>(
  {
    actionId: {
      type: Schema.Types.ObjectId,
      ref: 'Action',
      required: [true, 'Action ID is required'],
      index: true,
    },
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case ID is required'],
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      index: true,
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
    agentType: {
      type: String,
      required: [true, 'Agent type is required'],
      enum: {
        values: AGENT_TYPES,
        message: '{VALUE} is not a valid agent type',
      },
      index: true,
    },

    rejectionReason: {
      type: String,
      required: [true, 'Rejection reason is required'],
      enum: {
        values: REJECTION_REASONS,
        message: '{VALUE} is not a valid rejection reason',
      },
      index: true,
    },
    userComment: { type: String },

    feedbackContext: {
      type: FeedbackContextSchema,
      required: [true, 'Feedback context is required'],
    },

    userCorrection: {
      type: UserCorrectionSchema,
    },

    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },

    processedForTraining: {
      type: Boolean,
      default: false,
      index: true,
    },
    processedAt: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'feedback',
  }
);

FeedbackSchema.index({ processedForTraining: 1, createdAt: -1 });

FeedbackSchema.index({ rejectionReason: 1, actionType: 1 });
FeedbackSchema.index({ agentType: 1, rejectionReason: 1 });

FeedbackSchema.index({ createdAt: -1 });

FeedbackSchema.statics.getUnprocessedFeedback = async function (limit: number = 100) {
  return this.find({ processedForTraining: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

FeedbackSchema.statics.getRejectionStats = async function (
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          reason: '$rejectionReason',
          actionType: '$actionType',
          agentType: '$agentType',
        },
        count: { $sum: 1 },
        avgConfidence: { $avg: '$feedbackContext.aiConfidence' },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

export default mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);
