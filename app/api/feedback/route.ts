import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/api-helpers';
import {
  feedbackCreateSchema,
  feedbackQuerySchema,
} from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const payload = await req.json();
    const parsed = feedbackCreateSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: '反馈数据不合法',
          errors: parsed.error.format(),
        },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const feedback = await prisma.feedback.create({
      data: {
        studentId: user.studentId,
        studentName: user.name,
        contactEmail: user.profile?.email ?? null,
        title: data.title,
        description: data.description,
        priority: data.priority,
        pageUrl: data.pageUrl,
        screenshotUrl: data.screenshotUrl,
        status: 'OPEN',
      },
    });

    await prisma.feedbackActivity.create({
      data: {
        feedbackId: feedback.id,
        actorId: user._id.toString(),
        actorName: user.name,
        action: 'COMMENT',
        note: '提交反馈',
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: '反馈已提交，我们会尽快处理',
        data: {
          id: feedback.id,
          ticketNo: feedback.id.slice(0, 8).toUpperCase(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, message: '未登录或登录失效' },
        { status: 401 }
      );
    }
    console.error('Create feedback error:', error);
    return NextResponse.json(
      { success: false, message: '提交反馈失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const parseResult = feedbackQuerySchema.safeParse(
      Object.fromEntries(req.nextUrl.searchParams.entries())
    );
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: '筛选参数不合法',
          errors: parseResult.error.format(),
        },
        { status: 400 }
      );
    }
    const { status, priority, keyword, page, pageSize } = parseResult.data;

    if (user.role === 'student') {
      const list = await prisma.feedback.findMany({
        where: {
          studentId: user.studentId,
        },
        include: {
          activities: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        success: true,
        data: {
          items: list.map((item) => ({
            id: item.id,
            title: item.title,
            status: item.status,
            priority: item.priority,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            pageUrl: item.pageUrl,
            screenshotUrl: item.screenshotUrl,
            latestNote: item.activities[0]?.note ?? '提交反馈',
          })),
        },
      });
    }

    const whereClause: Record<string, unknown> = {};
    if (status) {
      whereClause.status = status;
    }
    if (priority) {
      whereClause.priority = priority;
    }
    if (keyword) {
      whereClause.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { studentName: { contains: keyword, mode: 'insensitive' } },
        { studentId: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.feedback.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        page,
        pageSize,
        total,
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          status: item.status,
          priority: item.priority,
          studentId: item.studentId,
          studentName: item.studentName,
          pageUrl: item.pageUrl,
          screenshotUrl: item.screenshotUrl,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          latestActivity: item.activities[0] ?? null,
        })),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, message: '未登录或登录失效' },
        { status: 401 }
      );
    }
    console.error('List feedback error:', error);
    return NextResponse.json(
      { success: false, message: '获取反馈列表失败' },
      { status: 500 }
    );
  }
}
