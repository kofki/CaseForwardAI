// lib/db/models/AuditLog.ts

import mongoose, { Schema, Document } from 'mongoose';
import {
  AgentType,
  AuditEventType,
  Severity,
  AGENT_TYPES,
  AUDIT_EVENT_TYPES,
  SEVERITIES,
} from '../types/enums';

export interface IAuditLog extends Document {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  caseId?: mongoose.Types.ObjectId;
  actionId?: mongoose.Types.ObjectId;
  documentId?: mongoose.Types.ObjectId;
  userId?: string;
  sessionId?: string;

  agent: {
    type: AgentType;
    version: string;
    instanceId?: string;
  };

  event: {
    type: AuditEventType;
    description: string;
    severity: Severity;
  };

  aiIO?: {
    prompt?: string;
    response?: string;
    model: string;
    temperature?: number;
    tokensUsed?: {
      input: number;
      output: number;
      total: number;
    };
    confidence?: number;
  };

  roundTable?: {
    participants: AgentType[];
    discussion: Array<{
      agent: AgentType;
      message: string;
      timestamp: Date;
    }>;
    consensus?: string;
  };

  feedback?: {
    decision: 'approved' | 'rejected';
    rating?: number;
    comments?: string;
    whatWentWrong?: string;
    whatWentWell?: string;
  };

  blockchain?: {
    network: 'mainnet' | 'devnet' | 'testnet';
    transactionHash?: string;
    slot?: number;
    confirmed: boolean;
    dataHash: string;
  };

  timing: {
    startedAt: Date;
    completedAt?: Date;
    durationMs?: number;
  };

  result: {
    success: boolean;
    error?: {
      code: string;
      message: string;
      stack?: string;
    };
    data?: Record<string, any>;
  };

  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    traceId: {
      type: String,
      required: [true, 'Trace ID is required'],
      index: true,
    },
    spanId: {
      type: String,
      required: [true, 'Span ID is required'],
      unique: true,
    },
    parentSpanId: {
      type: String,
      index: true,
    },
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      index: true,
    },
    actionId: {
      type: Schema.Types.ObjectId,
      ref: 'Action',
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
    },
    userId: {
      type: String,
      index: true,
    },
    sessionId: String,
    agent: {
      type: {
        type: String,
        required: [true, 'Agent type is required'],
        enum: {
          values: AGENT_TYPES,
          message: '{VALUE} is not a valid agent type',
        },
        index: true,
      },
      version: {
        type: String,
        required: true,
        default: '1.0.0',
      },
      instanceId: String,
    },
    event: {
      type: {
        type: String,
        required: [true, 'Event type is required'],
        enum: {
          values: AUDIT_EVENT_TYPES,
          message: '{VALUE} is not a valid event type',
        },
        index: true,
      },
      description: {
        type: String,
        required: [true, 'Event description is required'],
      },
      severity: {
        type: String,
        required: true,
        default: Severity.INFO,
        enum: {
          values: SEVERITIES,
          message: '{VALUE} is not a valid severity',
        },
        index: true,
      },
    },
    aiIO: {
      prompt: String,
      response: String,
      model: String,
      temperature: {
        type: Number,
        min: 0,
        max: 2,
      },
      tokensUsed: {
        input: Number,
        output: Number,
        total: Number,
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
    },
    roundTable: {
      participants: [
        {
          type: String,
          enum: AGENT_TYPES,
        },
      ],
      discussion: [
        {
          agent: {
            type: String,
            enum: AGENT_TYPES,
            required: true,
          },
          message: {
            type: String,
            required: true,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      consensus: String,
    },
    feedback: {
      decision: {
        type: String,
        enum: ['approved', 'rejected'],
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comments: String,
      whatWentWrong: String,
      whatWentWell: String,
    },
    blockchain: {
      network: {
        type: String,
        enum: ['mainnet', 'devnet', 'testnet'],
      },
      transactionHash: String,
      slot: Number,
      confirmed: {
        type: Boolean,
        default: false,
      },
      dataHash: String,
    },
    timing: {
      startedAt: {
        type: Date,
        required: true,
        default: Date.now,
      },
      completedAt: Date,
      durationMs: Number,
    },
    result: {
      success: {
        type: Boolean,
        required: true,
        default: true,
      },
      error: {
        code: String,
        message: String,
        stack: String,
      },
      data: {
        type: Schema.Types.Mixed,
      },
    },
  },
  {
    timestamps: true,
    collection: 'audit_logs',
  }
);

AuditLogSchema.index({ traceId: 1, 'timing.startedAt': 1 });

AuditLogSchema.index({ caseId: 1, 'agent.type': 1, createdAt: -1 });

AuditLogSchema.index({ 'agent.type': 1, 'event.type': 1, createdAt: -1 });

AuditLogSchema.index({ 'result.success': 1, 'event.severity': 1, createdAt: -1 });

AuditLogSchema.index({ 'feedback.decision': 1, 'agent.type': 1, createdAt: -1 });

// AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

export default mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);