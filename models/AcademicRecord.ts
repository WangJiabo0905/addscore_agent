import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

export interface IAcademicRecord {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  gpa: number;
  score: number;
  evidenceUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AcademicRecordDocument = HydratedDocument<IAcademicRecord>;

const academicRecordSchema = new Schema<IAcademicRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    gpa: { type: Number, min: 0, max: 5, required: true },
    score: { type: Number, min: 0, required: true },
    evidenceUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export const AcademicRecord: Model<IAcademicRecord> =
  mongoose.models.AcademicRecord ||
  mongoose.model<IAcademicRecord>('AcademicRecord', academicRecordSchema);
