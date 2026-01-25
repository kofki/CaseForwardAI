import mongoose, { Schema, Model, HydratedDocument } from 'mongoose';
import {
  LienType,
  LienStatus,
  LIEN_TYPES,
  LIEN_STATUSES,
} from '../types/enums';

export interface INegotiationHistory {
  date: Date;
  originalAmount: number;
  offeredAmount: number;
  notes?: string;
  negotiatedBy: string;
}

export interface ILien {
  caseId: mongoose.Types.ObjectId;
  documentId?: mongoose.Types.ObjectId;
  
  lienType: LienType;
  lienHolder: string;
  lienHolderContact?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    fax?: string;
  };
  
  claimNumber?: string;
  accountNumber?: string;
  
  originalAmount: number;
  currentAmount: number;
  amountPaid: number;
  remainingBalance: number;
  
  status: LienStatus;
  
  filedDate?: Date;
  dueDate?: Date;
  releasedDate?: Date;
  
  negotiationHistory: INegotiationHistory[];
  
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export type LienDocument = HydratedDocument<ILien>;

const NegotiationHistorySchema = new Schema(
  {
    date: { type: Date, required: true },
    originalAmount: { type: Number, required: true },
    offeredAmount: { type: Number, required: true },
    notes: { type: String },
    negotiatedBy: { type: String, required: true },
  },
  { _id: false }
);

const LienSchema = new Schema(
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
    },

    lienType: {
      type: String,
      required: [true, 'Lien type is required'],
      enum: {
        values: LIEN_TYPES,
        message: '{VALUE} is not a valid lien type',
      },
      index: true,
    },
    lienHolder: {
      type: String,
      required: [true, 'Lien holder is required'],
      trim: true,
    },
    lienHolderContact: {
      name: { type: String },
      phone: { type: String },
      email: { type: String },
      address: { type: String },
      fax: { type: String },
    },

    claimNumber: { type: String, trim: true },
    accountNumber: { type: String, trim: true },

    originalAmount: {
      type: Number,
      required: [true, 'Original amount is required'],
      min: 0,
    },
    currentAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingBalance: {
      type: Number,
      default: 0,
      min: 0,
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

    filedDate: { type: Date },
    dueDate: { type: Date },
    releasedDate: { type: Date },

    negotiationHistory: {
      type: [NegotiationHistorySchema],
      default: [],
    },

    notes: { type: String },
  },
  {
    timestamps: true,
    collection: 'liens',
  }
);

LienSchema.index({ caseId: 1, lienType: 1 });
LienSchema.index({ caseId: 1, status: 1 });
LienSchema.index({ status: 1, dueDate: 1 });

LienSchema.virtual('calculatedBalance').get(function () {
  return this.currentAmount - this.amountPaid;
});

LienSchema.statics.createWithBalance = async function (data: Partial<ILien>) {
  const remainingBalance = (data.currentAmount || 0) - (data.amountPaid || 0);
  return this.create({ ...data, remainingBalance });
};

LienSchema.statics.updateAmounts = async function (
  id: string,
  currentAmount: number,
  amountPaid: number
) {
  const remainingBalance = currentAmount - amountPaid;
  return this.findByIdAndUpdate(
    id,
    { currentAmount, amountPaid, remainingBalance },
    { new: true }
  );
};

const Lien: Model<ILien> = mongoose.models.Lien || mongoose.model<ILien>('Lien', LienSchema);

export default Lien;