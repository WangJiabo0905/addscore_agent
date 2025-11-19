import { NextRequest, NextResponse } from 'next/server';
import { requireReviewer } from '@/lib/api-helpers';
import { Achievement } from '@/models/Achievement';
import type { UserDocument } from '@/models/User';
import {
  deriveOverallStatus,
  ensureAchievementReviewers,
  getReviewerDecision,
} from '@/lib/reviewers';

const REVIEWABLE_STATUSES = ['submitted', 'approved', 'rejected'] as const;

type ReviewableStatus = (typeof REVIEWABLE_STATUSES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewer = await requireReviewer(request);
    const body = await request.json();
    const { status, comment } = body as {
      status?: ReviewableStatus;
      comment?: string;
    };

    if (!status || !REVIEWABLE_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, message: '无效的状态值' },
        { status: 400 }
      );
    }

    if (status === 'rejected' && (!comment || comment.trim().length === 0)) {
      return NextResponse.json(
        { success: false, message: '退回时需填写审核说明' },
        { status: 400 }
      );
    }

    const achievement = await Achievement.findById(params.id).populate('userId').exec();

    if (!achievement) {
      return NextResponse.json(
        { success: false, message: '未找到成果' },
        { status: 404 }
      );
    }

    await ensureAchievementReviewers(achievement);

    const reviewEntry = getReviewerDecision(achievement, reviewer._id);
    if (!reviewEntry) {
      return NextResponse.json(
        { success: false, message: '未找到对应审核角色' },
        { status: 400 }
      );
    }

    reviewEntry.status = status;
    reviewEntry.comment = comment ?? undefined;
    reviewEntry.reviewedAt = new Date();
    achievement.status = deriveOverallStatus(achievement.reviews);
    await achievement.save();
    await achievement.populate('userId');

    const owner = achievement.userId as unknown as UserDocument | null;

    return NextResponse.json({
      success: true,
      message: '成果状态已更新',
      data: {
        id: achievement._id.toString(),
        title: achievement.title,
        category: achievement.category,
        obtainedAt: achievement.obtainedAt,
        score: achievement.score,
        description: achievement.description,
        evidenceUrl: achievement.evidenceUrl,
        status: reviewEntry.status,
        reviewComment: reviewEntry.comment,
        reviewedAt: reviewEntry.reviewedAt,
        metadata: achievement.metadata,
        createdAt: achievement.createdAt,
        updatedAt: achievement.updatedAt,
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
        reviewer: {
          id: reviewer._id.toString(),
          name: reviewer.name,
          studentId: reviewer.studentId,
        },
      },
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
      { success: false, message: '更新成果状态失败' },
      { status: 500 }
    );
  }
}
