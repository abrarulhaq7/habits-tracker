# 0003. Performance & Memoization Strategy

- Status: accepted
- Date: 2026-06-26

## Context

The brief has an explicit, graded performance requirement: the practices list
must "handle 100+ items gracefully," with virtualization called out by name
(`FlashList`, `RecyclerListView`, or equivalent), and "performance awareness"
is one of the six scored evaluation categories.

React Native's default `FlatList` is windowed but still re-renders more
aggressively than purpose-built recycling lists, and a naive implementation
(inline `renderItem` arrow function, unmemoized row component, derived
summary stats recomputed on every render) would technically "work" at 5 items
in a demo and visibly degrade at 100+, which is exactly the gap the brief is
testing for.

There's a second, quieter risk: over-memoizing. Wrapping every trivial
computation in `useMemo`/`useCallback` adds cognitive overhead and, in cases
where the dependency array is wrong or the computation is cheaper than the
memo check itself, can make things slower or buggier, not faster. The brief
rewards "memoization strategy" as a documented choice, not a reflex applied
everywhere.

## Decision

**Virtualization:** Use `@shopify/flash-list` for the Practices list. It
recycles views (rather than just windowing, like `FlatList`), which is the
better fit for cards of fairly uniform height rendered at 100+ count.

**Stable references for list internals:**

- `renderItem` is defined once per screen render via `useCallback`, with a
  dependency array limited to what it actually closes over (typically just
  the mutation function reference, which is itself stable from
  `useMutatePractice`).
- `PracticeCard` is wrapped in `React.memo`. Combined with a stable
  `renderItem` and stable callback props, this means a row only re-renders
  when its own data actually changes — not on every list-level re-render
  (e.g. a pull-to-refresh spinner toggling).
- Callbacks passed to each row (`onPress`, `onToggleComplete`) are created
  once at the list/screen level with `useCallback`, parameterized by `id`
  rather than recreated per row with a fresh closure each render.

**Derived state:** `useSummaryStats()` computes `{ completedCount,
averageRating }` with `useMemo`, keyed on the practices array reference from
the query cache. Because TanStack Query returns a stable reference when the
underlying data hasn't changed, this memo only recomputes when a mutation
actually lands — not on every render of the Summary screen.

**What does NOT get memoized:** simple derived display values (formatting a
duration as "10 min", picking a color for a category tag) are cheap pure
functions, not memoized. A `useMemo` around a string template or object
lookup costs more in code complexity than it could ever save in render time.
The rule: memoize when the computation is O(n) over the dataset or when
stable identity is needed to prevent a child re-render, not by default.

**Code splitting:** Expo Router's file-based routing already code-splits per
route — `PracticeDetailScreen` is not bundled into the initial render of the
List screen. We preserve this by not importing detail-screen-only modules at
the top of list-screen files. No manual `React.lazy`/`Suspense` is layered on
top; it would duplicate work the router already does and adds complexity
this app's scope doesn't need.

## Consequences

- The list stays smooth at 100+ items because rows only re-render on actual
  data changes, and the list itself recycles views rather than mounting all
  100+ at once.
- Summary's derived stats recompute only when data changes, not on every
  Summary-tab focus event, which matters once the user is rapidly toggling
  completion and switching tabs to check the count.
- The "what we didn't memoize and why" note above is itself the kind of
  reasoning the brief asks the README to contain — it's documented here so
  it doesn't need to be re-derived under time pressure when writing that
  section.
- Cost: `React.memo` + `useCallback` add a small amount of boilerplate to
  `PracticeCard` and the list screen. Accepted because the 100+ item
  requirement is explicitly graded, unlike, say, micro-optimizing the
  Detail screen, which renders one item at a time and doesn't need any of
  this.

## Alternatives considered

- **Plain `FlatList` with manual `getItemLayout` and `windowSize` tuning.**
  Rejected: `FlashList` solves the same problem with less hand-tuning and is
  explicitly named in the brief as an acceptable choice; reinventing its
  internals with `FlatList` configuration would spend time the budget
  doesn't have for an inferior result.
- **Memoize everything reflexively (every derived value, every inline
  style).** Rejected: adds noise without measurable benefit for cheap
  computations, and increases the chance of a stale-dependency bug. Reserved
  memoization for the two cases that matter here — list row identity and the
  O(n) summary derivation.
- **`React.lazy` + `Suspense` for screen-level code splitting on top of Expo
  Router.** Rejected: redundant with the router's existing per-route
  splitting, and `Suspense` boundaries around navigation add complexity this
  app doesn't need at three screens.
