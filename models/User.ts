import mongoose, {
  Schema,
  type HydratedDocument,
  type Model,
  type Types,
} from 'mongoose';

export interface UserProfile {
  department: string;
  major: string;
  grade: string;
  className: string;
  phone: string;
  email: string;
}

export interface IUser {
  _id: Types.ObjectId;
  studentId: string;
  name: string;
  passwordHash: string;
  role: 'student' | 'reviewer';
  isActive: boolean;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    studentId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'reviewer'],
      default: 'student',
    },
    isActive: { type: Boolean, default: true },
    profile: {
      department: { type: String, default: '信息学院' },
      major: { type: String, default: '计算机科学与技术' },
      grade: { type: String, default: '2021级' },
      className: { type: String, default: '计算机1班' },
      phone: { type: String, default: '13800000000' },
      email: { type: String, default: 'student@example.com' },
    },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);
