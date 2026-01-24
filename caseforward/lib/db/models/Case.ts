// lib/db/models/Case.ts

import mongoose, { Schema, Document } from 'mongoose';
import {
  CaseType,
  CaseStatus,
  CASE_TYPES,
  CASE_STATUSES,
} from '../types/enums';

export interface ICase extends Document {
  caseNumber: string;
  fileNumber: string;
  caseType: CaseType;
  status: CaseStatus;

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
      required: [true, 'File number is required'],
      unique: true,
      trim: true,
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
      name: {
        type: String,
        required: [true, 'Client name is required'],
        trim: true,
      },
      email: {
        type: String,
        required: [true, 'Client email is required'],
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        required: [true, 'Client phone is required'],
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
        required: [true, 'Incident date is required'],
      },
      time: {
        type: String,
      },
      location: {
        address: String,
        city: {
          type: String,
          required: [true, 'Incident city is required'],
        },
        state: {
          type: String,
          required: [true, 'Incident state is required'],
        },
        zipCode: String,
        county: String,
      },
      description: {
        type: String,
        required: [true, 'Incident description is required'],
      },
      policeReportNumber: String,
    },

    defendants: [
      {
        name: {
          type: String,
          required: true,
        },
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
        carrier: {
          type: String,
          required: [true, 'Defendant insurance carrier is required'],
        },
        policyNumber: String,
        claimNumber: {
          type: String,
          required: [true, 'Claim number is required'],
          index: true,
        },
        policyLimit: Number,
        adjuster: {
          name: {
            type: String,
            required: [true, 'Adjuster name is required'],
          },
          phone: {
            type: String,
            required: [true, 'Adjuster phone is required'],
          },
          email: {
            type: String,
            required: [true, 'Adjuster email is required'],
          },
          fax: String,
        },
      },
    },

    dates: {
      incidentDate: {
        type: Date,
        required: [true, 'Incident date is required'],
      },
      intakeDate: {
        type: Date,
        default: Date.now,
      },
      statuteOfLimitations: {
        type: Date,
        required: [true, 'Statute of limitations date is required'],
        index: true,
      },
      demandSentDate: Date,
      settlementDate: Date,
    },

    financials: {
      totalMedicalBills: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalLiens: {
        type: Number,
        default: 0,
        min: 0,
      },
      lostWages: {
        type: Number,
        default: 0,
        min: 0,
      },
      propertyDamage: {
        type: Number,
        default: 0,
        min: 0,
      },
      demandAmount: {
        type: Number,
        min: 0,
      },
      settlementAmount: {
        type: Number,
        min: 0,
      },
      attorneyFees: {
        type: Number,
        min: 0,
      },
      clientRecovery: {
        type: Number,
        min: 0,
      },
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
      leadAttorney: {
        type: String,
        required: [true, 'Lead attorney is required'],
      },
      paralegal: String,
      caseManager: String,
    },

    aiMetadata: {
      lastAnalyzedAt: Date,
      pendingActions: {
        type: Number,
        default: 0,
      },
      completedActions: {
        type: Number,
        default: 0,
      },
      flags: [String],
    },
  },
  {
    timestamps: true,
    collection: 'cases',
  }
);

CaseSchema.index({ status: 1, 'dates.statuteOfLimitations': 1 });
CaseSchema.index({ 'team.leadAttorney': 1, status: 1 });
CaseSchema.index({ caseType: 1, status: 1 });
CaseSchema.index({ 'client.email': 1 });
CaseSchema.index({ createdAt: -1 });

CaseSchema.virtual('daysUntilSOL').get(function () {
  if (!this.dates.statuteOfLimitations) return null;
  const now = new Date();
  const sol = new Date(this.dates.statuteOfLimitations);
  const diffTime = sol.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

CaseSchema.virtual('totalDamages').get(function () {
  return (
    (this.financials.totalMedicalBills || 0) +
    (this.financials.lostWages || 0) +
    (this.financials.propertyDamage || 0)
  );
});

export default mongoose.models.Case ||
  mongoose.model<ICase>('Case', CaseSchema);