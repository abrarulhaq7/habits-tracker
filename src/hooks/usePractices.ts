import { usePracticesContext } from "@/context/PracticesContext";
import { useEffect } from "react";

/**
 * Primary data hook — fetches practices on first mount and
 * exposes loading / error state from Context.
 */
export function usePractices() {
  const { practices, loading, error, refetch } = usePracticesContext();

  useEffect(() => {
    // Only fetch if the list is empty (first mount)
    if (practices.length === 0) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data: practices,
    isLoading: loading,
    isError: !!error,
    error,
    refetch,
    isRefetching: false, // kept for API compatibility with existing screens
  };
}

/**
 * Hook for toggling the completed_today flag.
 * Mirrors the old TanStack useMutation shape so screens need no changes.
 */
export function useMutatePractice() {
  const { toggleCompletion } = usePracticesContext();

  const mutate = ({ id, completed }: { id: string; completed: boolean }) =>
    toggleCompletion(id, completed);

  return { mutate, isPending: false };
}

/**
 * Mutation 1: Update the star rating of a practice (1–5 or null).
 */
export function useMutatePracticeRating() {
  const { mutatePracticeRating } = usePracticesContext();

  const mutate = ({ id, rating }: { id: string; rating: number | null }) =>
    mutatePracticeRating(id, rating);

  return { mutate, isPending: false };
}

/**
 * Mutation 2: Update the title of a practice card.
 */
export function useMutatePracticeTitle() {
  const { mutatePracticeTitle } = usePracticesContext();

  const mutate = ({ id, title }: { id: string; title: string }) =>
    mutatePracticeTitle(id, title);

  return { mutate, isPending: false };
}
