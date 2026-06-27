// @ts-nocheck
import { computeSummaryStats } from './summary';
import { Practice } from '../types';

describe('computeSummaryStats', () => {
  it('should return 0 stats for empty practices list', () => {
    const stats = computeSummaryStats([]);
    expect(stats.completedCount).toBe(0);
    expect(stats.averageRating).toBe(0);
  });

  it('should compute correct completedCount and averageRating', () => {
    const practices: Practice[] = [
      {
        id: '1',
        title: 'Morning Yoga',
        description: 'Yoga sequence',
        duration_minutes: 15,
        category: 'movement',
        completed_today: true,
        rating: 4,
      },
      {
        id: '2',
        title: 'Deep Breathing',
        description: 'Breathing exercise',
        duration_minutes: 5,
        category: 'breath',
        completed_today: false,
        rating: 5,
      },
      {
        id: '3',
        title: 'Mindfulness',
        description: 'Reflection exercise',
        duration_minutes: 10,
        category: 'reflection',
        completed_today: true,
        rating: null,
      },
    ];

    const stats = computeSummaryStats(practices);
    expect(stats.completedCount).toBe(2);
    expect(stats.averageRating).toBe(4.5); // (4 + 5) / 2
  });

  it('should return 0 averageRating if no practices have a rating', () => {
    const practices: Practice[] = [
      {
        id: '1',
        title: 'Morning Yoga',
        description: 'Yoga sequence',
        duration_minutes: 15,
        category: 'movement',
        completed_today: true,
        rating: null,
      },
    ];

    const stats = computeSummaryStats(practices);
    expect(stats.completedCount).toBe(1);
    expect(stats.averageRating).toBe(0);
  });
});
