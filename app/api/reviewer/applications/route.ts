import { NextRequest, NextResponse } from 'next/server';
import { requireReviewer } from '@/lib/api-helpers';
import { Application } from '@/models/Application';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await requireReviewer(request);
    const applications = await Application.find({})
      .sort({ updatedAt: -1 })
      .lean();

    const latestByUser = new Map<string, typeof applications[number]>();
    applications.forEach((app) => {
      const key = app.userId.toString();
      const existing = latestByUser.get(key);
      if (!existing || new Date(existing.updatedAt ?? existing.createdAt ?? 0) < new Date(app.updatedAt ?? app.createdAt ?? 0)) {
        latestByUser.set(key, app);
      }
    });

    const userIds = Array.from(latestByUser.values()).map((app) => app.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select(['name', 'studentId', 'profile'])
      .lean();
    const userMap = new Map(users.map((user) => [user._id.toString(), user]));

    const flattenedApps = Array.from(latestByUser.values());

    return NextResponse.json({
      success: true,
      data: flattenedApps.map((item) => {
        const user = userMap.get(item.userId.toString());
        return {
          id: item._id.toString(),
          status: item.status,
          personalStatement: item.personalStatement,
          plan: item.plan,
          lastSubmittedAt: item.lastSubmittedAt,
          reviewerRemarks: item.reviewerRemarks,
          updatedAt: item.updatedAt,
          student: user
            ? {
                id: user._id?.toString?.() ?? '',
                name: user.name,
                studentId: user.studentId,
                profile: user.profile,
              }
            : null,
        };
      }),
    });
  } catch (error) {
    const message = (error as Error).message;
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
    }
    if (message === 'FORBIDDEN') {
      return NextResponse.json({ success: false, message: '无访问权限' }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, message: '获取推免申请材料失败' },
      { status: 500 }
    );
  }
}
