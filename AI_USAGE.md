# AI Usage

## 1. Tools & Rough Mix

- AI assistant (screens designs, architecture decisions, ADR/docs writing,
  codebase auditing and review) — roughly 45%
- AI assistant in editor (component scaffolding, screen implementation,
  test writing, refactoring) — roughly 40%
- Hand-written / hand-edited (wiring, fixing AI output, final review,
  fixes relaed to MSW) — roughly 15%

The split skews toward "AI for architecture and review" because a
separate AI conversation was used specifically to audit the real codebase
before writing documentation — reading every relevant file and quoting
exact evidence rather than letting the docs drift from what the code
actually does.

## 2. Three Prompts That Produced Something You Kept

**Prompt:** "Structure Expo Router as i explained so the Practices
tab has its own stack (List → Detail) while Summary stays a
flat tab, given the brief requires this exact nesting"

What came back: the `src/app/(tabs)/practices/_layout.tsx` nested-stack
folder structure, plus the convention that route files stay thin and
import the actual screen logic from `src/screens/`. Kept both — it's
written into `docs/system-design.md` section 1, and kept route files
boring and easy to diff throughout the build.

**Prompt:** "My Jest tests are passing, but I'm getting repeated
console.error warnings: 'The current testing environment is not
configured to support act(...)' pointing at dispatch calls inside async
functions in PracticesContext. Fix the test files to properly wait for
async state updates instead of asserting immediately."

What came back: a diff across all three screen test files replacing
immediate `getBy*` assertions with `await waitFor(...)` / `await
screen.findBy*(...)` wherever a test triggered a context fetch or
mutation, plus removal of leftover debug `console.log` calls in
`PracticesContext.tsx`. Kept in full and re-ran the suite to confirm: same
15 tests, same pass count, but now with zero `act()` warnings — meaning
the tests had previously been passing by timing luck rather than by
correctly waiting for the async work they were supposed to verify. Now
written into `docs/system-design.md` section 8 as the expected pattern
for any new test in this repo.

**Prompt (codebase audit):** (To make sure everthing is working as i
wanted) a structured, file-by-file audit prompt
asking AI to open and quote evidence from every relevant file — the
context reducer, every hook, every component's props, the navigation
tree, the API layer, the token structure, the test files — confirming
each one matched what our documentation already described, rather than
assuming it from memory.

What came back: a complete, evidence-quoted confirmation that the
architecture, component structure, and conventions held up exactly as
intended — the docs and the real code matched our project's standards,
scope, and readability bar throughout. Kept the full audit as a
reference point going forward, so any future addition to the app has
the same verified baseline to build on.

## 3. Two Cases Where AI Got It Wrong

**Case 1 — AI tried to introduce Redux, ignoring our own documented state
decision.** What happened: while working on a state-related task in a
session using a lower-tier model selection, the assistant ignored
`docs/adr/0001-state-management.md` (which explicitly states the app uses
Context + `useReducer` and lists Redux as a rejected alternative) and
started implementing the requested feature using Redux instead — setting
up an action creator and a slice-style structure, before getting as far as
actually running the install command. I caught this before any package
was added, stopped it immediately, and pointed it back at the existing
ADR. Why it happened: a weaker model is more likely to default to the
most common pattern it's seen in training data for "add state to a React
app" (Redux is extremely common in general React material) rather than
actually reading and respecting a project-specific constraint that
contradicts that default. What I did instead: re-ran the same request on
a stronger model with an explicit instruction to read `docs/adr/0001` and
`docs/system-design.md` first, which correctly implemented the feature
using the existing `PracticesContext` pattern. Lesson: model selection
matters for instruction-following on constraints that go against a
common default, not just for code quality — and a documented ADR is only
useful if something is actually checking the model reads it before
writing code, not after.

**Case 2 — AI added a deprecated testing package instead of the one
already specified.** What happened: while writing and running the test
suite, the assistant attempted to add `react-test-renderer` as a testing
dependency — a package that is officially deprecated, does not support
React 19+, and that Expo's own documentation explicitly says to remove if
present, since `@testing-library/react-native` already replaces it
entirely. `docs/system-design.md` section 8 already names
`@testing-library/react-native` (via the `jest-expo` preset) as the
testing stack, so this wasn't a case of no guidance existing, it was AI
reaching for an older, more "classic" testing pattern instead of the one
already chosen and documented. I stopped it before the install completed,
told it explicitly which package to use, and pointed it back at the
existing testing convention. What I did instead: gave a direct instruction
naming `@testing-library/react-native` specifically and telling it not to
add `react-test-renderer` under any circumstance, after which it
implemented the tests correctly using `render`, `fireEvent`, and
`waitFor` from the right library. Lesson: AI's training data contains a
lot of now-outdated tooling advice, and for a fast-moving ecosystem like
React Native testing, it will sometimes reach for what used to be
standard rather than what's current — worth explicitly naming the exact
package when it matters, not just describing the testing approach in
general terms.

## 4. What You Deliberately Did NOT Use AI For

All structural and architectural decisions were mine: the navigation
nesting, the choice of Context + `useReducer` over a state library, the
three-tier component tree, and how the data layer should be
shaped. AI implemented against these decisions; it didn't make them.

Every piece of AI-written code was manually checked against our own code
standards and readability bar before being accepted, not just glanced at
for "does it run." If something didn't match the conventions already
established in the codebase, it went back for a rewrite rather than being
left inconsistent.

The step-by-step approach for implementing MSW — how the mock handlers
should be structured, what the request/response shape should look like,
and how it should plug into the app — was guided by me directly, not left
for AI to decide on its own.

The choice of which technologies and tools to use throughout — Expo
Router, FlashList, Context API, MSW, Jest — was restricted and decided by
me upfront. AI worked within those constraints; it didn't pick the stack.

## 5. One Architectural Decision You Made Independently

Keeping `PracticesContext` as a single provider mounted above the tab
navigator, rather than splitting it into separate read/dispatch contexts
(a common React Context optimization to avoid re-rendering dispatch-only
consumers). At this app's scale — three screens, 120 mock items, three
mutation shapes — the added indirection of two contexts wasn't worth it
yet, and that trade-off is noted explicitly in
`docs/adr/0001-state-management.md` as the first thing to revisit if the
dataset or screen count grows. This wasn't AI-suggested; it came from
weighing the brief's actual scope against a pattern I've used before on
larger apps, and judging that the optimization didn't earn its complexity
here.
