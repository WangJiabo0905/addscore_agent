export const GPA_MAX = 4.0;
const ACADEMIC_SPECIALTY_MAX = 15;
const COMPREHENSIVE_PERFORMANCE_MAX = 5;
const GPA_SCORE_MULTIPLIER = 25; // 绩点 * 25 = 学业综合成绩

export interface GpaToScoreInput {
  gpa: number;
  academicSpecialtyScore: number;
  comprehensivePerformanceScore: number;
}

export interface GpaToScoreOutput {
  academicScore: number;
  finalScore: number;
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

export function convertGpaToScores(input: GpaToScoreInput): GpaToScoreOutput {
  const clampedGpa = clamp(input.gpa, 0, GPA_MAX);
  const clampedAcademicSpecialty = clamp(input.academicSpecialtyScore, 0, ACADEMIC_SPECIALTY_MAX);
  const clampedComprehensive = clamp(
    input.comprehensivePerformanceScore,
    0,
    COMPREHENSIVE_PERFORMANCE_MAX
  );

  const academicScore = Number((clampedGpa * GPA_SCORE_MULTIPLIER).toFixed(2));
  const finalScore =
    academicScore * 0.8 + clampedAcademicSpecialty + clampedComprehensive;

  return {
    academicScore,
    finalScore: Number(finalScore.toFixed(2)),
  };
}
