// lib/db/models/Document.ts

import mongoose, { Schema, Document } from 'mongoose';
import {
  DocumentCategory,
  DocumentStatus,
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
} from '../types/enums';

export interface IDocument extends Document {
  caseId: mongoose.Types.ObjectId;
  title: string;
  category: DocumentCategory;
  status: DocumentStatus;

  file: {
    originalName: string;
    storagePath: string;
    storageProvider: 'local' | 's3' | 'gcs' | 'azure';
    mimeType: string;
    size: number;
    hash: string;
  };

  metadata: {
    provider?: string;
    providerType?: string;
    dateOfService?: Date;
    dateRange?: {
      start: Date;
      end: Date;
    };
    pageCount?: number;
  };

  billing?: {
    totalBilled: number;
    totalPaid: number;
    balance: number;
    paidBy: string;
    hasLien: boolean;
    lienId?: mongoose.Types.ObjectId;
  };

  aiAnalysis: {
    isProcessed: boolean;
    processedAt?: Date;
    summary?: string;
    extractedData?: Record<string, any>;
    keyFindings: string[];
    flags: string[];
    confidence: number;
  };

  uploadedBy: string;
  uploadedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;

  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case ID is required'],
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Document category is required'],
      enum: {
        values: DOCUMENT_CATEGORIES,
        message: '{VALUE} is not a valid document category',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      default: DocumentStatus.RECEIVED,
      enum: {
        values: DOCUMENT_STATUSES,
        message: '{VALUE} is not a valid document status',
      },
      index: true,
    },

    file: {
      originalName: {
        type: String,
        required: [true, 'Original file name is required'],
      },
      storagePath: {
        type: String,
        required: [true, 'Storage path is required'],
      },
      storageProvider: {
        type: String,
        enum: ['local', 's3', 'gcs', 'azure'],
        default: 'local',
      },
      mimeType: {
        type: String,
        required: [true, 'MIME type is required'],
      },
      size: {
        type: Number,
        required: [true, 'File size is required'],
        min: 0,
      },
      hash: {
        type: String,
        required: [true, 'File hash is required'],
        index: true,
      },
    },

    metadata: {
      provider: String,
      providerType: String,
      dateOfService: Date,
      dateRange: {
        start: Date,
        end: Date,
      },
      pageCount: {
        type: Number,
        min: 0,
      },
    },

    billing: {
      totalBilled: {
        type: Number,
        min: 0,
      },
      totalPaid: {
        type: Number,
        min: 0,
      },
      balance: {
        type: Number,
        min: 0,
      },
      paidBy: String,
      hasLien: {
        type: Boolean,
        default: false,
      },
      lienId: {
        type: Schema.Types.ObjectId,
        ref: 'Lien',
      },
    },

    aiAnalysis: {
      isProcessed: {
        type: Boolean,
        default: false,
        index: true,
      },
      processedAt: Date,
      summary: String,
      extractedData: {
        type: Schema.Types.Mixed,
        default: {},
      },
      keyFindings: {
        type: [String],
        default: [],
      },
      flags: {
        type: [String],
        default: [],
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
      },
    },

    uploadedBy: {
      type: String,
      required: [true, 'Uploader is required'],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: String,
    reviewedAt: Date,
    notes: String,

    tags: {
      type: [String],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'documents',
  }
);

DocumentSchema.index({ caseId: 1, category: 1 });
DocumentSchema.index({ caseId: 1, status: 1 });
DocumentSchema.index({ caseId: 1, 'metadata.dateOfService': -1 });
DocumentSchema.index({ 'aiAnalysis.isProcessed': 1, createdAt: 1 });

DocumentSchema.index(
  {
    title: 'text',
    'aiAnalysis.summary': 'text',
    'aiAnalysis.keyFindings': 'text',
    tags: 'text',
  },
  {
    name: 'document_text_search',
    weights: {
      title: 10,
      'aiAnalysis.keyFindings': 5,
      tags: 3,
      'aiAnalysis.summary': 1,
    },
  }
);

DocumentSchema.index({ 'file.hash': 1 }, { unique: true });

export default mongoose.models.Document ||
  mongoose.model<IDocument>('Document', DocumentSchema);