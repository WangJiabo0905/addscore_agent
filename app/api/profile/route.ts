import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);

    return NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(),
        studentId: user.studentId,
        name: user.name,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, message: '获取个人信息失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const { name, profile } = body;

    if (name) {
      user.name = String(name);
    }

    if (profile) {
      user.profile = {
        ...user.profile,
        ...profile,
      };
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: '个人信息已更新',
      data: {
        id: user._id.toString(),
        studentId: user.studentId,
        name: user.name,
        profile: user.profile,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: '更新个人信息失败' },
      { status: 500 }
    );
  }
}

