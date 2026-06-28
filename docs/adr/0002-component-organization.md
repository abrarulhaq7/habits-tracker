# 0002. Component Organization

- Status: accepted
- Date: 2026-06-26

## Context

The brief requires two specific shared primitives — a `Card` (used by both
the practices list and the summary screen) and a `Button` — plus several
feature-specific pieces (a category tag, list/card skeletons, the
practice card itself). Without a stated rule, components generated across
many separate prompts to an AI assistant tend to drift in placement: some
ending up in a flat folder, some promoted to a shared location before they
actually have a second consumer.

This app is small (three screens), so the risk isn't large-codebase rot.
The risk is narrower and specific to building incrementally with an AI
assistant: component 9 not following the same placement logic as component
2, because the rule was never written down.

## Decision

Three tiers, matching `system-design.md` section 2:

| Folder                  | What lives there                                       | Test                                          |
| ------------------------ | --------------------------------------------------------- | ----------------------------------------------- |
| `components/ui/`         | Pure presentational primitives. No domain knowledge.    | Could ship to a different app unchanged.       |
| `components/practices/`  | Feature-coupled. Reads `Practice` from `lib/types`.     | Removing the feature would delete the folder. |
| `screens/`                | Page-level composition. Owns layout and hook wiring.    | One-off; not reused across routes.             |

**`components/ui/` today:** `Card`, `Button`, `AppLoader` (a centered
loading view with an `ActivityIndicator`), and `StateDisplay` (a generic
icon + title + subtitle + optional action button view, used for both error
and empty states). None of these import `Practice` or any other domain
type — `StateDisplay`'s props are `iconName`, `title`, `subtitle`,
`actionTitle`, and `onActionPress`, all primitives or callbacks.

**`components/practices/` today:** `PracticeCard` (wraps `Card`, adds
practice-specific layout and a completion toggle), `CategoryTag` (colored
badge keyed off the four category values), `PracticesList` (the `FlashList`
wrapper with pull-to-refresh), and the two loading placeholders
`PracticesListSkeleton` and `CardSkeleton`.

**Exception to the two-consumer rule:** `Card` and `Button` were built
directly into `components/ui/` from the start rather than waiting for a
second consumer to appear organically — the brief names them as required
shared primitives up front, so the usual "wait and see" rule (which exists
to prevent guessing at the wrong abstraction) doesn't apply here. `Card`'s
reuse is real and verified: `PracticeCard` wraps it for the list, and
`SummaryScreen` renders it directly, twice, for its "Completed Today" and
average-rating stat blocks.

**Boundary rule for `ui/`:** a `ui/` component's props are primitives
(`title: string`, `onPress: () => void`, `variant: "primary" | "secondary"
| "outline"`) or React nodes, never a domain type like `Practice`.
`PracticeCard` is the adapter — it imports `Practice` from `lib/types` and
maps its fields onto primitive props for the pieces it composes
(`CategoryTag`, text, the completion toggle). This is what keeps `Card`
reusable by `SummaryScreen`'s stat display, which has nothing to do with
practices.

**Rating input stays inline, for now.** The 1–5 star control is implemented
directly inside `PracticeDetailScreen` rather than extracted to its own
component. It has exactly one consumer today, so extracting it would be
the kind of premature abstraction the two-consumer rule exists to avoid.
Extract it to `components/practices/RatingInput.tsx` only once a second
screen needs the same control.

## Consequences

- An AI assistant asked to "add a new shared button variant" knows to look
  in `components/ui/Button.tsx`. Asked to "add a streak indicator to the
  practice card," it knows that's a `components/practices/` concern, since
  it touches `Practice` data.
- `Card`'s reuse by `SummaryScreen` is enforced by the prop boundary, not
  hope — `Card` physically cannot import `Practice`, so reuse is the only
  option, not an accident that breaks the first time someone adds a
  practice-specific prop to it.
- Minor cost: `PracticeCard` is an extra thin wrapper file rather than
  putting practice fields straight onto `Card`. Worth it for the reason
  above.
- Known, separate issue (not a placement problem, a behavior bug): `Button`
  declares a `children?: React.ReactNode` prop in its `ButtonProps`
  interface, but the implementation never destructures or renders it —
  only the `title` prop renders text. Any future call site passing
  children instead of `title` will silently render nothing for that
  content. Tracked in the README's "what's next," not an organization
  issue this ADR addresses.

## Alternatives considered

- **Flat `components/` folder, no tiers.** Rejected: with components
  generated across many separate AI prompts, a flat folder is exactly the
  structure most likely to drift — there's no rule to check a placement
  decision against.
- **Wait for two consumers before promoting `Card`/`Button` to `ui/`, same
  as everything else.** Rejected: the brief specifies these as shared
  primitives from the start. Treating them as an organically-discovered
  abstraction would mean building `PracticeCard` first, then awkwardly
  extracting `Card` out of it mid-build — pure overhead for a known
  requirement.
- **Extract the star-rating control into its own component immediately.**
  Rejected for now: one consumer, and extracting before a second consumer
  exists risks guessing at the wrong prop shape. Revisit if a second
  screen needs it.
