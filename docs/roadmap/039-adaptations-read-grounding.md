# Roadmap: Adaptations read — ground what the page shows

**Label:** feature
**Status:** in progress — unit 1 shipped 2026-09-02 (v1.13.0). Scout runs: S2
landed (v1.13.1), S1 + S3 landed (v1.13.2); S4–S12 still to run, two at a
time (§6.5 step 2), S12 + S4 next — S12 is the muscle window, cut loose from
the program cycle on 2026-09-03 (§6.6). Gates
[031](031-adaptations-drill-down-read.md); retires
[001](001-cross-adaptation-rep-ranges.md).
**Depends:** 019
**Release:** 2.0.0
**Covers inventory rows:** 2.1, 2.2, 2.3, 2.6, 3.3, 3.4, 3.6, 3.7, 3.8, 3.9, 3.10, 7.1, 7.4, 7.5 in
[grounding-inventory.md](../grounding-inventory.md), plus one number that has no
row at all (`CYCLE_SET_TARGET`, replaced by `MUSCLE_WINDOW_DAYS` under §6.6).

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
check (`eutils esummary`, 2026-09-02; Crossref for the three papers outside
PubMed). Landed so far: **S1, S2, S3**. Still to run, two at a time (§6.5
step 2): S12 + S4, then S5, S6, S7, S8, S9, S10, S11.

### S1 — LEVEL_WEIGHT (fractional sets by muscle link level)

**Claim:** `LEVEL_WEIGHT = {1: 1, 2: 0.5, 3: 0.25}` — a logged set is credited to each muscle the exercise trains at 1.0 weighted set when the muscle is the primary mover, 0.5 when it is a secondary mover / synergist doing substantial work (triceps in a bench press, biceps in a row), 0.25 when it is a tertiary contributor or stabiliser (forearms in a deadlift, abs in an overhead press). The physiological claim: an indirect set delivers about half the growth/strength stimulus of a direct set, a tertiary set about a quarter. Every muscle-coverage number (Home map, per-adaptation maps, the "missing" ranking) is the sum of these weights against the 10-weighted-sets/muscle/week floor, so the tiers decide which muscles the app calls missing.
**Searched:** 2026-09-02 · **Verdict:** partially supported — level 2 = 0.5 is **supported**; level 3 = 0.25 is **convention only**, and the nearest measurements sit at zero
**Number to use:** level 1 = **1**; level 2 = **0.5** (pair-by-pair truth runs roughly 0.4–1.0; 0.5 is the pooled best fit and the only fraction ever tested against alternatives); level 3 = 0–0.25 — default **0**, i.e. collapse to two tiers. No study measures a quarter-set stimulus, the best-fit counting scheme in the literature has no tier below "meaningfully trained", and the minor contributors that were measured (hamstrings in squats, medial deltoid in bench press) did not grow — crediting them 0.25 hides gaps, the one error a "what's missing" read must not make.

#### Evidence
- `[literature]` The largest dose-response model classifies every set as *direct* ("the measured muscle(s) was likely to be the primary force generator in the exercise", e.g. pectoralis major in bench press) or *indirect* ("likely to be meaningfully trained but not the primary force generator (i.e., synergist)", e.g. triceps in bench press), then tests three counting schemes — total (indirect = 1), fractional (indirect = 0.5), direct (indirect = 0). "The relative evidence for the 'fractional' quantification method was strongest" for both hypertrophy and strength, and the authors conclude "distinguishing between direct and indirect sets appears essential". Two points for Tekiō: Pelland's "indirect" is exactly the level-2 definition (a synergist doing meaningful work), and the scheme has **no third tier** — a muscle below "meaningfully trained" is not an indirect set at all, so a stabiliser carries 0. Only 0, 0.5 and 1 were compared; 0.25 and 0.75 were never tested. Bayesian multi-level meta-regression, 67 studies, n = 2,058 (79 % male, mean age 25, mixed training status) — [Pelland et al. 2026, Sports Med](https://pubmed.ncbi.nlm.nih.gov/41343037/) (PMID verified via eutils; full text paywalled — definitions quoted from the abstract and the authors' preprint)
- `[literature]` A review of the EMG evidence on counting limb muscles during multi-joint lifts concludes "the best advice would be to view set-volume on a 1:1 basis, then use logical rationale and personal expertise", while noting hamstring activation is "markedly lower" than quadriceps in squats and leg presses — i.e. the right fraction is pair-specific and can approach zero for some links. Narrative review, EMG studies — lowest literature tier — [Schoenfeld, Grgic, Haun, Itagaki & Helms 2019, Sports (Basel)](https://pubmed.ncbi.nlm.nih.gov/31336594/) (PMID verified via eutils)
- `[literature]` Row vs curl, same arm-count and effort: elbow-flexor thickness +5.16 % from unilateral dumbbell rows vs +11.06 % from curls (p = 0.009) — the synergist set was worth **0.47** of the direct set. Within-subject (one arm each), 10 untrained men, 8 weeks, 2×/wk, 4–6 sets of 8–12 to failure — [Mannarino et al. 2021, J Strength Cond Res](https://pubmed.ncbi.nlm.nih.gov/31268995/) (PMID verified via eutils)
- `[literature]` Same comparison by region: after 8 weeks, dumbbell curls grew the elbow flexors proximally 5 % and distally 11 %; dumbbell rows grew them proximally 5 % and distally 1 %. The indirect set matches the direct set at one site and does almost nothing at the other. Chronic experiment: 9 untrained men, 8 weeks, 2×/wk (an acute swelling experiment in 16 trained men is in the same paper) — [Leitão et al. 2025, Sport Sci Health 21:3197–3205](https://link.springer.com/article/10.1007/s11332-025-01530-7) (no PMID; not indexed in PubMed)
- `[literature]` Pulldown vs curl runs the other way: a multi-joint programme (lat pulldown / bench press) and a single-joint programme (curls / extensions) grew elbow-flexor thickness +6.10 % vs +5.83 %, no difference — for this pair the indirect set was worth **≈ 1.0**. RCT, 29 untrained men (MJ 14 / SJ 15), 10 weeks — [Gentil, Soares & Bottaro 2015, Asian J Sports Med](https://pubmed.ncbi.nlm.nih.gov/26446291/) (PMID verified via eutils)
- `[literature]` Adding curls and extensions on top of pulldowns and presses added nothing: +6.5 % (MJ only) vs +7.04 % (MJ + SJ) thickness, no between-group difference. RCT, 29 untrained men, 10 weeks — [Gentil et al. 2013, Appl Physiol Nutr Metab](https://pubmed.ncbi.nlm.nih.gov/23537028/) (PMID verified via eutils)
- `[literature]` The same null result in **trained** men: MJ vs MJ + SJ for 8 weeks — "no significant difference in any variable" for upper-body strength or size; the authors call MJ-only "time-efficient". RCT, 20 trained men (10 / 10), 8 weeks — [de França et al. 2015, Appl Physiol Nutr Metab](https://pubmed.ncbi.nlm.nih.gov/26244600/) (PMID verified via eutils)
- `[literature]` Pooled, single- vs multi-joint exercise produces a "trivial" difference in whole-muscle hypertrophy of the limb muscles, with individual studies showing single-joint work grows specific *subdivisions* better. Systematic review + meta-analysis, 7 studies / 10 nested comparisons — [Rosa et al. 2023, Strength Cond J 45(1)](https://journals.lww.com/nsca-scj/fulltext/2023/02000/hypertrophic_effects_of_single__versus_multi_joint.5.aspx) (not in PubMed; journal abstract page)
- `[literature]` Bench press vs skull crusher for the triceps, by head: the bench-press groups grew the **lateral head** significantly more than the extension-only group; the extension groups grew the **long head** significantly more than the bench-only group; the medial head was "statistically similar between conditions". So the synergist fraction is ≈ 1 for one head and low for another; secondary readings of the figures put bench-only whole-triceps growth at roughly half the extension groups' (figure data, not in the abstract). RCT, 43 untrained young men in 4 groups (MJ, SJ, MJ + SJ, SJ + MJ), 10 weeks — [Brandão et al. 2020, J Strength Cond Res](https://pubmed.ncbi.nlm.nih.gov/32149887/) (PMID verified via eutils)
- `[literature]` Bench press alone for 10 weeks grew the pectoralis major, pectoralis minor, anterior deltoid and triceps brachii versus control, with the pectoralis major growing more than the triceps and pectoralis minor. The **medial deltoid** — the minor contributor in the lift — is the one measured muscle not reported as growing more than control. This is the only trial measuring a primary mover, its synergists and a minor contributor from the same sets. RCT, 24 men (13 trained bench only 3×/wk, 3–4 sets; 11 control), 10 weeks — [Lanza et al. 2024, J Bodyw Mov Ther 40:1417–1422](https://pubmed.ncbi.nlm.nih.gov/39593465/) (PMID verified via eutils)
- `[literature]` Over 24 weeks of bench press only (3 × 10 at 75 % 1RM, 3×/wk), triceps brachii and pectoralis major CSA both increased and followed the same time-course — the indirect stimulus is durable, not a beginner artefact. RCT (continuous vs periodic), 14 untrained young men — [Ogasawara et al. 2013, Eur J Appl Physiol](https://pubmed.ncbi.nlm.nih.gov/23053130/) (PMID verified via eutils)
- `[literature]` Squats for 10 weeks: knee extensors +4.9 % (full) / +4.6 % (half), gluteus maximus +6.7 % / +2.2 %, adductors +6.2 % / +2.7 %, **hamstrings no significant change in either group** (rectus femoris also unchanged). A muscle that "assists" a squat the way a level-3 link is meant to received no measurable growth stimulus. RCT, 17 males (8 / 9), 10 weeks, 2×/wk — [Kubo et al. 2019, Eur J Appl Physiol](https://pubmed.ncbi.nlm.nih.gov/31230110/) (PMID verified via eutils)
- `[literature]` Squats for 9 weeks grew quadriceps (+3.6 ± 1.5 cm² vs hip thrust) and adductors (+2.5 ± 0.7 cm²) and glutes (similar to hip thrust), while "hamstrings growth was equivocal across both conditions" (0.1 ± 0.6 cm² between-group). Second independent zero for the same tertiary pair. RCT, 34 untrained college-aged adults (squat 16 / hip thrust 18), 9 weeks — [Plotkin et al. 2023, Front Physiol](https://pubmed.ncbi.nlm.nih.gov/37877099/) (PMID verified via eutils)
- `[literature]` Fractional sets have become the field's working unit: a pre-registered multi-site equivalence trial prescribed "9 fractional sets per week" vs "36 fractional sets per week" in previously trained adults and found the two statistically equivalent for arm and thigh muscle area (0.023, 90 % CI −0.044 to 0.091). Bears on S3 (how much volume), cited here only because it shows the unit in use. **Preprint, not peer-reviewed**; 22 sites, 120 randomised / 87 completed, 12 weeks — [Steele, Gschneidner, Carlson & Fisher 2026, SportRxiv](https://sportrxiv.org/index.php/server/preprint/view/810)
- `[practitioner consensus]` Indirect stimulus is real and large enough to change programming. Israetel sets rear-delt MV and MEV at 0–4 sets/week "because the rear delts can get enough work to grow robustly … through proper back training", and warns that "if you reduce or remove upper body pressing movements from your program, the volume landmarks for the triceps will climb substantially"; Galpin: a chin-up "is primarily working back but indirectly working biceps". Held by Israetel and Galpin — [RP rear-delt guide](https://rpstrength.com/blogs/articles/rear-delt-hypertrophy-training-tips), [RP triceps guide](https://rpstrength.com/blogs/articles/triceps-hypertrophy-training-tips), [Galpin, Huberman Lab guest series pt 2](https://podcastnotes.org/huberman-lab/guest-series-dr-andy-galpin-optimal-protocols-to-build-strength-grow-muscles-part-2-huberman-lab/). No literature contradicts it (Brandão, Lanza, Ogasawara).
- `[single-practitioner position]` Do **not** count indirect sets; discount the *target* instead. "We only count sets where the target muscle is the prime mover or isolation exercises specifically targeting that muscle … when we say '18 sets is the MRV for triceps,' we mean direct triceps work only. We've already factored in the indirect volume from pressing movements, reducing our estimates." Israetel only (RP's written landmarks); Galpin disagrees (below). RP's own podcast pages, written by staff who are not roster members (Milo Wolf; "Dr. Pak"), teach the opposite bookkeeping explicitly — "Bench press: 1.0 sets for chest, 0.5 sets for front delts and triceps … Rows: 1.0 sets for lats, 0.5 sets for rear delts and biceps … Squats: 1.0 sets for quads, 0.5 sets for glutes" — so RP as an organisation holds both models at once — [RP volume landmarks](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth), [RP "11-set rule" page](https://rpstrength.com/blogs/podcasts/training-frequency-decoded-the-11-set-rule-every-lifter-should-know), [RP "truth about volume" page](https://rpstrength.com/blogs/podcasts/the-truth-about-volume-how-little-training-you-need-to-grow)
- `[single-practitioner position]` Count-or-don't is the lifter's call: "you can count it or not towards working set[s] — really depends on goals", against a baseline of "10 working sets per muscle group, per week (or up to 25 if highly trained)". Galpin only; Israetel says never count — [Galpin, Huberman Lab guest series pt 2](https://podcastnotes.org/huberman-lab/guest-series-dr-andy-galpin-optimal-protocols-to-build-strength-grow-muscles-part-2-huberman-lab/)
- `[single-practitioner position]` No roster member, no RP page and no located study uses a **quarter-set** tier. Nobody holds 0.25; it exists only in `LEVEL_WEIGHT`.

#### Where they split
Three forks, and only the third is Tekiō's alone.

**1. Weight the set, weight the target, or let the lifter decide.** Pelland (and RP's podcast pages) put the discount on the *set* (0.5); Israetel's written landmarks put it on the *target* (direct-only counts against a pre-reduced MEV/MRV that differs per muscle); Galpin leaves it to the lifter per exercise. Everyone agrees the stimulus is real — this is a bookkeeping disagreement, not a physiological one. Tekiō has **one** floor (10/week) for every muscle, so the target-discount model is not available to it without a per-muscle target table; set-weighting is the only scheme that keeps a single denominator. That puts Tekiō on Pelland's side by construction, and 0.5 is his best-fit value.

**2. One constant or one fraction per link.** Inside the literature the level-2 fraction is pair-specific: ≈ 1.0 for pulldown → biceps (Gentil 2015) and for bench → lateral-head triceps (Brandão), ≈ 0.4–0.5 for row → biceps (Mannarino, Leitão), low for bench → long-head triceps. Schoenfeld 2019 says as much: default 1:1, then adjust per muscle. Pelland's 0.5 is the pooled compromise that beat 0 and 1 — it is a model fit, not a measured constant. The fork for Tekiō: keep one number per level, or move the fraction into the per-link `contribution` column of `exercise_muscle_groups`. Keep the constant at 0.5 now; the per-link column is the upgrade path. Do not replace 0.5 with an average of the pair results above — no study or practitioner holds such a number.

**3. Zero or a quarter for level 3.** Nobody outside this codebase holds 0.25. Pelland's scheme drops anything below "meaningfully trained" to 0; the three measured minor-contributor pairs (hamstrings in squats twice, medial deltoid in bench) show no growth over 9–10 weeks. The decision this forces: **collapse to two tiers** — but first audit the link table, because the change only removes stimulus that is not there if level 3 is reserved for stabilisers and minor contributors. Any real synergist currently tagged level 3 (RP's own examples: glutes in squats, rear delts in rows, front delts in bench) must be relabelled level 2 before the tier is zeroed, or the edit deletes real stimulus. If the caller keeps 0.25 anyway, it ships as a labelled convention, not as a finding.

#### Caveats
- Population mismatch: every synergist trial is 8–10 weeks in untrained men with n = 9–43, almost all on biceps and triceps. The one trained-men trial (de França, n = 20) found compounds cover the synergists at least as well in trained lifters as in novices, so the level-2 credit is not a beginner artefact. Pelland's pool is 79 % male, mean age 25, mixed status. One trained adult sits somewhere in the 0.4–1.0 spread per pair, not at 0.5.
- The fraction is hypertrophy-shaped. Strength gains in the same trials were exercise-specific (Mannarino: 10RM improved most on whatever exercise the arm trained), so crediting a row set as 0.5 of biceps *strength* is a looser claim than 0.5 of biceps *size*. S3 inherits this when it pools rep bands under one floor.
- A per-muscle read cannot see regions: bench alone grows the lateral head of the triceps ≈ fully and the long head little; rows grow the proximal biceps and not the distal. 0.5 is right on average and wrong at the head level, and the app should not pretend otherwise.
- 0.5 was never optimised. Pelland compared 0, 0.5 and 1 only; "fractional fits best" means 0.5 beat both extremes, not that it beats 0.4 or 0.6.
- The level-3 evidence is thin: two squat trials (hamstrings, n = 17 and 34) and one bench trial (medial deltoid, n = 24). Enough to say a quarter set is unmeasured and the nearest measurements are zero; not enough to say *every* stabiliser gets nothing. The bracing muscles the claim names (abs, erectors, forearms) simply have no growth data from compound lifts without direct work.
- What would move this number: a Pelland-style model comparison that includes 0.25 and 0.75 (would settle level 2's exact value); any trial showing a stabiliser grows from compound lifts alone (would resurrect a level-3 weight above 0); filling `exercise_muscle_groups.contribution` per link from the pair data above (would retire the level constant altogether).

#### Source comment
```
// LEVEL_WEIGHT — level 2 (synergist) = 0.5: the best-fit "fractional" set counting in the largest dose-response
// model (Pelland 2026) and synergist growth of ~0.4–1.0 × direct in trials (Mannarino 2021, Gentil 2015,
// Brandão 2020). Level 3 = 0 (convention band 0–0.25): no study measures a quarter-set stimulus and measured
// minor contributors did not grow (hamstrings in squats — Kubo 2019, Plotkin 2023; medial deltoid in bench —
// Lanza 2024). See docs/roadmap/039-adaptations-read-grounding.md#grounding
```

**Decision (S1, 2026-09-02):** level 2 stays **0.5** (supported). Level 3 stays
**0.25 for now, labelled a convention.** The scout's default is 0, but its
precondition is not met: an audit of `exercise_muscle_groups` the same day
found 24 stimulus links at level 3, and roughly ten of them are real synergists
(adductors in squats, upper back in rows, face pulls and reverse flys) that
must move to level 2 before the tier can be zeroed, or the edit deletes real
stimulus. The relabel is Peter's call on his own anatomy tags —
[042](042-level-3-link-audit.md) carries the list and the proposed level per
link, and zeroing the tier lands there. The bookkeeping fork is settled by
construction: one floor for every muscle means the discount sits on the *set*
(Pelland), not on the *target* (Israetel's written landmarks).

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

### S3 — WEEKLY_SET_FLOOR / CYCLE_SET_TARGET as an adaptation-agnostic total

**Claim:** 10 level-weighted hard sets per muscle per week (60 per 6-week cycle), counted across every rep range — a 3-rep strength set, a 10-rep hypertrophy set, a 20-rep endurance set and a power set each worth one set — is a defensible floor for *total* muscle stimulus, because hypertrophy is the most volume-hungry of the four muscle-linked qualities and hard sets grow muscle about equally across the load spectrum. Drives Home's per-muscle fill (`muscleStimulus().total ÷ WEEKLY_SET_FLOOR × weeks`) and the "what's missing" ranking. The *value* 10 is settled in 010 D10 and is not re-run here; this run rules on the *pooling*.
**Searched:** 2026-09-02 · **Verdict:** partially supported — pooling across 6–30+ reps is **supported**; pooling 1–5-rep heavy sets in full is **partially supported** (default: count in full); pooling power sets is **not supported** (default: exclude from the total); "meeting the floor covers strength, endurance and power too" is **partially supported** — it covers their *volume*, it is silent on strength's load, endurance's rep range and power's velocity.
**Number to use:** 10–20 pooled hard sets/muscle/week — default **10 (unchanged)**, cycle **60 (unchanged; honest band 50–60 per 010)**, where "hard set" = any resistance set at 1–30+ reps taken within a few reps of failure, and power-tagged sets (jumps, throws, swings — never near failure) count in `byQuality.power` only, at **0** toward the pooled total. A set near failure is the unit the volume literature is built on; a jump is not that unit, and no study gives it a fraction.

#### Evidence

*(a) Is a hard set worth the same across loads?*

- `[literature]` Hypertrophy is similar between low-load (≤60 % 1RM) and high-load (>60 % 1RM) training taken to failure; 1RM strength is significantly greater with high load. Systematic review + meta-analysis, 21 studies, mixed training status — [Schoenfeld, Grgic, Ogborn & Krieger 2017, J Strength Cond Res](https://pubmed.ncbi.nlm.nih.gov/28834797/) (PMID verified via eutils)
- `[literature]` No hypertrophy difference between low (>15 RM), moderate (9–15 RM) and high (≤8 RM) loads to failure (p = 0.113–0.469); strength superior for high and moderate vs low load (SMD 0.60–0.63 and 0.34–0.35). Network meta-analysis, 28 studies, n = 747 healthy adults, trained and untrained — [Lopez et al. 2021, Med Sci Sports Exerc](https://pubmed.ncbi.nlm.nih.gov/33433148/) (PMID verified via eutils)
- `[literature]` The *set* is a valid unit of hypertrophy volume "when the repetition range lies between 6 and 20+" and sets are taken to failure or near it. This is the review that licenses "a set is a set" — and it stops at 6 reps. Systematic review, 14 studies, resistance-trained 18–35 y — [Baz-Valle et al. 2021 (epub 2018), J Strength Cond Res](https://pubmed.ncbi.nlm.nih.gov/30063555/) (PMID verified via eutils)
- `[literature]` With volume load equated, 40 %, 60 % and 80 % 1RM grew the quadriceps equally (20.5 / 20.4 / 19.5 %) and the elbow flexors equally (25.3 / 25.1 / 25.0 %); 20 % 1RM grew less than half as much (8.9 % / 11.4 %). The floor of load-independence is ~30–40 % 1RM, not zero. Within-subject contralateral-limb trial, 30 untrained men, 12 weeks — [Lasevicius et al. 2018, Eur J Sport Sci](https://pubmed.ncbi.nlm.nih.gov/29564973/) (PMID verified via eutils)
- `[literature]` In well-trained men, 25–35 reps/set and 8–12 reps/set produced the same thickness gains (elbow flexors 8.6 vs 5.3 %, quads 9.5 vs 9.3 %, ns); squat 1RM favoured heavy (19.6 vs 8.8 %); upper-body endurance favoured light (+16.6 vs −1.2 %). RCT, 18 resistance-trained men, 8 weeks — [Schoenfeld et al. 2015, J Strength Cond Res](https://pubmed.ncbi.nlm.nih.gov/25853914/) (PMID verified via eutils)
- `[literature]` For hypertrophy "all prescriptions comparably promoted" growth; for strength, loads >80 % 1RM maximised gains (top-ranked SMD 1.60). Bayesian network meta-analysis, 178 studies (n = 5,097) strength / 119 studies (n = 3,364) hypertrophy — [Currier et al. 2023, Br J Sports Med](https://pubmed.ncbi.nlm.nih.gov/37414459/) (PMID verified via eutils)
- `[literature]` **The heavy end (1–5 reps), set-equated:** 4 × 3–5 reps at ~90 % 1RM grew lean arm mass *more* than 4 × 10–12 at ~70 % (5.2 vs 2.2 %) and bench 1RM more (14.8 vs 6.9 %). A heavy set counted per set is at least a full set. RCT, 29 resistance-trained men (14 / 15), 8 weeks — [Mangine et al. 2015, Physiol Rep](https://pubmed.ncbi.nlm.nih.gov/26272733/) (PMID verified via eutils)
- `[literature]` **The heavy end, volume-load-equated:** 7 × 3RM and 3 × 10RM produced no significant difference in biceps thickness; strength favoured 3RM. Read per set this hints a triple is worth ~0.4 of a 10-rep set, but the design cannot separate that from the extra sets — it is a caveat on Mangine, not a contradiction. RCT, 17 resistance-trained men, 8 weeks — [Schoenfeld et al. 2014, J Strength Cond Res](https://pubmed.ncbi.nlm.nih.gov/24714538/) (PMID verified via eutils)
- `[literature]` The classic three-zone trial: 3–5RM and 9–11RM both hypertrophied all three fibre types; 20–28RM did not, but was the only zone to improve local endurance and aerobic power. RCT with control, 32 untrained men, 8 weeks — [Campos et al. 2002, Eur J Appl Physiol](https://pubmed.ncbi.nlm.nih.gov/12436270/) (PMID verified via eutils)
- `[literature]` The repetition-continuum re-examination: hypertrophy can be obtained across a wide loading spectrum, strength is load-specific, local endurance favours light loads. Narrative review — lowest literature tier — [Schoenfeld, Grgic, Van Every & Plotkin 2021, Sports (Basel)](https://pubmed.ncbi.nlm.nih.gov/33671664/) (PMID verified via eutils)

*(b) Does a set that stops short of failure still count in full?*

- `[literature]` Heavy sets do not need failure: quadriceps CSA +7.7 % not-to-failure vs +8.1 % to failure at high load (1RM +33.4 vs +33.8 %). Light sets do: +2.8 % not-to-failure vs +7.8 % to failure at low load. Within-subject, 4 conditions, 25 untrained men, 8 weeks — [Lasevicius et al. 2022, J Strength Cond Res](https://pubmed.ncbi.nlm.nih.gov/31895290/) (PMID verified via eutils)
- `[literature]` In trained lifters, 1–2 RIR matched failure for quadriceps thickness (+0.182 vs +0.181 cm). RCT, within-subject legs, 18 resistance-trained (12 M / 6 F), 8 weeks — [Refalo et al. 2024, J Sports Sci](https://pubmed.ncbi.nlm.nih.gov/38393985/) (PMID verified via eutils)
- `[literature]` Failure vs non-failure: trivial advantage for failure (ES 0.19, 95 % CI 0.00–0.37); momentary failure vs non-failure ES 0.12 (CI −0.13–0.37, ns). Systematic review + meta-analysis, 15 studies, healthy adults — [Refalo et al. 2023, Sports Med](https://pubmed.ncbi.nlm.nih.gov/36334240/) (PMID verified via eutils)
- `[literature]` Failure vs non-failure: no difference for strength (ES −0.09) or hypertrophy (ES 0.22, CI −0.11–0.55); trained subgroup shows a small failure benefit for hypertrophy (ES 0.15, CI 0.03–0.26). Systematic review + meta-analysis, 15 studies, young adults — [Grgic et al. 2022, J Sport Health Sci](https://pubmed.ncbi.nlm.nih.gov/33497853/) (PMID verified via eutils)
- `[literature]` Continuous dose-response: hypertrophy slopes for RIR were negative with CIs excluding zero (more growth the closer to failure, "modest" fit); strength slopes contained zero ("similar across a wide range of RIR"). Series of multilevel meta-regressions; study count not stated in the abstract — [Robinson et al. 2024, Sports Med](https://pubmed.ncbi.nlm.nih.gov/38970765/) (PMID verified via eutils)
- `[literature]` Velocity-loss thresholds: higher in-set fatigue → more hypertrophy (b = 0.006 per % VL, CI 0.001–0.012) but worse countermovement jump (b = −0.040, CI −0.079 to −0.001), sprint and velocity; strength and endurance gains unaffected by VL magnitude. Systematic review + meta-analysis, 18 acute + 19 longitudinal studies — [Jukic et al. 2023, Sports Med](https://pubmed.ncbi.nlm.nih.gov/36178597/) (PMID verified via eutils)
- `[literature]` Stopping at 20 % velocity loss (≈40 % fewer reps than 40 % VL) gave similar squat strength, *greater* CMJ gain (+9.5 vs +3.5 %), preserved type IIX fibres — and *less* vastus lateralis hypertrophy. Fatigue-free sets are power sets, and power sets grow less muscle. RCT, 22 young men (12 / 10), 8 weeks — [Pareja-Blanco et al. 2017, Scand J Med Sci Sports](https://pubmed.ncbi.nlm.nih.gov/27038416/) (PMID verified via eutils)

*(c) Is the most volume-hungry quality's floor the right umbrella?*

- `[literature]` Volume raises both hypertrophy and strength (100 % posterior probability) with diminishing returns "considerably more pronounced" for strength; fractional set counting fit best. Bayesian meta-regression, 67 studies, n = 2,058 — [Pelland et al. 2026, Sports Med](https://pubmed.ncbi.nlm.nih.gov/41343037/) (PMID verified via eutils)
- `[literature]` Strength's floor is far below 10: one set at ~70–85 % 1RM, 2–3×/week, to high effort, significantly raises 1RM in trained men. Systematic review + meta-analysis, 6 studies — [Androulakis-Korakakis, Fisher & Steele 2020, Sports Med](https://pubmed.ncbi.nlm.nih.gov/31797219/) (PMID verified via eutils); powerlifters progress on ~3–6 sets of 1–5 reps/week above 80 % 1RM — [Androulakis-Korakakis et al. 2021, Front Sports Act Living](https://pubmed.ncbi.nlm.nih.gov/34527944/) (PMID verified via eutils)
- `[literature]` Strength's volume curve is shallow: low weekly sets ES 0.82, medium 0.98, high 1.01. Meta-analysis, 9 studies / 61 treatment groups — [Ralston et al. 2017, Sports Med](https://pubmed.ncbi.nlm.nih.gov/28755103/) (PMID verified via eutils)
- `[literature]` Power's dose is counted in jumps, not sets: minimal effective dosage "4 weeks (8 sessions), and 92 weekly jumps". Systematic review + meta-analysis, 11 studies, n = 744 — youth athletes grouped by maturity, so a population mismatch — [Ramirez-Campillo et al. 2023, Sports Med Open](https://pubmed.ncbi.nlm.nih.gov/37036542/) (PMID verified via eutils). Across the lifespan (8–73 y), reactive-strength gains favoured >7 weeks and 3 sessions/week, but "none of the analysed training variables explained the effects" in meta-regression — no set-count dose-response exists for power. Systematic review + meta-analysis, 61 studies, n = 2,576 — [Ramirez-Campillo et al. 2023, Sports Med](https://pubmed.ncbi.nlm.nih.gov/36906633/) (PMID verified via eutils)
- `[literature]` Local muscular endurance is rep-range-specific (Schoenfeld 2015: +16.6 % light vs −1.2 % heavy; Campos 2002: only the 20–28RM zone improved it). **No systematic review or meta-analysis of a weekly-set dose-response for local muscular endurance was located** (searched 2026-09-02); the pooled floor cannot claim to cover it.

*(d) The roster*

- `[single-practitioner position]` A working set counts toward the landmarks only inside "Load range: 30–85 % of 1RM, Rep range: 5–30 reps per set, Effort level: 0–4 reps in reserve", and within that band "a 5-rep set and a 30-rep set produce similar stimulus and fatigue". Sets below 5 reps / above 85 % 1RM, and any set at ≥5 RIR, are outside the model. Israetel only; Galpin's band starts at 4 reps and he is silent on pooling — [RP volume landmarks](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth)
- `[single-practitioner position]` Hypertrophy: "target 10 working sets per muscle group, per week (or up to 25 if highly trained)", "reps between 4–30 per set, stopping about 2 reps short of failure". Strength: the 3-to-5 concept — "3–5 exercises, 3–5 repetitions per set, 3–5 working sets, rest 3–5 minutes", 3–5 days/week; "you don't have to go to failure to see strength gains". A per-session prescription with no per-muscle weekly floor, and no statement on whether those heavy sets count toward the 10. Galpin only — [Huberman Lab guest series pt 2 (notes)](https://podcastnotes.org/huberman-lab/guest-series-dr-andy-galpin-optimal-protocols-to-build-strength-grow-muscles-part-2-huberman-lab/)
- `[practitioner consensus]` Power work is quality work, programmed apart from volume: Galpin puts it at 40–70 % 1RM, "quick, explosive", never to fatigue; Israetel's band requires 0–4 RIR, which a jump or swing set never meets. Neither counts a power set as a hypertrophy working set. Held by Galpin and Israetel — [Huberman Lab, Galpin episode](https://www.hubermanlab.com/episode/dr-andy-galpin-how-to-build-strength-muscle-size-and-endurance), [RP volume landmarks](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth)

#### Where they split

Two forks, one real.

**1. Does a heavy triple fill the muscle's floor?** Israetel's landmark model says no — sets under 5 reps or over 85 % 1RM are not "volume" and sit in a separate strength bucket. Galpin's hypertrophy band (4–30 reps) admits a 4-rep set and says nothing about a triple, while his 3-to-5 rule programs strength per *session*, not per muscle per week. The literature sides with counting it: the one set-equated trained-men trial (Mangine 2015) found 4 × 3–5 grew as much or more than 4 × 10–12, and Campos 2002 found 3–5RM fibres grew like 9–11RM fibres; Schoenfeld 2014's 7 × 3 ≈ 3 × 10 is the only hint that a triple buys less per set, and its design cannot say so. Baz-Valle's set-as-unit review stops at 6 reps, so below that the per-set worth is honestly a band, ~0.4–1.0. **Tekiō must choose: pool 1–5-rep sets in full, or discount/exclude them as Israetel does.** Pool them in full — it is the doctrine's own rule (§6.0, "a set is a set"), the trained-men data lean that way, and any discount would be a number nobody holds. Do not resolve this by counting triples at 0.5: that is Pelland's *indirect-muscle* convention borrowed for a different question.

**2. Does a power set fill it?** No split — this is the rare case where both practitioners and the literature agree, and the app disagrees with all of them. A jump, throw or swing set is never near failure; Israetel's band excludes it by RIR, Galpin programs it as a separate quality, and the trials (Pareja-Blanco 2017; Lasevicius 2018 at 20 % 1RM; Lasevicius 2022 low-load not-to-failure at +2.8 %) show far-from-failure and very light sets grow a fraction of a hard set, with the fraction unmeasured for ballistic work. **Tekiō must choose: count power sets in the pooled total (simple, over-counts), or count them in `byQuality.power` only (honest, one branch in `muscleStimulus`).** Exclude them. The pooled floor is a *hard-set* floor — that is what its 10 was grounded on — and a muscle trained only with swings reading "fed" on Home would be a costume on one fact (P2). The power map still shows those sets, so nothing is hidden.

The claim's second half — "meeting 10 pooled sets covers the other three qualities" — splits by *dimension*, not by person. Strength needs less volume than hypertrophy (Pelland's steeper flattening; Androulakis-Korakakis; Ralston), so 10 pooled sets is enough *volume* for it; but strength is load-specific (Lopez SMD 0.60; Currier >80 % 1RM), endurance is rep-range-specific (Schoenfeld 2015, Campos), and power is velocity-specific (Jukic, Pareja-Blanco). The pooled total answers "has this muscle done enough hard work" and nothing else; the per-quality maps answer the specificity questions. That division of labour is exactly §6.0's design, and the total should be labelled as *hard sets*, not as coverage of four qualities.

#### Caveats

- Population mismatch: the load-equivalence trials are small and mostly untrained (Lasevicius 2018 n = 30, 2022 n = 25; Campos n = 32; Pareja-Blanco n = 22); the trained-men trials that decide the heavy end are n = 17–29 (Schoenfeld 2014, 2015; Mangine; Refalo 2024). The meta-analyses pool young adults (Pelland: 79 % male, mean age 25). One trained adult sits inside the bands, not on a point.
- **The app cannot see effort.** Tekiō logs reps and load, not RIR or velocity loss. The pooling therefore *assumes* every non-power set is a hard set. The literature says that assumption fails for light sets stopped early (Lasevicius 2022: +2.8 vs +7.8 %) and holds for heavy sets stopped 1–2 short (Refalo 2024). A 20-rep set logged at 8 RIR is over-counted and nothing here can catch it; an RIR field would.
- Light loads have a floor: below ~30 % 1RM a set to failure grows less (Lasevicius 2018 at 20 %). Any set the app classifies as muscular endurance at very light load is over-counted by an unknown amount; there is no way to see load-relative-to-1RM without a 1RM.
- The 1–5-rep verdict rests on two small trained-men trials that point different ways when read per set. A set-equated trial of 1–5 vs 8–12 reps with direct muscle measures in trained adults would settle it; until then full credit is the default, not a finding.
- Power exclusion is a classification change, not a new number: it moves sets between `total` and `byQuality.power` and depends on the keyword rule (row 2.6, S4) and the one override column being right. Today only one override exists (Dead Hang → muscular_endurance), so the practical effect on Home is small; that is a reason to do it cheaply, not a reason to skip it.
- The cycle arithmetic (10 × 6 = 60 with a half-volume deload → honest 50–60) is unchanged from 010 and not re-argued here.
- What would move this number: an RIR or velocity capture (would let the app discount sets far from failure instead of assuming); a set-equated heavy-vs-moderate trained trial (would fix the 1–5-rep worth); any dose-response for local muscular endurance (would say whether 10 pooled sets covers it); a decision to switch the read from "adequate" to "optimal" (010 §Where they split) would move the floor to 12–20 and the cycle target with it.

#### Source comment
```
// 10 — weekly hard-set floor per muscle, pooled across every rep range (1–5 / 6–15 / 16–30+) at full
// value: hypertrophy per hard set is load-independent from ~30–40 % 1RM up (Schoenfeld 2017, Lopez 2021,
// Lasevicius 2018; set = unit, Baz-Valle 2018) and it is the volume-hungriest quality (Pelland 2026,
// Androulakis-Korakakis 2020). Power-tagged sets are NOT hard sets — they count in byQuality.power only
// (Pareja-Blanco 2017, Jukic 2023). Says nothing about strength's load, endurance's rep range or
// power's velocity — the per-quality maps do. See docs/roadmap/039-adaptations-read-grounding.md#grounding

// 60 — WEEKLY_SET_FLOOR × CYCLE, hard sets pooled across rep ranges, power sets excluded; with a
// half-volume deload the honest cycle band is 50–60 (010). Value grounded in 010 D10, pooling in
// 039 S3. See docs/roadmap/039-adaptations-read-grounding.md#grounding
```

**Decision (S3, 2026-09-02):** the floor is a *hard-set* floor. `WEEKLY_SET_FLOOR = 10`
now carries the pooling claim and `CYCLE_SET_TARGET` is derived from it
(`× CYCLE`), both unchanged in value. Sets at 1–5 reps count in full (the
literature leans that way and a discount would be a number nobody holds).
**Power sets leave `total`:** `muscleStimulus` counts a power set (override or
keyword) in `byQuality.power` only, so a muscle trained only with swings no
longer reads "fed" on Home. The §6.0 bracket therefore holds over the three
hard qualities, with power outside it. The muscle sheet says *hard sets* and
that power sets count on their own map; its two PLACEHOLDER marks on the
stimulus target are gone. Not addressed, by design: the app cannot see effort,
so every non-power set is assumed hard (an RIR field would fix that — not this
brief).

**Amended 2026-09-03 (§6.6):** the `× CYCLE` above is retired. The rate stays;
the window it multiplies becomes `MUSCLE_WINDOW_DAYS` (S12), and
`CYCLE_SET_TARGET` goes with it.

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
- [ ] The muscle read's window is its own grounded constant (§6.6, S12), not
      the program's `CYCLE`; `CYCLE_WINDOW_DAYS` and `CYCLE_SET_TARGET` are
      gone and Home names the window and the weekly rate on screen.
- [ ] Every covered inventory row names this brief as its carrier and shows a
      current verdict; `WEEKLY_SET_FLOOR` and `MUSCLE_WINDOW_DAYS` have rows.
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
| `muscleStates` ([fusedRead.ts:57](../../src/lib/fusedRead.ts#L57)) — its own loop, 42 d, all sets, ÷ `CYCLE_SET_TARGET` | Built on the shared function; window = rolling `CYCLE_WINDOW_DAYS` (→ `MUSCLE_WINDOW_DAYS`, §6.6); `sets` = the sum of the four muscle-linked qualities (→ the three hard ones, S3) |
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
(Done 2026-09-02; superseded on 2026-09-03 — the `× CYCLE` goes too, §6.6.)
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

### 6.3 The scout runs — twelve, one decision each, two at a time

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
| S12 | new row | A muscle's stimulus is judged over a **rolling 14-day window** against twice the weekly floor (20 hard sets), shown as "10/wk" (§6.6): long enough that a muscle trained once a week does not read as untouched on the morning of its session, short enough that a muscle silent for the whole window has genuinely missed its dose. Return the honest band for the window length and the default — expected literature: per-muscle training-frequency meta-analyses (Schoenfeld 2016, 2019), detraining time-courses (Bosquet 2013, Ogasawara 2013), how long one session's muscle-protein-synthesis response lasts | `MUSCLE_WINDOW_DAYS` (new, in app.ts beside `QUALITY_STALENESS_DAYS`) · `14`, replacing `CYCLE_WINDOW_DAYS = CYCLE × 7` [fusedRead.ts:25](../../src/lib/fusedRead.ts#L25) · `42`; target `WEEKLY_SET_FLOOR × MUSCLE_WINDOW_DAYS / 7` · `20`, replacing `CYCLE_SET_TARGET` · `60` |

Hypertrophy's `rx` (row 3.5) is **out**: grounded in 011 and locked to the
target (D3). Do not re-run it.

**Attribution already on the page:** `AdaptationGuide.tsx` ends with *"Based
on the Huberman Lab × Dr. Andy Galpin guest series on physical adaptations."*
That is a practitioner attribution for all seven blocks at once, in a collapsed
card. After S4–S10 land, that line either becomes the honest provenance
(literature where found, `convention` where not) or goes; the per-card InfoTip
carries no attribution at all today.

### 6.4 Landing the blocks — the four `/ground` destinations

1. **This brief:** paste all twelve blocks verbatim under a `## Grounding` section
   placed before `## Acceptance` (i.e. between §4 and §5), one `###` per run.
2. **The constants:** source comments on `LEVEL_WEIGHT`, `WEEKLY_SET_FLOOR`,
   `MUSCLE_WINDOW_DAYS`, each `rx` block and `ADAPTATION_PRINCIPLE`, every one
   pointing at `docs/roadmap/039-adaptations-read-grounding.md#grounding`
   (repoint to `done/` when the brief moves — `grep -rn 039- src/`).
3. **The inventory** ([grounding-inventory.md](../grounding-inventory.md)):
   rows 2.1–2.3, 2.6, 3.3, 3.4, 3.6–3.10, 7.1, 7.5 → carrier `039`, verdict updated, and the
   `Where` line numbers refreshed (7.1 says `utils.ts:479`, now 490; 7.5 says
   `lib/adaptations.ts:135-139`, now 146-150 — both move again after §6.1).
   Row 7.4 struck as retired (§6.2). New row **7.7** for `WEEKLY_SET_FLOOR`
   as the pooled total (S3) and **7.8** for `MUSCLE_WINDOW_DAYS` (S12). New
   ledger rows D13+ for each *decision* (the pooling, the 0.25 tier, the ramp,
   the window leaving the cycle, each attribution kept or removed).
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
   pairs (S1+S3 done; then S12+S4, S5+S6, S7+S8, S9+S10, S11 alone — reordered
   2026-09-03 so the window lands before the `rx` blocks), eutils-check each
   block as it lands, paste it under `## Grounding`, and commit after each pair so a dead
   session loses at most two runs. Then land per §6.4, including any `rx`
   text the verdicts change (record a changed value as a decision *before*
   editing the constant — `/ground` hard rule). Patch bump per pair.
   **Done so far:** S2 (v1.13.1) — block in `## Grounding`, source comments on
   `statusFor` and `GAP_CUTOFF`. S1 + S3 (v1.13.2) — blocks; `LEVEL_WEIGHT`
   comment carries the convention label (level 3 zeroing waits on
   [042](042-level-3-link-audit.md)); `WEEKLY_SET_FLOOR` created and
   `CYCLE_SET_TARGET` derived from it, power sets out of `total`, sheet
   PLACEHOLDERs replaced. Inventory/ledger rows for all three land with the
   rest in one pass at the end.
3. **Close:** tick §5, move this file to `done/`, repoint the source comments,
   move [001](001-cross-adaptation-rep-ranges.md) to `done/` as
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
([fusedRead.ts:25](../../src/lib/fusedRead.ts#L25), 42 days) and
`CYCLE_SET_TARGET = WEEKLY_SET_FLOOR × CYCLE`
([app.ts:99](../../src/constants/app.ts#L99), 60). `CYCLE` is the program's
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
