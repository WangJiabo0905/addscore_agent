import bcrypt from 'bcryptjs';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export interface AuthTokenPayload {
  userId: string;
  studentId: string;
}

const rawSecret = process.env.JWT_SECRET;

if (!rawSecret) {
  throw new Error('Missing JWT_SECRET environment variable');
}

const JWT_SECRET: string = rawSecret;

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

export function verifyToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload | string;
  if (
    typeof decoded !== 'object' ||
    !decoded ||
    typeof decoded.userId !== 'string' ||
    typeof decoded.studentId !== 'string'
  ) {
    throw new Error('Invalid token payload');
  }
  return {
    userId: decoded.userId,
    studentId: decoded.studentId,
  };
}

export function extractTokenFromRequest(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}
