# Roadmap: Weights tab — SIGNAL restyle

**Label:** feature
**Status:** planned — waits on 026 for the primitives and the chart spec.
**Depends:** 026
**Release:** 2.0.0

First of the page sweeps, on purpose: Weights is the primary capture surface
and the richest mix of form, chips, chart and history — the pattern set here
is what 028 (Cardio) and 029 (Mobility) copy.

## What is old (2026-09-01 survey)

- **LOG EXERCISE card** — old inputs, indigo "Save Exercise" solid,
  "+ Add set" indigo link.
- **Exercise chip cloud** — 30+ white pill chips in the old geometry. Re-skin
  per §8 only; whether the cloud is the right capture control at all is a
  product question, parked in [034](034-v2-1-candidates-tbc.md).
- **PROGRESS card** — Recharts line in indigo with dashed grid, indigo
  1RM/Volume toggle; deload dots need the `signal` treatment from the chart
  spec.
- **RECENT list** — set chips (`S1: 40kg×30`), edit/delete icon buttons,
  "Show N more" indigo link, 1RM badge.
- Session-plan / deload banners that render when a program is active.

## Scope

Re-skin every element above to the design system: SIGNAL tokens, type scale,
3px radii, uppercase tracked section labels, §8 chip tones (outline = act,
solid ink = commit), the §Charts spec from 026. No capture-flow or data
change. Cover both states: with and without an active program (the plan
banner and auto-advance UI belong to this page).

## Out of scope

- Splitting or refactoring component logic — re-skin only.
- Changing which exercises/chips/history the page shows.

## Doctrine check (§4)

Existing Core capture surface; presentation only; no new number, no new
section, no grounding. Sharpened read: capture gets out of the way faster
when controls follow the one chip/type convention (capture is overhead —
doctrine §1).

## Acceptance

- [ ] No old-token classes (`accent`, `primary`, `muted`, `bg`, `surface`,
      `success/warning/danger`) remain in `src/components/tabs/weights/`.
- [ ] Progress chart follows the §Charts spec, including deload dots.
- [ ] Both program states browser-verified with screenshots; console clean.
- [ ] Logging one exercise end-to-end still works (capture → recent → edit).
