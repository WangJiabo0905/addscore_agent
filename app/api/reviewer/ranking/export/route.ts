import { NextRequest, NextResponse } from 'next/server';
import { requireReviewer } from '@/lib/api-helpers';
import { getStudentRanking } from '@/lib/ranking';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function GET(request: NextRequest) {
  try {
    await requireReviewer(request);
    const ranking = await getStudentRanking();
    const rows = ranking
      .map(
        (entry) => `
        <tr>
          <td>${entry.rank}</td>
          <td>${escapeHtml(entry.student.name)}</td>
          <td>${escapeHtml(entry.student.studentId)}</td>
          <td>${escapeHtml(entry.student.profile?.department || '')}</td>
          <td>${escapeHtml(entry.student.profile?.major || '')}</td>
          <td>${escapeHtml(entry.student.profile?.grade || '')}</td>
          <td>${escapeHtml(entry.student.profile?.className || '')}</td>
          <td>${entry.academicScore.toFixed(2)}</td>
          <td>${entry.comprehensiveScore.toFixed(2)}</td>
          <td>${entry.gpa ? entry.gpa.toFixed(2) : ''}</td>
          <td>${entry.gpaScore ? entry.gpaScore.toFixed(2) : ''}</td>
          <td>${entry.gpaWeightedScore.toFixed(2)}</td>
          <td>${entry.totalScore.toFixed(2)}</td>
          <td>${escapeHtml(entry.reasonSummary || '—')}</td>
          <td>${entry.evidenceUrl ? `<a href="${escapeHtml(entry.evidenceUrl)}" target="_blank">查看</a>` : ''}</td>
        </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
      <html lang="zh-CN">
        <head>
          <meta charset="UTF-8" />
          <style>
            table { border-collapse: collapse; width: 100%; }
            td, th { border: 1px solid #333; padding: 8px; text-align: left; }
            th { background: #f0f0f0; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                <th>排名</th>
                <th>姓名</th>
                <th>学号</th>
                <th>学院</th>
                <th>专业</th>
                <th>年级</th>
                <th>班级</th>
                <th>学术积分</th>
                <th>综合积分</th>
                <th>绩点</th>
                <th>绩点折算分</th>
                <th>学业成绩（80%）</th>
                <th>总积分</th>
                <th>加分原因</th>
                <th>绩点附件</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>`;

    const filename = `ranking-${new Date().toISOString().slice(0, 10)}.xls`;
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
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
      { success: false, message: '导出排名失败' },
      { status: 500 }
    );
  }
}
