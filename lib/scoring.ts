import { Achievement, IAchievement } from '@/models/Achievement';
import { connectDB } from './db';

type ScoreBucket = 'academic' | 'comprehensive';

export interface ScoreDetail {
  achievementId: string;
  title: string;
  category: IAchievement['category'];
  rawScore: number;
  appliedScore: number;
  bucket: ScoreBucket;
  notes?: string;
}

export interface ScoreSummary {
  academicScore: number;
  comprehensiveScore: number;
  cappedAcademicScore: number;
  cappedComprehensiveScore: number;
  totalScore: number;
  details: ScoreDetail[];
}

export function calculateBaseScore(achievement: IAchievement): {
  rawScore: number;
  bucket: ScoreBucket;
  notes?: string;
} {
  const metadata = (achievement.metadata || {}) as Record<string, unknown>;
  switch (achievement.category) {
    case 'paper': {
      const level = String(metadata.level || 'B').toUpperCase();
      const scoreMap: Record<string, number> = { A: 10, B: 6, C: 1 };
      const rawScore = scoreMap[level] ?? 0;
      return {
        rawScore,
        bucket: 'academic',
        notes: `论文等级：${level}`,
      };
    }
    case 'patent': {
      const type = String(metadata.type || '发明专利');
      const rawScore = type.includes('发明') ? 2 : 1;
      return {
        rawScore,
        bucket: 'academic',
        notes: `专利类型：${type}`,
      };
    }
    case 'contest': {
      const level = String(metadata.level || '省级');
      const award = String(metadata.award || '三等奖');
      const matrix: Record<string, Record<string, number>> = {
        国际级: { 特等奖: 10, 一等奖: 8, 二等奖: 6, 三等奖: 4, 其他: 2 },
        国家级: { 特等奖: 8, 一等奖: 6, 二等奖: 4, 三等奖: 2, 其他: 1 },
        省级: { 特等奖: 6, 一等奖: 4, 二等奖: 2, 三等奖: 1, 其他: 0.5 },
        校级: { 特等奖: 2, 一等奖: 1, 二等奖: 0.5, 三等奖: 0.2, 其他: 0.1 },
      };
      const rawScore = matrix[level]?.[award] ?? 0;
      return {
        rawScore,
        bucket: 'academic',
        notes: `竞赛：${level}${award}`,
      };
    }
    case 'innovation': {
      const level = String(metadata.level || '省级');
      const scoreMap: Record<string, number> = {
        国家级: 2,
        省级: 1.5,
        校级: 1,
      };
      const rawScore = scoreMap[level] ?? 0.5;
      return {
        rawScore,
        bucket: 'academic',
        notes: `双创项目：${level}`,
      };
    }
    case 'volunteer': {
      const hours = Number(metadata.hours || 0);
      const rawScore = Math.min(hours / 200, 1);
      return {
        rawScore,
        bucket: 'comprehensive',
        notes: `志愿时长：${hours}h`,
      };
    }
    case 'honor': {
      const level = String(metadata.level || '校级');
      const scoreMap: Record<string, number> = {
        国家级: 2,
        省级: 1.5,
        校级: 1,
      };
      const rawScore = scoreMap[level] ?? 0.5;
      return {
        rawScore,
        bucket: 'comprehensive',
        notes: `荣誉：${level}`,
      };
    }
    case 'social': {
      const months = Number(metadata.months || 0);
      const rawScore = Math.min(months * 0.3, 2);
      return {
        rawScore,
        bucket: 'comprehensive',
        notes: `社会工作月份：${months}`,
      };
    }
    case 'sports': {
      const level = String(metadata.level || '校级');
      const place = Number(metadata.rank || 3);
      const baseMap: Record<string, number> = {
        国际级: 2,
        国家级: 1.5,
        省级: 1,
        校级: 0.5,
      };
      const rawScore = Math.max(baseMap[level] ?? 0.3, 0.1) / place;
      return {
        rawScore,
        bucket: 'comprehensive',
        notes: `体育：${level} 第${place}名`,
      };
    }
    default:
      return {
        rawScore: 0,
        bucket: 'academic',
      };
  }
}

interface CalculateScoreSummaryOptions {
  statuses?: IAchievement['status'][];
}

export async function calculateScoreSummary(
  userId: string,
  options?: CalculateScoreSummaryOptions
): Promise<ScoreSummary> {
  await connectDB();
  const statuses = options?.statuses?.length
    ? options.statuses
    : (['submitted', 'approved'] as IAchievement['status'][]);
  const achievements = await Achievement.find({
    userId,
    status: { $in: statuses },
  }).sort({ obtainedAt: 1 });

  let academic = 0;
  let comprehensive = 0;
  const details: ScoreDetail[] = [];

  achievements.forEach((achievement) => {
    const { rawScore, bucket, notes } = calculateBaseScore(achievement);
    const appliedScore =
      bucket === 'academic'
        ? Math.min(rawScore, 15 - academic)
        : Math.min(rawScore, 5 - comprehensive);

    if (bucket === 'academic') {
      academic = Math.min(academic + rawScore, 15);
    } else {
      comprehensive = Math.min(comprehensive + rawScore, 5);
    }

    details.push({
      achievementId: achievement._id.toString(),
      title: achievement.title,
      category: achievement.category,
      rawScore,
      appliedScore: Math.max(appliedScore, 0),
      bucket,
      notes,
    });
  });

  const cappedAcademicScore = Math.min(academic, 15);
  const cappedComprehensiveScore = Math.min(comprehensive, 5);

  return {
    academicScore: academic,
    comprehensiveScore: comprehensive,
    cappedAcademicScore,
    cappedComprehensiveScore,
    totalScore: cappedAcademicScore + cappedComprehensiveScore,
    details,
  };
}
