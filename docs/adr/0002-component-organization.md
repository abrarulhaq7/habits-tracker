# 0002. Component Organization

- Status: accepted
- Date: 2026-06-26

## Context

The brief requires two specific shared primitives — a `Card` (used by both
List and Summary screens) and a `Button` — plus several feature-specific
pieces (a rating input, a category tag, skeleton placeholders). Without a
stated rule, an AI assistant generating components on request will guess at
folder placement inconsistently across sessions: sometimes putting a
feature-coupled component in a flat `components/` root, sometimes promoting
something to a shared folder before it has a second consumer.

This app is small (three screens), so the risk isn't the same kind of rot a
large codebase faces. The risk here is narrower and more specific to working
with an AI assistant across many short prompts: drift, where component 12
doesn't follow the same placement logic as component 3 because the rule was
never written down.

## Decision

Three tiers, matching the shape of `system-design.md` section 2:

| Folder                 | What lives there                                      | Test                                          |
| ------------------------ | -------------------------------------------------------- | ----------------------------------------------- |
| `components/ui/`        | Pure presentational primitives. No domain knowledge.    | Could ship to a different app unchanged.       |
| `components/<feature>/` | Feature-coupled. Reads domain types from `lib/types`.   | Removing the feature would delete the folder. |
| `screens/`               | Page-level composition. Owns layout and hook wiring.    | One-off; not reused across routes.             |

**Exception to the two-consumer rule:** `Card` and `Button` go directly into
`components/ui/` on first write, not after a second consumer appears. The
brief names them as required shared primitives up front, so the "wait for a
second consumer" rule (which exists to prevent guessing at the wrong
abstraction) doesn't apply — the abstraction is already specified, not
guessed at.

Everything else — `PracticeCard` (the domain wrapper around `Card`),
`RatingInput`, `CategoryTag`, `CardSkeleton` — is feature-coupled and lives in
`components/practices/` until/unless a second feature needs it.

**Boundary rule for `ui/`:** a `ui/` component's props are primitives
(`title: string`, `onPress: () => void`, `variant: "primary" | "secondary"`)
or React nodes, never a domain type like `Practice`. `PracticeCard` is the
adapter: it imports `Practice` from `lib/types`, and maps its fields onto
`Card`'s primitive props. This keeps `Card` reusable by Summary's stat
display, which has nothing to do with practices, without `Card` needing to
know what a practice is.

## Consequences

- An AI assistant asked to "add a new shared button variant" knows to look in
  `components/ui/Button.tsx`. Asked to "add a streak indicator to the
  practice card," it knows that's a `components/practices/` concern, not a
  `ui/` one, because it touches `Practice` data.
- `Card`'s reuse by the Summary screen is enforced by the prop boundary, not
  by hope — `Card` physically cannot import `Practice`, so reuse is the only
  option, not an accident that breaks the first time someone adds a
  practice-specific prop to it.
- Minor cost: `PracticeCard` is an extra thin wrapper file rather than just
  putting practice fields straight onto `Card`. Worth it for the reason
  above.

## Alternatives considered

- **Flat `components/` folder, no tiers.** Rejected: with an AI assistant
  generating most components across many separate prompts, a flat folder is
  exactly the structure most likely to drift — there's no rule to check a
  placement decision against.
- **Wait for two consumers before promoting `Card`/`Button` to `ui/`, same as
  everything else.** Rejected: the brief specifies these as shared primitives
  from the start. Treating them like an organically-discovered abstraction
  would mean building `PracticeCard` first, then awkwardly extracting `Card`
  out of it mid-assignment — pure overhead for a known requirement.
- **Let `Card` accept a `Practice` directly and add an `as="summary"` mode for
  the Summary screen's stat display.** Rejected: this is exactly the kind of
  domain leakage into `ui/` the tier system exists to prevent, and it
  would make `Card` impossible to use for anything that isn't a practice.
