# Frontend System Design

How we build in this repo. This is the **living "how"**; the [ADRs](./adr/)
hold the **"why"** behind the contested decisions
([0001 state](./adr/0001-state-management.md),
[0002 component organization](./adr/0002-component-organization.md),
[0003 performance & memoization](./adr/0003-performance-memoization.md),
[0004 design tokens](./adr/0004-design-token-system.md)). When a convention
here changes, update this file.

This is a take-home assignment scoped to ~4 hours. Every rule below is sized
for that: enough structure to demonstrate production judgment, not so much
that it eats the time budget. If a rule and the clock conflict, document the
shortcut in the README's "what I'd do next" section instead of silently
skipping it.

## 1. Directory & layering

```text
app/                    # Expo Router file-based routes only. Thin: import
                         # screens from src/screens, do not write screen logic here.
  _layout.tsx
  (tabs)/
    _layout.tsx
    practices/
      _layout.tsx
      index.tsx          # imports src/screens/PracticesListScreen
      [id].tsx            # imports src/screens/PracticeDetailScreen
    summary.tsx           # imports src/screens/SummaryScreen
src/
  screens/               # One file per screen. Composition only — assembles
                         # components + hooks. No fetch calls written inline here.
  components/
    ui/                  # Pure presentational primitives. No domain knowledge,
                         # no data fetching, no navigation calls.
    practices/           # Feature-coupled components (PracticeCard, RatingInput).
                         # Read domain types from lib/types.
  hooks/                 # Custom hooks: usePractices, useMutatePractice,
                         # useSummaryStats, useResponsiveColumns.
  lib/
    api/                 # The mock network layer. Single fetch surface.
    types.ts              # Practice type + any API-boundary types.
    tokens.ts             # Design tokens (see ADR 0004).
    utils/                # Pure functions (e.g. computeSummaryStats).
  context/                # AppStateProvider (see ADR 0001). One file.
__tests__/                # Mirrors src/ path per file under test.
```

**Routes stay thin.** `app/**/*.tsx` files exist only to satisfy Expo Router's
file-based convention. The actual screen component, its layout, and its hook
calls live in `src/screens/`. This keeps screen logic testable without
mounting the router, and keeps route files boring and easy to diff.

## 2. Component tiers

Per [ADR 0002](./adr/0002-component-organization.md):

| Folder                  | What lives there                                      | Test                                          |
| ----------------------- | ----------------------------------------------------- | --------------------------------------------- |
| `components/ui/`        | Pure presentational primitives. No domain knowledge.  | Could ship to a different app unchanged.      |
| `components/<feature>/` | Feature-coupled. Reads domain types from `lib/types`. | Removing the feature would delete the folder. |
| `screens/`              | Page-level compositions. Owns layout + hook wiring.   | One-off; not reused across routes.            |

- **Two-consumer rule:** don't promote a component into `ui/` until it is
  needed in two different feature contexts. `Card` and `Button` are exempt —
  the brief requires them as shared primitives from the start, so they are
  built in `ui/` directly.
- `ui/*` files import only `react`, `react-native`, and other `ui/*` (plus
  `lib/tokens` for styling values — tokens are not domain knowledge). No
  imports from `lib/api`, `hooks/`, or `lib/types`'s domain shapes. If a `ui/`
  component needs a `Practice`-shaped prop, it isn't a `ui/` component — pass
  primitive props (`title: string`, `onPress: () => void`) instead and let the
  feature component map domain data onto them.
- Feature folders own their own prop types, built from `lib/types` domain
  types, not duplicating them.

## 3. Data fetching & state

There is **one** mock network layer: `lib/api/practices.ts`. It exports typed
functions (`fetchPractices`, `updatePractice`) that simulate latency and
occasional failure. Screens and hooks never construct their own fetch logic —
they call these functions through the query/mutation hooks in `hooks/`.

See [ADR 0001](./adr/0001-state-management.md) for the full reasoning. Summary:

- **Server-shaped state** (the practices list, completion status, ratings) is
  owned by **TanStack Query**, keyed `['practices']`. List, Detail, and
  Summary all read the same cache entry — this is what makes cross-tab sync
  work without manual prop-passing or a duplicated store.
- **Local UI-only state** (e.g. a star rating being actively dragged before
  commit, a collapsed/expanded card) stays as component-local `useState`.
  Don't lift it into a shared layer.
- **Cross-cutting client state with no server shape** (none is expected in
  this scope, but if it shows up — e.g. a theme toggle) goes in a single
  `AppStateProvider` using Context + `useReducer`, not a new dependency. See
  the Context API note below.

### Why Context API here, not Zustand/Redux

This assignment's shared state is fundamentally server-shaped (a list with
mutations), which is TanStack Query's job, not a client store's job. The
_only_ candidate for a hand-rolled shared layer would be incidental UI state
with no natural server shape, and at this app's size that need has not
materialized. If it does, reach for Context + `useReducer` first:

- One provider (`AppStateProvider`), one reducer, actions as a discriminated
  union. Avoid scattering five separate `useContext` providers.
- Split read and dispatch into two contexts (`StateContext`,
  `DispatchContext`) if more than one consumer re-renders on unrelated
  dispatches — dispatch never changes identity, so components that only
  dispatch (and don't read state) won't re-render when state updates.
- Do not put server-fetched data in Context. That is what the query cache is
  for; duplicating it invites the two going out of sync.

## 4. Custom hooks

Each hook has one job. Don't build a hook that both fetches and contains
unrelated UI logic.

- `usePractices()` — wraps `useQuery(['practices'], fetchPractices)`. Nothing
  else.
- `useMutatePractice()` — wraps `useMutation`, owns the optimistic-update
  `onMutate`/`onError`/`onSettled` lifecycle for marking complete. Returns a
  mutate function and pending/error state. Screens call this hook; they do
  not write cache-patching logic inline.
- `useSummaryStats()` — derives `{ completedCount, averageRating }` from the
  same `['practices']` query data via `useMemo`. Pure derivation, no fetch,
  no side effects. This is the "derived/computed state" the brief calls out
  — it belongs in its own hook so it's independently testable as logic, not
  buried in the Summary screen's render.
- `useResponsiveColumns()` — wraps `useWindowDimensions`, returns a column
  count. Pure UI concern, isolated so the list screen doesn't hand-roll
  breakpoint math inline.

**Hook boundary rule:** if you can't name what a hook returns in one sentence
without "and," split it.

## 5. Performance & memoization

Full rationale in [ADR 0003](./adr/0003-performance-memoization.md). Summary
of the rules an AI generating components should follow:

- List rendering uses `FlashList` (`@shopify/flash-list`), not a hand-rolled
  `FlatList` with manual memoization, given the 100+ item requirement.
- `renderItem` is a stable reference (defined with `useCallback`, or hoisted
  outside the component if it has no closure dependencies) — a new function
  identity every render defeats `FlashList`'s recycling.
- `PracticeCard` is wrapped in `React.memo`. Its props are primitives or
  stable references (no inline-created objects/arrays/functions passed from
  the parent on every render).
- Callbacks passed down to list items (`onPress`, `onToggleComplete`) are
  created with `useCallback` at the list/screen level, not redefined per row.
- Expensive derivations (`useSummaryStats`, column-count math) use `useMemo`
  keyed on their actual dependencies — not wrapped reflexively around cheap
  computations that don't need it. Memoizing a one-line string concat is
  noise, not optimization.
- Screen-level code splitting: `PracticeDetailScreen` is not eagerly bundled
  into the initial tab render. Expo Router's file-based routes already lazy
  load per-route by default — don't undo that by importing detail-screen-only
  dependencies (e.g. a heavy chart lib, if one is ever added) at the top of
  `PracticesListScreen`.

## 6. Styling & tokens

Full rationale in [ADR 0004](./adr/0004-design-token-system.md).

- All tokens live in `lib/tokens.ts` — colors, spacing scale, radius, type
  scale. No bare hex, no magic spacing numbers in component `style` objects.
- Use `StyleSheet.create` per component file, built from `tokens`. Don't
  inline style objects in JSX for anything beyond a one-off dynamic value
  (e.g. an animated/computed value that can't live in a static sheet).
- One spacing scale (e.g. 4px base: 4/8/12/16/24/32), referenced as named
  tokens (`spacing.sm`, `spacing.md`), not raw numbers, so an AI generating a
  new component pulls from the same scale instead of inventing `17`.

## 7. Errors & empty/loading states

- `usePractices()` exposes `isLoading`, `isError`, and `data` per TanStack
  Query's standard shape. Screens branch on these three states explicitly —
  no implicit "if data is undefined assume loading" guessing.
- Empty state (`data` is an empty array) is visually distinct from the error
  state. Don't collapse them into one "nothing to show" branch — the brief
  asks for both, and they mean different things to a user.
- Mutation errors (failed mark-complete, failed rating) surface as a rollback
  of the optimistic update, not a blocking alert. The brief expects the UI to
  feel responsive; a modal alert on every flaky-mock-network failure defeats
  that.

## 8. Testing

- **Jest + React Native Testing Library.** Tests live in `__tests__/`,
  mirroring the source path (`__tests__/components/ui/PracticeCard.test.tsx`
  for `src/components/ui/PracticeCard.tsx`).
- Minimum bar per the brief: one component test, one hook/utility test,
  integration test optional. See the README's testing strategy section for
  which of these we actually wrote and what was deliberately skipped.
- Component tests assert behavior (renders expected text, fires `onPress`),
  not implementation detail (don't assert on internal state, className-style
  checks, or exact style object values).
- Hook/utility tests for pure logic (`computeSummaryStats`) must cover the
  zero-completed edge case explicitly — average-of-empty-set is the kind of
  bug that's invisible until a reviewer tries it.

## 9. What AI-generated components must NOT do

Called out explicitly since this doc's primary audience is an AI assistant
generating code for this repo:

- Don't introduce Redux, Zustand, MobX, or Recoil. State story is TanStack
  Query + local `useState` + (if ever needed) one Context provider. See
  ADR 0001.
- Don't fetch data directly inside a `ui/` component or inside `screens/` —
  always through a `hooks/` wrapper.
- Don't hand-roll virtualization with `FlatList` + manual `getItemLayout`
  tuning when `FlashList` is already the dependency of record.
- Don't invent a new color, spacing, or font size outside `lib/tokens.ts`. If
  the existing scale doesn't fit, add a token and say so, don't inline a
  one-off value.
- Don't add animation beyond what React Navigation / Expo Router give for
  free. Per the brief, custom Lottie/Reanimated sequences are explicitly out
  of scope.
