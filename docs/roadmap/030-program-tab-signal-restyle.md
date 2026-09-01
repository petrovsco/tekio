# Roadmap: Program tab — SIGNAL restyle

**Label:** feature
**Status:** planned — kickoff-ready now 026 has landed. The biggest page sweep: ProgramTab is ~840 lines with three distinct states.
**Depends:** 026
**Release:** 2.0.0

## What is old (2026-09-01 survey)

- **START A PROGRAM card** — template rows with 🏋️ emoji, dashed
  "Create from scratch" with ✏️ emoji, indigo links.
- **PROGRAM HISTORY** — 📜 emoji heading, cards with indigo "Resume"
  solids, amber "Paused" badges, red delete, "View progress" disclosures.
- **The active-program view** (not in the survey screenshots — no active
  program that day, but it is most of the component): cycle/week header,
  deload banner, day cards, exercise blocks, superset grouping, the dnd-kit
  editor. All on old tokens.

## Scope

Re-skin all three states — no active program, active day view, and the
program editor — per the design system: SIGNAL tokens and type, §8 controls,
stroke icons, 3px radii, the deload treatment decided in 026. Status badges
(Paused/Active) lose amber; colour carries meaning (§1), so state reads as
ink weight or an uppercase label.

## Out of scope

- Splitting the 840-line component — that is refactoring, tracked by the
  tooling in [023](023-mechanical-code-quality-tooling.md)'s output, not by
  a restyle.
- Any change to cycle math, auto-advance, or program data.
- Whether the template picker earns its screen — parked in
  [034](034-v2-1-candidates-tbc.md).

## Doctrine check (§4)

Existing Core plan surface; presentation only; no new number, no grounding,
R1 untouched.

## Acceptance

- [ ] No old-token classes remain in `ProgramTab` and its children.
- [ ] All three states browser-verified with screenshots (resume the paused
      program on staging or verify the day view another way); console clean.
- [ ] Drag-and-drop reordering still works after the re-skin.
- [ ] The deload banner uses the treatment recorded in design-system.md.
