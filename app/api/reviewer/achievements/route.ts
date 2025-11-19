import { NextRequest, NextResponse } from 'next/server';
import { requireReviewer } from '@/lib/api-helpers';
import { Achievement } from '@/models/Achievement';
import type { UserDocument } from '@/models/User';
import { ensureAchievementReviewers, getReviewerDecision } from '@/lib/reviewers';

export async function GET(request: NextRequest) {
  try {
    const reviewer = await requireReviewer(request);
    const status = request.nextUrl.searchParams.get('status');

    const achievements = await Achievement.find({
      status: { $in: ['submitted', 'approved', 'rejected'] },
    })
      .populate('userId')
      .sort({ createdAt: -1 })
      .exec();
    await Promise.all(achievements.map((item) => ensureAchievementReviewers(item)));

    const filtered = achievements.filter((item) => {
      const reviewEntry = getReviewerDecision(item, reviewer._id);
      const reviewerStatus = reviewEntry?.status ?? 'submitted';
      if (status && status !== 'all' && reviewerStatus !== status) {
        return false;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      data: filtered.map((item) => {
        const owner = item.userId as unknown as UserDocument | null;
        const reviewEntry = getReviewerDecision(item, reviewer._id);
        const reviewerStatus = reviewEntry?.status ?? 'submitted';
        return {
          id: item._id.toString(),
          title: item.title,
          category: item.category,
          obtainedAt: item.obtainedAt,
          score: item.score,
          description: item.description,
          evidenceUrl: item.evidenceUrl,
          status: reviewerStatus,
          reviewComment: reviewEntry?.comment,
          reviewedAt: reviewEntry?.reviewedAt,
          metadata: item.metadata,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          student: owner
            ? {
                id: owner._id.toString(),
                name: owner.name,
                studentId: owner.studentId,
                department: owner.profile?.department,
                major: owner.profile?.major,
                grade: owner.profile?.grade,
              }
            : null,
          reviewer:
            reviewEntry && reviewEntry.status !== 'submitted'
              ? {
                  id: reviewer._id.toString(),
                  name: reviewer.name,
                  studentId: reviewer.studentId,
                }
              : null,
        };
      }),
    });
  } catch (error) {
    const message = (error as Error).message;
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }
    if (message === 'FORBIDDEN') {
      return NextResponse.json(
        { success: false, message: '无访问权限' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: '获取成果列表失败' },
      { status: 500 }
    );
  }
}
