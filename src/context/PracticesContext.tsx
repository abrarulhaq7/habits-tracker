import {
  fetchPractices,
  updatePracticeCompletion,
  updatePracticeRating,
  updatePracticeTitle,
} from "@/lib/api/practices";
import { Practice } from "@/lib/types";
import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
} from "react";

// ─── State Shape ─────────────────────────────────────────────────────────────

interface PracticesState {
  practices: Practice[];
  loading: boolean;
  error: string | null;
}

const initialState: PracticesState = {
  practices: [],
  loading: false,
  error: null,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Practice[] }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "UPDATE_PRACTICE"; payload: Practice }
  | { type: "OPTIMISTIC_UPDATE"; id: string; patch: Partial<Practice> }
  | { type: "ROLLBACK"; payload: Practice[] };

function practicesReducer(
  state: PracticesState,
  action: Action,
): PracticesState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "FETCH_SUCCESS":
      return { practices: action.payload, loading: false, error: null };

    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };

    case "UPDATE_PRACTICE":
      return {
        ...state,
        practices: state.practices.map((p) =>
          p.id === action.payload.id ? action.payload : p,
        ),
      };

    case "OPTIMISTIC_UPDATE":
      return {
        ...state,
        practices: state.practices.map((p) =>
          p.id === action.id ? { ...p, ...action.patch } : p,
        ),
      };

    case "ROLLBACK":
      return { ...state, practices: action.payload };

    default:
      return state;
  }
}

// ─── Context Interface ────────────────────────────────────────────────────────

interface PracticesContextValue extends PracticesState {
  /** Re-fetches the full practice list from the MSW handler. */
  refetch: () => Promise<void>;
  /** Toggle completed_today (optimistic). */
  toggleCompletion: (id: string, completed: boolean) => Promise<void>;
  /** Mutation 1 — update the star rating of a practice (1–5 or null). */
  mutatePracticeRating: (id: string, rating: number | null) => Promise<void>;
  /** Mutation 2 — update the title of a practice card. */
  mutatePracticeTitle: (id: string, title: string) => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const PracticesContext = createContext<PracticesContextValue | undefined>(
  undefined,
);

// ─── Provider ────────────────────────────────────────────────────────────────

export function PracticesProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(practicesReducer, initialState);

  /** Fetches all practices and updates the store. */
  const refetch = useCallback(async () => {
    dispatch({ type: "FETCH_START" });
    try {
      console.log("[PracticesContext] Fetching practices...");
      const data = await fetchPractices();
      console.log("[PracticesContext] Fetch successful! Items:", data.length);
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch (err) {
      console.error("[PracticesContext] Fetch failed with error:", err);
      dispatch({
        type: "FETCH_ERROR",
        payload: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, []);

  /**
   * Optimistically toggles the `completed_today` flag.
   * Rolls back on network failure.
   */
  const toggleCompletion = useCallback(
    async (id: string, completed: boolean) => {
      const snapshot = state.practices;
      dispatch({
        type: "OPTIMISTIC_UPDATE",
        id,
        patch: { completed_today: completed },
      });
      try {
        const updated = await updatePracticeCompletion(id, completed);
        dispatch({ type: "UPDATE_PRACTICE", payload: updated });
      } catch {
        dispatch({ type: "ROLLBACK", payload: snapshot });
      }
    },
    [state.practices],
  );

  /**
   * Mutation 1 — Update star rating.
   * Optimistically reflects the new rating; rolls back on error.
   */
  const mutatePracticeRating = useCallback(
    async (id: string, rating: number | null) => {
      const snapshot = state.practices;
      dispatch({ type: "OPTIMISTIC_UPDATE", id, patch: { rating } });
      try {
        const updated = await updatePracticeRating(id, rating);
        dispatch({ type: "UPDATE_PRACTICE", payload: updated });
      } catch {
        dispatch({ type: "ROLLBACK", payload: snapshot });
      }
    },
    [state.practices],
  );

  /**
   * Mutation 2 — Update card title.
   * Optimistically reflects the new title; rolls back on error.
   */
  const mutatePracticeTitle = useCallback(
    async (id: string, title: string) => {
      const snapshot = state.practices;
      dispatch({ type: "OPTIMISTIC_UPDATE", id, patch: { title } });
      try {
        const updated = await updatePracticeTitle(id, title);
        dispatch({ type: "UPDATE_PRACTICE", payload: updated });
      } catch {
        dispatch({ type: "ROLLBACK", payload: snapshot });
      }
    },
    [state.practices],
  );

  return (
    <PracticesContext.Provider
      value={{
        ...state,
        refetch,
        toggleCompletion,
        mutatePracticeRating,
        mutatePracticeTitle,
      }}
    >
      {children}
    </PracticesContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Consume the PracticesContext.
 * Must be used inside a <PracticesProvider>.
 */
export function usePracticesContext(): PracticesContextValue {
  const ctx = useContext(PracticesContext);
  if (!ctx) {
    throw new Error(
      "usePracticesContext must be used inside <PracticesProvider>",
    );
  }
  return ctx;
}
