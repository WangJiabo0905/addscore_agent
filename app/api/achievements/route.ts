import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-helpers';
import { Achievement } from '@/models/Achievement';
import { calculateBaseScore } from '@/lib/scoring';
import { ensureAchievementReviewers } from '@/lib/reviewers';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const status = request.nextUrl.searchParams.get('status');

    const query: Record<string, unknown> = { userId: user._id };
    if (status) {
      query.status = status;
    }

    const achievements = await Achievement.find(query).sort({ obtainedAt: -1 });
    await Promise.all(achievements.map((achievement) => ensureAchievementReviewers(achievement)));

    return NextResponse.json({
      success: true,
      data: achievements.map((item) => ({
        id: item._id.toString(),
        title: item.title,
        category: item.category,
        obtainedAt: item.obtainedAt,
        score: item.score,
        description: item.description,
        evidenceUrl: item.evidenceUrl,
        status: item.status,
        metadata: item.metadata,
        createdAt: item.createdAt,
        reviews: (item.reviews || []).map((review) => ({
          reviewerId: review.reviewerId.toString(),
          reviewerName: review.reviewerName,
          reviewerStudentId: review.reviewerStudentId,
          status: review.status,
          comment: review.comment,
          reviewedAt: review.reviewedAt,
        })),
      })),
    });
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: '获取成果列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const { title, category, obtainedAt, description, evidenceUrl, metadata, status } =
      body;

    if (!title || !category || !obtainedAt) {
      return NextResponse.json(
        { success: false, message: '请填写完整的成果信息' },
        { status: 400 }
      );
    }

    const parsedMetadata = metadata && typeof metadata === 'object' ? metadata : {};

    const normalizedStatus = status === 'submitted' ? 'submitted' : 'draft';

    const achievement = await Achievement.create({
      userId: user._id,
      title,
      category,
      obtainedAt,
      description,
      evidenceUrl,
      metadata: parsedMetadata,
      status: normalizedStatus,
    });

    const { rawScore } = calculateBaseScore(achievement);
    achievement.score = rawScore;
    await achievement.save();
    await ensureAchievementReviewers(achievement);

    return NextResponse.json({
      success: true,
      message: '成果已保存',
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

    return NextResponse.json(
      { success: false, message: '保存成果失败' },
      { status: 500 }
    );
  }
}
