import mongoose, { Schema, Document as MongoDocument } from 'mongoose';
import {
  ActionType,
  ActionStatus,
  ActionPriority,
  AgentType,
  ACTION_TYPES,
  ACTION_STATUSES,
  ACTION_PRIORITIES,
  AGENT_TYPES,
} from '../types/enums';

export interface IEmailContent {
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  attachments?: string[];
}

export interface ITextContent {
  to: string;
  message: string;
}

export interface IDocumentRequestContent {
  documentType: string;
  requestedFrom: string;
  reason: string;
  dueDate?: Date;
}

export interface ICaseUpdateContent {
  field: string;
  oldValue?: any;
  newValue: any;
  reason: string;
}

export interface IRecommendationContent {
  title: string;
  description: string;
  suggestedActions: string[];
}

export interface IActionContent {
  email?: IEmailContent;
  text?: ITextContent;
  documentRequest?: IDocumentRequestContent;
  caseUpdate?: ICaseUpdateContent;
  recommendation?: IRecommendationContent;
  raw?: Record<string, any>;
}

export interface IAIContext {
  reasoning: string;
  confidence: number;
  agentType: AgentType;
  supportingEvidence: string[];
  alternativesConsidered?: string[];
  roundTableSessionId?: string;
}

export interface IReviewResult {
  reviewedBy: string;
  reviewedAt: Date;
  approved: boolean;
  feedback?: string;
  modifiedContent?: IActionContent;
}

export interface IExecutionResult {
  executedAt: Date;
  success: boolean;
  error?: string;
  externalId?: string;
  auditHash?: string;
}

export interface IAction extends MongoDocument {
  caseId: mongoose.Types.ObjectId;
  documentId?: mongoose.Types.ObjectId;

  type: ActionType;
  status: ActionStatus;
  priority: ActionPriority;

  title: string;
  description: string;
  content: IActionContent;

  aiContext: IAIContext;

  actionCard?: {
    recommendation?: string;
    reasoning?: string;
    confidence?: number;
    [key: string]: any;
  };

  consensus?: {
    clientGuruOpinion?: string;
    evidenceAnalyzerOpinion?: string;
    finalDecision?: string;
    [key: string]: any;
  };

  review?: IReviewResult;
  execution?: IExecutionResult;

  expiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const EmailContentSchema = new Schema<IEmailContent>(
  {
    to: { type: [String], required: true },
    cc: { type: [String], default: [] },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    attachments: { type: [String], default: [] },
  },
  { _id: false }
);

const TextContentSchema = new Schema<ITextContent>(
  {
    to: { type: String, required: true },
    message: { type: String, required: true },
  },
  { _id: false }
);

const DocumentRequestContentSchema = new Schema<IDocumentRequestContent>(
  {
    documentType: { type: String, required: true },
    requestedFrom: { type: String, required: true },
    reason: { type: String, required: true },
    dueDate: { type: Date },
  },
  { _id: false }
);

const CaseUpdateContentSchema = new Schema<ICaseUpdateContent>(
  {
    field: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed, required: true },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const RecommendationContentSchema = new Schema<IRecommendationContent>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    suggestedActions: { type: [String], default: [] },
  },
  { _id: false }
);

const ActionContentSchema = new Schema<IActionContent>(
  {
    email: { type: EmailContentSchema },
    text: { type: TextContentSchema },
    documentRequest: { type: DocumentRequestContentSchema },
    caseUpdate: { type: CaseUpdateContentSchema },
    recommendation: { type: RecommendationContentSchema },
    raw: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const AIContextSchema = new Schema<IAIContext>(
  {
    reasoning: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    agentType: {
      type: String,
      required: true,
      enum: AGENT_TYPES,
    },
    supportingEvidence: { type: [String], default: [] },
    alternativesConsidered: { type: [String], default: [] },
    roundTableSessionId: { type: String },
  },
  { _id: false }
);

const ReviewResultSchema = new Schema<IReviewResult>(
  {
    reviewedBy: { type: String, required: true },
    reviewedAt: { type: Date, required: true },
    approved: { type: Boolean, required: true },
    feedback: { type: String },
    modifiedContent: { type: ActionContentSchema },
  },
  { _id: false }
);

const ExecutionResultSchema = new Schema<IExecutionResult>(
  {
    executedAt: { type: Date, required: true },
    success: { type: Boolean, required: true },
    error: { type: String },
    externalId: { type: String },
    auditHash: { type: String },
  },
  { _id: false }
);

const ActionSchema = new Schema<IAction>(
  {
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

    type: {
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

    title: {
      type: String,
      required: [true, 'Action title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Action description is required'],
    },
    content: {
      type: ActionContentSchema,
      required: [true, 'Action content is required'],
    },

    aiContext: {
      type: AIContextSchema,
      required: [true, 'AI context is required'],
    },

    review: { type: ReviewResultSchema },
    execution: { type: ExecutionResultSchema },

    expiresAt: { type: Date, index: true },
  },
  {
    timestamps: true,
    collection: 'actions',
  }
);

ActionSchema.index({ status: 1, priority: 1, createdAt: 1 });
ActionSchema.index({ caseId: 1, createdAt: -1 });
ActionSchema.index({ status: 1, expiresAt: 1 });

const ActionModel = mongoose.models.Action || mongoose.model<IAction>('Action', ActionSchema);

export async function createAction(payload: Record<string, any> & { caseId: string | mongoose.Types.ObjectId }) {
  return ActionModel.create(payload as any);
}

export async function getActionsByCaseId(caseId: string | mongoose.Types.ObjectId) {
  return ActionModel.find({ caseId }).sort({ createdAt: -1 }).exec();
}

export default ActionModel;

export type Action = IAction;
