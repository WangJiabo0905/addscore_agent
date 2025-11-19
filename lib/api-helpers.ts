import { NextRequest } from 'next/server';
import { extractTokenFromRequest, verifyToken } from './auth';
import { connectDB } from './db';
import { User } from '@/models/User';
import type { UserDocument } from '@/models/User';

export async function requireUser(req: NextRequest): Promise<UserDocument> {
  const token = extractTokenFromRequest(req);
  if (!token) {
    throw new Error('UNAUTHORIZED');
  }

  try {
    const payload = verifyToken(token);
    await connectDB();
    const user = await User.findById(payload.userId).exec();
    if (!user || !user.isActive) {
      throw new Error('UNAUTHORIZED');
    }
    return user;
  } catch (error) {
    throw new Error('UNAUTHORIZED');
  }
}

export async function requireReviewer(
  req: NextRequest
): Promise<UserDocument> {
  const user = await requireUser(req);
  if (user.role !== 'reviewer') {
    throw new Error('FORBIDDEN');
  }
  return user;
}
