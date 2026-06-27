import { Practice } from '../types';

export interface SummaryStats {
  completedCount: number;
  averageRating: number;
}

/**
 * Computes summary statistics from a list of practices.
 * 
 * - completedCount: The count of practices where completed_today is true.
 * - averageRating: The mean rating of all practices that have a rating (not null).
 *                  If no practices have a rating, returns 0.
 */
export function computeSummaryStats(practices: Practice[]): SummaryStats {
  if (!practices || practices.length === 0) {
    return { completedCount: 0, averageRating: 0 };
  }

  let completedCount = 0;
  let totalRating = 0;
  let ratedCount = 0;

  for (const practice of practices) {
    if (practice.completed_today) {
      completedCount++;
    }
    if (practice.rating !== null && practice.rating !== undefined) {
      totalRating += practice.rating;
      ratedCount++;
    }
  }

  const averageRating = ratedCount > 0 ? totalRating / ratedCount : 0;

  return {
    completedCount,
    averageRating,
  };
}
