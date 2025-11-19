import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-helpers';
import { AcademicRecord } from '@/models/AcademicRecord';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const record = await AcademicRecord.findOne({ userId: user._id }).exec();
    const responseData = record
      ? {
          gpa: record.gpa,
          score: Number((Math.max(0, Math.min(4, record.gpa)) * 25).toFixed(2)),
          evidenceUrl: record.evidenceUrl,
          updatedAt: record.updatedAt,
        }
      : null;
    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, message: '获取学习成绩失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const { gpa, evidenceUrl } = body as {
      gpa?: number;
      evidenceUrl?: string;
    };

    if (typeof gpa !== 'number' || Number.isNaN(gpa) || gpa < 0 || gpa > 4) {
      return NextResponse.json(
        { success: false, message: '请填写 0-4 之间的绩点' },
        { status: 400 }
      );
    }
    if (!evidenceUrl || typeof evidenceUrl !== 'string') {
      return NextResponse.json(
        { success: false, message: '请上传绩点佐证图片' },
        { status: 400 }
      );
    }

    const score = Number((Math.max(0, Math.min(4, gpa)) * 25).toFixed(2));

    const record = await AcademicRecord.findOneAndUpdate(
      { userId: user._id },
      { gpa, score, evidenceUrl },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();

    return NextResponse.json({
      success: true,
      message: '学习成绩已保存',
      data: {
        gpa: record.gpa,
        score: record.score,
        evidenceUrl: record.evidenceUrl,
        updatedAt: record.updatedAt,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, message: '保存学习成绩失败' },
      { status: 500 }
    );
  }
}
