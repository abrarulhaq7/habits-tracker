# 0004. Design Token System

- Status: accepted
- Date: 2026-06-26

## Context

The brief explicitly requires "design tokens (colors, spacing, type) defined
in one place," and separately says "pixel-perfect design — clean and
readable beats Figma-precise." Together, these mean: the visual system
should be systematic and centralized, but doesn't need a polished design
file behind it — it needs to *look* like it came from one, by virtue of using
a consistent, named scale instead of scattered magic numbers.

The intended look (confirmed separately) is a minimalistic dark theme. In
React Native there is no CSS `:root` and no Tailwind `@theme` block, so the
"canonical source + JS mirror" pattern used in CSS-based projects collapses
to a single JS/TS module, since that is also the only mechanism React Native
styling has.

## Decision

**One file, one export.** `lib/tokens.ts` exports a single `tokens` object,
the only source of color, spacing, radius, and type values in the app. There
is no separate CSS layer to keep in sync, since React Native has none — this
removes the entire "drift between two sources" problem that a web project's
ADR on this topic has to solve for.

- **Colors:** a small dark-theme palette — background, surface (slightly
  elevated card background), primary text, secondary/muted text, one accent
  color, and per-category colors for the four practice categories (movement,
  breath, reflection, rest). No raw hex anywhere else in the codebase;
  components reference `tokens.color.*`.
- **Spacing:** a single 4px-based scale (`xs/sm/md/lg/xl`, e.g.
  4/8/16/24/32). Components reference `tokens.spacing.*` in
  `StyleSheet.create` calls, not literal numbers.
- **Radius:** two named values (`tokens.radius.card`, `tokens.radius.control`)
  rather than per-component ad hoc rounding, so cards, buttons, and the
  rating input all feel like one visual language.
- **Type:** a small named scale (`tokens.font.size.{caption,body,title,
  display}`) paired with consistent line-height multipliers, rather than
  per-component font sizes chosen by eye.

**Enforcement:** there's no lint rule for this at this app's scope (a custom
ESLint rule is overhead this assignment doesn't justify). Instead, the rule is
procedural: any new component reviews `lib/tokens.ts` first and extends it
(adding a token) rather than inlining a one-off value. This is written down
here specifically so an AI assistant generating a new component follows the
same rule a human contributor would, rather than defaulting to whatever
value looks right in isolation.

## Consequences

- One file answers "what's the accent color" or "what spacing do we use
  here" for the whole app — relevant given most of this app's components
  will be generated incrementally, across separate prompts, rather than
  written in one sitting where a human would just remember the last value
  they used.
- No CSS/JS drift problem to test for, since React Native styling has only
  the one JS-side mechanism to begin with — simpler than the web-project
  pattern this ADR's structure is modeled on.
- Cost: if a component genuinely needs a one-off value with no reuse
  potential (e.g. a single decorative illustration's stroke width), there's
  no formal escape hatch documented. Acceptable at this scope — flag it
  inline as a comment rather than adding a token for a single use.

## Alternatives considered

- **Per-component inline styles with ad hoc values.** Rejected: directly
  contradicts the brief's explicit requirement for centralized tokens, and
  would visibly drift across components generated in separate AI prompts.
- **A theming library (e.g. Tamagui, Restyle, NativeWind).** Rejected for
  this scope: each adds a dependency and a learning/setup cost disproportionate
  to a three-screen app, and the brief's bar ("clean and readable," not
  "Figma-precise") doesn't call for a full theming engine.
- **Split tokens into multiple files (colors.ts, spacing.ts, typography.ts).**
  Rejected: at this app's size, one file is easier to scan in full and avoids
  import sprawl across components that need more than one token category.
