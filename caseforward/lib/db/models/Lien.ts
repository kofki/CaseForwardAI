// lib/db/models/Lien.ts

import mongoose, { Schema, Document } from 'mongoose';
import {
  LienType,
  LienStatus,
  LIEN_TYPES,
  LIEN_STATUSES,
  LienTypePriority,
} from '../types/enums';

export interface ILien extends Document {
  caseId: mongoose.Types.ObjectId;
  type: LienType;
  status: LienStatus;
  priority: number;
  lienholder: {
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
    fax?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    accountNumber?: string;
    claimNumber?: string;
  };

  amounts: {
    originalClaimed: number;
    currentBalance: number;
    negotiatedAmount?: number;
    paidAmount: number;
    waivedAmount: number;
  };

  negotiations: Array<{
    date: Date;
    contactedBy: string;
    method: 'phone' | 'email' | 'mail' | 'fax';
    offeredAmount?: number;
    responseAmount?: number;
    notes: string;
    outcome?: string;
  }>;

  relatedDocuments: Array<{
    documentId: mongoose.Types.ObjectId;
    description: string;
  }>;

  dates: {
    identifiedDate: Date;
    noticeReceivedDate?: Date;
    responseDeadline?: Date;
    lastContactDate?: Date;
    resolvedDate?: Date;
  };

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const LienSchema = new Schema<ILien>(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case ID is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Lien type is required'],
      enum: {
        values: LIEN_TYPES,
        message: '{VALUE} is not a valid lien type',
      },
      index: true,
    },
    status: {
      type: String,
      required: true,
      default: LienStatus.IDENTIFIED,
      enum: {
        values: LIEN_STATUSES,
        message: '{VALUE} is not a valid lien status',
      },
      index: true,
    },
    priority: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      default: function (this: ILien) {
        return LienTypePriority[this.type as LienType] || 8;
      },
    },
    lienholder: {
      name: {
        type: String,
        required: [true, 'Lienholder name is required'],
        trim: true,
      },
      contactName: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      fax: {
        type: String,
        trim: true,
      },
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
      },
      accountNumber: String,
      claimNumber: String,
    },

    amounts: {
      originalClaimed: {
        type: Number,
        required: [true, 'Original claimed amount is required'],
        min: 0,
      },
      currentBalance: {
        type: Number,
        required: [true, 'Current balance is required'],
        min: 0,
      },
      negotiatedAmount: {
        type: Number,
        min: 0,
      },
      paidAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      waivedAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    negotiations: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        contactedBy: {
          type: String,
          required: true,
        },
        method: {
          type: String,
          enum: ['phone', 'email', 'mail', 'fax'],
          required: true,
        },
        offeredAmount: {
          type: Number,
          min: 0,
        },
        responseAmount: {
          type: Number,
          min: 0,
        },
        notes: {
          type: String,
          required: true,
        },
        outcome: String,
      },
    ],

    relatedDocuments: [
      {
        documentId: {
          type: Schema.Types.ObjectId,
          ref: 'Document',
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],

    dates: {
      identifiedDate: {
        type: Date,
        default: Date.now,
      },
      noticeReceivedDate: Date,
      responseDeadline: {
        type: Date,
        index: true,
      },
      lastContactDate: Date,
      resolvedDate: Date,
    },

    notes: String,
  },
  {
    timestamps: true,
    collection: 'liens',
  }
);

LienSchema.index({ caseId: 1, type: 1 });
LienSchema.index({ caseId: 1, status: 1 });
LienSchema.index({ status: 1, 'dates.responseDeadline': 1 });
LienSchema.index({ caseId: 1, priority: 1 });

LienSchema.virtual('remainingBalance').get(function () {
  return (
    this.amounts.currentBalance -
    this.amounts.paidAmount -
    this.amounts.waivedAmount
  );
});

LienSchema.virtual('savings').get(function () {
  if (!this.amounts.negotiatedAmount) return 0;
  return this.amounts.originalClaimed - this.amounts.negotiatedAmount;
});

export default mongoose.models.Lien ||
  mongoose.model<ILien>('Lien', LienSchema);