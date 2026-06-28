# 0001. State Management Strategy

- Status: accepted
- Date: 2026-06-26

## Context

This app has three screens that all need to agree on the same underlying
data: a list of practices, each with `completed_today`, `rating`, and
`title` fields that can change independently. The brief's hardest
requirement is structural: the Practices tab contains its own stack
(List → Detail), and a sibling Summary tab must reflect changes made on the
Detail screen the moment the user switches tabs.

That means state cannot live inside any single screen's local `useState` —
`PracticesListScreen`, `PracticeDetailScreen`, and `SummaryScreen` are
different components in different navigators, and none is an ancestor of
the others in a way local state or simple prop drilling could reach.

There is also no real backend — the network layer is mocked via MSW — but
the brief asks for it to be approached the way a real one would be.

## Decision

**Use a single React Context (`PracticesContext`) backed by `useReducer`
as the source of truth for all practice data**, with one provider mounted
above the tab navigator so `PracticesListScreen`, `PracticeDetailScreen`,
and `SummaryScreen` all read from the same in-memory state.

- The reducer handles six action types: `FETCH_START`, `FETCH_SUCCESS`,
  `FETCH_ERROR` (the fetch lifecycle), and `OPTIMISTIC_UPDATE`,
  `UPDATE_PRACTICE`, `ROLLBACK` (the mutation lifecycle).
- Three domain mutation functions live on the context —
  `toggleCompletion`, `mutatePracticeRating`, `mutatePracticeTitle` — each
  exposed to screens through a thin hook (`useMutatePractice`,
  `useMutatePracticeRating`, `useMutatePracticeTitle` in
  `hooks/usePractices.ts`). Screens call these hooks; they never dispatch
  to the reducer directly.
- All three mutations follow the same lifecycle: snapshot the current
  `state.practices`, dispatch `OPTIMISTIC_UPDATE` with the patch
  immediately, await the corresponding `lib/api/practices.ts` call, then
  dispatch `UPDATE_PRACTICE` with the server-confirmed value on success or
  `ROLLBACK` to the snapshot on failure.
- Because `PracticesListScreen`, `PracticeDetailScreen`, and
  `SummaryScreen` all read from the same `PracticesContext` provider (via
  `usePractices()` and `useSummaryStats()`), a dispatch from the Detail
  screen is visible to List and Summary on their very next render — no
  manual refetch, no event bus, no prop drilling across the tab boundary.
- Local, UI-only state (e.g. which star is being actively pressed before
  release) stays as plain `useState` inside the component that owns it. It
  never gets promoted into the context.

## Consequences

- Cross-tab sync, the single hardest requirement in the brief, is solved
  by one provider sitting above the tab navigator — every consumer reads
  the same state object, so there is nothing to keep in sync.
- All three mutations follow one consistent, explicit lifecycle
  (snapshot → optimistic dispatch → reconcile or rollback), rather than
  three different ad hoc patterns.
- Zero added dependencies. The entire state layer is `react`'s built-in
  `useReducer` + `useContext`.
- Cost: there's no settle-time reconciliation step beyond the
  `UPDATE_PRACTICE` dispatch on success. If a server response ever
  diverged in shape or value from what the optimistic patch assumed,
  nothing would re-validate it automatically — this is the kind of gap a
  cache-invalidation layer would close for free, and the first thing to
  revisit if this app connected to a real backend with retries and
  variable latency.
- Known, documented gap: `isPending` and `isRefetching` are currently
  hardcoded `false` in the hook layer (`hooks/usePractices.ts`) rather
  than tracked in the reducer. The optimistic dispatch/rollback logic
  itself is correct and functions properly; what's missing is exposing
  real in-flight state to the UI for spinners/disabled buttons. Tracked in
  the README's "what's next."
- Risk: a single Context provider re-renders every consumer on any state
  change, including ones that only care about a different practice's
  data. At 120 mock items this hasn't shown up as a real problem — see
  ADR 0003 for how `React.memo` boundaries currently absorb this — but
  it's the first thing to revisit if the dataset or screen count grows
  substantially.

## Alternatives considered

- **A data-fetching/cache library (e.g. TanStack Query).** Would provide
  cache invalidation, a built-in pending/settled lifecycle, and
  request deduplication for free, removing the two gaps noted above.
  Rejected for this app's current scope: the data is a fixed, small mock
  set with three well-defined mutation shapes, and `useReducer` +
  `useContext` covers the same cross-tab-sync requirement without adding a
  dependency. Worth reconsidering if this app connects to a real backend.
- **Redux Toolkit.** Rejected: more ceremony (slices, store setup,
  provider wiring) than one list with three mutation types justifies.
- **Zustand.** A reasonable lightweight option for incidental cross-component
  client state in general. Rejected here specifically because Context +
  `useReducer` already covers this app's one-list, fixed-mutation-shape
  state without adding a dependency, and there's no other unrelated shared
  state in the app that would benefit from a separate store.
- **Lifting state to the navigator root and passing it via route params.**
  Rejected: route params communicate navigation intent, not live mutable
  application state — passing the practices list through them would fight
  the navigation library rather than use it.
