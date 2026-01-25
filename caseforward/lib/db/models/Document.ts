import mongoose, { Schema, Document as MongoDocument } from 'mongoose';
import {
  DocumentStatus,
  DocumentCategory,
  InputSource,
  DOCUMENT_STATUSES,
  DOCUMENT_CATEGORIES,
  INPUT_SOURCES,
} from '../types/enums';

export interface IFileInfo {
  originalName: string;
  storagePath: string;
  storageProvider: 'r2';
  mimeType: string;
  size: number;
  hash: string;
}

export interface IExtractedImage {
  storagePath: string;
  page: number;
  width?: number;
  height?: number;
  description?: string;
}

export interface IExtractedContent {
  text: string;
  textLength: number;
  images: IExtractedImage[];
  pageCount: number;
  hasImages: boolean;
  extractedAt: Date;
  extractionMethod: 'pdf-parse' | 'ocr' | 'native' | 'none';
  extractionError?: string;
}

export interface IExtractedEntity {
  value: string;
  confidence: number;
  source?: string;
}

export interface IQuickExtraction {
  documentType: DocumentCategory;
  documentTypeConfidence: number;
  entities: {
    patientName?: IExtractedEntity;
    patientDOB?: IExtractedEntity;
    providerName?: IExtractedEntity;
    providerType?: IExtractedEntity;
    providerNPI?: IExtractedEntity;
    dates: IExtractedEntity[];
    amounts: IExtractedEntity[];
    caseNumbers: IExtractedEntity[];
    diagnoses: IExtractedEntity[];
    procedures: IExtractedEntity[];
  };
  suggestedCases: Array<{
    caseId: mongoose.Types.ObjectId;
    caseNumber: string;
    clientName: string;
    confidence: number;
    matchReasons: string[];
  }>;
  extractedAt: Date;
}

export interface IRoundTableMessage {
  agent: 'orchestrator' | 'client_guru' | 'evidence_analyzer';
  message: string;
  timestamp: Date;
}

export interface IAIAnalysis {
  isProcessed: boolean;
  processedAt?: Date;
  summary?: string;
  keyFindings: string[];
  flags: string[];
  recommendations: string[];
  confidence: number;
  agentContributions: {
    orchestrator?: string;
    clientGuru?: string;
    evidenceAnalyzer?: string;
  };
  roundTableLog: IRoundTableMessage[];
  tokensUsed?: number;
  processingTimeMs?: number;
}

export interface IDocumentMetadata {
  provider?: string;
  providerType?: string;
  providerNPI?: string;
  facility?: string;

  dateOfService?: Date;
  dateRange?: {
    start: Date;
    end: Date;
  };

  billAmount?: number;
  amountPaid?: number;
  balanceDue?: number;

  diagnoses?: string[];
  procedures?: string[];

  pageCount?: number;
}

export interface IDocument extends MongoDocument {
  caseId: mongoose.Types.ObjectId | null;

  status: DocumentStatus;

  title: string;
  category: DocumentCategory;

  inputSource: InputSource;

  file: IFileInfo;

  extractedContent?: IExtractedContent;

  quickExtraction?: IQuickExtraction;

  aiAnalysis: IAIAnalysis;

  metadata: IDocumentMetadata;

  uploadedBy: string;
  uploadedAt: Date;
  assignedAt?: Date;
  assignedBy?: string;
  reviewedBy?: string;
  reviewedAt?: Date;

  notes?: string;
  tags: string[];

  lastError?: string;
  errorCount: number;

  createdAt: Date;
  updatedAt: Date;
}

const FileInfoSchema = new Schema<IFileInfo>(
  {
    originalName: { type: String, required: true },
    storagePath: { type: String, required: true },
    storageProvider: { type: String, enum: ['r2'], default: 'r2' },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    hash: { type: String, required: true },
  },
  { _id: false }
);

const ExtractedImageSchema = new Schema<IExtractedImage>(
  {
    storagePath: { type: String, required: true },
    page: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    description: { type: String },
  },
  { _id: false }
);

const ExtractedContentSchema = new Schema<IExtractedContent>(
  {
    text: { type: String, default: '' },
    textLength: { type: Number, default: 0 },
    images: { type: [ExtractedImageSchema], default: [] },
    pageCount: { type: Number, default: 0 },
    hasImages: { type: Boolean, default: false },
    extractedAt: { type: Date },
    extractionMethod: {
      type: String,
      enum: ['pdf-parse', 'ocr', 'native', 'none'],
      default: 'none'
    },
    extractionError: { type: String },
  },
  { _id: false }
);

const ExtractedEntitySchema = new Schema(
  {
    value: { type: String, required: true },
    confidence: { type: Number, default: 0, min: 0, max: 1 },
    source: { type: String },
  },
  { _id: false }
);

const QuickExtractionSchema = new Schema<IQuickExtraction>(
  {
    documentType: { type: String, enum: DOCUMENT_CATEGORIES },
    documentTypeConfidence: { type: Number, default: 0, min: 0, max: 1 },
    entities: {
      patientName: { type: ExtractedEntitySchema },
      patientDOB: { type: ExtractedEntitySchema },
      providerName: { type: ExtractedEntitySchema },
      providerType: { type: ExtractedEntitySchema },
      providerNPI: { type: ExtractedEntitySchema },
      dates: { type: [ExtractedEntitySchema], default: [] },
      amounts: { type: [ExtractedEntitySchema], default: [] },
      caseNumbers: { type: [ExtractedEntitySchema], default: [] },
      diagnoses: { type: [ExtractedEntitySchema], default: [] },
      procedures: { type: [ExtractedEntitySchema], default: [] },
    },
    suggestedCases: [{
      caseId: { type: Schema.Types.ObjectId, ref: 'Case' },
      caseNumber: { type: String },
      clientName: { type: String },
      confidence: { type: Number, min: 0, max: 1 },
      matchReasons: { type: [String], default: [] },
    }],
    extractedAt: { type: Date },
  },
  { _id: false }
);

const RoundTableMessageSchema = new Schema<IRoundTableMessage>(
  {
    agent: {
      type: String,
      enum: ['orchestrator', 'client_guru', 'evidence_analyzer'],
      required: true
    },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AIAnalysisSchema = new Schema<IAIAnalysis>(
  {
    isProcessed: { type: Boolean, default: false },
    processedAt: { type: Date },
    summary: { type: String },
    keyFindings: { type: [String], default: [] },
    flags: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    confidence: { type: Number, default: 0, min: 0, max: 1 },
    agentContributions: {
      orchestrator: { type: String },
      clientGuru: { type: String },
      evidenceAnalyzer: { type: String },
    },
    roundTableLog: { type: [RoundTableMessageSchema], default: [] },
    tokensUsed: { type: Number },
    processingTimeMs: { type: Number },
  },
  { _id: false }
);

const DocumentMetadataSchema = new Schema<IDocumentMetadata>(
  {
    provider: { type: String },
    providerType: { type: String },
    providerNPI: { type: String },
    facility: { type: String },
    dateOfService: { type: Date },
    dateRange: {
      start: { type: Date },
      end: { type: Date },
    },
    billAmount: { type: Number, min: 0 },
    amountPaid: { type: Number, min: 0 },
    balanceDue: { type: Number, min: 0 },
    diagnoses: { type: [String], default: [] },
    procedures: { type: [String], default: [] },
    pageCount: { type: Number, min: 0 },
  },
  { _id: false }
);

const DocumentSchema = new Schema<IDocument>(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      index: true,
      default: null,
    },

    status: {
      type: String,
      required: true,
      default: DocumentStatus.UPLOADING,
      enum: {
        values: DOCUMENT_STATUSES,
        message: '{VALUE} is not a valid document status',
      },
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    category: {
      type: String,
      default: DocumentCategory.OTHER,
      enum: {
        values: DOCUMENT_CATEGORIES,
        message: '{VALUE} is not a valid document category',
      },
      index: true,
    },

    inputSource: {
      type: String,
      default: InputSource.WEB_UPLOAD,
      enum: {
        values: INPUT_SOURCES,
        message: '{VALUE} is not a valid input source',
      },
    },

    file: {
      type: FileInfoSchema,
      required: [true, 'File information is required'],
    },

    extractedContent: {
      type: ExtractedContentSchema,
    },

    quickExtraction: {
      type: QuickExtractionSchema,
    },

    aiAnalysis: {
      type: AIAnalysisSchema,
      default: () => ({ isProcessed: false, keyFindings: [], flags: [], recommendations: [], roundTableLog: [] }),
    },

    metadata: {
      type: DocumentMetadataSchema,
      default: () => ({}),
    },

    uploadedBy: {
      type: String,
      required: [true, 'Uploader is required'],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    assignedAt: { type: Date },
    assignedBy: { type: String },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },

    // User additions
    notes: { type: String },
    tags: { type: [String], default: [], index: true },

    // Error tracking
    lastError: { type: String },
    errorCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'documents',
  }
);

// ============================================================================
// INDEXES
// ============================================================================

// Compound indexes for common queries
DocumentSchema.index({ caseId: 1, category: 1 });
DocumentSchema.index({ caseId: 1, status: 1 });
DocumentSchema.index({ status: 1, createdAt: -1 });
DocumentSchema.index({ 'aiAnalysis.isProcessed': 1, status: 1 });
DocumentSchema.index({ 'file.hash': 1 }, { unique: true });

// For finding unassigned documents
DocumentSchema.index({ caseId: 1, status: 1 }, { 
  partialFilterExpression: { caseId: null } 
});

// Text search
DocumentSchema.index(
  {
    title: 'text',
    'extractedContent.text': 'text',
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
      'aiAnalysis.summary': 2,
      'extractedContent.text': 1,
    },
  }
);

// ============================================================================
// EXPORT
// ============================================================================

export default mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);
