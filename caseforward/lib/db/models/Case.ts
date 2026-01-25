import mongoose, { Schema, Document as MongoDocument } from 'mongoose';
import {
  CaseType,
  CaseStatus,
  CASE_TYPES,
  CASE_STATUSES,
} from '../types/enums';

export interface IClient {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

export interface IFinancials {
  totalMedicalBills: number;
  totalMedicalPaid: number;
  lostWages: number;
  propertyDamage: number;
  painAndSuffering: number;
  settlementAmount: number;
  attorneyFees: number;
  caseCosts: number;
  netToClient: number;
}

export interface IAIMetadata {
  lastProcessedAt?: Date;
  summary?: string;
  keyIssues: string[];
  missingDocuments: string[];
  nextSteps: string[];
  riskFlags: string[];
  confidenceScore: number;
}

export interface IInsurance {
  defendantPolicy?: {
    carrier?: string;
    claimNumber?: string;
    policyLimit?: number;
    adjuster?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  };
}

export interface ICase extends MongoDocument {
  caseNumber: string;
  fileNumber?: string;
  title?: string;
  description?: string;

  caseType: CaseType;
  status: CaseStatus;

  client: IClient;
  defendant?: string;
  insurance?: IInsurance;
  attorney?: string;
  paralegal?: string;

  incidentDate?: Date;
  filedDate?: Date;
  statuteOfLimitationsDate?: Date;
  closedDate?: Date;

  incidentDescription?: string;
  incidentLocation?: string;
  injuries: string[];

  financials: IFinancials;

  aiMetadata: IAIMetadata;

  documentCount: number;
  pendingActionCount: number;

  notes?: string;
  tags: string[];

  createdAt: Date;
  updatedAt: Date;

  daysUntilStatuteExpires?: number;
  totalDamages?: number;
  clientFullName?: string;
}

const ClientSchema = new Schema<IClient>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
    },
  },
  { _id: false }
);

const FinancialsSchema = new Schema<IFinancials>(
  {
    totalMedicalBills: { type: Number, default: 0, min: 0 },
    totalMedicalPaid: { type: Number, default: 0, min: 0 },
    lostWages: { type: Number, default: 0, min: 0 },
    propertyDamage: { type: Number, default: 0, min: 0 },
    painAndSuffering: { type: Number, default: 0, min: 0 },
    settlementAmount: { type: Number, default: 0, min: 0 },
    attorneyFees: { type: Number, default: 0, min: 0 },
    caseCosts: { type: Number, default: 0, min: 0 },
    netToClient: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const AIMetadataSchema = new Schema<IAIMetadata>(
  {
    lastProcessedAt: { type: Date },
    summary: { type: String },
    keyIssues: { type: [String], default: [] },
    missingDocuments: { type: [String], default: [] },
    nextSteps: { type: [String], default: [] },
    riskFlags: { type: [String], default: [] },
    confidenceScore: { type: Number, default: 0, min: 0, max: 1 },
  },
  { _id: false }
);

const CaseSchema = new Schema<ICase>(
  {
    caseNumber: {
      type: String,
      required: [true, 'Case number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    title: { type: String, trim: true },
    description: { type: String },
    fileNumber: {
      type: String,
      trim: true,
      sparse: true,
    },

    caseType: {
      type: String,
      required: [true, 'Case type is required'],
      enum: {
        values: CASE_TYPES,
        message: '{VALUE} is not a valid case type',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      default: CaseStatus.INTAKE,
      enum: {
        values: CASE_STATUSES,
        message: '{VALUE} is not a valid case status',
      },
      index: true,
    },

    client: {
      type: ClientSchema,
      required: [true, 'Client information is required'],
    },
    defendant: { type: String, trim: true },

    // Updated Insurance Structure
    insurance: {
      type: new Schema({
        defendantPolicy: {
          carrier: { type: String, trim: true },
          claimNumber: { type: String, trim: true },
          policyLimit: { type: Number },
          adjuster: {
            name: { type: String, trim: true },
            email: { type: String, trim: true },
            phone: { type: String, trim: true },
          }
        }
      }, { _id: false }),
      default: () => ({}),
    },

    attorney: { type: String, trim: true },
    paralegal: { type: String, trim: true },

    incidentDate: { type: Date, index: true },
    filedDate: { type: Date },
    statuteOfLimitationsDate: { type: Date, index: true },
    closedDate: { type: Date },

    incidentDescription: { type: String },
    incidentLocation: { type: String },
    injuries: { type: [String], default: [] },

    financials: {
      type: FinancialsSchema,
      default: () => ({}),
    },

    aiMetadata: {
      type: AIMetadataSchema,
      default: () => ({}),
    },

    documentCount: { type: Number, default: 0, min: 0 },
    pendingActionCount: { type: Number, default: 0, min: 0 },

    notes: { type: String },
    tags: { type: [String], default: [], index: true },
  },
  {
    timestamps: true,
    collection: 'cases',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CaseSchema.virtual('daysUntilStatuteExpires').get(function () {
  if (!this.statuteOfLimitationsDate) return undefined;
  const now = new Date();
  const diffTime = this.statuteOfLimitationsDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

CaseSchema.virtual('totalDamages').get(function () {
  const f = this.financials;
  return (
    (f?.totalMedicalBills || 0) +
    (f?.lostWages || 0) +
    (f?.propertyDamage || 0) +
    (f?.painAndSuffering || 0)
  );
});

CaseSchema.virtual('clientFullName').get(function () {
  if (!this.client) return undefined;
  return `${this.client.firstName} ${this.client.lastName}`;
});

CaseSchema.index({ status: 1, caseType: 1 });
CaseSchema.index({ 'client.lastName': 1, 'client.firstName': 1 });
CaseSchema.index({ statuteOfLimitationsDate: 1, status: 1 });
CaseSchema.index({ createdAt: -1 });
CaseSchema.index({ updatedAt: -1 });

CaseSchema.index(
  {
    caseNumber: 'text',
    'client.firstName': 'text',
    'client.lastName': 'text',
    defendant: 'text',
    incidentDescription: 'text',
    notes: 'text',
  },
  {
    name: 'case_text_search',
    weights: {
      caseNumber: 10,
      'client.lastName': 8,
      'client.firstName': 8,
      defendant: 5,
      incidentDescription: 2,
      notes: 1,
    },
  }
);

const CaseModel = mongoose.models.Case || mongoose.model<ICase>('Case', CaseSchema);

export async function getCaseById(id: string | mongoose.Types.ObjectId) {
  return CaseModel.findById(id).exec();
}

export async function getCases(filter?: any) {
  return CaseModel.find(filter ?? {}).sort({ createdAt: -1 }).exec();
}

export default CaseModel;

export type Case = ICase;
