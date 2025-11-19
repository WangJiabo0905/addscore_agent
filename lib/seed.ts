import { connectDB } from './db';
import { User } from '@/models/User';
import { hashPassword } from './auth';

interface DefaultUserConfig {
  studentId: string;
  password: string;
  name: string;
  role: 'student' | 'reviewer';
  profile: {
    department: string;
    major: string;
    grade: string;
    className: string;
    phone: string;
    email: string;
  };
}

const DEFAULT_USERS: DefaultUserConfig[] = [
  {
    studentId: 'student_demo',
    password: 'student2024',
    name: '示例学生',
    role: 'student',
    profile: {
      department: '信息学院',
      major: '计算机科学与技术',
      grade: '2024级',
      className: '演示班',
      phone: '13800000000',
      email: 'student_demo@xmu.edu.cn',
    },
  },
  {
    studentId: 'reviewer001',
    password: 'checker2024',
    name: '李审核',
    role: 'reviewer',
    profile: {
      department: '信息学院推免工作小组',
      major: '审核中心',
      grade: '审核组',
      className: '综合审核',
      phone: '13900000000',
      email: 'reviewer@xmu.edu.cn',
    },
  },
  {
    studentId: 'reviewer002',
    password: 'checker2024',
    name: '王审核',
    role: 'reviewer',
    profile: {
      department: '信息学院推免工作小组',
      major: '审核中心',
      grade: '审核组',
      className: '创新成果审核',
      phone: '13900000001',
      email: 'reviewer002@xmu.edu.cn',
    },
  },
  {
    studentId: 'reviewer003',
    password: 'checker2024',
    name: '陈审核',
    role: 'reviewer',
    profile: {
      department: '信息学院推免工作小组',
      major: '审核中心',
      grade: '审核组',
      className: '综合素质审核',
      phone: '13900000002',
      email: 'reviewer003@xmu.edu.cn',
    },
  },
];

export async function ensureDefaultUsers(): Promise<void> {
  await connectDB();

  for (const config of DEFAULT_USERS) {
    const existing = await User.findOne({ studentId: config.studentId });
    if (existing) {
      continue;
    }
    const passwordHash = await hashPassword(config.password);
    await User.create({
      studentId: config.studentId,
      name: config.name,
      passwordHash,
      role: config.role,
      profile: config.profile,
    });
  }
}

export async function ensureDefaultStudent(): Promise<void> {
  await ensureDefaultUsers();
}
