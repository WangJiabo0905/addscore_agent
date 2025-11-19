'use client';

export interface StoredUser {
  id: string;
  studentId: string;
  name: string;
  role: string;
  profile?: {
    department: string;
    major: string;
    grade: string;
    className: string;
    phone: string;
    email: string;
  };
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch (error) {
    console.error('Failed to parse stored user', error);
    return null;
  }
}

export function saveAuth(user: StoredUser, token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user');
  localStorage.removeItem('token');
}

