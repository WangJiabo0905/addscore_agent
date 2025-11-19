import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-helpers';
import { getSupabaseClient } from '@/lib/supabase';

type ImportCategory =
  | 'research'
  | 'competition'
  | 'volunteer'
  | 'honor'
  | 'socialWork'
  | 'languageExam'
  | 'other';

interface BulkImportItem {
  category: ImportCategory;
  title: string;
  description: string;
  totalVolunteerHours?: number;
  proofFileId: string;
}

interface BulkImportRequestBody {
  studentId: string;
  items: BulkImportItem[];
}

const categoryMap: Record<ImportCategory, string> = {
  research: 'SCIENTIFIC_RESEARCH',
  competition: 'COMPETITION',
  volunteer: 'VOLUNTEER_SERVICE',
  honor: 'HONOR',
  socialWork: 'SOCIAL_WORK',
  languageExam: 'LANGUAGE_EXAM',
  other: 'OTHER',
};

function computeVolunteerBonus(hours?: number): number {
  if (!hours || hours < 200) {
    return 0;
  }
  let score = 1;
  if (hours > 200) {
    const extraHours = hours - 200;
    score += Math.floor(extraHours / 2) * 0.05;
  }
  return Math.min(score, 1);
}

function computeResearchBonusFromTitleAndContext(): number {
  // TODO: hook into real scoring logic.
  return 0;
}

function computeCompetitionBonusFromContext(): number {
  // TODO: implement actual competition scoring.
  return 0;
}

function computeHonorBonus(): number {
  // TODO: implement actual honor scoring logic.
  return 0;
}

function computeSocialWorkBonus(): number {
  // TODO: implement actual social work scoring logic.
  return 0;
}

function computeLanguageExamBonus(): number {
  // TODO: implement actual language exam scoring logic.
  return 0;
}

function getRecommendedScore(item: BulkImportItem): number {
  switch (item.category) {
    case 'volunteer':
      return computeVolunteerBonus(item.totalVolunteerHours);
    case 'research':
      return computeResearchBonusFromTitleAndContext();
    case 'competition':
      return computeCompetitionBonusFromContext();
    case 'honor':
      return computeHonorBonus();
    case 'socialWork':
      return computeSocialWorkBonus();
    case 'languageExam':
      return computeLanguageExamBonus();
    default:
      return 0;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as BulkImportRequestBody;
    if (!body.studentId || !Array.isArray(body.items)) {
      return NextResponse.json({ success: false, message: '参数不完整' }, { status: 400 });
    }
    if (body.studentId !== user._id.toString() && user.studentId !== body.studentId) {
      return NextResponse.json({ success: false, message: '无导入权限' }, { status: 403 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ success: false, message: '未配置 Supabase' }, { status: 500 });
    }

    const rows = body.items.map((item) => ({
      student_id: body.studentId,
      category: categoryMap[item.category] ?? categoryMap.other,
      title: item.title,
      description: item.description,
      proof_file_id: item.proofFileId,
      status: 'submitted',
      recommended_score: getRecommendedScore(item),
      source: 'pdf-import',
      metadata: {
        totalVolunteerHours: item.totalVolunteerHours ?? null,
        rawCategory: item.category,
      },
    }));

    const { data, error } = await supabase.from('achievements').insert(rows).select('*');
    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    const message = (error as Error).message || '导入失败';
    const statusCode =
      message === '无导入权限' ? 403 : message === '参数不完整' ? 400 : 500;
    return NextResponse.json({ success: false, message }, { status: statusCode });
  }
}
