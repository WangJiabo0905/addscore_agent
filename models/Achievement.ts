import mongoose, {
  Schema,
  type HydratedDocument,
  type Model,
  type Types,
} from 'mongoose';

export type AchievementCategory =
  | 'paper'
  | 'patent'
  | 'contest'
  | 'innovation'
  | 'volunteer'
  | 'honor'
  | 'social'
  | 'sports';

export interface ReviewDecision {
  reviewerId: Types.ObjectId;
  reviewerName: string;
  reviewerStudentId: string;
  status: 'submitted' | 'approved' | 'rejected';
  comment?: string;
  reviewedAt?: Date;
}

export interface IAchievement {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  category: AchievementCategory;
  obtainedAt: Date;
  score: number;
  description?: string;
  evidenceUrl?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  metadata: Record<string, unknown>;
  reviews: ReviewDecision[];
  createdAt: Date;
  updatedAt: Date;
}

export type AchievementDocument = HydratedDocument<IAchievement>;

const achievementSchema = new Schema<IAchievement>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'paper',
        'patent',
        'contest',
        'innovation',
        'volunteer',
        'honor',
        'social',
        'sports',
      ],
      required: true,
    },
    obtainedAt: { type: Date, required: true },
    score: { type: Number, default: 0 },
    description: { type: String },
    evidenceUrl: { type: String },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'draft',
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    reviews: {
      type: [
        {
          reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          reviewerName: { type: String, required: true },
          reviewerStudentId: { type: String, required: true },
          status: {
            type: String,
            enum: ['submitted', 'approved', 'rejected'],
            default: 'submitted',
          },
          comment: { type: String },
          reviewedAt: { type: Date },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const Achievement: Model<IAchievement> =
  mongoose.models.Achievement ||
  mongoose.model<IAchievement>('Achievement', achievementSchema);
