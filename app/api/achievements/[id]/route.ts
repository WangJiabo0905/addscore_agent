import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-helpers';
import { Achievement } from '@/models/Achievement';
import type { AchievementDocument } from '@/models/Achievement';
import { calculateBaseScore } from '@/lib/scoring';
import { ensureAchievementReviewers } from '@/lib/reviewers';

async function findAchievement(
  id: string,
  userId: string
): Promise<AchievementDocument> {
  const achievement = await Achievement.findOne({ _id: id, userId }).exec();
  if (!achievement) {
    throw new Error('NOT_FOUND');
  }
  return achievement;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser(request);
    const achievement = await findAchievement(params.id, user._id.toString());
    await ensureAchievementReviewers(achievement);

    return NextResponse.json({
      success: true,
      data: {
        id: achievement._id.toString(),
        title: achievement.title,
        category: achievement.category,
        obtainedAt: achievement.obtainedAt,
        score: achievement.score,
        description: achievement.description,
        evidenceUrl: achievement.evidenceUrl,
        status: achievement.status,
        metadata: achievement.metadata,
        createdAt: achievement.createdAt,
        updatedAt: achievement.updatedAt,
        reviews: (achievement.reviews || []).map((review) => ({
          reviewerId: review.reviewerId.toString(),
          reviewerName: review.reviewerName,
          reviewerStudentId: review.reviewerStudentId,
          status: review.status,
          comment: review.comment,
          reviewedAt: review.reviewedAt,
        })),
      },
    });
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }
    if ((error as Error).message === 'NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: '未找到成果' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, message: '获取成果失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser(request);
    const achievement = await findAchievement(params.id, user._id.toString());
    const body = await request.json();

    const allowedFields = [
      'title',
      'category',
      'obtainedAt',
      'description',
      'evidenceUrl',
      'metadata',
      'status',
    ] as const;

    allowedFields.forEach((field) => {
      if (field in body) {
        if (field === 'metadata') {
          achievement.metadata =
            body.metadata && typeof body.metadata === 'object'
              ? body.metadata
              : {};
        } else if (field === 'status') {
          const nextStatus = body.status;
          if (nextStatus === 'draft' || nextStatus === 'submitted') {
            achievement.status = nextStatus;
          }
        } else {
          (achievement as any)[field] = body[field];
        }
      }
    });

    if (achievement.status === 'draft' || achievement.status === 'submitted') {
      achievement.reviews = (achievement.reviews || []).map((review) => ({
        ...review,
        status: 'submitted',
        comment: undefined,
        reviewedAt: undefined,
      }));
    }

    const { rawScore } = calculateBaseScore(achievement);
    achievement.score = rawScore;
    await achievement.save();
    await ensureAchievementReviewers(achievement);

    return NextResponse.json({
      success: true,
      message: '成果已更新',
      data: {
        id: achievement._id.toString(),
        title: achievement.title,
        category: achievement.category,
        obtainedAt: achievement.obtainedAt,
        score: achievement.score,
        description: achievement.description,
        evidenceUrl: achievement.evidenceUrl,
        status: achievement.status,
        metadata: achievement.metadata,
        createdAt: achievement.createdAt,
        updatedAt: achievement.updatedAt,
        reviews: (achievement.reviews || []).map((review) => ({
          reviewerId: review.reviewerId.toString(),
          reviewerName: review.reviewerName,
          reviewerStudentId: review.reviewerStudentId,
          status: review.status,
          comment: review.comment,
          reviewedAt: review.reviewedAt,
        })),
      },
    });
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }
    if ((error as Error).message === 'NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: '未找到成果' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, message: '更新成果失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser(request);
    const achievement = await findAchievement(params.id, user._id.toString());
    await achievement.deleteOne();

    return NextResponse.json({
      success: true,
      message: '成果已删除',
    });
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }
    if ((error as Error).message === 'NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: '未找到成果' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, message: '删除成果失败' },
      { status: 500 }
    );
  }
}
