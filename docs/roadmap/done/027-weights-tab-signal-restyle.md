# Roadmap: Weights tab — SIGNAL restyle

**Label:** feature
**Status:** done — the whole page, its plan banners and the progress chart are SIGNAL; landed 2026-09-01 in v1.6.0.
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
  product question, parked in [034](../034-v2-1-candidates-tbc.md).
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

- [x] No old-token classes (`accent`, `primary`, `muted`, `bg`, `surface`,
      `success/warning/danger`) remain in `src/components/tabs/weights/`.
- [x] Progress chart follows the §Charts spec, including deload dots — verified
      with the accent dot actually rendering. Recharts draws its dots only after
      the line's draw animation finishes, so an early screenshot shows none.
- [x] Both program states browser-verified with screenshots; console clean apart
      from the browser's automatic `/favicon.ico` 404, which predates this work
      ([038](../038-favicon-and-app-icon.md)).
- [x] Logging one exercise end-to-end still works (capture → recent → edit) —
      logged, read back, opened in EditModal, then deleted, and the orphan
      `exercises` row it created was removed too. Nothing was left in the
      shared database.

## What this decided

- **The three-colour volume tiers are gone.** `VolumeRow` ranked its `= kg` /
  `+2.5 kg` / `+5 kg` columns in green, blue and violet — a second palette,
  which §1 does not allow. The column label already names the tier, so the
  table is monochrome and nothing is lost.
- **A PR is stated, not coloured.** The `🏆 PR` marker became a solid-ink micro
  label, the same tone as `SS`: a personal best is a fact, not an urgency, so
  it cannot spend the accent (§1).
- **Nothing on the plan banner commits an entry.** Every control there —
  `Last`, `Deload`, `Log together`, `Use` — only prefills the log form, so they
  are all the reversible outline tone, with `Targets` as the ghost beside them
  (§8). Solid ink stays for `Save exercise` and `Save superset`.
- **The banner stopped recolouring itself.** It was amber on a deload week and
  green when done. Deload is now the outlined `DELOAD · WK 6` label 026
  specified, and done is a check plus a micro label, both on the same white
  card.
- **The chart's last point needed room.** The most recent session sat exactly on
  the plot's clip edge, so a deload dot on it would have been sliced in half.
  The right margin is 12 rather than 6.

## Handed on

- **`BLOCK_META` still carries its emoji.** A SIGNAL `iconName` was added
  alongside `icon` because ProgramTab reads the same constant; the emoji field
  dies when [030](030-program-tab-signal-restyle.md) sweeps that page.
- **Three icons joined the shared set** — `warmup`, `sport`, `recovery` — for
  the six block types. 028–032 should reuse them rather than add near-duplicates.
- **The exercise chip cloud was only re-skinned.** Whether a 30-chip cloud is
  the right capture control at all stays parked in
  [034](../034-v2-1-candidates-tbc.md).
