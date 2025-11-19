import { NextRequest, NextResponse } from 'next/server';
import { requireReviewer } from '@/lib/api-helpers';
import { getStudentRanking } from '@/lib/ranking';

export async function GET(request: NextRequest) {
  try {
    await requireReviewer(request);
    const ranking = await getStudentRanking();

    return NextResponse.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        ranking,
      },
    });
  } catch (error) {
    const message = (error as Error).message;
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
    }
    if (message === 'FORBIDDEN') {
      return NextResponse.json({ success: false, message: '无访问权限' }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, message: '获取排名数据失败' },
      { status: 500 }
    );
  }
}
