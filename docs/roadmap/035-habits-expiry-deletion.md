# Roadmap: Habits expiry — delete the shelved section, keep the muscle editor

**Label:** feature
**Status:** blocked — waits for the R2 shelf expiry (2026-10-07). If Habits has not been missed by then, this runs; split out of 014 on 2026-09-01 so that brief could close with its folds.

Doctrine R2: a shelved section carries a delete-by date, and Habits' is
**2026-10-07** (shelved 2026-08-26, default-off since 2026-08-27). This brief
is the deletion, plus the one thing the ledger says must survive it.

## 1. First: move `ExerciseMuscleEditor` to Admin

[src/components/tabs/habits/ExerciseMuscleEditor.tsx](../../src/components/tabs/habits/ExerciseMuscleEditor.tsx)
edits exercise→muscle mappings, which power the body map and muscle coverage —
Core infrastructure that happens to sit in the Habits folder. It moves next to
[MuscleGroupEditor.tsx](../../src/components/tabs/admin/MuscleGroupEditor.tsx)
**before** anything is deleted. The `muscle_groups` /
`exercise_muscle_groups` tables stay. If the 032 restyle reaches Admin first,
it restyles the editor wherever it lives.

## 2. Then: delete the section

- `HabitsTab.tsx`, `habits/HabitForm.tsx`, `habits/habitFields.ts`,
  `src/test/habits.test.ts`.
- `habitCompletionSets` ([utils.ts:500](../../src/lib/utils.ts#L500)) and its
  three call sites
  ([adaptations.ts:262](../../src/lib/adaptations.ts#L262),
  [utils.ts:607](../../src/lib/utils.ts#L607),
  [utils.ts:651](../../src/lib/utils.ts#L651)) — the muscle read counts
  logged sets only, per the ledger decision.
- The `'Habits'` entry in `DRAWER_TABS`
  ([App.tsx](../../src/App.tsx)) and its `NAV_META` row in the Drawer.
- The Habits row in `DEFAULTS`
  ([sectionConfig.ts](../../src/lib/db/sectionConfig.ts)) — 014 once kept it
  because `homeOn()` treated a missing section as visible, but `OverviewTab`
  died with 018 unit 6; **verify nothing reads it any more**, then drop it.

## 3. The DB half is release-blocked

The unused habit tables can **not** be dropped while `master` runs 1.x —
production still reads them (the same shared-database rule as
[025](025-release-blocked-schema-drops.md)). When the code deletion ships on
`develop`, queue the table drops in 025's table; they run once `master` runs
2.0.0 or later.

## Doctrine check (§4)

Executes an existing ledger verdict (R2/R3) — no new surface, no new number,
no grounding. What it lets us stop doing: paying bundle weight, test runtime
and reading load for a section ruled out on 2026-08-26.

## Acceptance

- [ ] `ExerciseMuscleEditor` lives under Admin and the body map still renders.
- [ ] The files, helper, call sites and config rows above are gone; build and
      tests green; the drawer shows no Habits entry.
- [ ] The habit table drops are queued in 025 (not run).
- [ ] The doctrine §5 ledger row flips from "Shelf — delete by 2026-10-07" to
      recording the deletion date.
