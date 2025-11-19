import { Types } from 'mongoose';
import type { AchievementDocument, IAchievement } from '@/models/Achievement';
import { User } from '@/models/User';
import { connectDB } from './db';

export interface ReviewerProfile {
  id: string;
  name: string;
  studentId: string;
}

const REVIEWER_CACHE_TTL = 1000 * 60 * 5;

let reviewerCache: {
  fetchedAt: number;
  data: ReviewerProfile[];
} = {
  fetchedAt: 0,
  data: [],
};

export async function getActiveReviewers(): Promise<ReviewerProfile[]> {
  const now = Date.now();
  if (reviewerCache.data.length && now - reviewerCache.fetchedAt < REVIEWER_CACHE_TTL) {
    return reviewerCache.data;
  }

  await connectDB();
  const reviewers = await User.find({ role: 'reviewer', isActive: true })
    .select(['name', 'studentId'])
    .exec();
  reviewerCache = {
    fetchedAt: now,
    data: reviewers.map((reviewer) => ({
      id: reviewer._id.toString(),
      name: reviewer.name,
      studentId: reviewer.studentId,
    })),
  };
  return reviewerCache.data;
}

export async function ensureAchievementReviewers(
  achievement: AchievementDocument
): Promise<void> {
  const reviewers = await getActiveReviewers();
  const existingMap = new Map(
    (achievement.reviews || []).map((review) => [review.reviewerId.toString(), review])
  );
  let updated = false;

  const newReviews = reviewers.map((reviewer) => {
    const existing = existingMap.get(reviewer.id);
    if (existing) {
      if (
        existing.reviewerName !== reviewer.name ||
        existing.reviewerStudentId !== reviewer.studentId
      ) {
        existing.reviewerName = reviewer.name;
        existing.reviewerStudentId = reviewer.studentId;
        updated = true;
      }
      return existing;
    }
    updated = true;
    return {
      reviewerId: new Types.ObjectId(reviewer.id),
      reviewerName: reviewer.name,
      reviewerStudentId: reviewer.studentId,
      status: 'submitted' as const,
      comment: undefined,
      reviewedAt: undefined,
    };
  });

  if (newReviews.length !== achievement.reviews.length) {
    updated = true;
  }

  if (updated) {
    achievement.reviews = newReviews;
    await achievement.save();
  }
}

export function getReviewerDecision(
  achievement: AchievementDocument,
  reviewerId: Types.ObjectId | string
) {
  const reviewerKey =
    typeof reviewerId === 'string' ? reviewerId : (reviewerId as Types.ObjectId).toString();
  return (
    (achievement.reviews || []).find(
      (review) => review.reviewerId.toString() === reviewerKey
    ) ?? null
  );
}

export function deriveOverallStatus(
  reviews: IAchievement['reviews']
): IAchievement['status'] {
  if (!reviews || reviews.length === 0) {
    return 'submitted';
  }
  if (reviews.some((review) => review.status === 'rejected')) {
    return 'rejected';
  }
  if (reviews.every((review) => review.status === 'approved')) {
    return 'approved';
  }
  return 'submitted';
}
