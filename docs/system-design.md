# Frontend System Design

How this app is built. This is the **living "how"**; the [ADRs](./adr/)
hold the **"why"** behind the contested decisions
([0001 state](./adr/0001-state-management.md),
[0002 component organization](./adr/0002-component-organization.md),
[0003 performance & memoization](./adr/0003-performance-memoization.md),
[0004 design tokens](./adr/0004-design-token-system.md)). When a convention
here changes, update this file.

This doc describes the actual codebase, not an aspirational plan — every
file, hook, and component named below exists and was verified against the
real source before being written down.

## 1. Directory & layering

```text
src/
├── app/                       # Expo Router file-based routes. Thin —
│   ├── _layout.tsx              # imports screens from src/screens, no
│   ├── index.tsx                 # screen logic lives here.
│   └── (tabs)/
│       ├── _layout.tsx            # Bottom tabs: Practices, Summary
│       ├── practices/
│       │   ├── _layout.tsx         # Native stack: index → [id]
│       │   ├── index.tsx            # imports PracticesListScreen
│       │   └── [id].tsx              # imports PracticeDetailScreen
│       └── summary.tsx               # imports SummaryScreen
├── screens/                   # One file per screen. Composition + hook
│   ├── PracticesListScreen.tsx  # wiring. Owns layout, not raw fetch calls.
│   ├── PracticeDetailScreen.tsx
│   └── SummaryScreen.tsx
├── components/
│   ├── ui/                    # Pure presentational primitives. No domain
│   │   ├── AppLoader.tsx        # knowledge, no data fetching.
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── StateDisplay.tsx      # shared error/empty state view
│   └── practices/              # Feature-coupled. Reads Practice from lib/types.
│       ├── PracticesList.tsx     # FlashList wrapper, pull-to-refresh
│       ├── PracticesListSkeleton.tsx
│       ├── CardSkeleton.tsx
│       ├── PracticeCard.tsx
│       └── CategoryTag.tsx
├── context/
│   └── PracticesContext.tsx    # Single source of truth — see ADR 0001
├── hooks/
│   ├── usePractices.ts          # exports usePractices, useMutatePractice,
│   │                              # useMutatePracticeRating, useMutatePracticeTitle
│   ├── useResponsiveColumns.ts
│   └── useSummaryStats.ts
├── lib/
│   ├── api/
│   │   └── practices.ts          # fetchPractices, fetchPracticeById,
│   │                                # updatePracticeCompletion, updatePracticeRating,
│   │                                # updatePracticeTitle
│   ├── utils/
│   │   ├── summary.ts             # computeSummaryStats — pure derivation
│   │   └── summary.test.ts         # co-located test
│   ├── tokens.ts                  # Design tokens — see ADR 0004
│   └── types.ts                    # Practice interface
└── mocks/
    ├── data.ts                    # generates 120 mock practices
    ├── handlers.ts                  # MSW request handlers
    ├── index.ts
    ├── polyfills.ts
    └── server.ts
```

**Routes stay thin.** `src/app/**/*.tsx` files exist only to satisfy Expo
Router's file-based convention. The actual screen component, its layout,
and its hook calls live in `src/screens/`. This keeps screen logic testable
without mounting the router, and keeps route files boring and easy to diff.

## 2. Component tiers

Per [ADR 0002](./adr/0002-component-organization.md):

| Folder                  | What lives there                                      | Test                                          |
| ------------------------ | ------------------------------------------------------ | ----------------------------------------------- |
| `components/ui/`         | Pure presentational primitives (`Card`, `Button`,<br>`AppLoader`, `StateDisplay`). No domain knowledge. | Could ship to a different app unchanged.       |
| `components/practices/`  | Feature-coupled (`PracticeCard`, `CategoryTag`,<br>`PracticesList`, skeletons). Reads `Practice` from `lib/types`. | Removing the feature would delete the folder. |
| `screens/`               | Page-level composition. Owns layout + hook wiring.    | One-off; not reused across routes.             |

- **Two-consumer rule:** don't promote a component into `ui/` until it is
  needed in two different feature contexts. `Card` and `Button` are exempt
  — they were built as shared primitives from the start, per the brief's
  explicit requirement. `Card` is genuinely reused today: `PracticeCard`
  wraps it for the list, and `SummaryScreen` uses it directly for its two
  stat blocks.
- `ui/*` components import only `react`, `react-native`, and other `ui/*`
  (plus `lib/tokens` for styling — tokens are not domain knowledge). No
  imports from `lib/api`, `hooks/`, or domain types like `Practice`. If a
  `ui/` component needs a `Practice`-shaped prop, it isn't a `ui/`
  component — pass primitive props instead and let the feature component
  map domain data onto them. `StateDisplay`'s props (`iconName`, `title`,
  `subtitle`, `actionTitle`, `onActionPress`) are a working example: it
  renders error/empty states for any screen without knowing what a
  `Practice` is.
- The star-rating control is currently inline inside `PracticeDetailScreen`
  rather than its own component. At one consumer, extracting it would be
  premature per the two-consumer rule. If a second screen ever needs a
  rating input, extract it to `components/practices/RatingInput.tsx` then,
  not before.

## 3. Data fetching & state

There is **one** mock network layer: `lib/api/practices.ts`, exporting
`fetchPractices`, `fetchPracticeById`, `updatePracticeCompletion`,
`updatePracticeRating`, and `updatePracticeTitle`. These call MSW-intercepted
HTTP requests against `/practices` and `/practices/:id`. Screens and hooks
never construct their own fetch logic — they go through `PracticesContext`.

See [ADR 0001](./adr/0001-state-management.md) for the full reasoning.
Summary:

- **All practice data** lives in one `PracticesContext`, backed by
  `useReducer`, with a single provider mounted above the tab navigator.
  `PracticesListScreen`, `PracticeDetailScreen`, and `SummaryScreen` all
  read from this same context (`usePractices()` / `useSummaryStats()`) —
  this is what makes cross-tab sync work without manual prop-passing.
- **Six reducer actions** drive all state changes: `FETCH_START`,
  `FETCH_SUCCESS`, `FETCH_ERROR`, `OPTIMISTIC_UPDATE`, `UPDATE_PRACTICE`,
  `ROLLBACK`. Every mutation follows the same lifecycle: snapshot the
  current state, dispatch `OPTIMISTIC_UPDATE` immediately, await the mock
  API call, then dispatch `UPDATE_PRACTICE` with the server-confirmed value
  on success or `ROLLBACK` to the snapshot on failure.
- **Local UI-only state** (e.g. which star is currently being pressed
  before release) stays as plain `useState` inside the component that owns
  it. It never gets promoted into the context.

### Why Context + `useReducer`, and not a data-fetching library

This app's shared state is one list with three mutation shapes — small and
fixed enough that `useReducer` + `useContext` covers it cleanly without
adding a dependency:

- One provider, one reducer, six actions as a discriminated union. Every
  screen that needs practice data reads it from the same place.
- The optimistic-update lifecycle (snapshot → dispatch → reconcile or
  rollback) is applied identically across all three mutations, so a new
  mutation has an established pattern to follow rather than inventing one.
- Zero added dependencies for what is, in this assignment, a mock API.
- A general-purpose state library (Redux, Zustand) would add ceremony
  (slices/stores, provider wiring) that one list with three mutation types
  doesn't need. A data-fetching library (TanStack Query, RTK Query) would
  give cache invalidation and a built-in pending/settled lifecycle for
  free — see the known-gaps note below and ADR 0001 for where this trade
  would be revisited.
- If the app ever needs state that's genuinely unrelated to practice data
  (e.g. a theme toggle), that belongs in its own separate provider — don't
  grow `PracticesContext` to cover unrelated concerns just because it's
  already there.

### Known gap: `isPending` / `isRefetching` are not yet wired to real state

`usePractices()` returns `isRefetching: false` unconditionally, and
`useMutatePractice` / `useMutatePracticeRating` / `useMutatePracticeTitle`
each return `isPending: false` unconditionally — none of these are derived
from the reducer. The optimistic dispatch and rollback logic itself works
correctly; what's missing is exposing real in-flight state to the UI layer
(for a pull-to-refresh spinner or a disabled button during a request). See
the README's "what's next" for the fix.

## 4. Custom hooks

Each hook has one job. Don't build a hook that both fetches and contains
unrelated UI logic.

- `usePractices()` — reads `{ data, isLoading, isError, error, refetch,
  isRefetching }` from `PracticesContext`. Triggers an initial `refetch()`
  if `practices.length === 0`.
- `useMutatePractice()`, `useMutatePracticeRating()`,
  `useMutatePracticeTitle()` — each a thin wrapper returning `{ mutate,
  isPending }` that calls exactly one `PracticesContext` method
  (`toggleCompletion`, `mutatePracticeRating`, `mutatePracticeTitle`
  respectively). Screens call these hooks directly; they never dispatch to
  the reducer themselves.
- `useSummaryStats()` — calls `usePractices()` internally and derives
  `{ completedCount, averageRating, isLoading, isError, error, refetch,
  isRefetching }` via `computeSummaryStats()`. This is the "derived/computed
  state" the brief calls out — kept in its own hook so it's testable as
  pure logic, independent of how `SummaryScreen` renders it.
- `useResponsiveColumns()` — wraps `useWindowDimensions`, returns `2` when
  width ≥ 768px (tablet breakpoint), otherwise `1`. Pure UI concern,
  isolated so `PracticesListScreen` doesn't hand-roll breakpoint math.

**Hook boundary rule:** if you can't name what a hook returns in one
sentence without "and," split it.

## 5. Performance & memoization

Full rationale in [ADR 0003](./adr/0003-performance-memoization.md).
Verified in the current code:

- `PracticesList` renders the list via `FlashList` from `@shopify/flash-list`
  (not `FlatList`), with `numColumns` driven by `useResponsiveColumns()` and
  pull-to-refresh wired through `RefreshControl`.
- `renderItem` inside `PracticesList` is wrapped in `useCallback`, keyed on
  `[onPracticePress, onToggleComplete, numColumns]` — a stable reference so
  `FlashList` can recycle rows instead of remounting them.
- `PracticeCard` is wrapped in `React.memo`. Combined with the stable
  `renderItem` above, a row only re-renders when its own practice data
  actually changes.
- Loading state uses a dedicated `PracticesListSkeleton` (6 `CardSkeleton`
  placeholders in the current column layout) rather than a generic spinner
  — this keeps the loading layout shape consistent with the loaded layout,
  avoiding a layout jump.
- Code splitting: Expo Router's file-based routing already splits per
  route — `PracticeDetailScreen` is not bundled into the initial render of
  the list tab. No manual `React.lazy`/`Suspense` layered on top; it would
  duplicate work the router already does.

What does **not** get memoized: simple derived display values (formatting
duration, picking a category color) are cheap pure functions, not wrapped
in `useMemo`. Memoizing a one-line lookup costs more in code complexity
than it could ever save in render time. Memoize when the computation is
O(n) over the dataset (`useSummaryStats`) or when stable identity prevents
a child re-render (`renderItem`, `PracticeCard`) — not by default.

## 6. Styling & tokens

Full rationale in [ADR 0004](./adr/0004-design-token-system.md). All tokens
live in `lib/tokens.ts`, exporting a single `tokens` object with four
top-level categories: `colors` (including a `category` sub-object for the
four practice categories), `spacing` (`xs`–`xl`), `radius` (`card`,
`control`, `badge`), and `font` (`size` and `weight` scales). No bare hex
values or magic spacing numbers belong in component `style` objects —
reference `tokens.*` instead.

## 7. Errors & empty/loading states

- `usePractices()` exposes `isLoading`, `isError`, `error`, and `data`.
  `PracticesListScreen` branches on these explicitly: `PracticesListSkeleton`
  while loading, `StateDisplay` for the error case, `StateDisplay` again
  (with different copy) for the empty case, and `PracticesList` once data
  has loaded successfully. Loading and error/empty states are visually
  distinct — they mean different things to the user.
- Mutation errors (failed completion toggle, failed rating, failed title
  edit) roll back the optimistic update via the `ROLLBACK` action rather
  than surfacing a blocking alert. The brief expects the UI to feel
  responsive; a modal alert on every flaky-mock-network failure would
  defeat that.

## 8. Testing

- **Jest, via the `jest-expo` preset, + React Native Testing Library.**
  Configured in `jest.config.js` (`preset: 'jest-expo'`,
  `setupFilesAfterEnv: ['./jest.setup.js']`) with `"test": "jest"` in
  `package.json`. Verified passing: 4 suites, 15 tests.
- **File placement:** tests are co-located next to the source they cover —
  `summary.ts` / `summary.test.ts` in the same folder, and each screen's
  test sits beside its component (`SummaryScreen.tsx` /
  `SummaryScreen.test.tsx`, etc.) — rather than a separate mirrored test
  tree. Simpler to navigate at this project's size.
- **Current coverage**, exceeding the brief's stated minimum of one
  component test + one hook/utility test:
  - `lib/utils/summary.test.ts` — `computeSummaryStats` on empty input,
    mixed completed/rated data, and null-rating handling.
  - `screens/SummaryScreen.test.tsx` — correct stat math rendered, fallback
    display for zero completed, and updates on pull-to-refresh.
  - `screens/PracticeDetailScreen.test.tsx` — detail rendering, completion
    mutation, rating mutation, correct API arguments.
  - `screens/PracticesListScreen.test.tsx` — skeleton loading, populated
    list, empty state, API failure/error state, navigation on tap.
- **Async state updates must be properly awaited.** `PracticesContext`'s
  fetch and mutation dispatches happen after an `await`. Any test that
  asserts immediately after triggering one of these via a `getBy*` query
  risks an `act()` warning and a result that passes by timing luck rather
  than correctness. Use `await waitFor(...)` or `await screen.findBy*(...)`
  after any action that triggers a context fetch or mutation — this is the
  expected pattern for any new test in this repo.
- No end-to-end test yet exercises the full cross-tab flow (mark complete
  on Detail → switch tabs → see it reflected on Summary) in one test; each
  screen above is tested with its own rendering of `PracticesProvider`.
  The brief marks integration tests optional — see the README's "what's
  next" for this as a future addition.

## 9. What AI-generated components must NOT do

- Don't introduce Redux, Zustand, MobX, Recoil, or a data-fetching library
  (TanStack Query, RTK Query, SWR). State story is `PracticesContext`
  (`useReducer` + `useContext`) + local `useState`. See ADR 0001.
- Don't fetch data directly inside a `ui/` component or inside `screens/`
  — always through `lib/api/practices.ts`, called from `PracticesContext`,
  exposed via the `hooks/` wrappers.
- Don't hand-roll virtualization with `FlatList` when `FlashList` is
  already the dependency of record in `PracticesList`.
- Don't invent a new color, spacing, or font size outside `lib/tokens.ts`.
  Extend the existing scale and say so; don't inline a one-off value.
- Don't add animation beyond what Expo Router's native transitions give
  for free. Per the brief, custom Lottie/Reanimated sequences are out of
  scope. (`CardSkeleton`'s loop fade is the one existing exception, since
  it's a loading placeholder, not a feature animation.)
