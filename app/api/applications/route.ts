import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applicationCreateSchema } from '@/lib/validation';
import { requireUser } from '@/lib/api-helpers';
import { findCatalogItem } from '@/lib/policy';

const ACTIVE_STATUSES = ['PENDING', 'IN_REVIEW', 'APPROVED'] as const;

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const applications = await prisma.catalogApplication.findMany({
      where: { studentId: user.studentId },
      include: {
        item: {
          include: { category: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: applications.map((application) => ({
        id: application.id,
        status: application.status,
        summary: application.summary,
        achievedAt: application.achievedAt,
        submittedAt: application.submittedAt,
        attachments: application.attachments,
        item: {
          slug: application.item.slug,
          title: application.item.title,
          category: {
            slug: application.item.category.slug,
            title: application.item.category.title,
          },
        },
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, message: '未登录或登录已过期' },
        { status: 401 }
      );
    }
    console.error('List applications error:', error);
    return NextResponse.json(
      { success: false, message: '获取申请列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const json = await req.json();
    const parsed = applicationCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: '申请表单数据不合法',
          errors: parsed.error.format(),
        },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const itemRecord = await prisma.catalogItem.findUnique({
      where: { slug: data.itemSlug },
      include: { category: true },
    });
    if (!itemRecord) {
      return NextResponse.json(
        { success: false, message: '未找到匹配的加分项目' },
        { status: 404 }
      );
    }

    const policyItem = findCatalogItem(data.itemSlug);
    if (!policyItem) {
      return NextResponse.json(
        { success: false, message: '尚未配置该项目的政策规则' },
        { status: 500 }
      );
    }

    const activeStatuses = [...ACTIVE_STATUSES];
    const categorySlug = itemRecord.category.slug;

    if (policyItem.slug === 'paper-c-tier') {
      const cTierCount = await prisma.catalogApplication.count({
        where: {
          studentId: user.studentId,
          item: { slug: 'paper-c-tier' },
          status: { in: activeStatuses },
        },
      });
      if (cTierCount >= 2) {
        return NextResponse.json(
          {
            success: false,
            message: 'C 类论文最多计入 2 篇，请核对后再提交。',
          },
          { status: 422 }
        );
      }
    }

    if (categorySlug === 'competition') {
      const competitionApps = await prisma.catalogApplication.findMany({
        where: {
          studentId: user.studentId,
          item: { category: { slug: 'competition' } },
          status: { in: activeStatuses },
        },
        select: { payload: true, id: true, item: { select: { slug: true } } },
      });
      if (competitionApps.length >= 3 && policyItem.flags.includes('limitedQuota')) {
        return NextResponse.json(
          {
            success: false,
            message: '竞赛项目加分累积不超过 3 项。',
          },
          { status: 422 }
        );
      }

      const outsideCount = competitionApps.filter((application) => {
        const payload = application.payload as Record<string, unknown>;
        return payload?.isOutsideSchoolProject === true;
      }).length;
      if (data.metadata.isOutsideSchoolProject && outsideCount >= 1) {
        return NextResponse.json(
          {
            success: false,
            message: '非信息学院赛事加分最多 1 项。',
          },
          { status: 422 }
        );
      }

      const sameWork = competitionApps.find((application) => {
        const payload = application.payload as Record<string, unknown>;
        return (
          typeof payload?.workName === 'string' &&
          payload.workName === data.metadata.workName
        );
      });
      if (sameWork) {
        return NextResponse.json(
          {
            success: false,
            message: '同一作品已提交过竞赛加分，请勿重复申报。',
          },
          { status: 422 }
        );
      }
    }

    const created = await prisma.catalogApplication.create({
      data: {
        studentId: user.studentId,
        userId: user._id.toString(),
        summary: data.summary,
        achievedAt: data.obtainedAt,
        itemId: itemRecord.id,
        status: 'PENDING',
        payload: data.metadata,
        attachments: data.attachments.map((attachment) => attachment.url),
        teamMembers: data.teamMembers ?? null,
      },
      include: {
        item: { include: { category: true } },
      },
    });

    await prisma.catalogApplicationAudit.create({
      data: {
        applicationId: created.id,
        actorId: user._id.toString(),
        actorName: user.name,
        action: 'SUBMIT',
        message: data.summary.slice(0, 200),
        payload: {
          metadata: data.metadata,
          attachments: data.attachments,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: '申请已提交，等待审核',
        data: {
          id: created.id,
          status: created.status,
          summary: created.summary,
          item: {
            slug: created.item.slug,
            title: created.item.title,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, message: '未登录或登录已过期' },
        { status: 401 }
      );
    }
    console.error('Create application error:', error);
    return NextResponse.json(
      { success: false, message: '提交申请失败，请稍后再试' },
      { status: 500 }
    );
  }
}
