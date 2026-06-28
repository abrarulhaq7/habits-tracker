# Habits Tracker — Daily Practices

A small habit-tracking app built for the Kaelis Tech take-home assignment.
Expo, TypeScript, Expo Router, Context API, MSW Native.

## Setup

```bash
git clone https://github.com/abrarulhaq7/habits-tracker.git
cd habits-tracker
npm install
npx expo start
```

A `.env.development` file is committed (with a matching `.env.example`) so
the app runs immediately with no extra configuration. Open in iOS
Simulator, Android Emulator, or Expo Go from the terminal output.

## Time spent

About 4 hours for the core build (setup, navigation, the three screens,
mutations, responsive layout, design tokens, basic environement), plus additional time for test coverage and a code-organization pass on screen files. See "what I'd do next" for the small number of items that can be dont next.

## Architecture

Full reasoning lives in [`docs/system-design.md`](./docs/system-design.md)
(the living conventions doc) and [`docs/adr/`](./docs/adr/) (the numbered
decision records). Short version below.

```
src/
├── app/                    Expo Router file-based routes (thin)
│   └── (tabs)/
│       ├── practices/        Stack: list → detail
│       └── summary.tsx
├── screens/                 PracticesListScreen, PracticeDetailScreen, SummaryScreen
├── components/
│   ├── ui/                   Card, Button, AppLoader, StateDisplay
│   └── practices/             PracticeCard, CategoryTag, PracticesList,
│                                PracticesListSkeleton, CardSkeleton
├── context/                 PracticesContext (useReducer-based state + mutations)
├── hooks/                   usePractices, useMutatePractice*, useSummaryStats,
│                              useResponsiveColumns
├── lib/
│   ├── api/practices.ts       Mock network layer (intercepted by MSW)
│   ├── tokens.ts                Design tokens
│   ├── types.ts                  Practice type
│   └── utils/summary.ts           computeSummaryStats — pure derivation
└── mocks/                   MSW handlers + 120 generated mock practices
```

## State management: Context API + `useReducer`, and why

All practice data — the list, completion status, ratings, titles — lives
in a single `PracticesContext`, backed by `useReducer`, with one provider
mounted above the tab navigator. `PracticesListScreen`,
`PracticeDetailScreen`, and `SummaryScreen` all read from this same
context, which is what makes the brief's hardest requirement (Detail
screen changes reflecting immediately on Summary after a tab switch) work
without any manual refetching or prop drilling across the tab boundary.

Why Context + `useReducer` over a dedicated state library:

- The app's shared state is one list with three well-defined mutation
  shapes (completion, rating, title) — small and fixed enough that
  `useReducer` + `useContext` covers it cleanly with zero added
  dependencies.
- All three mutations follow one consistent lifecycle: snapshot the
  current state, dispatch an optimistic update immediately, await the
  mock API call, then reconcile with the server response on success or
  roll back to the snapshot on failure. A new mutation has an established
  pattern to follow rather than inventing its own.
- Redux or a similar general-purpose store would add ceremony (slices,
  store setup, provider wiring) that one list with three mutation types
  doesn't need that.

The honest trade-off: there's no settle-time reconciliation step beyond
the success-path `UPDATE_PRACTICE` dispatch, and no cache invalidation
layer. A dedicated data-fetching library would give both for free. That's
an explicit, scoped decision for this app's size, not an oversight — full
reasoning in
[`docs/adr/0001-state-management.md`](./docs/adr/0001-state-management.md).

**Known limitation:** the mutation hooks (`useMutatePractice`,
`useMutatePracticeRating`, `useMutatePracticeTitle`) and `usePractices()`
currently return hardcoded `isPending` / `isRefetching` flags rather than
tracking real in-flight state in the reducer. The optimistic UI update
itself works correctly (state changes immediately, rolls back on
failure), but a loading spinner or disabled-button state tied to "is this
specific mutation in flight right now" would not currently reflect
reality. See "what I'd do next."

## Optimistic updates

All three mutations — marking a practice complete, setting its rating, and
editing its title — are optimistic, using the same snapshot → dispatch →
reconcile/rollback pattern in `PracticesContext`. Applying the pattern
uniformly, rather than picking just one mutation to special-case, keeps the
mutation lifecycle predictable and easy to extend: any future mutation
follows the same three-step shape instead of needing its own bespoke
logic.

## Testing strategy

**4 suites, 15 tests, all passing.** `npm test` runs clean with no
warnings and no stray console output.

- `lib/utils/summary.test.ts` — `computeSummaryStats()` on empty input,
  mixed completed/rated data, and null-rating handling (no divide-by-zero
  on the average). The highest-risk pure logic in the app, and the brief
  specifically calls out "derived/computed state across the dataset" as
  something to demonstrate.
- `screens/SummaryScreen.test.tsx` — correct stat math rendered from mock
  data, fallback display when zero practices are completed, and updates
  on pull-to-refresh.
- `screens/PracticesListScreen.test.tsx` — skeleton loading state,
  populated list, empty state, API-failure error state, and navigation on
  card tap.
- `screens/PracticeDetailScreen.test.tsx` — correct detail rendering, and
  both the completion and rating mutations firing with correct arguments.

This covers all three screens plus the core derivation logic, exceeding
the brief's stated minimum of one component test + one hook/utility test.

## Responsiveness

`useResponsiveColumns()` switches the practices list between 1 column
(width < 768px) and 2 columns (width ≥ 768px, tablet/landscape) via
`useWindowDimensions`. `PracticeDetailScreen` independently checks
`width > height` to detect landscape and switches to a genuine two-pane
layout — category, title, duration, and description in a scrollable left
pane, star rating and the complete action in a right pane — rather than
just stretching the portrait layout. Portrait keeps a sticky footer with
the complete action; landscape moves it into the right pane.

## What I'd do next with another 4 hours

This was scoped intentionally as a slice of a larger product, so the real
answer to "what's next" is about where this goes if it kept growing, not
just a bug list. In rough priority order:

1. **Real backend integration with Firebase.** Swap the MSW mock layer for
   Firestore, with practices, completions, and ratings persisted per user
   instead of living only in memory for the session. This is also the
   natural point to introduce a proper caching strategy — stale-while-
   revalidate reads, optimistic writes reconciled against real Firestore
   listeners, and offline-first behavior so the app stays usable on a flaky
   connection, not just against a fast local mock.

2. **CRUD for practices, not just mutate.** Right now a user can complete,
   rate, and retitle an existing practice, but can't create a new one,
   meaningfully edit its full detail, or delete it. Adding a "create
   practice" flow plus edit/delete on the Detail screen, each with its own
   test coverage, turns this from a fixed demo dataset into something a
   real user could actually shape to their own routine.

3. **Daily motivation notifications.** A scheduled push notification (via
   a cron job on the backend, delivered through Expo's push service) that
   nudges the user once a day if they haven't completed any practices yet
   — the kind of lightweight retention feature that matters a lot for a
   habit-tracking product specifically, since the whole point is daily
   consistency.

4. **CI/CD with Fastlane.** Set up a proper pipeline — lint, type-check,
   test, then automated build and delivery to TestFlight (and the Play
   Store equivalent) on merge to main — so every change ships through the
   same repeatable path instead of a manual build.

5. **Ship it to a real user and iterate on real feedback.** If this were
   actually going out to a client or test user, the next real step isn't
   guessing at more features — it's getting the app in front of them,
   listening to what's actually confusing or missing in their daily use,
   and feeding that back into a prioritized list rather than continuing to
   build in a vacuum.

6. **Streaks.** Track consecutive days a practice has been completed, not
   just today's status. This is the single biggest motivator in habit
   products generally — "completed today" is a snapshot, "7 days in a row"
   is the thing that actually keeps someone coming back.

7. **A simple history view per practice.** Tapping into a practice's past
   week of completions and ratings on the Detail screen, so the user can
   see their own pattern over time instead of only ever seeing "today."
8. **Category-level filtering on the list.** With 100+ practices, a quick
   filter by movement/breath/reflection/rest would make the list genuinely
   usable at scale, rather than just performant at scale.

## AI usage

See [`AI_USAGE.md`](./AI_USAGE.md) for the full breakdown.
