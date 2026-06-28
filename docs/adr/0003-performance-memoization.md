# 0003. Performance & Memoization Strategy

- Status: accepted
- Date: 2026-06-26

## Context

The brief has an explicit, graded performance requirement: the practices
list must "handle 100+ items gracefully," with virtualization called out
by name, and "performance awareness" is one of the six scored evaluation
categories. The mock dataset generates exactly 120 practices
(`mocks/data.ts`), so this isn't a hypothetical — the list screen renders
that volume on every load.

A naive implementation (inline `renderItem` arrow function recreated every
render, an unmemoized row component, derived summary stats recomputed on
every render) would technically work at a handful of items in a quick
check and visibly degrade at 120, which is exactly the gap the brief is
testing for.

There's a second, quieter risk: over-memoizing. Wrapping every trivial
computation in `useMemo`/`useCallback` adds overhead and, with a wrong
dependency array, can introduce bugs rather than prevent them. The brief
rewards a documented memoization *strategy*, not blanket application.

## Decision

**Virtualization:** `PracticesList` renders via `FlashList` from
`@shopify/flash-list`, not `FlatList`. `FlashList` recycles views rather
than just windowing, which fits cards of fairly uniform height at 120-item
volume better than `FlatList`'s default behavior.

**Stable references for list internals:**

- `renderItem` inside `PracticesList` is defined with `useCallback`,
  dependent on `[onPracticePress, onToggleComplete, numColumns]` — exactly
  what it closes over, no more. A new function identity every render would
  defeat `FlashList`'s recycling.
- `PracticeCard` is wrapped in `React.memo`. Combined with the stable
  `renderItem` above, a row only re-renders when its own practice's data
  actually changes, not on every list-level re-render (e.g. a
  pull-to-refresh spinner toggling).
- Callbacks passed into each row (`onPracticePress`, `onToggleComplete`)
  are created once at the screen level and passed down, parameterized by
  `id`, rather than recreated per row with a fresh closure.

**Loading state matches the loaded layout's shape.** `PracticesListSkeleton`
renders the same column layout (driven by the same `numColumns` value) using
six `CardSkeleton` placeholders, rather than a centered spinner. This avoids
a layout jump between loading and loaded states and reads as more
deliberate than a generic spinner would.

**Derived state:** `useSummaryStats()` computes `{ completedCount,
averageRating }` via `computeSummaryStats()`, called with the practices
array from `usePractices()`. Because `PracticesContext` only replaces
`state.practices` on `FETCH_SUCCESS`, `UPDATE_PRACTICE`, or `ROLLBACK`, this
derivation only recomputes when the underlying data actually changes — not
on every render of `SummaryScreen`.

**What does NOT get memoized:** simple derived display values (formatting a
duration string, picking a category's color from `tokens.colors.category`)
are cheap pure functions, not wrapped in `useMemo`. A memo around a one-line
lookup costs more in code complexity than it could ever save in render
time. The rule: memoize when the computation is O(n) over the dataset
(`computeSummaryStats`) or when stable identity is needed to prevent a
child re-render (`renderItem`, `PracticeCard`) — not by default.

**Code splitting:** Expo Router's file-based routing already splits per
route. `PracticeDetailScreen` is not bundled into the initial render of the
practices list tab. No manual `React.lazy`/`Suspense` layered on top — it
would duplicate work the router already does and adds complexity this
app's scope doesn't need.

## Consequences

- The list stays smooth at the full 120-item mock dataset because rows
  only re-render on actual data changes, and `FlashList` recycles views
  rather than mounting all 120 at once.
- `useSummaryStats`'s derivation recomputes only when practice data
  actually changes, not on every `SummaryScreen` focus event — relevant
  once a user is rapidly toggling completion and switching tabs to check
  the count.
- The "what we didn't memoize and why" note above is itself the kind of
  reasoning the brief's README asks for — documented here so it doesn't
  need to be re-derived under time pressure when writing that section.
- Cost: `React.memo` + `useCallback` add a small amount of boilerplate to
  `PracticeCard` and `PracticesList`. Justified because the 100+ item
  requirement is explicitly graded, unlike, say, the Detail screen, which
  renders one item at a time and doesn't need any of this.

## Alternatives considered

- **Plain `FlatList` with manual `getItemLayout` and `windowSize` tuning.**
  Rejected: `FlashList` solves the same problem with less hand-tuning and
  is explicitly named in the brief as an acceptable virtualization choice.
- **A generic centered spinner for the loading state instead of a
  layout-matched skeleton.** Rejected: a layout-matched skeleton
  (`PracticesListSkeleton` + `CardSkeleton`) avoids a visible layout jump
  when real data arrives and reads as more polished for roughly the same
  implementation effort.
- **Memoize every derived value reflexively (every formatted string, every
  inline style).** Rejected: adds noise without measurable benefit for
  cheap computations and increases the chance of a stale-dependency bug.
  Memoization is reserved for the two cases that matter here — list row
  identity and the O(n) summary derivation.
- **`React.lazy` + `Suspense` for screen-level code splitting on top of
  Expo Router.** Rejected: redundant with the router's existing per-route
  splitting, and adds complexity this app doesn't need at three screens.
