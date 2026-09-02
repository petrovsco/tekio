# Roadmap: Adaptations read — ground what the page shows

**Label:** feature
**Status:** in progress — unit 1 shipped 2026-09-02 (v1.13.0). Scout runs: S2
landed (v1.13.1); S1, S3–S11 still to run, two at a time (§6.5 step 2 — the
2026-09-02 batch of eleven hit the session limit). Gates
[031](031-adaptations-drill-down-read.md); retires
[001](001-cross-adaptation-rep-ranges.md).
**Depends:** 019
**Release:** 2.0.0
**Covers inventory rows:** 2.1, 2.2, 2.3, 2.6, 3.3, 3.4, 3.6, 3.7, 3.8, 3.9, 3.10, 7.1, 7.4, 7.5 in
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
   [019](done/019-adaptation-model-simplification.md) followed).

**Out:**

- **Target *values*** — 1.2–1.9 are already grounded or `convention` in
  [011](done/011-adaptation-weekly-targets.md); their *shapes* belong to
  [012](012-adaptation-target-shapes.md). Do not re-run the scout on them.
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

One `###` per scout run from §6.3, pasted verbatim on receipt after the PMID
check (`eutils esummary`, 2026-09-02). Landed so far: **S2**. Still to run,
two at a time (§6.5 step 2): S1, S3, S4, S5, S6, S7, S8, S9, S10, S11.

### S2 — statusFor / GAP_CUTOFF (the on-track cut and the ramp)

**Claim:** Stimulus below the 10-weighted-sets/muscle/week floor is graded — every hard set buys some adaptation — so a continuous fill (sets ÷ floor) is the honest picture and the three-step cut in `statusFor` (0 → untouched, 0–10 → needs work, ≥10 → on track) is a coarsening of it. Sub-questions: (a) is any volume below the floor worth *zero* (a true threshold that would justify a step); (b) is `GAP_CUTOFF = 0.70` (7 sets/week) a physiological line or a display convention. Drives whether the Adaptations tab keeps three flat colours per muscle or draws Home's ramp, and where the "still a gap" callout stops.
**Searched:** 2026-09-02 · **Verdict:** supported — the ramp is honest and no sub-floor threshold exists; the 0.70 line is **convention only**
**Number to use:** fill = weighted sets ÷ 10 per week, continuous from 0; the only two steps with physiological content are **0** (no stimulus) and **1.0** (the grounded floor). `GAP_CUTOFF` 0.6–0.8 — default **0.70 (unchanged)**. No study draws a line at any fraction of the floor, but 0.70 sits just above the maintenance zone the literature does describe (roughly 0.1–0.6 of a full dose), so the callout stops nagging only once a muscle is clearly on the growth curve — a defensible convention, not a finding.

#### Evidence
- `[literature]` Hypertrophy rises with weekly sets in a graded, per-set way: each additional weekly set added ES +0.023 ≈ +0.37 % growth, modelled as a linear per-set slope with no threshold term. Systematic review + meta-analysis, 15 studies / 34 treatment groups, mixed training status — [Schoenfeld, Ogborn & Krieger 2017, J Sports Sci](https://pubmed.ncbi.nlm.nih.gov/27433992/) (PMID verified via eutils)
- `[literature]` The largest dose-response model finds a 100 % posterior probability that the marginal slope of volume is > 0 for both hypertrophy and strength, with *diminishing* returns (much steeper flattening for strength). A concave curve means the first sets buy the most per set — the opposite of a threshold. Fractional set counting (indirect sets = 0.5) fit best. Bayesian meta-regression, 67 studies, n = 2,058 (79 % male, mean age 25) — [Pelland et al. 2026, Sports Med](https://pubmed.ncbi.nlm.nih.gov/41343037/) (PMID verified via eutils)
- `[literature]` One set per exercise already produces hypertrophy: ES 0.24 for 1 set vs 0.34 for 2–3 and 0.44 for 4–6 sets; multiple sets give ~40 % more, not "some vs none". Meta-analysis, 8 studies / 19 treatment groups / 55 effect sizes, trained and untrained — [Krieger 2010, J Strength Cond Res](https://pubmed.ncbi.nlm.nih.gov/20300012/) (PMID verified via eutils)
- `[literature]` In resistance-trained men, 1 set per exercise × 3 sessions/week (≈3 sets/muscle/week, ~0.3 of Tekiō's floor) still increased muscle size at most sites and matched the 3- and 5-set groups for strength; higher volume grew more. RCT, 34 resistance-trained men, 8 weeks — [Schoenfeld et al. 2019, Med Sci Sports Exerc](https://pubmed.ncbi.nlm.nih.gov/30153194/) (PMID verified via eutils)
- `[literature]` A single set performed 1–3×/week was sufficient for significant 1RM gains in resistance-trained men (overall +12.09 kg, 95 % CI 8.16–16.03). Systematic review + meta-analysis, 6 studies (5 pooled) — [Androulakis-Korakakis, Fisher & Steele 2020, Sports Med](https://pubmed.ncbi.nlm.nih.gov/31797219/) (PMID verified via eutils)
- `[literature]` Intermediate–advanced powerlifters gained strength on ~3–6 working sets of 1–5 reps per week above 80 % 1RM, spread over 1–3 sessions. Multi-study paper (interviews, surveys, two interventions, n = 25 in the interventions) — [Androulakis-Korakakis et al. 2021, Front Sports Act Living](https://pubmed.ncbi.nlm.nih.gov/34527944/) (PMID verified via eutils)
- `[literature]` Strength follows the same graded shape: low weekly sets ES 0.82 (95 % CI 0.47–1.17) vs high 1.01 (0.70–1.32) — the low category is large, not near zero. Meta-analysis, 9 studies / 61 treatment groups, novice to well-trained — [Ralston et al. 2017, Sports Med](https://pubmed.ncbi.nlm.nih.gov/28755103/) (PMID verified via eutils)
- `[literature]` After 16 weeks at 3 sessions/week, cutting the dose to one-third or one-ninth for 32 weeks preserved the muscle gained in young adults (20–35 y) but not in older adults (60–75 y); strength was largely retained even with complete detraining. This is the *maintenance* line: ~1/9–1/3 of a full dose keeps muscle in the young. Two-phase randomised trial, n = 70 — [Bickel, Cross & Bamman 2011, Med Sci Sports Exerc](https://pubmed.ncbi.nlm.nih.gov/21131862/) (PMID verified via eutils)
- `[literature]` Every resistance-training prescription beat control for both strength and hypertrophy; for hypertrophy "all prescriptions comparably promoted" growth. Any dose above zero counts. Bayesian network meta-analysis, 178 studies (n = 5,097) strength / 119 studies (n = 3,364) hypertrophy — [Currier et al. 2023, Br J Sports Med](https://pubmed.ncbi.nlm.nih.gov/37414459/) (PMID verified via eutils)
- `[literature]` A time-efficient practical minimum of 4 weekly sets per muscle group at 6–15 RM (≈0.4 of the floor) is proposed as still growth-producing. Narrative review — lowest literature tier — [Iversen et al. 2021, Sports Med](https://pubmed.ncbi.nlm.nih.gov/34125411/) (PMID verified via eutils)
- `[practitioner consensus]` The adequacy floor sits near 10 working sets/muscle/week for a trained adult (Galpin: "target 10 working sets per muscle group, per week", up to 25 if highly trained; Israetel's MAV band 12–20 starts just above it). Held by Galpin and Israetel — [Galpin, Huberman Lab guest series pt 2](https://podcastnotes.org/huberman-lab/guest-series-dr-andy-galpin-optimal-protocols-to-build-strength-grow-muscles-part-2-huberman-lab/), [RP volume landmarks](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth). Already recorded in 010; repeated here only because it anchors the 1.0 step.
- `[single-practitioner position]` Israetel's landmark model is the only roster position that draws *steps* below the floor: MV ≈ 6 sets/week "preserve[s] your current muscle mass", below MV you lose, between MV and MEV you maintain but "only maintain" — i.e. growth is zero until MEV. Israetel only; Galpin names a single floor and no maintenance step; RP itself cut its MEV estimates in 2018 because "new research on even experienced lifters shows hypertrophy with much lower volumes than we had previously programmed" — [RP volume landmarks](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth), [RP Physique Templates 2.0](https://rpstrength.com/expert-advice/male-and-female-physique-templates-20)
- `[single-practitioner position]` No roster member, and no located study, puts a line at 70 % of a target — or at any fraction of one. Nobody holds the number; it exists only in `GapMap.tsx`.

#### Where they split
The fork is Israetel's *threshold* model against the meta-analytic *curve*. Israetel's landmarks say volume below MEV grows nothing (a flat step, then growth); Schoenfeld 2017, Pelland 2026, Krieger 2010 and Currier 2023 fit curves that rise from the first set and flatten, and the trained-men trials (Schoenfeld 2019 at ~3 sets/week, Androulakis-Korakakis 2020 at one set) show growth and strength gains well inside Israetel's "maintenance only" band. Galpin sits with the literature: one floor, no step beneath it. This forces one choice on Tekiō: **is a muscle's state a category or a fraction?** The literature says fraction — draw Home's ramp on the tab, one ramp on both surfaces, and treat `statusFor`'s middle band as a *label* of the ramp (0 < fill < 1), never as a third flat colour with its own edge. The only step with physiological content below 1.0 is 0 vs > 0 ("untouched" is real: no set, no stimulus). Do not fix this by placing the middle edge at Israetel's MV or MEV — that would present one practitioner's model as the literature's shape.

#### Caveats
- Population mismatch: the dose-response models are group averages over 6–12 weeks in mostly young men (Pelland 79 % male, mean age 25); the trained-men data that matter most here are small (Schoenfeld 2019 n = 34; the powerlifter interventions n = 25). One trained adult sits somewhere on the curve, not at a point.
- Age moves the maintenance line: Bickel's 60–75 y group needed more than one-third of the dose to keep muscle. A user past ~40 should expect the low end of the ramp (0.1–0.35) to maintain less than it does in the trials.
- The ramp bands happen to bracket the maintenance literature — 0.10 ≈ Bickel's 1/9 dose, 0.35 ≈ his 1/3 dose, 0.70 just above Israetel's MV (≈ 0.6 of a 10-set floor). That is a coincidence worth noting, not a grounding: the steps were chosen for ink, and the literature merely does not contradict them.
- The fraction is only as honest as its numerator and denominator: it assumes fractional set counting (S1) and the 10-set floor pooled across rep bands (S3). If S3 moves the floor, every band on the ramp moves with it and 0.70 means a different set count.
- What would move this number: a trained-population trial showing *zero* growth at 3–6 direct sets/week (a real MEV) would justify a step at that fraction; a decision to change the read's meaning from "adequate" to "optimal" (010 §Where they split) would move the 1.0 step and, with it, where any gap line sits.

#### Source comment
```
// statusFor — three states are a label of a continuous fill (sets ÷ floor), not three physiological
// bands: stimulus is graded from the first set (Schoenfeld 2017, Pelland 2026, Krieger 2010; trained
// men at ~3 sets/wk still grow, Schoenfeld 2019). Only 0 (untouched) and ≥ floor carry meaning.
// See docs/roadmap/039-adaptations-read-grounding.md#grounding

// 0.70 — display convention, not a physiological line: no study places a cutoff at any fraction of the
// floor; 0.70 sits just above the maintenance zone (Bickel 2011: 1/9–1/3 of a full dose keeps muscle
// in young adults; Israetel MV ≈ 0.6 × floor). See docs/roadmap/039-adaptations-read-grounding.md#grounding
```

**Decision (S2, 2026-09-02):** `GAP_CUTOFF` stays 0.70 and `statusFor` keeps its three states, but both are now labelled as a *convention* over a continuous fill. 031 draws Home's ramp on the Adaptations tab (one ramp, both surfaces) instead of three flat per-muscle colours; the middle band is a label of the ramp, not a physiological edge.

---

## 5. Acceptance

- [x] §1's accounting decision is made, written here with its reason, and the
      losing dialect(s) deleted from the code. (2026-09-02, v1.13.0 — §6.1
      option (a); `muscleCoverage` and its card are gone.)
- [ ] A `## Grounding` section exists here carrying verdicts for rows 7.1, 7.5,
      `CYCLE_SET_TARGET`-as-total, and the seven `rx` blocks (3.3, 3.4, 3.6–3.10).
- [ ] Rows 3.4 and 3.8 either carry attribution for the named protocol they ship,
      or no longer ship it.
- [ ] Rep bands overlap (§6.0): `classifyWeightSet` returns every quality whose
      band covers the set; rows 2.1–2.3 and 2.6 carry verdicts here; the
      per-quality sums may exceed a muscle's total and the tab says so on screen.
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
the tab's per-adaptation sums may therefore exceed the muscle's total. That is
by design and it goes on screen — the tab already labels its window ("This
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
| `muscleStates` ([fusedRead.ts:57](../../src/lib/fusedRead.ts#L57)) — its own loop, 42 d, all sets, ÷ `CYCLE_SET_TARGET` | Built on the shared function; window = rolling `CYCLE_WINDOW_DAYS`; `sets` = the sum of the four muscle-linked qualities |
| `adaptationCoverage` ([lib/adaptations.ts:159](../../src/lib/adaptations.ts#L159)) — its own loop, week-to-date, per adaptation, + a habit fold | Built on the shared function; window = calendar week-to-date; per adaptation; **habit fold dropped** (doctrine §5 already ruled: the muscle read counts logged sets only — the `habits` / `habitCompletions` / `exerciseNames` args go, and so do the two habit tests in `adaptations.test.ts`) |
| `muscleCoverage` ([utils.ts:558](../../src/lib/utils.ts#L558)) — week-to-date, no target, + recovery minutes, + habits | **Deleted**, with `MuscleCoverageRow`, `MuscleCoverageCard.tsx` (its only consumer), its `<MuscleCoverageCard />` line in `AdaptationsTab.tsx`, and the `muscleCoverage` block in `habits.test.ts`. `habitMuscleContributions` and `recoveryHabitSets` in utils.ts are then used only by tests — delete them too (035 was going to) |

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

### 6.3 The scout runs — eleven, one decision each, dispatch in parallel

All `subagent_type: science-scout`, each given the claim, the constant, the
current value, this brief's path, and the date. Verify every citation through
NCBI eutils before pasting (acceptance box 5).

| # | Row | Claim to hand the scout | Constant · value |
|---|---|---|---|
| S1 | 7.1 | A set on an exercise where the muscle is a level-2 (secondary) mover counts as half a set of stimulus for that muscle, level-3 a quarter — the fractional-set convention every map is denominated in | `LEVEL_WEIGHT` [utils.ts:490](../../src/lib/utils.ts#L490) · `{1: 1, 2: 0.5, 3: 0.25}`. Pelland 2026's best-fit model counts indirect sets at 0.5 (already cited in [010 §Grounding](done/010-home-fused-reads.md#grounding)) — the scout's job is the 0.25 tier and whether 0.5 is "indirect" in the same sense |
| S2 | 7.5 | Stimulus below the weekly floor is graded (each set buys some adaptation), so a continuous fill is honest and a three-step on-track / needs-work / untouched cut is a coarsening; is anything below the floor worth *zero*? | `statusFor` [lib/adaptations.ts:146](../../src/lib/adaptations.ts#L146) + `GAP_CUTOFF = 0.70` [GapMap.tsx:16](../../src/components/tabs/home/GapMap.tsx#L16) |
| S3 | new row | 10 level-weighted sets/muscle/week **counted across every rep range** (strength, hypertrophy, endurance and power sets all pooled) is a defensible adequacy floor for *total* muscle stimulus — i.e. the hypertrophy floor is the right adaptation-agnostic denominator because it is the most volume-hungry of the four | `WEEKLY_SET_FLOOR` (new) · `10`, and `CYCLE_SET_TARGET` [app.ts:90](../../src/constants/app.ts#L90) · `60`. The *value* is grounded (010 D10); the *pooling* is the claim |
| S4 | 3.3, 2.6 | Power prescription: 30–70% 1RM, 1–5 reps, 3–5 sets, 2–5 min rest, never to fatigue; and the keyword rule that jumps, throws, Olympic lifts, swings, sleds and sprints are power work regardless of rep count (row 2.6) | `ADAPTATIONS[power].rx` [adaptations.ts:78](../../src/constants/adaptations.ts#L78) |
| S5 | 3.4 | Strength prescription: 85–100% 1RM, 3–5 reps, 3–5 sets, 2–5 min rest, 1–2 RIR; and the cue "Galpin's 3–5 rule" (3–5 reps × sets × min rest × sessions/wk) — attribute or remove | `ADAPTATIONS[strength].rx` [adaptations.ts:109](../../src/constants/adaptations.ts#L109) |
| S6 | 3.6 | Muscular-endurance prescription: <50% 1RM, 15–40+ reps, 2–4 sets, <60 s rest, to/near failure | `ADAPTATIONS[muscular_endurance].rx` [adaptations.ts:163](../../src/constants/adaptations.ts#L163) |
| S7 | 3.7 | Anaerobic-capacity prescription: all-out 20 s–2 min efforts, 3–8 rounds, 1:2–1:4 work:rest | `ADAPTATIONS[anaerobic_capacity].rx` [adaptations.ts:189](../../src/constants/adaptations.ts#L189) |
| S8 | 3.8 | VO₂max prescription: 90–100% HRmax, 3–8 min efforts, 4–6 sets, ≈1:1 rest; and the cue "classic 4×4 min at 90–95% HRmax, 3 min easy" — expected source Helgerud 2007 (verify) — attribute or remove | `ADAPTATIONS[vo2max].rx` [adaptations.ts:220](../../src/constants/adaptations.ts#L220) |
| S9 | 3.9 | Endurance prescription: Zone 2 / conversational, 30 min–hours continuous; the cue's mechanistic claims "nasal-breathing pace" and "builds mitochondria & fat oxidation" | `ADAPTATIONS[endurance].rx` [adaptations.ts:251](../../src/constants/adaptations.ts#L251) |
| S10 | 3.10 | Power and strength are quality-driven (never to fatigue, full rest); hypertrophy through endurance are volume/fatigue-driven (accumulate work, push effort) — expected literature: velocity-loss and proximity-to-failure meta-analyses | `ADAPTATION_PRINCIPLE` [adaptations.ts:268](../../src/constants/adaptations.ts#L268) |
| S11 | 2.1–2.3 | **Rep bands per muscle-linked quality overlap** (§6.0): which rep range, taken near failure, trains strength, which hypertrophy, which local muscular endurance, and where the bands overlap so that one set counts in full toward each — return the three `[lo, hi]` edges. Today's disjoint cut `[1,5] / [6,15] / [16,999]` is the value being replaced | `repRange` on strength / hypertrophy / muscular_endurance [adaptations.ts:94](../../src/constants/adaptations.ts#L94), [:125](../../src/constants/adaptations.ts#L125), [:153](../../src/constants/adaptations.ts#L153) |

Hypertrophy's `rx` (row 3.5) is **out**: grounded in 011 and locked to the
target (D3). Do not re-run it.

**Attribution already on the page:** `AdaptationGuide.tsx` ends with *"Based
on the Huberman Lab × Dr. Andy Galpin guest series on physical adaptations."*
That is a practitioner attribution for all seven blocks at once, in a collapsed
card. After S4–S10 land, that line either becomes the honest provenance
(literature where found, `convention` where not) or goes; the per-card InfoTip
carries no attribution at all today.

### 6.4 Landing the blocks — the four `/ground` destinations

1. **This brief:** paste all eleven blocks verbatim under a `## Grounding` section
   placed before `## Acceptance` (i.e. between §4 and §5), one `###` per run.
2. **The constants:** source comments on `LEVEL_WEIGHT`, `WEEKLY_SET_FLOOR`,
   `CYCLE_SET_TARGET`, each `rx` block and `ADAPTATION_PRINCIPLE`, every one
   pointing at `docs/roadmap/039-adaptations-read-grounding.md#grounding`
   (repoint to `done/` when the brief moves — `grep -rn 039- src/`).
3. **The inventory** ([grounding-inventory.md](../grounding-inventory.md)):
   rows 2.1–2.3, 2.6, 3.3, 3.4, 3.6–3.10, 7.1, 7.5 → carrier `039`, verdict updated, and the
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
   pairs (S1+S3, S4+S5, S6+S7, S8+S9, S10+S11), eutils-check each block as it
   lands, paste it under `## Grounding`, and commit after each pair so a dead
   session loses at most two runs. Then land per §6.4, including any `rx`
   text the verdicts change (record a changed value as a decision *before*
   editing the constant — `/ground` hard rule). Patch bump per pair.
   **Done so far:** S2 (v1.13.1) — block in `## Grounding`, source comments on
   `statusFor` and `GAP_CUTOFF`; its inventory/ledger rows land with the rest
   in one pass at the end.
3. **Close:** tick §5, move this file to `done/`, repoint the source comments,
   move [001](001-cross-adaptation-rep-ranges.md) to `done/` as
   `done — decided and shipped inside 039`, repoint its links (031 §4, 034,
   the inventory), and set [031](031-adaptations-drill-down-read.md) to
   `planned` (019, 026, 039 all landed). Patch bump.
