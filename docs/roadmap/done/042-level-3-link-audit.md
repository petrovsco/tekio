# Roadmap: Level-3 muscle links — audit, relabel, then zero the tier

**Label:** feature
**Status:** done — decided and shipped 2026-09-03 (v1.14.0). Peter ticked
every row in §2 in one interactive pass; 12 links moved to level 2, the
duplicate Face Pull exercise was merged into Face Pulls, and `LEVEL_WEIGHT[3]`
is now 0. Created 2026-09-02 from
[039](039-adaptations-read-grounding.md) scout run S1.
**Release:** 2.0.0

---

## The plain summary

Every logged set is credited to each muscle the exercise trains, weighted by
the muscle's link level: level 1 counts as one set, level 2 as half, level 3
as a quarter (`LEVEL_WEIGHT` in `src/lib/utils.ts`). Scout run S1 in 039
grounded those weights on 2026-09-02. Half a set for a level-2 synergist is
**supported** (Pelland 2026's best-fit counting; row-vs-curl and bench-vs-
extension trials). A quarter set for level 3 is **convention only**: no study
measures a quarter-set stimulus, and the minor contributors that were measured
(hamstrings in squats, the medial deltoid in the bench press) did not grow at
all. The scout's default is **0** — collapse to two tiers.

It could not be applied on the spot, because it comes with a precondition:
zeroing the tier only removes stimulus that is not there **if level 3 is
reserved for stabilisers and minor contributors.** An audit of
`exercise_muscle_groups` the same day found 24 stimulus links at level 3, and
about ten of them are real synergists that belong at level 2. Zeroing the
tier first would delete real stimulus from the read. So: relabel first, then
zero. The relabel is a judgement about the catalogue's own anatomy tags, which is why
this is a brief with a checklist and not a migration.

The full evidence and the fork it settles are in
[039 §Grounding, run S1](../../grounding/039-adaptations-read.md#grounding). Grounding
blocks travel with their brief and are never copied; this file only points.

---

## 1. What changes on Home if the proposals below are taken

Sets logged in the last 42 days on the level-3 stimulus links, and what each
relabel moves (a link going 3 → 2 gains 0.25 per set; a link staying at 3 loses
0.25 per set once the tier is zeroed):

| Muscle | Sets on level-3 links, last 42 d | Move if proposals taken |
|---|---|---|
| Upper Back / Traps | 48 (rows 9, pull-ups 9, overhead press 8, reverse fly 4, face pulls 18) | **+12** weighted sets |
| Adductors | 6 (back squat) | +1.5 |
| Anterior Deltoid | 3 (lateral raises) | +0.75 |
| Erectors | 6 (back squat) | −1.5 |
| Forearms | 9 (pull-ups) | −2.25 |

Upper Back is the one that matters. Today the app credits a quarter set for
work that the rhomboids and mid-traps are doing in every row, face pull and
reverse fly. Whether that has been reading Upper Back as *more* missing than it
is, is exactly what this brief fixes.

**Observed after landing (2026-09-03, headless screenshots of Home, the Upper
Back sheet and the Adaptations tab):** Upper Back reads 27 / 60 hard sets, fed
by Face Pulls 9, Pull-ups 6, Rows 6, Overhead Press 4 and Reverse Fly 2 — every
figure a whole or half set, no quarter fractions anywhere. Erectors read
"0 sets / 111 d": yesterday's back squat no longer sets their last-stimulus
date, which is the recency fix in step 3 doing its job. Adductors read
"3 sets / 1 d" (6 squat sets × 0.5). The one console error was an unrelated
404 on a static resource.

## 2. The audit — 24 links, one decision each

Queried 2026-09-02 (`exercise_muscle_groups` joined to `exercises`,
`muscle_groups`, `session_exercises`, `session_sets`, `training_sessions`).
Recovery-contribution links at level 3 (7 of them) are not listed: they never
add sets. **Decided** is Peter's tick from the 2026-09-03 walk-through; every
proposal was taken as written, including the three marked borderline.

| # | Exercise → muscle | Sets 42 d / all | Decided 2026-09-03 | Why |
|---|---|---|---|---|
| 1 | Rows → Upper Back / Traps | 9 / 60 | **2** ✓ | Rhomboids and mid-traps retract the scapula on every rep; a co-mover, not a stabiliser. Arguably level 1 — offered, not taken. |
| 2 | Low Row → Upper Back / Traps | 0 / 5 | **2** ✓ | Same pattern as 1. |
| 3 | Single-Arm DB Row → Upper Back / Traps | 0 / 0 | **2** ✓ | Same pattern as 1. |
| 4 | Face Pulls → Upper Back / Traps | 18 / 27 | **2** ✓ | Mid/lower traps and rhomboids are co-primary with the rear delts here. |
| 5 | Face Pull → Upper Back / Traps | 0 / 0 | **merged into 4** ✓ | Duplicate exercise name of 4. Peter chose to fold the merge in: its one program-day row (Volleyball Performance & Healthspan, paused) was repointed to Face Pulls and the duplicate deleted. Face Pulls keeps its own links (Rotator Cuff 1, Posterior Deltoid 2); the deleted row had those two the other way round — noted, not changed. |
| 6 | Reverse Fly → Upper Back / Traps | 4 / 35 | **2** ✓ | As 4. |
| 7 | Band Pull-Apart → Upper Back / Traps | 0 / 0 | **2** ✓ | As 4. |
| 8 | Pull-ups → Upper Back / Traps | 9 / 39 | **2** ✓ | Lower traps and rhomboids depress and retract the scapula through the pull. |
| 9 | Overhead Press → Upper Back / Traps | 8 / 38 | **2** ✓ *(was borderline)* | Upper traps upwardly rotate the scapula under load; a real synergist, but smaller than in 1–8. |
| 10 | Back Squat → Adductors | 6 / 54 | **2** ✓ | Adductor magnus grew as much as the glutes in both squat trials the scout found (Kubo 2019 +6.2 %; Plotkin 2023 +2.5 cm²). |
| 11 | Goblet Squat → Adductors | 0 / 0 | **2** ✓ | Same pattern as 10. |
| 12 | Bulgarian Split Squat → Adductors | 0 / 0 | **2** ✓ | Same pattern as 10, plus frontal-plane stabilisation. |
| 13 | Lat Raises → Anterior Deltoid | 3 / 15 | **2** ✓ *(was borderline)* | The front delt shares abduction above ~30°; substantial EMG, no growth trial. |
| 14 | Back Squat → Erectors | 6 / 54 | 3 → 0 ✓ | Isometric brace; no growth data. The stabiliser the tier was made for. |
| 15 | Single-Leg RDL → Erectors | 0 / 0 | 3 → 0 ✓ | As 14. |
| 16 | Deadlift → Lats | 0 / 48 | 3 → 0 ✓ | Isometric hold keeping the bar close. |
| 17 | Deadlift → Upper Back / Traps | 0 / 48 | 3 → 0 ✓ *(was borderline)* | Isometric hold; heavy deadlifts are credited with trap growth by lifters, but no trial measures it. |
| 18 | Bicep Curls → Forearms | 0 / 59 | 3 → 0 ✓ | Isometric grip and wrist. |
| 19 | Pull-ups → Forearms | 9 / 39 | 3 → 0 ✓ | Isometric grip. |
| 20 | Nordic Hamstring Curl → Glutes | 0 / 0 | 3 → 0 ✓ | Isometric hip-extension hold. |
| 21 | Scap Push-Up → Rotator Cuff | 0 / 0 | 3 → 0 ✓ | A serratus drill; the cuff is a bystander. |
| 22 | Hip Airplane → Adductors | 0 / 0 | 3 → 0 ✓ | A balance drill logged as a lift. |
| 23 | Assault Bike Intervals → Glutes | 0 / 0 | 3 → 0 ✓ | Conditioning entry; glute stimulus is not the point and is unmeasured. |
| 24 | Freestyle Swim → Posterior Deltoid | 0 / 0 | 3 → 0 ✓ | As 23. |

After the edits the database holds exactly 11 stimulus links at level 3 —
rows 14–24 — confirmed by query on 2026-09-03.

## 3. Doctrine §4 checklist

1. **Which read does this sharpen?** Home's body map and the per-muscle maps on
   the Adaptations tab — both Core reads. No new surface.
2. **What does it let me stop doing?** Stop crediting stimulus nobody has
   measured; stop carrying a weight tier no study or practitioner holds.
3. **Input or destination?** Input — it changes what the existing maps mean.
4. **Honest shape of the data?** Per link, spatial. The change lands on the
   silhouette, which is the right place for a per-muscle fact (P2).
5. **Does it write a number claiming physiological meaning?** Yes — level 3
   goes from 0.25 to 0. It is grounded by 039 S1, whose number-to-use is the
   band 0–0.25 with default 0; picking 0 is a choice inside a grounded range
   (`/ground` exemption 3), so no new scout run.

## 4. Steps

1. **Peter ticks §2.** Done 2026-09-03 in three batches of four questions;
   the table above is the record.
2. **Apply the relabels** — one `update exercise_muscle_groups set level = 2`
   per ticked row, by exercise and muscle id, on the shared Supabase project
   (production and staging read the same rows). Done: 12 rows returned level 2;
   the level-3 stimulus links left are exactly rows 14–24.
3. **Merge the duplicate** (folded in by Peter's tick on row 5): repoint the
   one `program_day_exercises` row from Face Pull to Face Pulls, then delete
   Face Pull (its four links went with it by cascade; no session ever logged
   it). Done.
4. **Zero the tier in code.** `LEVEL_WEIGHT` is `{ 1: 1, 2: 0.5, 3: 0 }` (key
   kept so an unknown level reads as an explicit 0); its source comment says
   *grounded* and points here. Three consumers skip zero-weight links:
   `muscleStimulus` in `src/lib/adaptations.ts` (no total, no quality bucket,
   no key), and recency in `muscleStates` plus `stimulusWeightsFor` (behind
   `muscleSources` and `muscleWeeklySets`) in `src/lib/fusedRead.ts`. Done.
5. **Tests.** Three new cases: a level-3 link adds nothing to `total` or any
   `byQuality` bucket and creates no key; adds no sets and no recency in
   `muscleStates`; lists no source and no weekly sets. No existing test
   assumed 0.25. Full suite 133 / 133, build passes.
6. **Browser-verify** Home (the map and the Upper Back sheet) and the
   Adaptations tab. Done headless — see the observations under §1.
7. **Inventory row 7.1** in [grounding-inventory.md](../../grounding-inventory.md):
   verdict → grounded (level 2 supported, level 3 grounded at 0), carrier 039
   S1 + this brief; decision **D13** added to the ledger. Done.
8. **Minor bump** — 1.13.3 → 1.14.0, tagged.

## 5. Acceptance

- [x] Every row in §2 carries a ticked or corrected level.
- [x] The database holds no level-3 stimulus link that §2 marks as level 2.
- [x] `LEVEL_WEIGHT[3]` is 0, its source comment says *grounded*, and
      zero-weight links add nothing to totals, per-quality buckets, recency or
      sources.
- [x] Tests cover the zero-weight link and pass; the build passes.
- [x] Home and the Adaptations tab were checked in the browser after the
      relabel, with a screenshot in the session summary.
- [x] Inventory row 7.1 and the decisions ledger reflect the final state.

## Out of scope

- Moving the fraction into the per-link `contribution` column (one number per
  pair instead of per level) — the upgrade path S1 named; a later brief if the
  pair data ever justifies it.
- Any change to level 2's value. 0.5 is the only fraction ever tested against
  alternatives; do not replace it with an average of the pair results.
- Face Pulls' own link levels (Rotator Cuff 1, Posterior Deltoid 2). The merge
  exposed that the deleted duplicate had them reversed; whichever is right is a
  ten-second edit in Admin's exercise-muscle editor, not part of this brief.
