# 0001. State Management Strategy

- Status: accepted
- Date: 2026-06-26

## Context

This app has three screens that all need to agree on the same underlying
data: a list of practices, each with a `completed_today` flag and a
`rating`. The brief's hardest requirement is structural: the Practices tab
contains its own stack (List → Detail), and a sibling Summary tab must
reflect changes made on the Detail screen the moment the user switches tabs.

That means state cannot live inside any single screen's local `useState` —
List, Detail, and Summary are different components in different navigators,
and none of them is an ancestor of the others in a way that local state or
simple prop drilling could reach.

There is also no real backend. The "network layer" is a mock, but the brief
is explicit that it should be approached the way a real network layer would
be — meaning the state solution should be one that would still make sense if
a real API replaced the mock tomorrow.

## Decision

**Use TanStack Query (React Query) as the single source of truth for all
practice data**, keyed under `['practices']`.

- `usePractices()` reads the query. `useMutatePractice()` writes to it via
  `useMutation`, patching the cache directly in `onMutate` for the optimistic
  path (see the README for which mutation is optimistic and why).
- List, Detail, and Summary all call `usePractices()` (directly or via
  `useSummaryStats()`, which derives from the same cache). Because TanStack
  Query de-duplicates by query key, all three are reading **one** in-memory
  object, not three independent copies. A cache write from Detail is visible
  to List and Summary on their next render — which for React Query backed
  by `useQuery` subscriptions means immediately, no manual refetch or event
  bus required.
- Local, UI-only state (e.g. an in-progress star selection before the user
  releases their tap) stays as plain `useState` inside the component that
  owns it. It never gets promoted to the shared layer.
- No Redux, Zustand, or Context-based global store is introduced. There is no
  state in this app that is shared-but-not-server-shaped, so there is nothing
  for a general-purpose client store to do that the query cache doesn't
  already do better (deduping, cache invalidation, loading/error states,
  refetch-on-refresh all come for free).

**If** a future requirement introduced genuinely client-only shared state
with no server shape (e.g. a theme toggle persisted across screens, an
in-progress multi-step wizard), the next step would be a single
`AppStateProvider` using Context + `useReducer` — not a new dependency —
since at this app's scale a second library would be solving a problem
Context already solves.

## Consequences

- Cross-tab sync, the single hardest requirement in the brief, is solved by
  the data layer's normal behavior rather than bespoke plumbing. There is no
  custom event system, no "refresh on focus" listener, no Context provider
  whose only job is to hold a list.
- Pull-to-refresh, loading state, and error state are the library's standard
  output (`isLoading`, `isError`, `refetch`), not hand-written booleans.
- Optimistic updates follow a known, testable lifecycle (`onMutate` /
  `onError` rollback / `onSettled` invalidate) instead of an ad hoc "update
  state now, fix it later if the request fails" pattern.
- Cost: one additional dependency (`@tanstack/react-query`) for an app that
  technically has no real backend. Justified because the brief explicitly
  asks for the network layer to be treated as production-shaped, and because
  the cross-tab requirement is the kind of problem this library exists to
  solve — reaching for `useState` + manual lifting here would mean rebuilding
  a worse version of the same cache.
- Risk: a reviewer could read "added a data-fetching library for a mock API"
  as overengineering if the reasoning above isn't stated. Mitigated by
  writing the reasoning down here and in the README rather than assuming it's
  self-evident.

## Alternatives considered

- **React Context + `useReducer` as the single shared store.** Rejected as
  the primary mechanism: it would work, but means hand-building cache
  invalidation, loading/error flags, and refetch-on-pull-to-refresh, all of
  which TanStack Query provides directly. Kept in reserve for any future
  client-only state that has no server shape.
- **Redux Toolkit (with or without RTK Query).** Rejected: more ceremony
  (slices, store setup, provider) than this app's scope justifies. RTK Query
  would solve the same caching problem as TanStack Query but with a heavier
  API surface for no added benefit here.
- **Lift state to the navigator root and pass it down via route params /
  context manually.** Rejected: route params are for navigation intent, not
  shared application state, and passing live mutable state through them
  would fight the navigation library rather than use it. Also reinvents
  exactly what a query cache already does.
- **Zustand.** A reasonable lightweight option in general, and the right
  default for incidental cross-component client state per the trigger rule
  above. Rejected as the *primary* layer here specifically because this
  app's shared state is server-shaped (a fetched list with mutations), which
  is TanStack Query's specialty, not a generic store's.
