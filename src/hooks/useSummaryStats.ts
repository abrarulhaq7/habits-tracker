import { useMemo } from 'react';
import { usePractices } from '@/hooks/usePractices';
import { computeSummaryStats, SummaryStats } from '@/lib/utils/summary';

export interface UseSummaryStatsResult extends SummaryStats {
  isLoading: boolean;
  isError: boolean;
  error: Error | string | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
}

export function useSummaryStats(): UseSummaryStatsResult {
  const { data: practices = [], isLoading, isError, error, refetch, isRefetching } = usePractices();

  const stats = useMemo(() => {
    return computeSummaryStats(practices);
  }, [practices]);

  return {
    ...stats,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  };
}
