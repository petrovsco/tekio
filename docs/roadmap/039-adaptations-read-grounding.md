# Roadmap: Adaptations read — ground what the page shows

**Label:** feature
**Status:** in progress — picked up 2026-09-02. The code read is done and the
execution plan is written into §6 below; no code has changed yet. Resume with
`/roadmap 39` and start at §6 step 1. Gates [031](031-adaptations-drill-down-read.md).
**Depends:** 019
**Release:** 2.0.0
**Covers inventory rows:** 3.3, 3.4, 3.6, 3.7, 3.8, 3.9, 3.10, 7.1, 7.4, 7.5 in
[grounding-inventory.md](../grounding-inventory.md), plus one number that has no
row at all (`CYCLE_SET_TARGET`).

---

## The plain summary

The Adaptations tab is a **read**, not a capture screen — the drill-down behind
Home's five-second answer. A read is only worth building if its numbers mean
something. Right now the page shows three different answers to the same
question and about thirty-five prescription numbers that nobody has checked.

**This brief settles the meanings. [031](031-adaptations-drill-down-read.md)
then draws them.** In that order, for the same reason 031 already waited for
019: repainting a number that is about to change its denominator is throwaway
work.

---

## 1. The page answers "how much has this muscle had" three different ways

All three ship today. Two of them are on this tab.

| Where | Function | Window | Denominator | Split by adaptation? |
|---|---|---|---|---|
| Home's body map | `muscleStates` ([fusedRead.ts:57](../../src/lib/fusedRead.ts#L57)) | rolling **42 days** (`CYCLE_WINDOW_DAYS`) | `CYCLE_SET_TARGET` = **60** weighted sets | no — one total |
| Adaptations tab, per-adaptation body map | `adaptationCoverage` ([lib/adaptations.ts](../../src/lib/adaptations.ts)) | **week-to-date** | that adaptation's `weeklyMuscleTarget` (6 / 6 / 10 / 6) | yes |
| Adaptations tab, MUSCLE COVERAGE card | `muscleCoverage` ([utils.ts](../../src/lib/utils.ts)) | **week-to-date** | none — bars are relative to the busiest muscle | no |

Three windows, three denominators, one silhouette. A muscle can read dark on
Home and pale one tap later, and both are "correct". That is the confusion the
page has, and no amount of restyling removes it.

**A finding worth keeping:** `CYCLE_SET_TARGET = 60` is documented in its own
comment as *"10 fractional sets/muscle/week × 6-wk cycle"* — that is the
**hypertrophy** volume band (Schoenfeld 2017, Pelland 2026, Baz-Valle 2022,
grounded in [010 §Grounding](done/010-home-fused-reads.md#grounding)). So Home's
map is not a neutral total-stimulus read: it is denominated in hypertrophy and
labelled as though it were adaptation-agnostic. That may still be the right
default — hypertrophy is the volume-hungriest of the four — but it is a claim,
it is currently unstated, and it decides whether the per-adaptation maps in 031
are the *same* picture at higher resolution or a *different* picture wearing the
same ink ramp.

### The decision this brief owes 031

Pick one and write down why:

- **(a) One canonical accounting.** One function, one window, one weighted-set
  unit; the per-adaptation view is that same number filtered by adaptation, and
  Home's total is the sum. Cheapest to explain, and the drill-down genuinely
  drills *down* rather than sideways.
- **(b) Two honest reads, explicitly labelled.** Home stays cycle-shaped
  ("have I covered this muscle over the cycle"), the tab stays week-shaped
  ("am I hitting this adaptation's weekly dose"), and each says its window on
  screen. Defensible — they are different questions — but it needs the labels
  to carry the whole distinction.

**Recommendation: (a), with the window as the one thing that stays plural.**
Same function, same weighted-set unit, same target semantics; the caller picks
the window, and the window is named on screen. That kills the third dialect
outright and leaves the two survivors provably consistent.

---

## 2. Nothing on this page has a live grounding carrier

The numbers the page renders are indexed, but their assigned briefs are gone or
parked:

| Inventory rows | What they are | Assigned to | Problem |
|---|---|---|---|
| 7.1, 7.4, 7.5 | `LEVEL_WEIGHT` (a level-2 muscle gets half a set), the 5 mobility-min target, and the on-track/needs-work/untouched cut | `home-fused-reads` **(due)** | 010 shipped and is in `done/`. These rows point at a brief that will never run again |
| 3.3, 3.4, 3.6, 3.10 | Power / strength / muscular-endurance `rx` prose and `ADAPTATION_PRINCIPLE` | `cross-adaptation-rep-ranges` | [001](001-cross-adaptation-rep-ranges.md) is `backlog` and is about a *different* question — whether classification should be fuzzy |
| 3.7, 3.8, 3.9 | Anaerobic / VO₂max / endurance `rx` prose | `hr-zone-intensity-classification` | [005](005-hr-zone-intensity-classification.md) is about *classifier thresholds*, not the prescriptions the page prints |
| — | `CYCLE_SET_TARGET` = 60 | — | **Has no inventory row at all**, despite being the denominator of the whole Home map |

Row 7.1 is the sharpest: *"Every muscle-coverage number and the whole BodyMap is
denominated in this."* The redesign makes the body map the centre of the page.
Making an ungrounded denominator more prominent is the wrong direction.

Row 3.4 and row 3.8 are the loudest: the app ships **"Galpin's 3–5 rule"** and
**"the classic 4×4 min at 90–95% HRmax"** as settled fact, unattributed. 031
keeps that text — behind an icon, but still on the page.

---

## 3. Scope

**In — decide and record:**

1. **The accounting decision in §1**, written into this brief with its reason,
   and implemented: one weighted-set function, or two with on-screen labels.
   Delete whichever of the three dialects loses.
2. **`/ground` runs** for the rows this brief covers, landing as a `## Grounding`
   section here:
   - `LEVEL_WEIGHT` `{1: 1, 2: 0.5, 3: 0.25}` (row 7.1) — the fractional-set
     convention. This is the single highest-leverage number on the page.
   - The on-track / needs-work / untouched cut (row 7.5) and the ramp steps it
     feeds.
   - `CYCLE_SET_TARGET` = 60 as an *adaptation-agnostic* denominator — the value
     is grounded; what is ungrounded is using a hypertrophy band as the total.
   - The seven `rx` blocks (rows 3.3, 3.4, 3.6–3.9) and `ADAPTATION_PRINCIPLE`
     (3.10), with **attribution for the two named protocols** in 3.4 and 3.8 or
     their removal.
   - The 5 mobility-min-per-muscle target (row 7.4) if the redesign keeps a
     recovery axis on this page; drop the row from scope if it does not.
3. **Repoint the inventory** in the same change — rows 3.3–3.10 and 7.1/7.4/7.5
   name this brief as their carrier, verdicts updated, and a new row created for
   `CYCLE_SET_TARGET`. No TODOs left in the index (the rule
   [019](done/019-adaptation-model-simplification.md) followed).

**Out:**

- **Target *values*** — 1.2–1.9 are already grounded or `convention` in
  [011](done/011-adaptation-weekly-targets.md); their *shapes* belong to
  [012](012-adaptation-target-shapes.md). Do not re-run the scout on them.
- **Rep-range boundaries and fuzzy classification** — [001](001-cross-adaptation-rep-ranges.md).
- **Cardio classifier thresholds** (rows 6.1–6.5, the ≥25/≥8 min heuristic, the
  TE cutoff) — [005](005-hr-zone-intensity-classification.md).
- **Any pixel of the redesign** — [031](031-adaptations-drill-down-read.md).

The split to hold in mind: **039 grounds what the page *displays*; 001 and 005
ground how the app *classifies*.**

---

## 4. Doctrine §4 checklist

1. **Which read does this sharpen?** Adaptations and Home — both existing Core
   reads. No new surface, R1 untouched.
2. **What does it let me stop doing?** Stop maintaining three muscle-stimulus
   dialects; stop shipping two named protocols as anonymous fact; stop pointing
   ten inventory rows at briefs that cannot carry them.
3. **Input or destination?** Input. It changes what existing reads mean and adds
   no surface.
4. **Honest shape?** The question this brief exists to answer — §1 is exactly a
   "does this picture fit its data" argument (P2).
5. **Does it write a number claiming physiological meaning?** Yes, several. This
   brief *is* the grounding gate for them, so the `## Grounding` section is
   mandatory and must exist before 031 starts.

---

## 5. Acceptance

- [ ] §1's accounting decision is made, written here with its reason, and the
      losing dialect(s) deleted from the code.
- [ ] A `## Grounding` section exists here carrying verdicts for rows 7.1, 7.5,
      `CYCLE_SET_TARGET`-as-total, and the seven `rx` blocks (3.3, 3.4, 3.6–3.10).
- [ ] Rows 3.4 and 3.8 either carry attribution for the named protocol they ship,
      or no longer ship it.
- [ ] Every covered inventory row names this brief as its carrier and shows a
      current verdict; `CYCLE_SET_TARGET` has a row.
- [ ] Citations verified through NCBI eutils before being pasted, not from a
      search-result summary.
- [ ] The app still builds and every existing adaptation test passes; any number
      that moved is reflected in its test.

---

## 6. Kickoff findings — 2026-09-02 (where it left off)

The first session read every file in §1–§2 and stopped before touching code
(context wrap-up). Everything below is settled enough to execute without
re-reading; the one open check is marked.

### 6.1 The accounting decision — (a), made concrete

**(a) is taken.** One accounting: *stimulus = level-weighted sets in a window;
adequacy = a weekly rate × the weeks in that window.* The window is the only
thing that stays plural, and it is named on screen.

| Today | Under (a) |
|---|---|
| `muscleStates` ([fusedRead.ts:57](../../src/lib/fusedRead.ts#L57)) — its own loop, 42 d, all sets, ÷ `CYCLE_SET_TARGET` | Built on the shared function; window = rolling `CYCLE_WINDOW_DAYS`; `sets` = the sum of the four muscle-linked qualities |
| `adaptationCoverage` ([lib/adaptations.ts:159](../../src/lib/adaptations.ts#L159)) — its own loop, week-to-date, per adaptation, + a habit fold | Built on the shared function; window = calendar week-to-date; per adaptation; **habit fold dropped** (doctrine §5 already ruled: the muscle read counts logged sets only — the `habits` / `habitCompletions` / `exerciseNames` args go, and so do the two habit tests in `adaptations.test.ts`) |
| `muscleCoverage` ([utils.ts:558](../../src/lib/utils.ts#L558)) — week-to-date, no target, + recovery minutes, + habits | **Deleted**, with `MuscleCoverageRow`, `MuscleCoverageCard.tsx` (its only consumer), its `<MuscleCoverageCard />` line in `AdaptationsTab.tsx`, and the `muscleCoverage` block in `habits.test.ts`. `habitMuscleContributions` and `recoveryHabitSets` in utils.ts are then used only by tests — delete them too (035 was going to) |

**The shared function** — new, in `src/lib/adaptations.ts` (fusedRead already
imports from there):

```ts
/** Level-weighted sets per muscle group inside [from, to], split by the
 *  muscle-linked quality each set classified into. `total` is the sum of the
 *  four — Home's number and the drill-down's numbers are one accounting. */
export function muscleStimulus(
  weights, exerciseMuscles, window: { from: string; to: string }, overrides?,
): { total: Record<string, number>; byQuality: Record<MuscleQuality, Record<string, number>> }
```

Classification per set is `classifyWeightSet(reps, resolveExerciseAdaptation(...))`
— the same override-aware rule `muscleQualityMix` already uses, so
`muscleQualityMix` becomes a thin caller as well. Add one test asserting the
invariant: `total[m] === Σ byQuality[q][m]` for every muscle.

**Open check (5 min, Supabase):** whether any exercise override names a cardio
quality (`exercises` rows read by `adaptationMap` in `store/app.ts`). If none,
"total = Σ four qualities" is exact today; if some, decide whether those sets
count in `total` and say so in the function comment.

**The denominator.** `CYCLE_SET_TARGET` stops being a literal: it becomes
`WEEKLY_SET_FLOOR × CYCLE` where `WEEKLY_SET_FLOOR = 10` carries the
adaptation-agnostic claim the scout below rules on. `MuscleSheet.tsx:17`
already derives `WEEKLY_TARGET = CYCLE_SET_TARGET / CYCLE` — invert that.
The DB shadow (inventory 1.11) means the tab reads `adaptation_targets` while
Home reads the constant; they are byte-identical today. Note it, do not fix it.

**The ramp.** Home colours by continuous `fillFraction`
([GapMap.tsx:16-21](../../src/components/tabs/home/GapMap.tsx#L16), cutoff 0.70);
the tab colours by the three-step `status` ([lib/adaptations.ts:146](../../src/lib/adaptations.ts#L146)).
Add `fillFraction` to `MuscleStatusRow` so 031 can draw one ramp; whether
`status` survives is the row-7.5 scout's call.

**On-screen window labels** already exist on Home (`"N sets in 42 days"`,
`"42-day cycle · target 60"`) and on the tab (`"This Week"`). The
`<strong>PLACEHOLDER</strong>` after `target {CYCLE_SET_TARGET}` in
[MuscleSheet.tsx:161](../../src/components/tabs/home/MuscleSheet.tsx#L161) is the
mark 018 left for exactly this brief's verdict — replace it when the block lands.

### 6.2 Row 7.4 is retired, not grounded

`WEEKLY_STRETCH_TARGET_MIN = 5` sat at `utils.ts:338` when the inventory was
built (commit `ecfc547`). It no longer exists anywhere in `src/` — it went with
`RecoveryCard` (014 step 3). Strike row 7.4 as **retired**; drop it from this
brief's scope. 031 §3c cuts the recovery axis from the page anyway.

### 6.3 The scout runs — ten, one decision each, dispatch in parallel

All `subagent_type: science-scout`, each given the claim, the constant, the
current value, this brief's path, and the date. Verify every citation through
NCBI eutils before pasting (acceptance box 5).

| # | Row | Claim to hand the scout | Constant · value |
|---|---|---|---|
| S1 | 7.1 | A set on an exercise where the muscle is a level-2 (secondary) mover counts as half a set of stimulus for that muscle, level-3 a quarter — the fractional-set convention every map is denominated in | `LEVEL_WEIGHT` [utils.ts:490](../../src/lib/utils.ts#L490) · `{1: 1, 2: 0.5, 3: 0.25}`. Pelland 2026's best-fit model counts indirect sets at 0.5 (already cited in [010 §Grounding](done/010-home-fused-reads.md#grounding)) — the scout's job is the 0.25 tier and whether 0.5 is "indirect" in the same sense |
| S2 | 7.5 | Stimulus below the weekly floor is graded (each set buys some adaptation), so a continuous fill is honest and a three-step on-track / needs-work / untouched cut is a coarsening; is anything below the floor worth *zero*? | `statusFor` [lib/adaptations.ts:146](../../src/lib/adaptations.ts#L146) + `GAP_CUTOFF = 0.70` [GapMap.tsx:16](../../src/components/tabs/home/GapMap.tsx#L16) |
| S3 | new row | 10 level-weighted sets/muscle/week **counted across every rep range** (strength, hypertrophy, endurance and power sets all pooled) is a defensible adequacy floor for *total* muscle stimulus — i.e. the hypertrophy floor is the right adaptation-agnostic denominator because it is the most volume-hungry of the four | `WEEKLY_SET_FLOOR` (new) · `10`, and `CYCLE_SET_TARGET` [app.ts:90](../../src/constants/app.ts#L90) · `60`. The *value* is grounded (010 D10); the *pooling* is the claim |
| S4 | 3.3 | Power prescription: 30–70% 1RM, 1–5 reps, 3–5 sets, 2–5 min rest, never to fatigue | `ADAPTATIONS[power].rx` [adaptations.ts:78](../../src/constants/adaptations.ts#L78) |
| S5 | 3.4 | Strength prescription: 85–100% 1RM, 3–5 reps, 3–5 sets, 2–5 min rest, 1–2 RIR; and the cue "Galpin's 3–5 rule" (3–5 reps × sets × min rest × sessions/wk) — attribute or remove | `ADAPTATIONS[strength].rx` [adaptations.ts:109](../../src/constants/adaptations.ts#L109) |
| S6 | 3.6 | Muscular-endurance prescription: <50% 1RM, 15–40+ reps, 2–4 sets, <60 s rest, to/near failure | `ADAPTATIONS[muscular_endurance].rx` [adaptations.ts:163](../../src/constants/adaptations.ts#L163) |
| S7 | 3.7 | Anaerobic-capacity prescription: all-out 20 s–2 min efforts, 3–8 rounds, 1:2–1:4 work:rest | `ADAPTATIONS[anaerobic_capacity].rx` [adaptations.ts:189](../../src/constants/adaptations.ts#L189) |
| S8 | 3.8 | VO₂max prescription: 90–100% HRmax, 3–8 min efforts, 4–6 sets, ≈1:1 rest; and the cue "classic 4×4 min at 90–95% HRmax, 3 min easy" — expected source Helgerud 2007 (verify) — attribute or remove | `ADAPTATIONS[vo2max].rx` [adaptations.ts:220](../../src/constants/adaptations.ts#L220) |
| S9 | 3.9 | Endurance prescription: Zone 2 / conversational, 30 min–hours continuous; the cue's mechanistic claims "nasal-breathing pace" and "builds mitochondria & fat oxidation" | `ADAPTATIONS[endurance].rx` [adaptations.ts:251](../../src/constants/adaptations.ts#L251) |
| S10 | 3.10 | Power and strength are quality-driven (never to fatigue, full rest); hypertrophy through endurance are volume/fatigue-driven (accumulate work, push effort) — expected literature: velocity-loss and proximity-to-failure meta-analyses | `ADAPTATION_PRINCIPLE` [adaptations.ts:268](../../src/constants/adaptations.ts#L268) |

Hypertrophy's `rx` (row 3.5) is **out**: grounded in 011 and locked to the
target (D3). Do not re-run it.

**Attribution already on the page:** `AdaptationGuide.tsx` ends with *"Based
on the Huberman Lab × Dr. Andy Galpin guest series on physical adaptations."*
That is a practitioner attribution for all seven blocks at once, in a collapsed
card. After S4–S10 land, that line either becomes the honest provenance
(literature where found, `convention` where not) or goes; the per-card InfoTip
carries no attribution at all today.

### 6.4 Landing the blocks — the four `/ground` destinations

1. **This brief:** paste all ten blocks verbatim under a `## Grounding` section
   placed before `## Acceptance` (i.e. between §4 and §5), one `###` per run.
2. **The constants:** source comments on `LEVEL_WEIGHT`, `WEEKLY_SET_FLOOR`,
   `CYCLE_SET_TARGET`, each `rx` block and `ADAPTATION_PRINCIPLE`, every one
   pointing at `docs/roadmap/039-adaptations-read-grounding.md#grounding`
   (repoint to `done/` when the brief moves — `grep -rn 039- src/`).
3. **The inventory** ([grounding-inventory.md](../grounding-inventory.md)):
   rows 3.3, 3.4, 3.6–3.10, 7.1, 7.5 → carrier `039`, verdict updated, and the
   `Where` line numbers refreshed (7.1 says `utils.ts:479`, now 490; 7.5 says
   `lib/adaptations.ts:135-139`, now 146-150 — both move again after §6.1).
   Row 7.4 struck as retired (§6.2). New row **7.7** for `WEEKLY_SET_FLOOR` /
   `CYCLE_SET_TARGET`-as-total. New ledger rows D13+ for each *decision*
   (the pooling, the 0.25 tier, the ramp, each attribution kept or removed).
   Bump the counts paragraph and add an "Updated 2026-09-xx by the 039 runs"
   note in *How to read it*.
4. **the user's own knowledge base:** only if a run produces durable life-knowledge
   (unlikely here — these are training prescriptions).

### 6.5 Running order and checkpoints

Each unit build-passes on its own; commit and push after each.

1. **Code — the accounting** (§6.1): shared function, both callers on it,
   `muscleCoverage` + card + dead habit helpers deleted, tests updated, the
   invariant test added. Browser-verify Home and the Adaptations tab (the tab
   loses its MUSCLE COVERAGE card — expected; 031 rebuilds the page).
   **Minor bump** (1.13.0, tagged) — the tab visibly changes.
2. **Scouts** (§6.3) — dispatch all ten at once; while they run, do the
   eutils checks as they come back. Then land per §6.4, including any `rx`
   text the verdicts change (record a changed value as a decision *before*
   editing the constant — `/ground` hard rule). Patch bump.
3. **Close:** tick §5, move this file to `done/`, repoint the source comments,
   and set [031](031-adaptations-drill-down-read.md) to `planned` (019, 026,
   039 all landed). Patch bump.
