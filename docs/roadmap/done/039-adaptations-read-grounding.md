# Roadmap: Adaptations read — ground what the page shows

**Label:** feature
**Status:** done — closed 2026-09-03 (v1.16.9): the twelve scout blocks live in
[grounding/039-adaptations-read.md](../../grounding/039-adaptations-read.md#grounding),
the code units shipped v1.13.0–v1.16.8, [001](001-cross-adaptation-rep-ranges.md)
retired inside this brief and [031](031-adaptations-drill-down-read.md) set
to `planned`.
**Depends:** 019
**Release:** 2.0.0
**Covers inventory rows:** 2.1, 2.2, 2.3, 2.6, 3.3, 3.4, 3.6, 3.7, 3.8, 3.9, 3.10, 7.1, 7.4, 7.5 in
[grounding-inventory.md](../../grounding-inventory.md), plus one number that has no
row at all (`CYCLE_SET_TARGET`, replaced by `MUSCLE_WINDOW_DAYS` under §6.6).

## Progress log

- **2026-09-02** — kickoff: §1–§2 read, accounting decision §6.1 made; unit 1
  shipped (v1.13.0): `classifyWeightSet` returns every quality, `muscleCoverage`
  and its card deleted. Eleven scouts dispatched at once — ten died on the
  5-hour limit, S2 came back (v1.13.1). S1 + S3 blocks (v1.13.2):
  `WEEKLY_SET_FLOOR` created, `CYCLE_SET_TARGET` derived from it, power sets
  out of `total`.
- **2026-09-03** — S1's level-3 zeroing shipped via
  [done/042](042-level-3-link-audit.md) (v1.14.0). S12 + S4 blocks
  (v1.14.1). Unit S12 (v1.16.0): `MUSCLE_WINDOW_DAYS = 14` replaces
  `CYCLE_WINDOW_DAYS`, rows 7.7 / 7.8, D14. Unit S4 (v1.16.1): power `rx`
  split in words, `hop` / `jump` whole-word + `NOT_POWER`, `clapping`, rows
  2.6 / 3.3 / 7.5, D15–D17. [done/043](043-scout-named-exercises-catalogue.md)
  put the scout-named exercises in the catalogue.
- **2026-09-03 (evening)** — S5–S8 dispatched as a batch of four; all died on
  `529 Overloaded` after two resumes each; nothing landed (v1.16.2).
- **2026-09-03 (night)** — S5 + S6 run inline, no subagents (§6.7): blocks,
  source comments, endurance load `<50%` → `40–60% 1RM` (D19), rows 3.4 / 3.6,
  D18–D20 (v1.16.3).
- **2026-09-03 (late)** — S7 + S8 inline: six of the first 24 recalled PMIDs
  were wrong and were re-found by title; anaerobic floors 3 → 4 rounds and
  1:2 → 1:1 (D21–D22); "Classic 4×4" → "Helgerud's 4×4" and the effort
  reworded (D23–D24); acceptance box 3 closed; rows 3.7 / 3.8 (v1.16.4).
- **2026-09-03** — the nine landed blocks moved to
  [grounding/039-adaptations-read.md](../../grounding/039-adaptations-read.md#grounding)
  and §6's handoffs folded into this log (v1.16.5); S9 + S10 dispatched as
  two parallel scouts; Rhonda Patrick added to the scout roster's cardio row.
- **2026-09-03 (late)** — S9 + S10 back from two parallel scouts (≈170k
  tokens / 8–13 min each; every PMID resolved on first check). S10 unit shipped
  (v1.16.6): `ADAPTATION_PRINCIPLE` two camps → three (D25), the reference
  card's attribution → a taxonomy credit (D26), row 3.10, rows 3.7 / 3.8's
  copied columns corrected; the reference card browser-checked (all S6–S10
  strings render, one pre-existing 404 in the console). S9's block landed
  verified with its decision pending — the unit is the next session's.
- **2026-09-03 (S9 unit)** — S9's Decision written (D27–D29): the endurance
  cue moves from nasal breathing to the talk test, the mitochondria claim is
  reworded to volume, the 30-min floor stays as a convention; source comment
  on `rx.endurance`, row 3.9 grounded, acceptance box 2 closed (v1.16.7). S11
  dispatched alone — the round's one scout — and lost when the session hit its
  limit before the block came back; the S9 unit was committed by the next
  session, which re-issues S11.
- **2026-09-03 (S11 unit)** — S11 re-run as one scout (≈146k tokens, 10 min);
  15 PMIDs + 1 DOI verified. Decision D30–D32: hypertrophy `[5, 30]`,
  muscular endurance `[15, 999]`, strength `[1, 5]` kept — the bands now
  overlap at 5 and 15–30. Source comments on the three `repRange`s, the
  classifier and invariant tests moved with them, rows 2.1–2.3 grounded,
  acceptance boxes 4 and 6–8 closed (v1.16.8).
- **2026-09-03 (close)** — §6.5 step 3: every §5 box already ticked; this brief
  and 001 moved to `done/`, 031 set to `planned`, links repointed (v1.16.9).

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
| Home's body map | `muscleStates` ([fusedRead.ts:57](../../../src/lib/fusedRead.ts#L57)) | rolling **42 days** (`CYCLE_WINDOW_DAYS`) | `CYCLE_SET_TARGET` = **60** weighted sets | no — one total |
| Adaptations tab, per-adaptation body map | `adaptationCoverage` ([lib/adaptations.ts](../../../src/lib/adaptations.ts)) | **week-to-date** | that adaptation's `weeklyMuscleTarget` (6 / 6 / 10 / 6) | yes |
| Adaptations tab, MUSCLE COVERAGE card | `muscleCoverage` ([utils.ts](../../../src/lib/utils.ts)) | **week-to-date** | none — bars are relative to the busiest muscle | no |

Three windows, three denominators, one silhouette. A muscle can read dark on
Home and pale one tap later, and both are "correct". That is the confusion the
page has, and no amount of restyling removes it.

**A finding worth keeping:** `CYCLE_SET_TARGET = 60` is documented in its own
comment as *"10 fractional sets/muscle/week × 6-wk cycle"* — that is the
**hypertrophy** volume band (Schoenfeld 2017, Pelland 2026, Baz-Valle 2022,
grounded in [010 §Grounding](010-home-fused-reads.md#grounding)). So Home's
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
   Delete whichever of the three dialects loses. **Added 2026-09-02 (§6.0):**
   the rep bands that classify a set (`repRange`, inventory rows 2.1–2.3, and
   the keyword rules in 2.6) are in scope too — they are grounded here and
   made to overlap, so one set can feed several qualities.
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
   [019](019-adaptation-model-simplification.md) followed).

**Out:**

- **Target *values*** — 1.2–1.9 are already grounded or `convention` in
  [011](011-adaptation-weekly-targets.md); their *shapes* belong to
  [012](../012-adaptation-target-shapes.md). Do not re-run the scout on them.
- ~~Rep-range boundaries and fuzzy classification — 001~~ **Pulled in
  2026-09-02** (§6.0): 001's question is decided by this brief.
- **Cardio classifier thresholds** (rows 6.1–6.5, the ≥25/≥8 min heuristic, the
  TE cutoff) — [005](005-hr-zone-intensity-classification.md).
- **Any pixel of the redesign** — [031](031-adaptations-drill-down-read.md).

The split to hold in mind: **039 grounds what the page *displays* and how a
resistance set *classifies*; 005 grounds how cardio *classifies*.**

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

## Grounding

The blocks live in
**[grounding/039-adaptations-read.md](../../grounding/039-adaptations-read.md#grounding)**
— one `###` per scout run, pasted verbatim on receipt after the citation check
(`eutils esummary`; Crossref for the papers outside PubMed), each closing with
the **Decision** paragraph the ledger rows cite. Landed: all twelve, each with its unit (S11 last, 2026-09-03). Moved out of this file on
2026-09-03 so a session picking the brief up reads the plan, not 800 lines of
evidence; the source comments in `src/` and the inventory link to the new file.

---

## 5. Acceptance

- [x] §1's accounting decision is made, written here with its reason, and the
      losing dialect(s) deleted from the code. (2026-09-02, v1.13.0 — §6.1
      option (a); `muscleCoverage` and its card are gone.)
- [x] A `## Grounding` section exists here (its blocks in
      [grounding/039-adaptations-read.md](../../grounding/039-adaptations-read.md#grounding))
      carrying verdicts for rows 7.1, 7.5,
      `CYCLE_SET_TARGET`-as-total, and the seven `rx` blocks (3.3, 3.4, 3.6–3.10).
      (2026-09-03, v1.16.7 — S1–S10 and S12 landed with decisions; S11's rep
      bands are box 4.)
- [x] Rows 3.4 and 3.8 either carry attribution for the named protocol they ship,
      or no longer ship it. (2026-09-03 — S5 keeps "Galpin's 3–5 rule",
      attributed, D18; S8 renames "Classic 4×4" to "Helgerud’s 4×4", D23.)
- [x] Rep bands overlap (§6.0): `classifyWeightSet` returns every quality whose
      band covers the set; rows 2.1–2.3 and 2.6 carry verdicts here; the
      per-quality sums may exceed a muscle's total and the tab says so on screen.
      (Classifier and tab line 2026-09-02, v1.13.0; edges `[1, 5]` /
      `[5, 30]` / `[15, 999]` 2026-09-03, v1.16.8 — S11, D30–D32; 2.6 — S4, D16.)
- [x] The muscle read's window is its own grounded constant (§6.6, S12), not
      the program's `CYCLE`; `CYCLE_WINDOW_DAYS` and `CYCLE_SET_TARGET` are
      gone and Home names the window and the weekly rate on screen.
      (2026-09-03, v1.16.0 — `MUSCLE_WINDOW_DAYS` / `MUSCLE_SET_TARGET` in
      app.ts, `HISTORY_WEEKS = 6` keeps the sheet's bars as history.)
- [x] Every covered inventory row names this brief as its carrier and shows a
      current verdict; `WEEKLY_SET_FLOOR` and `MUSCLE_WINDOW_DAYS` have rows.
      (2026-09-03, v1.16.8 — rows 2.1–2.3 were the last; 7.4 retired, §6.2.)
- [x] Citations verified through NCBI eutils before being pasted, not from a
      search-result summary. (Every block, S1–S12; Crossref for the DOIs
      outside PubMed — §6.7.)
- [x] The app still builds and every existing adaptation test passes; any number
      that moved is reflected in its test. (2026-09-03, v1.16.8 — the
      classifier and invariant tests carry the S11 edges.)

---

## 6. Kickoff findings — 2026-09-02 (where it left off)

The first session read every file in §1–§2 and stopped before touching code
(context wrap-up). Everything below is settled enough to execute without
re-reading; the one open check is marked.

### 6.0 Amendment 2026-09-02 — rep bands overlap, and the sums may exceed the total

Peter, picking the brief up again the same day: *if the rep-range stimulus per
adaptation is not grounded, ground it here; and we know a rep range can trigger
more than one stimulus, so on the Adaptations screen the combined sets across
adaptations can pass beyond the muscle's total sets.*

That is a decision, and it changes three things in the plan below.

**1. The classifier becomes multi-valued.** Today `classifyWeightSet` is a
strict partition — `[1,5]` strength, `[6,15]` hypertrophy, `[16,999]` muscular
endurance — so a set of 5 is 100 % strength and a set of 16 is 0 % hypertrophy.
The bands are made to **overlap** and the function returns every quality whose
band covers the set; a set inside an overlap counts **in full** toward each.
This is the model cardio already uses (`classifyCardioAdaptations` awards a
hard ride to both VO₂max and anaerobic capacity). It is *not* the fractional
scheme 001 sketched (0.7 strength + 0.3 hypertrophy): no weighting curve, no
partial sets — a set is a set. Overrides still win outright: an exercise tagged
power is one power set and nothing else.

Why it matters here and not just in theory — the logged sets by rep band
(Supabase, 2026-09-02, all history, 838 sets):

| reps | 1–5 | 6–8 | 9–12 | 13–15 | 16–20 | 21–30 | 31+ |
|---|---|---|---|---|---|---|---|
| sets | 48 | 142 | 289 | 103 | 170 | 74 | 12 |

A fifth of everything ever logged sits at 16–20 reps and today buys **zero**
hypertrophy credit, against a literature that finds hypertrophy per hard set
roughly load-independent from ~30 % 1RM up. The disjoint cut is the least
honest number on the page.

**2. The invariant flips.** §6.1 planned to assert `total = Σ byQuality`. Under
overlap the honest statement is `max_q byQuality[q] ≤ total ≤ Σ_q byQuality[q]`:
Home's per-muscle total still counts each set **once** (the muscle did one set
of work), the per-adaptation maps count it once **per quality it trains**, and
the tab's per-adaptation sums may therefore exceed the muscle's total. (S3
narrowed this on 2026-09-02: power sets sit outside `total`, so the bracket
holds over the three hard qualities.) That is by design and it goes on screen — the tab already labels its window ("This
Week"); it now also says *a set can count toward more than one quality*, once,
where the four muscle-linked adaptations sit. The hero's "lifting sets" line
must not sum the four `volume`s any more (it would double count); it reports
the set count once.

**3. Rows 2.1–2.3 and 2.6 come into this brief**, and 001 retires. The band
edges are the numbers being grounded; the keyword rules (2.6 — "jumps, throws,
Olympic lifts, swings, sprints are power regardless of reps") are the same
claim as power's `rx` cue, so S4 carries them. 001 is set `blocked — decided,
ships inside 039` now and moves to `done/` when this brief does.

**Where the band edges come from:** the S11 scout run below, not this session.
The current `repRange` values are the *disjoint* cut and will move; per the
`/ground` hard rule the new edges are recorded as a decision in `## Grounding`
before the constant is edited. The shape the code needs is unchanged —
`repRange: [lo, hi]` per adaptation, now allowed to overlap — and
`classifyWeightSet` walks all of `REP_DERIVED` instead of stopping at the first
hit. Expected literature: the repetition-continuum re-examination
(Schoenfeld, Grgic, Van Every, Plotkin 2021), the low- vs high-load
meta-analyses (Schoenfeld 2017; Lopez 2021), and Campos 2002 for the classic
three-zone specificity result — all to be verified through eutils.

### 6.1 The accounting decision — (a), made concrete

**(a) is taken.** One accounting: *stimulus = level-weighted sets in a window;
adequacy = a weekly rate × the weeks in that window.* The window is the only
thing that stays plural, and it is named on screen.

| Today | Under (a) |
|---|---|
| `muscleStates` ([fusedRead.ts:57](../../../src/lib/fusedRead.ts#L57)) — its own loop, 42 d, all sets, ÷ `CYCLE_SET_TARGET` | Built on the shared function; window = rolling `CYCLE_WINDOW_DAYS` (→ `MUSCLE_WINDOW_DAYS`, §6.6); `sets` = the sum of the four muscle-linked qualities (→ the three hard ones, S3) |
| `adaptationCoverage` ([lib/adaptations.ts:159](../../../src/lib/adaptations.ts#L159)) — its own loop, week-to-date, per adaptation, + a habit fold | Built on the shared function; window = calendar week-to-date; per adaptation; **habit fold dropped** (doctrine §5 already ruled: the muscle read counts logged sets only — the `habits` / `habitCompletions` / `exerciseNames` args go, and so do the two habit tests in `adaptations.test.ts`) |
| `muscleCoverage` ([utils.ts:558](../../../src/lib/utils.ts#L558)) — week-to-date, no target, + recovery minutes, + habits | **Deleted**, with `MuscleCoverageRow`, `MuscleCoverageCard.tsx` (its only consumer), its `<MuscleCoverageCard />` line in `AdaptationsTab.tsx`, and the `muscleCoverage` block in `habits.test.ts`. `habitMuscleContributions` and `recoveryHabitSets` in utils.ts are then used only by tests — delete them too (035 was going to) |

**The shared function** — new, in `src/lib/adaptations.ts` (fusedRead already
imports from there):

```ts
/** Level-weighted sets per muscle group inside [from, to]. `total` counts
 *  each set once — a set is one set of stimulus for the muscle however many
 *  qualities it trains. `byQuality[q]` counts the set in full for every
 *  quality whose rep band covers it (§6.0), so Σ byQuality ≥ total. */
export function muscleStimulus(
  weights, exerciseMuscles, window: { from: string; to: string }, overrides?,
): { total: Record<string, number>; byQuality: Record<MuscleQuality, Record<string, number>> }
```

Classification per set is `classifyWeightSet(reps, resolveExerciseAdaptation(...))`,
which under §6.0 returns an **array** — the same override-aware rule
`muscleQualityMix` already uses, so `muscleQualityMix` becomes a thin caller as
well. Add one test asserting the two invariants:
`max_q byQuality[q][m] ≤ total[m] ≤ Σ_q byQuality[q][m]` for every muscle, and
a set of 5 reps counting once in `total` and once each in strength *and*
hypertrophy.

**Open check — closed 2026-09-02.** The override column is
`exercises.default_adaptation`; exactly one row carries a value (Dead Hang →
muscular_endurance). No override names a cardio quality, so every logged set
classifies muscle-linked and `total` is exact. Keep the guard in the function
comment: an override naming a cardio quality would still count in `total`
(the muscle did the work) and in no `byQuality` bucket.

**The denominator.** `CYCLE_SET_TARGET` stops being a literal: it becomes
`WEEKLY_SET_FLOOR × CYCLE` where `WEEKLY_SET_FLOOR = 10` carries the
adaptation-agnostic claim the scout below rules on. `MuscleSheet.tsx:17`
already derives `WEEKLY_TARGET = CYCLE_SET_TARGET / CYCLE` — invert that.
(Done 2026-09-02; superseded on 2026-09-03 — the `× CYCLE` goes too, §6.6.)
The DB shadow (inventory 1.11) means the tab reads `adaptation_targets` while
Home reads the constant; they are byte-identical today. Note it, do not fix it.

**The ramp.** Home colours by continuous `fillFraction`
([GapMap.tsx:16-21](../../../src/components/tabs/home/GapMap.tsx#L16), cutoff 0.70);
the tab colours by the three-step `status` ([lib/adaptations.ts:146](../../../src/lib/adaptations.ts#L146)).
Add `fillFraction` to `MuscleStatusRow` so 031 can draw one ramp; whether
`status` survives is the row-7.5 scout's call.

**On-screen window labels** already exist on Home (`"N sets in 42 days"`,
`"42-day cycle · target 60"`) and on the tab (`"This Week"`). The
`<strong>PLACEHOLDER</strong>` after `target {CYCLE_SET_TARGET}` in
[MuscleSheet.tsx:161](../../../src/components/tabs/home/MuscleSheet.tsx#L161) is the
mark 018 left for exactly this brief's verdict — replace it when the block lands.

### 6.2 Row 7.4 is retired, not grounded

`WEEKLY_STRETCH_TARGET_MIN = 5` sat at `utils.ts:338` when the inventory was
built (commit `ecfc547`). It no longer exists anywhere in `src/` — it went with
`RecoveryCard` (014 step 3). Strike row 7.4 as **retired**; drop it from this
brief's scope. 031 §3c cuts the recovery axis from the page anyway.

### 6.3 The scout runs — twelve, one decision each, two at a time

All `subagent_type: science-scout`, each given the claim, the constant, the
current value, this brief's path, and the date. Verify every citation through
NCBI eutils before pasting (acceptance box 5). S1–S8 and S12 have landed —
their claims are the **Claim** line of their blocks in the grounding file, and
the progress log says when. The rows kept below are the ones still in flight
or still to dispatch, so a dead run can be re-issued from here:

| # | Row | Claim to hand the scout | Constant · value |
|---|---|---|---|
| S9 | 3.9 | Endurance prescription: Zone 2 / conversational, 30 min–hours continuous; the cue's mechanistic claims "nasal-breathing pace" and "builds mitochondria & fat oxidation" | `ADAPTATIONS[endurance].rx` [adaptations.ts:251](../../../src/constants/adaptations.ts#L251) |
| S10 | 3.10 | Power and strength are quality-driven (never to fatigue, full rest); hypertrophy through endurance are volume/fatigue-driven (accumulate work, push effort) — expected literature: velocity-loss and proximity-to-failure meta-analyses | `ADAPTATION_PRINCIPLE` [adaptations.ts:268](../../../src/constants/adaptations.ts#L268) |
| S11 | 2.1–2.3 | **Rep bands per muscle-linked quality overlap** (§6.0): which rep range, taken near failure, trains strength, which hypertrophy, which local muscular endurance, and where the bands overlap so that one set counts in full toward each — return the three `[lo, hi]` edges. Today's disjoint cut `[1,5] / [6,15] / [16,999]` is the value being replaced | `repRange` on strength / hypertrophy / muscular_endurance [adaptations.ts:108](../../../src/constants/adaptations.ts#L108), [:158](../../../src/constants/adaptations.ts#L158), [:186](../../../src/constants/adaptations.ts#L186) |

Hypertrophy's `rx` (row 3.5) is **out**: grounded in 011 and locked to the
target (D3). Do not re-run it.

**Attribution already on the page:** `AdaptationGuide.tsx` ends with *"Based
on the Huberman Lab × Dr. Andy Galpin guest series on physical adaptations."*
That is a practitioner attribution for all seven blocks at once, in a collapsed
card. After S4–S10 land, that line either becomes the honest provenance
(literature where found, `convention` where not) or goes; the per-card InfoTip
carries no attribution at all today.

### 6.4 Landing the blocks — the four `/ground` destinations

1. **The grounding file**
   ([grounding/039-adaptations-read.md](../../grounding/039-adaptations-read.md#grounding)):
   paste every block verbatim under its `## Grounding`, one `###` per run,
   and end each with a **Decision** paragraph; this brief's own `## Grounding`
   is a pointer. The file stays where it is when the brief retires, so nothing
   below needs repointing. (Moved out of the brief 2026-09-03 — the nine landed
   blocks were 790 of its 1,426 lines.)
2. **The constants:** source comments on `LEVEL_WEIGHT`, `WEEKLY_SET_FLOOR`,
   `MUSCLE_WINDOW_DAYS`, each `rx` block and `ADAPTATION_PRINCIPLE`, every one
   pointing at `docs/grounding/039-adaptations-read.md#grounding`.
3. **The inventory** ([grounding-inventory.md](../../grounding-inventory.md)):
   rows 2.1–2.3, 2.6, 3.3, 3.4, 3.6–3.10, 7.1, 7.5 → carrier `039`, verdict updated, and the
   `Where` line numbers refreshed (7.1 says `utils.ts:479`, now 490; 7.5 says
   `lib/adaptations.ts:135-139`, now 146-150 — both move again after §6.1).
   Row 7.4 struck as retired (§6.2). New row **7.7** for `WEEKLY_SET_FLOOR`
   as the pooled total (S3) and **7.8** for `MUSCLE_WINDOW_DAYS` (S12). New
   ledger rows D13+ for each *decision* (the pooling, the 0.25 tier, the ramp,
   the window leaving the cycle, each attribution kept or removed).
   Bump the counts paragraph and add an "Updated 2026-09-xx by the 039 runs"
   note in *How to read it*.
4. **The user's own knowledge base** (optional, machine-local — see `/ground`
   step 4): only if a run produces durable life-knowledge (unlikely here —
   these are training prescriptions).

### 6.5 Running order and checkpoints

Each unit build-passes on its own; commit and push after each.

1. **Code — the accounting** (§6.0 + §6.1): `classifyWeightSet` returns an
   array (callers: `adaptationCoverage`, `muscleQualityMix`, `powerSetCount`,
   the tests); shared function, both callers on it; `muscleCoverage` + card +
   dead habit helpers deleted; the hero's "lifting sets" counts sets once; the
   one-line "a set can count toward more than one quality" label on the tab;
   tests updated, the invariant test added. The band *edges* stay at today's
   values in this unit — overlap is only exercised by the test until S11 lands.
   Browser-verify Home and the Adaptations tab (the tab loses its MUSCLE
   COVERAGE card — expected; 031 rebuilds the page).
   **Minor bump** (1.13.0, tagged) — the tab visibly changes.
2. **Scouts** (§6.3) — **two at a time, never all at once.** The first
   attempt (2026-09-02) dispatched all eleven in parallel; ten died on the
   5-hour session limit and only S2 came back. One scout costs roughly an hour
   of interactive work, so a batch of eleven is most of a window. Run them in
   pairs, eutils-check each block as it lands, paste it into the grounding
   file, and commit after each pair so a dead session loses at most two runs.
   Then land per §6.4, including any `rx` text the verdicts change (record a
   changed value as a decision *before* editing the constant — `/ground` hard
   rule). Patch bump per pair. **Landed:** S1–S8 and S12 (progress log).
   **Remaining:** none — S9, S10 and S11 landed 2026-09-03 (v1.16.6–v1.16.8).
3. **Close:** tick §5, move this file to `done/` (the grounding file and the source
   comments stay put), move [001](001-cross-adaptation-rep-ranges.md) to `done/` as
   `done — decided and shipped inside 039`, repoint its links (031 §4, 034,
   the inventory), and set [031](031-adaptations-drill-down-read.md) to
   `planned` (019, 026, 039 all landed). Patch bump.

### 6.6 Amendment 2026-09-03 — the muscle window leaves the program cycle

Peter, after S1 + S3 landed: *the six-week cycle is the program's — the one
saved program in the database. Home and the Adaptations reads were never meant
to be grounded on it. Everything there should be science- or convention-based,
and muscle adaptation is researched per week. Cardio already has its own
timings; do the same for muscles, so it is (1) easy to follow — we live in
weeks — and (2) grounded. I don't push on the 60-set cycle.*

**What the read hangs on today.** `CYCLE_WINDOW_DAYS = CYCLE × 7`
([fusedRead.ts:25](../../../src/lib/fusedRead.ts#L25), 42 days) and
`CYCLE_SET_TARGET = WEEKLY_SET_FLOOR × CYCLE`
([app.ts:99](../../../src/constants/app.ts#L99), 60). `CYCLE` is the program's
cycle length — the constant `cycleInfo` and the deload logic run on. Neither
the 42 nor the 60 was ever grounded: S3 ruled on the *rate* (10 hard sets per
muscle per week) and on the pooling; the 60 is that rate times a program length
nobody asked the research about, and §6.1's "the window is the only thing that
stays plural" left it unexamined. Cardio's equivalents —
`QUALITY_STALENESS_DAYS` (14 / 14 / 28) and each quality's
`weeklySessionTarget` — are grounded per quality in 011 and owe nothing to the
program. Four consumers read the cycle window: `muscleStates` (the fill),
`powerSetCount`, `muscleWeeks` (the sheet's six weekly bars) and
`muscleSources`; Home's copy says "this cycle" twice.

**Decision (Peter, 2026-09-03).** The per-muscle read gets its own window
constant, `MUSCLE_WINDOW_DAYS`, in app.ts beside `QUALITY_STALENESS_DAYS`. Its
target is `WEEKLY_SET_FLOOR × MUSCLE_WINDOW_DAYS / 7`. `CYCLE_WINDOW_DAYS` and
`CYCLE_SET_TARGET` go. `CYCLE` stays exactly what it is — the program's cycle
— and nothing on Home or the Adaptations tab reads it any more. The weekly
rate stays the unit on screen ("10/wk"), with the window named beside it
("N hard sets in 14 days").

**Value: rolling 14 days, target 20 — pending S12.** Chosen from three:

- **Rolling 14 days ÷ 20 (taken).** The shortest window in which a muscle
  trained once a week does not flip to empty on the morning of its session;
  one rhythm with the 14-day cardio staleness; and the detraining literature
  puts measurable loss past roughly two to three weeks, so a muscle silent for
  the whole window has honestly missed its dose.
- Rolling 7 days ÷ 10. The literature's own unit, but on leg-day morning the
  quads read as untouched as a muscle ignored for a month, and rank top of
  "what's missing".
- Calendar week-to-date, Monday start. What the Adaptations tab does today;
  on Monday morning every muscle is a gap — the wrong "what's missing" read.
- 42 days was not on the list: no muscle evidence speaks for it. Its one merit
  was averaging over the deload week, which is a program concern.

The window length is a number claiming physiological meaning (doctrine §4
q5), so it runs as **S12** before the constant changes. 14 is the value handed
to the scout; a verdict with a different default is a decision recorded here
first (`/ground` hard rule).

**What survives untouched:** S3's rate and pooling; S2's continuous fill and
`GAP_CUTOFF` (fractions of the window's target, whatever the window — 0.70
keeps meaning "70 % of the target"); S1's weights; `RECOVER_DAYS` and
`daysSince` (all-history recency).

**Code, when S12 lands** — one unit, minor bump (Home's map visibly changes):

1. app.ts: `MUSCLE_WINDOW_DAYS = 14` with its source comment pointing here;
   `MUSCLE_SET_TARGET = WEEKLY_SET_FLOOR * MUSCLE_WINDOW_DAYS / 7`; delete
   `CYCLE_SET_TARGET`.
2. fusedRead.ts: `CYCLE_WINDOW_DAYS` → `MUSCLE_WINDOW_DAYS` in `cycleWindow`
   (rename it `muscleWindow`), `muscleStates`, `powerSetCount` and
   `muscleSources`; `fillFraction` over `MUSCLE_SET_TARGET`; the
   `MuscleState.sets` doc. `muscleWeeks` keeps six weekly bars as *history* —
   history is not a claim — but driven by a plain display constant in the
   sheet, not by `CYCLE`.
3. MuscleSheet.tsx and HomeTab.tsx: "N hard sets in 14 days", "14-day window ·
   10/wk · power sets count on their own map"; "this cycle" → "in the last 14
   days"; the bars' caption says "last 6 weeks".
4. fusedRead.test.ts: eight references assume 42 / 60 — move them.
5. Inventory row 7.8 and a ledger row for this decision (§6.4 step 3).
6. Browser-verify Home: expect more muscles to read as gaps — a 14-day window
   is stricter on anything trained once a fortnight, which is the honest read.

### 6.7 How a run lands — the recipe the S5–S8 sessions settled on

Scouts or inline, the receiving steps are the same. **Verify first:** every
PMID through `eutils esummary` — a 30-line `cite-check.mjs` in the session
scratchpad lists what NCBI and Crossref say each linked PMID / DOI is;
serialise the calls, NCBI throttles at 3/s. Six of the first 24 PMIDs
recalled from memory in S7 + S8 were wrong, so a block is not read until its
citations resolve. Practitioner positions come from the podcast-notes pages
and Huberman Lab's own summaries via WebFetch (URLs in the S4 / S6 / S8
blocks). **Then land:** paste the block into the grounding file as
`### S<n> — …` with heading levels shifted one down and HTML entities
decoded; write its **Decision** paragraph; then the code unit — source
comment on the constant, any text the verdict changes (ledger row *before*
the constant is edited), inventory row + ledger rows, tests, build, browser
check, patch bump. Inline (no subagents) costs the same as a scout pair —
one pair fills a session either way. A subagent's block is the last
assistant text in its JSONL transcript; a 40-line extractor saves retyping
it.

**Browser check 2026-09-03 (S10 unit):** the reference card on the
Adaptations tab renders every S6–S10 string (`40–60% 1RM`; `4–8 rounds`,
`1:1–1:4`; the Helgerud cue and even-pace effort; the three-camp principle;
the taxonomy credit) — text check plus screenshot; the only console error is
a pre-existing 404. The S6–S8 debt is cleared.

**S9 unit landed 2026-09-03 (v1.16.7)** by that recipe: Decision paragraph
(forks 1–4 as the scout proposed), ledger rows D27–D29 before the constant
moved, the source comment and the talk-test cue on `rx.endurance`, row 3.9 →
carrier 039 S9, the endurance row of the reference card screenshotted.

**S11 unit landed 2026-09-03 (v1.16.8)** by the same recipe, after the first
S11 scout was lost to a session limit and re-issued from §6.3: 15 PMIDs + 1
DOI verified, block pasted, Decision D30–D32 written before the three
`repRange` edges moved, the classifier, invariant and `muscleQualityMix`
tests moved with them, rows 2.1–2.3 → carrier 039 S11. **Browser check:**
the Adaptations tab's hero counts 45 lifting sets once while the strength /
hypertrophy / endurance rows read 2 / 44 / 13 — the overlap is live in the
data, not only in the test — and the hypertrophy card opens to a body map
with 5 of 6 muscle groups on track (screenshot; the only console error is
the pre-existing 404).

**Next — §6.5 step 3** closes the brief.
