import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  mapperId: mongoose.Types.ObjectId;
  sessionId?: mongoose.Types.ObjectId;
  eventId?: mongoose.Types.ObjectId;
  amount: number;
  type: string;
  status: string;
  description?: string;
  bankAccount?: string;
  bankName?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    mapperId: {
      type: Schema.Types.ObjectId,
      ref: 'Mapper',
      required: true,
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'MappingSession',
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['MAPPING', 'BONUS', 'REFERRAL', 'WITHDRAWAL', 'EVENT_REPORT'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    description: String,
    bankAccount: String,
    bankName: String,
    reference: {
      type: String,
      unique: true,
      sparse: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
transactionSchema.index({ mapperId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });

const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
export default Transaction;
