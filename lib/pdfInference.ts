export type AchievementCategory =
  | 'research'
  | 'competition'
  | 'volunteer'
  | 'honor'
  | 'socialWork'
  | 'languageExam'
  | 'other';

export interface PdfPageText {
  pageNumber: number;
  rawText: string;
}

export interface InferredAchievement {
  category: AchievementCategory;
  title: string;
  description: string;
  sourcePages: number[];
  totalVolunteerHours?: number;
  rawMatchedText?: string;
}

const categoryKeywords: Record<Exclude<AchievementCategory, 'other'>, string[]> = {
  research: ['论文', 'journal', 'conference', 'proceedings', '科研', '学术'],
  competition: ['竞赛', '比赛', '大赛', '数学建模', 'icpc', 'ccpc', '挑战杯', '程序设计'],
  volunteer: ['志愿', '志愿服务', '志愿工时'],
  honor: ['三好学生', '优秀学生', '荣誉称号', '优秀干部', '奖章'],
  socialWork: ['班长', '学生干部', '社长', '团支部书记', '学生会', '部长'],
  languageExam: ['四级', '六级', 'cet-4', 'cet-6', '雅思', '托福', 'pte'],
};

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function detectCategory(paragraph: string): AchievementCategory {
  const lowerParagraph = paragraph.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => lowerParagraph.includes(keyword.toLowerCase()))) {
      return category as AchievementCategory;
    }
  }
  return 'other';
}

function extractTitle(paragraph: string, category: AchievementCategory): string {
  const normalized = normalizeText(paragraph);
  if (normalized.length < 40) {
    return normalized;
  }
  switch (category) {
    case 'competition':
      return normalized.slice(0, 40);
    case 'research':
      return normalized.slice(0, 60);
    case 'volunteer':
      return '志愿服务记录';
    case 'honor':
      return '荣誉称号或奖项';
    case 'socialWork':
      return '社会工作/学生干部经历';
    case 'languageExam':
      return '语言考试成绩';
    default:
      return normalized.slice(0, 40);
  }
}

const HOURS_REGEX = /(\d+(?:\.\d+)?)\s*小时/g;

function extractVolunteerHours(paragraph: string): number {
  let total = 0;
  let match: RegExpExecArray | null;
  while ((match = HOURS_REGEX.exec(paragraph)) !== null) {
    total += Number(match[1]);
  }
  return total;
}

function splitParagraphs(rawText: string): string[] {
  return rawText
    .split(/\n{2,}|\r{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

export function inferAchievementsFromPdf(pages: PdfPageText[]): InferredAchievement[] {
  const results: InferredAchievement[] = [];

  pages.forEach((page) => {
    const paragraphs = splitParagraphs(page.rawText);

    paragraphs.forEach((paragraph) => {
      const category = detectCategory(paragraph);
      const title = extractTitle(paragraph, category);
      const totalVolunteerHours = category === 'volunteer' ? extractVolunteerHours(paragraph) : undefined;

      results.push({
        category,
        title,
        description: paragraph,
        sourcePages: [page.pageNumber],
        totalVolunteerHours,
        rawMatchedText: normalizeText(paragraph).slice(0, 200),
      });
    });
  });

  return results;
}
