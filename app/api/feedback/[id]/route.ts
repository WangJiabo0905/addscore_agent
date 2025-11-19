import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireReviewer } from '@/lib/api-helpers';
import { feedbackUpdateSchema } from '@/lib/validation';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewer = await requireReviewer(req);
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少反馈编号' },
        { status: 400 }
      );
    }

    const payload = await req.json();
    const parsed = feedbackUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: '更新内容不合法',
          errors: parsed.error.format(),
        },
        { status: 422 }
      );
    }
    const data = parsed.data;

    const feedback = await prisma.feedback.findUnique({ where: { id } });
    if (!feedback) {
      return NextResponse.json(
        { success: false, message: '反馈不存在' },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};
    const activities: {
      action: 'COMMENT' | 'STATUS_CHANGE';
      note?: string | null;
    }[] = [];

    if (data.status && data.status !== feedback.status) {
      updates.status = data.status;
      if (data.status === 'RESOLVED') {
        updates.resolvedAt = new Date();
      }
      activities.push({
        action: 'STATUS_CHANGE',
        note: `状态更新为 ${data.status}`,
      });
    }

    if (data.priority && data.priority !== feedback.priority) {
      updates.priority = data.priority;
      activities.push({
        action: 'STATUS_CHANGE',
        note: `优先级调整为 ${data.priority}`,
      });
    }

    if (data.note) {
      activities.push({
        action: 'COMMENT',
        note: data.note,
      });
    }

    const hasUpdates = Object.keys(updates).length > 0;
    const updated = hasUpdates
      ? await prisma.feedback.update({
          where: { id },
          data: updates,
        })
      : feedback;

    if (activities.length > 0) {
      await prisma.$transaction(
        activities.map((activity) =>
          prisma.feedbackActivity.create({
            data: {
              feedbackId: id,
              actorId: reviewer._id.toString(),
              actorName: reviewer.name,
              action: activity.action,
              note: activity.note ?? null,
            },
          })
        )
      );
    }

    const latest = await prisma.feedbackActivity.findMany({
      where: { feedbackId: id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      message: '反馈已更新',
      data: {
        feedback: updated,
        recentActivities: latest,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { success: false, message: '未登录或登录失效' },
          { status: 401 }
        );
      }
      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { success: false, message: '无权执行该操作' },
          { status: 403 }
        );
      }
    }
    console.error('Update feedback error:', error);
    return NextResponse.json(
      { success: false, message: '更新反馈失败' },
      { status: 500 }
    );
  }
}
