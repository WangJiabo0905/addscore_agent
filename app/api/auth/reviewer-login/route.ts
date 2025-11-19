import { NextRequest, NextResponse } from 'next/server';
import { ensureDefaultUsers } from '@/lib/seed';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { signToken, verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { accountId, password } = await request.json();

    if (!accountId || !password) {
      return NextResponse.json(
        { success: false, message: '请提供账号和密码' },
        { status: 400 }
      );
    }

    await ensureDefaultUsers();
    await connectDB();

    const user = await User.findOne({ studentId: accountId, role: 'reviewer' });
    if (!user) {
      return NextResponse.json(
        { success: false, message: '账号或密码错误' },
        { status: 401 }
      );
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, message: '账号或密码错误' },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user._id.toString(),
      studentId: user.studentId,
    });

    return NextResponse.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user._id.toString(),
          studentId: user.studentId,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          profile: user.profile,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Reviewer login error:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
