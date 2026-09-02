# Roadmap: Adaptations read — ground what the page shows

**Label:** feature
**Status:** planned — kickoff-ready. Gates [031](031-adaptations-drill-down-read.md):
the redesign must not repaint numbers whose meaning is still undecided.
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
