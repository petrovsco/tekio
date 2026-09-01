# Roadmap: Program tab — SIGNAL restyle

**Label:** feature
**Status:** done — all three states, the block-type icons and the emoji `BLOCK_META.icon` field landed 2026-09-01 in v1.9.0.
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

**Inherited from [027](027-weights-tab-signal-restyle.md):** `BLOCK_META`
in [src/constants/program.ts](../../src/constants/program.ts) now carries a
SIGNAL `iconName` beside its old emoji `icon`. ProgramTab is the last consumer
of the emoji field — switch it to `iconName` and delete `icon` here. The shared
icon set also gained `warmup`, `sport` and `recovery`; reuse them rather than
adding near-duplicates.

Re-skin all three states — no active program, active day view, and the
program editor — per the design system: SIGNAL tokens and type, §8 controls,
stroke icons, 3px radii, the deload treatment decided in 026. Status badges
(Paused/Active) lose amber; colour carries meaning (§1), so state reads as
ink weight or an uppercase label.

## Out of scope

- Splitting the 840-line component — that is refactoring, tracked by the
  tooling in [023](../023-mechanical-code-quality-tooling.md)'s output, not by
  a restyle.
- Any change to cycle math, auto-advance, or program data.
- Whether the template picker earns its screen — parked in
  [034](../034-v2-1-candidates-tbc.md).

## Doctrine check (§4)

Existing Core plan surface; presentation only; no new number, no grounding,
R1 untouched.

## Acceptance

- [x] No old-token classes remain in `ProgramTab` and its children.
- [x] All three states browser-verified with screenshots; console clean apart
      from the browser's automatic `/favicon.ico` 404, which predates this work
      ([038](../038-favicon-and-app-icon.md)). The empty state, the editor (day →
      block → exercise → superset pairing → JSON-import error) and the history
      cards were driven on live data without writing; the active day view came
      from resuming the paused Volleyball program, screenshotting, then pausing
      it back — `resumeProgram` and `pauseProgram` are exact inverses on two
      status columns, and both cycles were confirmed `PAUSED` again afterwards.
- [x] Drag-and-drop reordering still works — vacuously: **ProgramTab has no
      dnd-kit**. The survey line was wrong; `@dnd-kit` is imported only by
      `ProfileTab`, so the check belongs to [032](../032-profile-admin-signal-restyle.md).
      Editor reordering is by add/remove, and add, remove, pair and unpair were
      all exercised.
- [x] The deload banner uses the treatment recorded in design-system.md — the
      outlined `DELOAD · WK 6` micro label from `DeloadBadge`.

## What this decided

- **The cycle bar is the stimulus ramp, not a progress meter.** Six week
  segments used to run indigo-to-pale; they now read as §4 does — weeks behind
  you are ink, this week is the ramp's mid step, the weeks ahead are hairline.
  Same polarity as the body map: ink accumulates like work done.
- **A superset pairing pick is a chip, not a star.** The old ⊕ / ★ pair spent
  purple on a two-step selection. It is now a micro `SS` button carrying the
  §8 chip tones — solid ink is the exercise you picked first, outline is every
  other — so the badge that names the result also names the act of making it.
- **A cycle's ending is a stated fact.** `Paused` / `Completed` / `Stopped
  early` lost their amber and their ⏸ 🎉 ⏹ glyphs and became outlined
  `MicroLabel`s; the progress delta on a history row lost its green/red and
  reads in ink with the sign carrying it (§1, and 026's ratings-and-results
  decision).
- **The editor lays out on grids.** A SIGNAL field carries `w-full`
  (`ui/Input`), which fights a flex row, so day rows, block headers and the
  add-exercise row use explicit grid tracks — the shape `SetsGrid` and the
  Mobility form already use. The two selects holding long option text
  (`Unscheduled`, `Conditioning`) took a narrower side padding so the native
  chevron stops clipping the value.
- **Dashed borders left the page.** "Create from scratch" and "Add program"
  were dashed boxes; §6 knows only 1px and 2px borders, and §9 spends the
  single dash in the system on chart reference lines. Both are now solid-line
  rows led by the stroke `plus` icon.
