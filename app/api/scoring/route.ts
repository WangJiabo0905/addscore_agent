import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-helpers';
import { calculateScoreSummary } from '@/lib/scoring';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const summary = await calculateScoreSummary(user._id.toString());

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, message: '计算积分失败' },
      { status: 500 }
    );
  }
}

