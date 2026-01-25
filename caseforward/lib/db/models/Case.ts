import mongoose, { Schema, Document } from 'mongoose';
import {
  CaseType,
  CaseStatus,
  CASE_TYPES,
  CASE_STATUSES,
} from '../types/enums';

// --- Mongoose Interface (Enhanced) ---

export interface ICase extends Document {
  caseNumber: string;
  fileNumber: string;
  // Compatibility fields for main branch
  title?: string;
  description?: string;

  caseType: CaseType;
  status: CaseStatus | string; // Allow string for legacy statuses

  client: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    dateOfBirth?: Date;
  };

  incident: {
    date: Date;
    time?: string;
    location: {
      address?: string;
      city: string;
      state: string;
      zipCode?: string;
      county?: string;
    };
    description: string;
    policeReportNumber?: string;
  };

  defendants: Array<{
    name: string;
    type: 'individual' | 'company' | 'government';
    address?: string;
  }>;

  insurance: {
    clientPolicy?: {
      carrier: string;
      policyNumber: string;
      coverageType: string;
    };
    defendantPolicy: {
      carrier: string;
      policyNumber?: string;
      claimNumber: string;
      policyLimit?: number;
      adjuster: {
        name: string;
        phone: string;
        email: string;
        fax?: string;
      };
    };
  };

  dates: {
    incidentDate: Date;
    intakeDate: Date;
    statuteOfLimitations: Date;
    demandSentDate?: Date;
    settlementDate?: Date;
  };

  financials: {
    totalMedicalBills: number;
    totalLiens: number;
    lostWages: number;
    propertyDamage: number;
    demandAmount?: number;
    settlementAmount?: number;
    attorneyFees?: number;
    clientRecovery?: number;
  };

  evidenceChecklist: {
    clientIntake: boolean;
    retainerSigned: boolean;
    policeReport: boolean;
    medicalRecords: boolean;
    medicalBills: boolean;
    incidentPhotos: boolean;
    witnessStatements: boolean;
    payStubs: boolean;
    employerLetter: boolean;
    insuranceDocs: boolean;
  };

  team: {
    leadAttorney: string;
    paralegal?: string;
    caseManager?: string;
  };

  aiMetadata: {
    lastAnalyzedAt?: Date;
    pendingActions: number;
    completedActions: number;
    flags: string[];
  };

  createdAt: Date;
  updatedAt: Date;
}

const CaseSchema = new Schema<ICase>(
  {
    caseNumber: {
      type: String,
      required: [true, 'Case number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    fileNumber: {
      type: String,
      required: [false, 'File number is optional for legacy cases'], // Relaxed for compat
      trim: true,
    },
    title: String,
    description: String,

    caseType: {
      type: String,
      required: [false, 'Case type is optional for legacy'], // Relaxed
      enum: {
        values: [...CASE_TYPES, 'Personal Injury', 'Other'], // Extended
        message: '{VALUE} is not a valid case type',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      default: CaseStatus.INTAKE,
      index: true,
    },

    client: {
      name: {
        type: String,
        required: [true, 'Client name is required'],
        trim: true,
      },
      email: {
        type: String,
        required: [false, 'Client email is optional for legacy'], // Relaxed
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        required: [false, 'Client phone is optional for legacy'], // Relaxed
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      dateOfBirth: {
        type: Date,
      },
    },

    incident: {
      date: {
        type: Date,
        required: [false, 'Incident date is optional for legacy'],
      },
      time: String,
      location: {
        address: String,
        city: String,
        state: String,
        zipCode: String,
        county: String,
      },
      description: {
        type: String,
        required: [false, 'Incident description is optional'],
      },
      policeReportNumber: String,
    },

    defendants: [
      {
        name: String,
        type: {
          type: String,
          enum: ['individual', 'company', 'government'],
          default: 'individual',
        },
        address: String,
      },
    ],

    insurance: {
      clientPolicy: {
        carrier: String,
        policyNumber: String,
        coverageType: String,
      },
      defendantPolicy: {
        carrier: String,
        policyNumber: String,
        claimNumber: String,
        policyLimit: Number,
        adjuster: {
          name: String,
          phone: String,
          email: String,
          fax: String,
        },
      },
    },

    dates: {
      incidentDate: Date,
      intakeDate: {
        type: Date,
        default: Date.now,
      },
      statuteOfLimitations: {
        type: Date,
        index: true,
      },
      demandSentDate: Date,
      settlementDate: Date,
    },

    financials: {
      totalMedicalBills: { type: Number, default: 0 },
      totalLiens: { type: Number, default: 0 },
      lostWages: { type: Number, default: 0 },
      propertyDamage: { type: Number, default: 0 },
      demandAmount: Number,
      settlementAmount: Number,
      attorneyFees: Number,
      clientRecovery: Number,
    },

    evidenceChecklist: {
      clientIntake: { type: Boolean, default: false },
      retainerSigned: { type: Boolean, default: false },
      policeReport: { type: Boolean, default: false },
      medicalRecords: { type: Boolean, default: false },
      medicalBills: { type: Boolean, default: false },
      incidentPhotos: { type: Boolean, default: false },
      witnessStatements: { type: Boolean, default: false },
      payStubs: { type: Boolean, default: false },
      employerLetter: { type: Boolean, default: false },
      insuranceDocs: { type: Boolean, default: false },
    },

    team: {
      leadAttorney: String,
      paralegal: String,
      caseManager: String,
    },

    aiMetadata: {
      lastAnalyzedAt: Date,
      pendingActions: { type: Number, default: 0 },
      completedActions: { type: Number, default: 0 },
      flags: [String],
    },
  },
  {
    timestamps: true,
    collection: 'cases',
    strict: false, // Allow fields from Main that aren't in schema
  }
);

// Virtuals
CaseSchema.virtual('daysUntilSOL').get(function () {
  if (!this.dates?.statuteOfLimitations) return null;
  const now = new Date();
  const sol = new Date(this.dates.statuteOfLimitations);
  const diffTime = sol.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

CaseSchema.virtual('totalDamages').get(function () {
  return (
    (this.financials?.totalMedicalBills || 0) +
    (this.financials?.lostWages || 0) +
    (this.financials?.propertyDamage || 0)
  );
});

// Helper for connection
import { connectToDatabase } from '../connect';

// Ensure model is compiled
let CaseModel: mongoose.Model<ICase>;
try {
  CaseModel = mongoose.model<ICase>('Case');
} catch {
  CaseModel = mongoose.model<ICase>('Case', CaseSchema);
}

export default CaseModel;

// --- Helper Functions for Main Branch Compatibility ---

export async function getCases(userId?: string) {
  await connectToDatabase();
  const query = userId ? { 'team.leadAttorney': userId } : {};
  const cases = await CaseModel.find(query).sort({ createdAt: -1 }).lean();
  return cases.map(c => ({
    ...c,
    _id: c._id.toString()
  }));
}

export async function getCaseById(id: string) {
  await connectToDatabase();
  try {
    const case_ = await CaseModel.findById(id).lean();
    if (!case_) return null;
    return {
      ...case_,
      _id: case_._id.toString()
    };
  } catch (error) {
    return null;
  }
}

export async function createCase(caseData: any) {
  await connectToDatabase();
  // Map flat structure (if from main) to nested structure (if needed) or rely on strict: false
  // For now, pass caseData directly.
  const newCase = new CaseModel(caseData);
  const saved = await newCase.save();
  return {
    ...saved.toObject(),
    _id: saved._id.toString()
  };
}
