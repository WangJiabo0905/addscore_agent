import { User } from '@/models/User';
import { Achievement } from '@/models/Achievement';
import { AcademicRecord } from '@/models/AcademicRecord';
import { calculateScoreSummary, type ScoreDetail } from './scoring';
import { connectDB } from './db';

export interface RankingEntry {
  rank: number;
  student: {
    id: string;
    name: string;
    studentId: string;
    profile: {
      department: string;
      major: string;
      grade: string;
      className: string;
    };
  };
  academicScore: number;
  comprehensiveScore: number;
  totalScore: number;
  gpaWeightedScore: number;
  details: ScoreDetail[];
  reasonSummary: string;
  gpa?: number;
  gpaScore?: number;
  evidenceUrl?: string;
}

export async function getStudentRanking(): Promise<RankingEntry[]> {
  await connectDB();
  const submittedUserIds = await Achievement.distinct('userId', {
    status: { $ne: 'draft' },
  });
  if (submittedUserIds.length === 0) {
    return [];
  }

  const students = await User.find({ _id: { $in: submittedUserIds }, isActive: true })
    .select(['name', 'studentId', 'profile'])
    .exec();

  const records = await AcademicRecord.find({
    userId: { $in: submittedUserIds },
  }).exec();
  const recordMap = new Map(records.map((record) => [record.userId.toString(), record]));

  const summaries = await Promise.all(
    students.map(async (student) => {
      const userId = student._id.toString();
      const summary = await calculateScoreSummary(userId, {
        statuses: ['approved'],
      });
      const record = recordMap.get(userId);
      const gpaValue = record?.gpa ?? 0;
      const derivedGpaScore = record
        ? Number((Math.min(Math.max(gpaValue, 0), 4) * 25).toFixed(2))
        : undefined;
      const derivedGpaWeighted =
        typeof derivedGpaScore === 'number' ? Number((derivedGpaScore * 0.8).toFixed(2)) : undefined;
      const reasonSummary = summary.details
        .filter((detail) => detail.appliedScore > 0)
        .map((detail) => {
          const bucketLabel = detail.bucket === 'academic' ? '学术' : '综合';
          const scoreLabel = detail.appliedScore.toFixed(2);
          return `${detail.title}（${bucketLabel}，${scoreLabel}分${detail.notes ? `，${detail.notes}` : ''}）`;
        })
        .concat(
          record
            ? [
                `绩点：${record.gpa.toFixed(2)}（折算${(derivedGpaScore ?? 0).toFixed(
                  2
                )}分，计入${(derivedGpaWeighted ?? 0).toFixed(2)}分）`,
              ]
            : []
        )
        .join('；')
        .replace(/；$/, '');
      return {
        student,
        summary,
        reasonSummary,
        record,
        derivedGpaScore,
      };
    })
  );

  const sorted = summaries
    .map((entry) => ({
      student: {
        id: entry.student._id.toString(),
        name: entry.student.name,
        studentId: entry.student.studentId,
        profile: entry.student.profile,
      },
      academicScore: entry.summary.cappedAcademicScore,
      comprehensiveScore: entry.summary.cappedComprehensiveScore,
      gpa: entry.record?.gpa,
      gpaScore: entry.derivedGpaScore,
      evidenceUrl: entry.record?.evidenceUrl,
      details: entry.summary.details,
      reasonSummary: entry.reasonSummary,
    }))
    .map((entry) => {
      const gpaScore = entry.gpaScore ?? 0;
      const gpaWeightedScore = Number((gpaScore * 0.8).toFixed(2));
      const totalScore = Number(
        (gpaWeightedScore + entry.academicScore + entry.comprehensiveScore).toFixed(2)
      );
      return {
        ...entry,
        gpaWeightedScore,
        totalScore,
      };
    })
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      if (b.academicScore !== a.academicScore) {
        return b.academicScore - a.academicScore;
      }
      return b.comprehensiveScore - a.comprehensiveScore;
    });

  return sorted.map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }));
}
