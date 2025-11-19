import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-helpers';
import { Application } from '@/models/Application';

async function getOrCreateApplication(userId: string) {
  let record = await Application.findOne({ userId });
  if (!record) {
    record = await Application.create({
      userId,
      status: 'draft',
      personalStatement: '',
      plan: '',
    });
  }
  return record;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const record = await getOrCreateApplication(user._id.toString());

    return NextResponse.json({
      success: true,
      data: {
        id: record._id.toString(),
        status: record.status,
        personalStatement: record.personalStatement,
        plan: record.plan,
        lastSubmittedAt: record.lastSubmittedAt,
        reviewerRemarks: record.reviewerRemarks,
        updatedAt: record.updatedAt,
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
      { success: false, message: '获取申请信息失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const record = await getOrCreateApplication(user._id.toString());
    const body = await request.json();
    const { personalStatement, plan, status } = body;

    if (typeof personalStatement === 'string') {
      record.personalStatement = personalStatement;
    }

    if (typeof plan === 'string') {
      record.plan = plan;
    }

    if (status && ['draft', 'submitted'].includes(status)) {
      record.status = status;
    }

    await record.save();

    return NextResponse.json({
      success: true,
      message: '申请信息已保存',
      data: {
        id: record._id.toString(),
        status: record.status,
        personalStatement: record.personalStatement,
        plan: record.plan,
        lastSubmittedAt: record.lastSubmittedAt,
        reviewerRemarks: record.reviewerRemarks,
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
      { success: false, message: '保存申请信息失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const record = await getOrCreateApplication(user._id.toString());

    if (!record.personalStatement || !record.plan) {
      return NextResponse.json(
        { success: false, message: '请先完善个人陈述和培养计划' },
        { status: 400 }
      );
    }

    record.status = 'submitted';
    record.lastSubmittedAt = new Date();
    await record.save();

    return NextResponse.json({
      success: true,
      message: '已提交申请，等待审核',
      data: {
        id: record._id.toString(),
        status: record.status,
        lastSubmittedAt: record.lastSubmittedAt,
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
      { success: false, message: '提交申请失败' },
      { status: 500 }
    );
  }
}

