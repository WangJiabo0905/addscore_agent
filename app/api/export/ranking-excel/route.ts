import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getSupabaseClient } from '@/lib/supabase';

async function getCurrentUserRole() {
  // TODO: implement actual auth/role retrieval
  return 'admin';
}

async function fetchRankingData() {
  // TODO: replace with actual DB query that joins students/achievements/score summaries
  return [
    {
      studentNo: '20210001',
      name: '张三',
      major: '计算机科学与技术',
      gpa: 4.5,
      academicScore: 90,
      academicSpecialtyScore: 12,
      comprehensivePerformanceScore: 4,
      finalScore: 88,
      gpaProofUrl: 'https://example.com/gpa-proof.pdf',
      achievements: [
        {
          category: '科研成果',
          reason: '发表一篇国际会议论文',
          score: 5,
          proofFileId: 'proofs/generic.pdf',
        },
      ],
    },
  ];
}

async function getProofPublicUrl(fileId: string): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase || !fileId) return '';
  const bucket = process.env.SUPABASE_PROOF_BUCKET || 'proof-pdfs';
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(fileId);
  return publicUrl;
}

export async function GET(_request: NextRequest) {
  const role = await getCurrentUserRole();
  if (role !== 'admin' && role !== 'auditor') {
    return NextResponse.json({ success: false, message: '无导出权限' }, { status: 403 });
  }

  const rankingData = await fetchRankingData();

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('加分登记表');

  worksheet.columns = [
    { header: '序号', key: 'index', width: 8 },
    { header: '学号', key: 'studentNo', width: 12 },
    { header: '姓名', key: 'name', width: 12 },
    { header: '专业', key: 'major', width: 20 },
    { header: '学业综合成绩', key: 'academicScore', width: 15 },
    { header: '学术专长成绩', key: 'academicSpecialtyScore', width: 15 },
    { header: '综合表现成绩', key: 'comprehensivePerformanceScore', width: 15 },
    { header: '推免综合成绩', key: 'finalScore', width: 15 },
    { header: '类别', key: 'category', width: 12 },
    { header: '加分原因', key: 'reason', width: 30 },
    { header: '加分分值', key: 'score', width: 12 },
    { header: '证明材料链接', key: 'proofUrl', width: 30 },
    { header: '绩点证明链接', key: 'gpaProofUrl', width: 30 },
  ];

  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  let index = 1;
  for (const student of rankingData) {
    for (const achievement of student.achievements) {
      worksheet.addRow({
        index,
        studentNo: student.studentNo,
        name: student.name,
        major: student.major,
        academicScore: student.academicScore,
        academicSpecialtyScore: student.academicSpecialtyScore,
        comprehensivePerformanceScore: student.comprehensivePerformanceScore,
        finalScore: student.finalScore,
        category: achievement.category,
        reason: achievement.reason,
        score: achievement.score,
        proofUrl: await getProofPublicUrl(achievement.proofFileId),
        gpaProofUrl: student.gpaProofUrl,
      });
      index += 1;
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="信息学院推免加分登记表.xlsx"',
    },
  });
}
