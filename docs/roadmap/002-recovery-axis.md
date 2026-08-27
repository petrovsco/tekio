# Roadmap: Recovery / Readiness axis

**Status:** shipped (2026-07-10, commit d809d1e; habits fold-in added 2026-07-14, commit 96ce1b9) — core axis + habits sub-score done; food fold-in + export/import still deferred (see Follow-ups).

## Shipped

Sleep + Sauna + Cold + Mobility + recovery-tagged Habits roll up into a single
readiness % on a Home `RecoveryCard` (parallel to the nine adaptations, not a
10th). New tables `sauna_sessions` / `cold_sessions`; the pre-scaffolded
`sleep_logs` was opened to the single-user app. Lightweight inline quick-add on
the card; this-week entries are tap-to-edit chips → EditModal (with delete).
Recovery seeded as a Home-only section (`showInMenu:false`, no dedicated tab).
Weekly targets + weights live in `RECOVERY_TARGETS` / `RECOVERY_WEIGHTS` in
`src/constants/app.ts`.

The fifth "Habits" sub-score (2026-07-14) counts weekly bouts of manual
(`autoSource === 'none'`) habit completions that resolve to a recovery
contribution — via `recoveryHabitSets()` in `src/lib/utils.ts`, reusing
`habitMuscleContributions()` so exercise-linked dual-purpose habits (stimulus
on one muscle, recovery on another) are judged by their resolved contributions,
not a single habit-level flag. Auto-sourced habits stay excluded, same
double-counting rationale as `muscleCoverage()`. Weights rebalanced to
sleep 0.45 / mobility 0.15 / sauna 0.15 / cold 0.15 / habits 0.10.

## Follow-ups

- **Food / nutrition** — spun out into its own brief now that a scoring model is
  defined: [007-nutrition-food-recovery-score.md](007-nutrition-food-recovery-score.md)
  (Phase 1 FRS bench shipped 2026-07-14; app integration is the remaining work).
- **Export/import** — DONE (2026-07-14, commit 9f3ac0c): sleep/sauna/cold now
  round-trip through `ExportPane`/`ImportPane`. Nutrition export/import is tracked
  in the nutrition brief above.

**Kickoff:** start a fresh session with this file as the brief.

## Goal

Add a **Recovery/Readiness axis** that sits *parallel* to the nine training
adaptations (Galpin) rather than inside them. Galpin's 9 are training stimulus
qualities; mobility/recovery is deliberately *not* one of them. Today recovery is
only informally represented by the 💆 minutes column on the Muscle Coverage card.
This axis makes recovery a first-class, aggregated view.

## Inputs to aggregate

- **Mobility** (already logged) — the 💆 recovery minutes per muscle.
- **Manual recovery habits** (already folded into muscle coverage — see
  `habitMuscleContributions` in `src/lib/utils.ts`).
- **Sleep** — new data (duration, quality). New table.
- **Nutrition / food** — new data; larger scope (likely its own sub-project:
  logging model, targets). Consider phasing this last.
- **Sauna** — new data (sessions, minutes, temp?). New table.
- **Cold plunge / cold exposure** — new data (sessions, minutes, temp?). New table.

## Suggested shape

- One `recovery_*` table per modality (`sleep_entries`, `sauna_entries`,
  `cold_entries`), each user-scoped like the rest (`USER_ID`, single-user design).
  Keep food separate — it's a bigger domain.
- A `RecoveryCard` on Home (mirrors `MuscleCoverageCard` / the adaptation
  dashboard), showing per-modality weekly totals + a simple readiness roll-up.
- A `usePrefs` section entry so it can be toggled/reordered like other sections
  (remember: new Home cards need an icon — see the home-card-icons convention).
- Reuse the existing weekly-window + `startOfWeek(weekStartDay)` conventions
  (Monday/ISO — user is Europe-based).

## Explicitly out of scope for this axis

- Do **not** add mobility/recovery as a 10th Galpin adaptation. It's a separate
  axis by design (see the adaptations discussion).

## Related code

- `src/lib/utils.ts` — `muscleCoverage()`, `habitMuscleContributions()`
- `src/components/tabs/home/MuscleCoverageCard.tsx` — the current 💆 recovery column
- `src/constants/adaptations.ts` — the nine adaptations (recovery is NOT one)
- `src/store/app.ts` — `bootstrap()` parallel loads; add new loaders here
