# Roadmap: Habits expiry — delete the shelved section, keep the muscle editor

**Label:** feature
**Status:** done — ran 2026-09-05, a month before the R2 date, on Peter's call: Habits is against the doctrine and the app's flow, so the wait was buying nothing. Code, tests, assistant tools and the deployed edge function are clean; the table drops are queued in 025.

## Progress log

- 2026-09-01 — split out of 014 so that brief could close with its folds;
  blocked on the R2 expiry (2026-10-07).
- 2026-09-05 — Peter called it early ("I was convinced habits is against the
  doctrine and the app general flow"). Shipped in v1.18.0: editor moved to
  Admin, section deleted, assistant habit tools removed on the client and in
  the `assistant-chat` edge function (redeployed as version 2), doctrine
  ledger row flipped, drops queued in 025.

Doctrine R2: a shelved section carries a delete-by date, and Habits' was
**2026-10-07** (shelved 2026-08-26, default-off since 2026-08-27). This brief
is the deletion, plus the one thing the ledger says must survive it.

## 1. First: move `ExerciseMuscleEditor` to Admin

[src/components/tabs/admin/ExerciseMuscleEditor.tsx](../../../src/components/tabs/admin/ExerciseMuscleEditor.tsx)
edits exercise→muscle mappings, which power the body map and muscle coverage —
Core infrastructure that happened to sit in the Habits folder. It moved next to
[MuscleGroupEditor.tsx](../../../src/components/tabs/admin/MuscleGroupEditor.tsx)
**before** anything was deleted, taking the one helper it used from
`habitFields.ts` (`muscleOptions`, the "Parent › Child" select rows) with it.
The `muscle_groups` / `exercise_muscle_groups` tables stay.

## 2. Then: delete the section

What the brief listed, and what the sweep found on top of it:

- `HabitsTab.tsx`, `habits/HabitForm.tsx`, `habits/habitFields.ts`,
  `src/test/habits.test.ts`, and `src/lib/db/habits.ts` — gone; the
  `habits/` folder is empty and removed.
- `habitCompletionSets` and its three call sites — already gone before this
  brief ran (039/045 rebuilt the muscle read on logged sets only).
- The `'Habits'` entry in `DRAWER_TABS` ([App.tsx](../../../src/App.tsx)),
  its `NAV_META` row in the Drawer, its `SECTION_META` row in Profile, and the
  `habits` icon in [Icon.tsx](../../../src/components/ui/Icon.tsx).
- The Habits row in `DEFAULTS`
  ([sectionConfig.ts](../../../src/lib/db/sectionConfig.ts)). Nothing read it:
  the Drawer and Profile both filter config rows through their own meta tables,
  so the live `Habits` row in `user_section_config` is now ignored exactly like
  the folded sections' rows.
- The store: `habits` / `habitCompletions` state, the four habit actions, the
  two bootstrap loads. The types: `Habit`, `HabitCompletion`, `HabitCadence`,
  `HabitAutoSource`, `HabitProgress`, the `habit` `EditModalTarget` variant and
  its `EditModal` branch. `utils.ts`: `habitPeriodStart`, `habitProgress`,
  `HabitProgressContext`.
- **The assistant** — not in the original list. `create_habit` /
  `update_habit` / `delete_habit` came out of the client executor, the context
  snapshot, the panel's help text and suggestion, and the `assistant-chat`
  edge function's system prompt and tool declarations. The function was
  redeployed (version 2, `verify_jwt` still false, as before). `master`'s
  assistant loses the habit tools too — it shares the function — which is
  fine: the section has been hidden there since 2026-08-27.

## 3. The DB half is release-blocked

The `habits` and `habit_completions` tables can **not** be dropped while
`master` runs 1.x — production still loads both on bootstrap (the same
shared-database rule as
[025](025-release-blocked-schema-drops.md)). The drops are queued in 025's
table with the order and the foreign keys that matter; they run once `master`
runs 2.0.0 or later. Until then a leftover habit row can still block deleting
the muscle group it points at — the Admin editor's toast now says "something
still references it" rather than naming habits.

## Doctrine check (§4)

Executes an existing ledger verdict (R2/R3) — no new surface, no new number,
no grounding. What it lets us stop doing: paying bundle weight, test runtime
and reading load for a section ruled out on 2026-08-26.

## Verification

Build and the 145 Vitest tests green. Headless chromium at phone width: Home
renders the body map and readiness; the drawer's Log group lists Weights,
Cardio, Mobility only; Profile's section list has no Habits row; Admin shows the
Exercise → muscle mapping card, which expands to 110 exercises and offers 16
"Parent › Child" muscle options. The only console error is the known
`/favicon.ico` 404 (roadmap 038).

## Acceptance

- [x] `ExerciseMuscleEditor` lives under Admin and the body map still renders.
- [x] The files, helper, call sites and config rows above are gone; build and
      tests green; the drawer shows no Habits entry.
- [x] The habit table drops are queued in 025 (not run).
- [x] The doctrine §5 ledger row flips from "Shelf — delete by 2026-10-07" to
      recording the deletion date.
