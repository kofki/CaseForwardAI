import mongoose, { Schema, Document as MongoDocument } from 'mongoose';
import {
  AuditEventType,
  SeverityLevel,
  AgentType,
  AUDIT_EVENT_TYPES,
  SEVERITY_LEVELS,
  AGENT_TYPES,
} from '../types/enums';

export interface IAIDetails {
  modelName: string;
  prompt?: string;
  response?: string;
  temperature?: number;
  tokensUsed?: number;
  latencyMs?: number;
  roundTableSessionId?: string;
}

export interface IRequestContext {
  requestId?: string;
  traceId?: string;
  userAgent?: string;
  ipAddress?: string;
  endpoint?: string;
  method?: string;
}

export interface IAuditLog extends MongoDocument {
  eventType: AuditEventType;
  severity: SeverityLevel;

  agentType: AgentType;
  agentId: string;

  caseId?: mongoose.Types.ObjectId;
  documentId?: mongoose.Types.ObjectId;
  actionId?: mongoose.Types.ObjectId;

  message: string;
  details?: Record<string, any>;

  aiDetails?: IAIDetails;

  requestContext?: IRequestContext;

  success: boolean;
  errorMessage?: string;
  errorStack?: string;

  blockchainHash?: string;

  createdAt: Date;
}

const AIDetailsSchema = new Schema<IAIDetails>(
  {
    modelName: { type: String, required: true },
    prompt: { type: String },
    response: { type: String },
    temperature: { type: Number },
    tokensUsed: { type: Number },
    latencyMs: { type: Number },
    roundTableSessionId: { type: String },
  },
  { _id: false }
);

const RequestContextSchema = new Schema<IRequestContext>(
  {
    requestId: { type: String },
    traceId: { type: String },
    userAgent: { type: String },
    ipAddress: { type: String },
    endpoint: { type: String },
    method: { type: String },
  },
  { _id: false }
);

const AuditLogSchema = new Schema<IAuditLog>(
  {
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: {
        values: AUDIT_EVENT_TYPES,
        message: '{VALUE} is not a valid event type',
      },
      index: true,
    },
    severity: {
      type: String,
      required: true,
      default: SeverityLevel.INFO,
      enum: {
        values: SEVERITY_LEVELS,
        message: '{VALUE} is not a valid severity level',
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
    agentId: {
      type: String,
      required: [true, 'Agent ID is required'],
      index: true,
    },

    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      index: true,
    },
    actionId: {
      type: Schema.Types.ObjectId,
      ref: 'Action',
      index: true,
    },

    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    details: {
      type: Schema.Types.Mixed,
    },

    aiDetails: {
      type: AIDetailsSchema,
    },

    requestContext: {
      type: RequestContextSchema,
    },

    success: {
      type: Boolean,
      required: true,
      default: true,
    },
    errorMessage: { type: String },
    errorStack: { type: String },

    blockchainHash: { type: String, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'audit_logs',
  }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ caseId: 1, createdAt: -1 });
AuditLogSchema.index({ agentType: 1, eventType: 1, createdAt: -1 });
AuditLogSchema.index({ severity: 1, success: 1, createdAt: -1 });
AuditLogSchema.index({ eventType: 1, createdAt: -1 });

AuditLogSchema.statics.logEvent = async function (
  eventType: AuditEventType,
  agentType: AgentType,
  agentId: string,
  message: string,
  options: Partial<IAuditLog> = {}
) {
  return this.create({
    eventType,
    agentType,
    agentId,
    message,
    success: true,
    ...options,
  });
};

AuditLogSchema.statics.logError = async function (
  eventType: AuditEventType,
  agentType: AgentType,
  agentId: string,
  error: Error,
  options: Partial<IAuditLog> = {}
) {
  return this.create({
    eventType,
    agentType,
    agentId,
    message: error.message,
    success: false,
    errorMessage: error.message,
    errorStack: error.stack,
    severity: SeverityLevel.ERROR,
    ...options,
  });
};

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
