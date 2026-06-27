import { Practice } from '../lib/types';

// Base set of unique practices
const BASE_PRACTICES: Omit<Practice, 'id' | 'completed_today' | 'rating'>[] = [
  { title: 'Morning Stretch Session', description: 'Start the day with gentle mobility and flexibility.', duration_minutes: 15, category: 'movement' },
  { title: 'Box Breathing Exercise', description: 'Calm your mind and focus on deliberate breathing.', duration_minutes: 5, category: 'breath' },
  { title: 'Gratitude Journaling', description: 'Write down three things you are grateful for today.', duration_minutes: 10, category: 'reflection' },
  { title: 'Midday Mindfulness Break', description: 'Unplug for a few minutes and re-center.', duration_minutes: 12, category: 'rest' },
  { title: 'Evening Walking Practice', description: 'Wind down and decompress with a relaxed walk.', duration_minutes: 30, category: 'movement' },
  { title: 'Deep Belly Breathing', description: 'Slow down your heart rate and reduce stress.', duration_minutes: 8, category: 'breath' },
  { title: 'Self-Reflection Meditation', description: 'Observe your thoughts without judgment.', duration_minutes: 15, category: 'reflection' },
  { title: 'Power Nap', description: 'Quick rest to recharge your energy levels.', duration_minutes: 20, category: 'rest' },
  { title: 'Yoga Flow', description: 'Connect breath with movement in a brief flow.', duration_minutes: 25, category: 'movement' },
  { title: '4-7-8 Breathing Technique', description: 'A natural tranquilizer for the nervous system.', duration_minutes: 4, category: 'breath' },
  { title: 'Daily Review', description: 'Evaluate your choices and learnings from today.', duration_minutes: 10, category: 'reflection' },
  { title: 'Progressive Muscle Relaxation', description: 'Release physical tension from head to toe.', duration_minutes: 18, category: 'rest' },
];

/** Generate 120 mock practice items */
const generateMockData = (): Practice[] => {
  const list: Practice[] = [];
  for (let i = 0; i < 120; i++) {
    const base = BASE_PRACTICES[i % BASE_PRACTICES.length];
    const itemNumber = Math.floor(i / BASE_PRACTICES.length) + 1;
    list.push({
      id: `practice-${i + 1}`,
      title: `${base.title} ${itemNumber}`,
      description: base.description,
      duration_minutes: base.duration_minutes,
      category: base.category,
      completed_today: i % 7 === 0 || i % 11 === 0,
      rating: i % 7 === 0 ? (Math.floor(i / 7) % 5) + 1 : null,
    });
  }
  return list;
};

/**
 * Mutable in-memory store.
 * MSW handlers read and write to this array directly,
 * simulating a persistent backend within a single session.
 */
export let practicesStore: Practice[] = generateMockData();
