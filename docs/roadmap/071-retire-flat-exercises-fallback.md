# Roadmap: Retire the flat-`exercises` fallback in the program tree

**Label:** infra
**Status:** planned — found on the way through
[048](done/048-simplification-candidates.md), which expected this to need a backfill
migration. It does not: the live database has **zero** rows to backfill (see
*The migration 048 predicted is not needed*). Filed 2026-09-08.

## Goal

A program day used to be a flat list of exercise names. It is now a list of
**blocks**, each holding its own exercises — that is what the database stores
and what the editor writes. The old flat shape survives in four places as a
fallback, and every one of them is a branch a reader has to hold in their head
while working out what a program day actually is:

| Where | The fallback |
|---|---|
| `lib/db/program.ts`, in `fetchDayDetails` | builds a synthetic block from rows whose `block_id is null` |
| `ProgramTab.tsx`, `flatToBlock` / `normalizeDays` | wraps a day with no `blocks` into one block |
| `weights/TodaysPlan.tsx` | reads `day.exercises` when `day.blocks` is empty |
| `lib/utils.ts`, `defaultProgram()` | *creates* days with `exercises` and no `blocks` |

The `ProgramDay` type says the same thing out loud: `blocks?:` is optional and
`exercises` is documented as "derived … for backward compatibility". So the
type permits a shape the writer can no longer produce, and four readers carry
code for it.

## The migration 048 predicted is not needed

048 recorded these fallbacks as *"look dead but are not"* and said removing
them "needs a backfill migration". Both halves were checked against the live
database on 2026-09-08 and the picture has changed:

- **`program_day_exercises` holds 95 rows and every one has a `block_id`.**
  Zero rows with `block_id is null`, across zero days. There is nothing to
  backfill.
- **No write path can create one.** `saveBlock` always inserts
  `block_id: blockId` from a block it has just created, and the day save above
  it wraps a flat `day.exercises` into a synthetic weight block *before*
  writing. A flat day cannot reach the database any more.

What keeps the fallbacks alive is therefore not the database — it is
`defaultProgram()`, which still returns days with `exercises` and no `blocks`,
plus the import path that feeds the same shape into the editor. Both are
in-memory, both are ours, and both can emit blocks instead.

## Change

1. `defaultProgram()` returns days carrying a single weight block, the same
   shape `saveBlock` would have written.
2. `blocks` becomes required on `ProgramDay`; `exercises` / `supersets` stay as
   the derived convenience fields they are documented to be.
3. Delete the three read fallbacks — `fetchDayDetails`'s `block_id is null`
   branch, `flatToBlock` / the `normalizeDays` conditional, and `TodaysPlan`'s
   `day.exercises` branch. The type change makes the compiler find any site
   this brief missed.

Do it as one unit: the type change is what proves the deletions are safe, so
splitting it leaves the tree in a state where they are not.

## Out of scope

- Any change to what a program *does*. This is shape only — the same days, the
  same exercises, the same order.
- The program import parser's own tolerance of a flat input file. A file
  someone wrote by hand may still list exercises flat; the parser normalises it
  into blocks, which is exactly right and stays.

## Risk

Low, but **visual**: the Program tab's editor and the Weights tab's "today's
plan" both render off this shape. Walk a program day in both, plus a fresh
`defaultProgram()` (create a program without importing one), before pushing.

## Doctrine checklist

1. **Which read does this sharpen?** None directly — Program and Weights render
   the same thing afterwards. It is the P1 performance/legibility face: one
   shape instead of two.
2. **What does it let me stop doing?** Keeping two program-day shapes in step,
   in four files, forever.
3. **Input or destination?** Neither; code.
4. **Honest shape?** Yes, literally: the type stops advertising a shape nothing
   writes.
5. **Physiological number?** No.

## Acceptance

- [ ] `ProgramDay.blocks` is required and `defaultProgram()` emits blocks
- [ ] The three read fallbacks are gone and `npm run build` passes
- [ ] A program created from `defaultProgram()`, an imported program and the
      live enrolled program all render unchanged on the Program tab and in
      today's plan on Weights — checked in the browser, 0 console errors
- [ ] `program_day_exercises` still holds no `block_id is null` row after the
      change (re-run the count; it is one query)
