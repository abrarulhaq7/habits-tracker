# 0004. Design Token System

- Status: accepted
- Date: 2026-06-26

## Context

The brief explicitly requires "design tokens (colors, spacing, type)
defined in one place," and separately says "pixel-perfect design — clean
and readable beats Figma-precise." Together: the visual system should be
systematic and centralized, but doesn't need a polished design file behind
it — it needs to *look* like it came from one, by using a consistent, named
scale instead of scattered magic numbers.

The intended visual direction is a minimalistic dark theme. React Native
has no CSS `:root` and no equivalent of a Tailwind `@theme` block, so the
"canonical source + mirror" pattern some web projects use to keep CSS and
JS color values in sync doesn't apply here — there's only one styling
mechanism (JS objects consumed by `StyleSheet.create`), so there's nothing
to keep in sync in the first place.

## Decision

**One file, one export.** `lib/tokens.ts` exports a single `tokens` object
with four top-level categories, and it is the only source of these values
in the app:

- **`colors`** — `background`, `surface`, `border`, `text`, `textMuted`,
  `accent`, `accentPressed`, `success`, `error`, plus a nested `category`
  object with `{ bg, text }` pairs for each of the four practice categories
  (`movement`, `breath`, `reflection`, `rest`). Components reference
  `tokens.colors.*` — no raw hex values anywhere else in the codebase.
- **`spacing`** — a five-step scale, `xs` through `xl`. Components
  reference `tokens.spacing.*` in `StyleSheet.create` calls, not literal
  pixel numbers.
- **`radius`** — three named values: `card`, `control`, `badge`. Cards,
  buttons, and badges each pull from the relevant token rather than
  rounding by eye per component.
- **`font`** — a `size` scale (`caption`, `body`, `title`, `display`) and a
  `weight` scale (`regular`, `medium`, `bold`), rather than per-component
  font sizes chosen ad hoc.

**Enforcement is procedural, not tooling-based.** There's no custom ESLint
rule for this at this app's scope — that overhead isn't justified for a
three-screen take-home. Instead: any new component reviews `lib/tokens.ts`
first and extends it (adding a token) rather than inlining a one-off value.
This is written down here specifically so an AI assistant generating a new
component follows the same rule a human contributor would, rather than
picking whatever value looks right in isolation for that one component.

## Consequences

- One file answers "what's the accent color" or "what spacing do we use
  here" for the whole app — relevant given the app was built incrementally
  across many separate prompts, where there's no continuity of "the last
  value I used" the way there would be for a human writing every file in
  one sitting.
- No CSS/JS drift problem to guard against, since React Native styling has
  only the one JS-side mechanism — simpler than a web project's
  canonical-source-plus-mirror pattern.
- Cost: if a component genuinely needs a one-off value with no reuse
  potential, there's no formal escape hatch documented. Acceptable at this
  scope — flag it inline as a comment rather than adding a token for a
  single use.

## Alternatives considered

- **Per-component inline styles with ad hoc values.** Rejected: directly
  contradicts the brief's explicit requirement for centralized tokens, and
  would visibly drift across components built in separate sessions.
- **A theming library (Tamagui, Restyle, NativeWind).** Rejected for this
  scope: each adds a dependency and setup cost disproportionate to a
  three-screen app, and the brief's bar ("clean and readable," not
  "Figma-precise") doesn't call for a full theming engine.
- **Split tokens into multiple files (`colors.ts`, `spacing.ts`,
  `typography.ts`).** Rejected: at this app's size, one file is easier to
  scan in full and avoids import sprawl across components that need more
  than one token category.
