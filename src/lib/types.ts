export interface Practice {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  category: 'movement' | 'breath' | 'reflection' | 'rest';
  completed_today: boolean;
  rating: number | null; // 1-5 or null
}
