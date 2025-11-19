import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-helpers';
import { Achievement } from '@/models/Achievement';
import { Application } from '@/models/Application';
import { calculateScoreSummary } from '@/lib/scoring';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const [achievementStats, application, scoreSummary] = await Promise.all([
      Achievement.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Application.findOne({ userId: user._id }),
      calculateScoreSummary(user._id.toString()),
    ]);

    const statsMap = achievementStats.reduce<Record<string, number>>(
      (acc, item) => {
        acc[item._id] = item.count;
        return acc;
      },
      {}
    );

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          studentId: user.studentId,
          profile: user.profile,
        },
        achievements: {
          total: Object.values(statsMap).reduce((sum, value) => sum + value, 0),
          draft: statsMap.draft || 0,
          submitted: statsMap.submitted || 0,
          approved: statsMap.approved || 0,
          rejected: statsMap.rejected || 0,
        },
        application: application
          ? {
              status: application.status,
              lastSubmittedAt: application.lastSubmittedAt,
              updatedAt: application.updatedAt,
            }
          : {
              status: 'draft',
            },
        scoring: scoreSummary,
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
      { success: false, message: '获取仪表盘数据失败' },
      { status: 500 }
    );
  }
}

