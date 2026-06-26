# Architecture Decision Records

This folder captures the non-obvious architectural decisions in this app —
the **why**, not the **what**. Code shows what we built; these records show
why we built it that way and what we rejected.

This matters more than usual for this repo: it is a take-home assignment, and
the brief explicitly asks for reasoning behind state management, testing, and
architecture choices, not just working code. These ADRs are that reasoning,
written down once instead of re-explained in every README section or AI prompt.

## When to write an ADR

- A decision is hard to reverse (navigation library, state layer, data
  fetching approach).
- Two reasonable engineers would disagree about which option to pick.
- The choice constrains future code (folder layout, hook boundaries, how
  cross-tab state syncs).
- An AI assistant generating a new component would otherwise guess, and might
  guess wrong.

## Format

One file per decision, numbered: `NNNN-kebab-case-title.md`.

```markdown
# NNNN. Title

- Status: proposed | accepted | superseded by NNNN
- Date: YYYY-MM-DD

## Context

What's the situation that forces a decision?

## Decision

What did we decide?

## Consequences

Good and bad outcomes. What's now harder, what's now easier.

## Alternatives considered

What we rejected and why.
```

## Index

- [0001 — State management strategy](./0001-state-management.md)
- [0002 — Component organization](./0002-component-organization.md)
- [0003 — Performance & memoization strategy](./0003-performance-memoization.md)
- [0004 — Design token system](./0004-design-token-system.md)

## How AI should use this folder

If you (the AI assistant) are asked to generate a new component, hook, or
screen for this app:

1. Read [`../system-design.md`](../system-design.md) first — it is the
   current living convention.
2. Read the ADR for the area you're touching (state → 0001, component
   placement → 0002, lists/renders → 0003, colors/spacing/type → 0004)
   if the system design doc references it.
3. Match existing patterns in the codebase over inventing new ones. If a
   convention here conflicts with something already in the code, flag the
   conflict instead of silently picking one.
4. Do not introduce a new dependency (state library, animation library,
   form library) that isn't already named in these docs without calling it
   out explicitly in your response.

For the living "how" guide these decisions feed into, see
[../system-design.md](../system-design.md).
