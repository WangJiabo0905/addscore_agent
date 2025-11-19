import mongoose, {
  Schema,
  type HydratedDocument,
  type Model,
  type Types,
} from 'mongoose';

export interface IApplication {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  personalStatement: string;
  plan: string;
  lastSubmittedAt?: Date;
  reviewerRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ApplicationDocument = HydratedDocument<IApplication>;

const applicationSchema = new Schema<IApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
      default: 'draft',
    },
    personalStatement: { type: String, default: '' },
    plan: { type: String, default: '' },
    lastSubmittedAt: { type: Date },
    reviewerRemarks: { type: String },
  },
  { timestamps: true }
);

export const Application: Model<IApplication> =
  mongoose.models.Application ||
  mongoose.model<IApplication>('Application', applicationSchema);
