# Roadmap: Scout-named exercises — in the catalogue, mapped, and selectable

**Label:** feature
**Status:** done — shipped 2026-09-03 (v1.15.0): 14 scout-named exercises
added and linked, 14 logged-but-unmapped exercises linked, the Weights picker
reads the catalogue. Created the same day from
[039](039-adaptations-read-grounding.md) runs S1 and S4.
**Release:** 2.0.0

---

## The plain summary

The scouts in 039 argue with named exercises: bench press → triceps, row →
biceps, pulldown, chin-up, hip thrust, kettlebell swing, power clean, snatch,
broad jump, med-ball slam, sprint, sled. Fourteen of those names are not in
Tekiō's `exercises` table. Two things follow:

1. **Nothing can be logged under a name the app does not know without first
   typing it fresh,** and a fresh name has no muscle links — so its sets never
   reach the Home map or the Adaptations maps. The read silently drops them.
2. **The Weights picker only suggests names that have already been logged**
   ([WeightsTab.tsx:47](../../../src/components/tabs/weights/WeightsTab.tsx#L47)).
   A catalogue row alone is invisible; the picker has to read the catalogue.

On the way in, the same audit found **fourteen exercises Peter has already
logged that have no muscle links at all** — Chest Press (6 sessions), Leg
Extension (5), Dips (4), Forward Dumbbell Lunge (3), Jump Back Squat (3), and
nine more. Every set on them has counted for nothing on the muscle read. That
is the same fix (rows in `exercise_muscle_groups`), so it lands here too.

This brief adds the fourteen scout-named exercises with their links, maps the
fourteen unmapped logged ones, and makes the picker offer any catalogue
exercise that trains a muscle.

---

## 1. What changes

### 1.1 Fourteen new exercises, with links

Levels follow S1 as decided in [042](042-level-3-link-audit.md): level 1
is the primary force generator, level 2 a synergist meaningfully trained
(Pelland 2026's "indirect" set), and there is no level 3 — a stabiliser gets no
link. Every link is `stimulus`.

| Exercise | Equipment | Level 1 | Level 2 | Where the scouts name it |
|---|---|---|---|---|
| Kettlebell Swing | kettlebell | Glutes, Hamstrings | Erectors | S4 keyword `kettlebell swing`; Galpin's list; Junior 2022 |
| Power Clean | barbell | Quadriceps, Glutes | Hamstrings, Erectors, Upper Back / Traps | S4 (Soriano 2015: cleans peak power ≥ 70 % 1RM) |
| Hang Power Clean | barbell | Quadriceps, Glutes | Hamstrings, Erectors, Upper Back / Traps | S4 (Soriano 2015) |
| Snatch | barbell | Quadriceps, Glutes | Hamstrings, Erectors, Upper Back / Traps, Anterior Deltoid | S4; Galpin's list |
| Clean and Jerk | barbell | Quadriceps, Glutes | Hamstrings, Erectors, Upper Back / Traps, Anterior Deltoid, Triceps | S4; Galpin's list |
| Broad Jump | bodyweight | Glutes, Quadriceps | Hamstrings, Calves | S4 keyword `broad jump` |
| Med Ball Slam | other | Lats, Rectus Abdominis | Obliques | S4 keyword `slam` |
| Sprint | bodyweight | Glutes, Hamstrings | Quadriceps, Calves, Hip Flexors | S4 keyword `sprint`; Galpin's "short sprints" |
| Sled Push | other | Quadriceps, Glutes | Calves, Hamstrings | S4 keyword `sled` (partially supported, kept as convention) |
| Clapping Push-up | bodyweight | Chest | Anterior Deltoid, Triceps | Galpin's list in S4 — **no keyword covers it**, see §3 |
| Lat Pulldown | cable | Lats | Biceps, Rhomboids, Upper Back / Traps | S1 (Gentil 2015, pulldown → biceps) |
| Chin-up | bodyweight | Lats | Biceps, Rhomboids, Upper Back / Traps | S1 (Galpin: "primarily back, indirectly biceps") |
| Hip Thrust | barbell | Glutes | Hamstrings | S1 (Plotkin 2023, squat vs hip thrust) |
| Skull Crusher | barbell | Triceps | — | S1 (the bench-vs-extension trials) |

Two calls worth stating. **Chin-up → Biceps stays level 2**, matching Pull-ups
and S1's decision to keep one fraction per level; the per-link `contribution`
column is the upgrade path if a chin-up ever deserves 1.0. **Sprint lives in
Weights**, not Cardio, because S4's keyword rule reads weight-set names — a
"set" of sprints is how Galpin's power prescription gets logged.

### 1.2 Fourteen logged exercises that had no links

Queried 2026-09-03: `exercises` with sessions in `session_exercises` and no
row in `exercise_muscle_groups`.

| Exercise | Sessions | Level 1 | Level 2 |
|---|---|---|---|
| Chest Press | 6 | Chest | Anterior Deltoid, Triceps |
| Leg Extension | 5 | Quadriceps | — |
| Dips | 4 | Chest, Triceps | Anterior Deltoid |
| Forward Dumbbell Lunge | 3 | Quadriceps, Glutes | Hamstrings, Adductors |
| Jump Back Squat | 3 | Quadriceps, Glutes | Hamstrings, Calves |
| Hanging Leg Raises | 2 | Rectus Abdominis, Hip Flexors | — |
| Leg Curl | 2 | Hamstrings | Calves |
| Backward Dumbbell Lunge | 1 | Quadriceps, Glutes | Hamstrings, Adductors |
| Bench Dip | 1 | Triceps | Chest, Anterior Deltoid |
| Cable Shrugs (4 Positions) | 1 | Upper Back / Traps | — |
| Decline Sit Ups | 1 | Rectus Abdominis | Hip Flexors, Obliques |
| Incline Dumbbell Tricep Extension | 1 | Triceps | — |
| PJR Pullover / Cable Extension | 1 | Triceps | Lats |
| Tricep Push Out (Cable Pushdown) | 1 | Triceps | — |

### 1.3 The picker reads the catalogue

New helper `weightsPickerNames` in [utils.ts](../../../src/lib/utils.ts): the
Weights picker offers **every name logged before, plus every catalogue exercise
with at least one stimulus link.** Recovery-only rows (Couch Stretch, Foam Roll
Quads) and the habit-era rows with no links (Sauna, Nutrition Window, Box
Breathing, Tennis Play) stay out, so the list gains lifts without gaining
noise. The chart selector and the history filter keep using logged names only —
a chart for an exercise with no sets is nothing.

---

## 2. Doctrine §4 checklist

1. **Which read does this sharpen?** The muscle read — Home's body map and the
   per-adaptation maps — through the Weights capture that feeds it.
2. **What does it let me stop doing?** Typing a new name, logging under it, then
   remembering to map it in Admin. Nothing folds; nothing new is built.
3. **Input or destination?** Input. Catalogue rows and links feed an existing read.
4. **Honest shape of the data?** Per-exercise anatomy tags at two levels. No
   numbers.
5. **Does it write a number claiming physiological meaning?** No. The level
   definitions are S1's (grounded in 039); a link is the runtime data the Admin
   editor writes, and `/ground` Step 0 fires on defaults, not runtime edits. No
   scout run.

---

## 3. Not added, and the one remainder

**Names left out on purpose.** *Jump Squat* — "Jump Back Squat" already is one
(3 sessions), so it was mapped instead of duplicated. *Air bike* — "Assault Bike
Intervals" exists. *Jump rope, jumping jacks, ladder drills* — S4 names them as
the **collisions** its keyword fix removes (conditioning, not power); putting
them in Weights would recreate the bug. *Plyo, plyometrics, throws* — families,
not exercises; the three med-ball throws already exist. *KB Swing* — an alias;
the matcher takes both spellings, the catalogue takes one. Rows, curls, bench,
squat, deadlift, overhead press, face pulls, box jump, pogo, dead hang,
woodchop, dip — already there.

**Found on the way, not done here:** the row `Hanging Leg Raises:` (trailing
colon, 0 sessions) is a typo duplicate of Hanging Leg Raises. Deleting a
production row is Peter's tick; it is one `delete` once given.

**The remainder goes to 039.** Clapping Push-up is on Galpin's power list but
none of S4's 20 keywords match it, so its sets classify by reps. Whether
`clapping` joins the grounded keyword list is a 039 decision (its S4 code unit,
§6.7), not this brief's — a pointer is added there.

---

## Acceptance

- [x] The 14 exercises in §1.1 exist in `exercises` with the links in the table
      (levels 1 and 2 only, all `stimulus`).
- [x] The 14 exercises in §1.2 have the links in the table.
- [x] `weightsPickerNames` is unit-tested and the Weights picker uses it.
- [x] Verified in the browser: on Weights, typing "kett" offers Kettlebell
      Swing before it has ever been logged; "sauna" offers nothing — headless
      Chromium 2026-09-03, "clean" offered Clean and Jerk / Hang Power Clean /
      Power Clean; the only console error was the known unrelated static 404.
- [x] 039 §6.7 carries the `clapping` keyword question.
