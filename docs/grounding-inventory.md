# Grounding inventory

Every number in Tekiō that claims physiological meaning — what it is, where it
lives, what it asserts, and whether anything backs it.

**Built 2026-08-26** as pushback #7(a) of
[roadmap/feature-grounding.md](roadmap/feature-grounding.md). This is an *index*,
not a grounding block: findings live in briefs (`/ground` Step 3) and this file
points at them. It sits outside `roadmap/` on purpose — briefs move to `done/`,
an index must not.

**No research was run building this.** #7(b) is opportunistic by design.

---

## How to read it

**State** uses the `/ground` Step 3 verdict vocabulary: `grounded` /
`convention` / `unknown`. As of today **every row is `unknown`** — `grep -rn "##
Grounding" docs/` returns nothing, so no number in this app has ever been
checked. That is the headline, and it is why the column looks useless right now;
it stops being uniform the moment the first scout run lands.

Rows marked **†** are ones I would *not* spend a scout run on — see
[§13.2](#132-a-fourth-inventory-state).

**Step 0** records whether the trigger spec in
[.claude/skills/ground/SKILL.md](../.claude/skills/ground/SKILL.md) catches the
number, and how cleanly:

| Mark | Meaning |
|---|---|
| `named` | Fires, and the gated table names the file/table it lives in |
| `unnamed` | Fires on the claim, but the gated table does not name where this copy lives — you would only find it by already knowing |
| `?` | Genuinely ambiguous; Step 0 does not decide it |
| `no` | Correctly not gated |

**Grounding brief** names which brief would carry the `## Grounding` block.
**(due)** = already scheduled for rewrite, so it trips the trigger on its own —
this is where #7(b) starts. **(no brief)** = nothing in `roadmap/` would carry
it; one has to be created before a scout run has anywhere to land.

Counts: **75 rows**, of which 64 fire the trigger, 8 are ambiguous, 3 do not
fire. **31 of the 64 firing rows are `unnamed`** — see [§13.1](#131-the-gated-table-is-a-location-list).

---

## 1. Adaptation targets — what Home calls "missing"

The purpose sentence rests on these. Ground them first (Mode B, "targets before
weights").

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 1.1 | `3` | [adaptations.ts:81](../src/constants/adaptations.ts#L81) | Speed needs 3 weighted sets per muscle group per week | named | unknown | home-fused-reads **(due)** |
| 1.2 | `4` | [adaptations.ts:100](../src/constants/adaptations.ts#L100) | Power needs 4 sets/muscle/week | named | unknown | home-fused-reads **(due)** |
| 1.3 | `8` | [adaptations.ts:119](../src/constants/adaptations.ts#L119) | Strength needs 8 sets/muscle/week | named | unknown | home-fused-reads **(due)** |
| 1.4 | `10` | [adaptations.ts:138](../src/constants/adaptations.ts#L138) | Hypertrophy needs 10 sets/muscle/week | named | unknown | home-fused-reads **(due)** |
| 1.5 | `6` | [adaptations.ts:157](../src/constants/adaptations.ts#L157) | Muscular endurance needs 6 sets/muscle/week | named | unknown | home-fused-reads **(due)** |
| 1.6 | `3` | [adaptations.ts:63](../src/constants/adaptations.ts#L63) | Skill needs 3 sessions/week | named | unknown | skill-adaptation-data-source |
| 1.7 | `1` | [adaptations.ts:177](../src/constants/adaptations.ts#L177) | Anaerobic capacity needs 1 session/week | named | unknown | home-fused-reads **(due)** |
| 1.8 | `1` | [adaptations.ts:196](../src/constants/adaptations.ts#L196) | VO₂max needs 1 session/week | named | unknown | home-fused-reads **(due)** |
| 1.9 | `2` | [adaptations.ts:215](../src/constants/adaptations.ts#L215) | Endurance needs 2 sessions/week | named | unknown | home-fused-reads **(due)** |
| 1.10 | `0` ×9 | `weeklyMuscleTarget` / `weeklySessionTarget` sentinels throughout [adaptations.ts](../src/constants/adaptations.ts) | *Nothing.* `0` means "this axis does not apply to this adaptation" — a stand-in for `null`, read as a flag at [lib/adaptations.ts:263](../src/lib/adaptations.ts#L263) | ? | unknown † | — |
| 1.11 | all 18, duplicated | `adaptation_targets` (DB), 9 rows | Identical values to 1.1–1.9, and **they win** — [lib/adaptations.ts:261-262](../src/lib/adaptations.ts#L261) prefers the DB row over the constant | named | unknown | home-fused-reads **(due)** |

> **1.11 matters more than it looks.** Grounding the constants changes nothing
> the user sees. The DB rows shadow every default, are currently byte-identical,
> and carry no marker distinguishing "seeded" from "user-edited". See
> [§13.3](#133-the-db-shadow-makes-defaults-not-runtime-edits-undecidable).

## 2. Rep-range classification

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 2.1 | `[1, 5]` | [adaptations.ts:118](../src/constants/adaptations.ts#L118) | 1–5 reps = strength | named | unknown | cross-adaptation-rep-ranges |
| 2.2 | `[6, 15]` | [adaptations.ts:137](../src/constants/adaptations.ts#L137) | 6–15 reps = hypertrophy | named | unknown | cross-adaptation-rep-ranges |
| 2.3 | `[16, 999]` | [adaptations.ts:156](../src/constants/adaptations.ts#L156) | 16+ reps = muscular endurance | named | unknown | cross-adaptation-rep-ranges |
| 2.4 | `reps <= 5` | [lib/adaptations.ts:26](../src/lib/adaptations.ts#L26) | Same boundary as 2.1 — **this is the copy the app actually runs** | unnamed | unknown | cross-adaptation-rep-ranges |
| 2.5 | `reps <= 15` | [lib/adaptations.ts:27](../src/lib/adaptations.ts#L27) | Same boundary as 2.2, likewise live | unnamed | unknown | cross-adaptation-rep-ranges |
| 2.6 | 18 keyword rules | [adaptations.ts:242-265](../src/constants/adaptations.ts#L242) | "kettlebell swing is power", "pogo is speed", etc. — a physiological classification carrying **no digit** | ? | unknown | cross-adaptation-rep-ranges |

> **2.1–2.3 are dead code.** `grep -rn "repRange" src/` shows the field declared
> and never read. The gated table names the field that does nothing and misses
> the two lines that do the work. See
> [§13.1](#131-the-gated-table-is-a-location-list).

## 3. `rx` prescriptions — 9 blocks, ~45 numbers in prose

One row per adaptation; the gated table covers `load / reps / sets / rest /
effort / cue` for all of them. All named, all `unknown`, and the cues are the
sharpest debt in the app because they read as settled fact.

| # | Numbers asserted | Where | Notable claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 3.1 | Skill: 3–5 reps | [adaptations.ts:64-71](../src/constants/adaptations.ts#L64) | "Never to fatigue" | named | unknown | skill-adaptation-data-source |
| 3.2 | Speed: 0–30% 1RM, 1–5 reps, 3–5 sets, 2–5 min | [adaptations.ts:83-90](../src/constants/adaptations.ts#L83) | Load band for velocity work | named | unknown | cross-adaptation-rep-ranges |
| 3.3 | Power: 30–70% 1RM, 1–5, 3–5, 2–5 min | [adaptations.ts:102-109](../src/constants/adaptations.ts#L102) | Load band for ballistic work | named | unknown | cross-adaptation-rep-ranges |
| 3.4 | Strength: 85–100% 1RM, 3–5, 3–5, 2–5 min, 1–2 RIR | [adaptations.ts:121-128](../src/constants/adaptations.ts#L121) | **Cue names "Galpin's 3–5 rule" as settled** — a `[single-practitioner position]` with no provenance ([adaptations.ts:127](../src/constants/adaptations.ts#L127)); the skill's own *Known debt* entry | named | unknown | cross-adaptation-rep-ranges |
| 3.5 | Hypertrophy: 30–80% 1RM, 5–30 (≈8–15), 10–20 sets/muscle/wk, 30 s–2 min, 0–4 RIR | [adaptations.ts:140-147](../src/constants/adaptations.ts#L140) | **`sets: '10–20 / muscle / week'` contradicts row 1.4's `10`** — the card prescribes a range whose floor is the target | named | unknown | home-fused-reads **(due)** |
| 3.6 | Musc. endurance: <50% 1RM, 15–40+, 2–4, <60 s | [adaptations.ts:159-166](../src/constants/adaptations.ts#L159) | Load ceiling and rest floor | named | unknown | cross-adaptation-rep-ranges |
| 3.7 | Anaerobic: 20 s–2 min, 3–8 rounds, 1:2–1:4 rest | [adaptations.ts:178-185](../src/constants/adaptations.ts#L178) | Work:rest ratio | named | unknown | hr-zone-intensity-classification |
| 3.8 | VO₂max: ~90–100% HRmax, 3–8 min, 4–6 sets, ≈1:1 | [adaptations.ts:197-204](../src/constants/adaptations.ts#L197) | **Cue ships the "classic 4×4 min at 90–95% HRmax" protocol** ([adaptations.ts:203](../src/constants/adaptations.ts#L203)) — a named protocol, unattributed. Same failure class as 3.4 | named | unknown | hr-zone-intensity-classification |
| 3.9 | Endurance: Zone 2, 30 min–hours | [adaptations.ts:216-223](../src/constants/adaptations.ts#L216) | "Nasal-breathing pace"; "builds mitochondria & fat oxidation" — a **mechanistic** claim, no number | named | unknown | hr-zone-intensity-classification |
| 3.10 | *(none)* | [adaptations.ts:233-235](../src/constants/adaptations.ts#L233) | `ADAPTATION_PRINCIPLE`: "Skill · Speed · Power · Strength are quality-driven — never train to fatigue… Hypertrophy → Endurance are volume/fatigue-driven". A categorical physiological claim that **carries no digit at all** | ? | unknown | cross-adaptation-rep-ranges |

## 4. Recovery / readiness

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 4.1 | `8` | [app.ts:66](../src/constants/app.ts#L66) | Target 8 h sleep/night | named | unknown | home-fused-reads **(due)** |
| 4.2 | `30` | [app.ts:68](../src/constants/app.ts#L68) | Target 30 mobility min/week | named | unknown | home-fused-reads **(due)** |
| 4.3 | `2` | [app.ts:70](../src/constants/app.ts#L70) | Target 2 sauna sessions/week | named | unknown | home-fused-reads **(due)** |
| 4.4 | `2` | [app.ts:72](../src/constants/app.ts#L72) | Target 2 cold sessions/week | named | unknown | home-fused-reads **(due)** |
| 4.5 | `5` | [app.ts:74](../src/constants/app.ts#L74) | Target 5 recovery-habit bouts/week | named | unknown | home-fused-reads **(due — being deleted)** |
| 4.6 | `0.45` | [app.ts:79](../src/constants/app.ts#L79) | Sleep is 45% of systemic readiness | named | unknown | home-fused-reads **(due)** |
| 4.7 | `0.15` | [app.ts:80](../src/constants/app.ts#L80) | Mobility is 15% | named | unknown | home-fused-reads **(due)** |
| 4.8 | `0.15` | [app.ts:81](../src/constants/app.ts#L81) | Sauna is 15% | named | unknown | home-fused-reads **(due)** |
| 4.9 | `0.15` | [app.ts:82](../src/constants/app.ts#L82) | Cold is 15% | named | unknown | home-fused-reads **(due)** |
| 4.10 | `0.10` | [app.ts:83](../src/constants/app.ts#L83) | Habits are 10% — **the input being dropped**; its removal is what renormalises 4.6–4.9 | named | unknown | home-fused-reads **(due)** |
| 4.11 | `score / 100` | [RecoveryCard.tsx:65](../src/components/tabs/home/RecoveryCard.tsx#L65) | Garmin's 0–100 sleep score maps linearly onto the sub-score **and supersedes duration-vs-target when present** — two different sleep models, silently switched per night | unnamed | unknown | home-fused-reads **(due)** |
| 4.12 | `80` / `50` | [RecoveryCard.tsx:20-21](../src/components/tabs/home/RecoveryCard.tsx#L20) | ≥80% readiness is green (push), 50–79 amber, <50 red. **This is the app's answer to "am I recovered enough to push today?"** | unnamed | unknown | home-fused-reads **(due)** |
| 4.13 | `sub >= 1` | [RecoveryCard.tsx:239](../src/components/tabs/home/RecoveryCard.tsx#L239) | A modality is "on target" at exactly 100% of its weekly target — no credit above, no partial band | unnamed | unknown † | home-fused-reads |
| 4.14 | `80` °C / `10` °C | [RecoveryCard.tsx:177](../src/components/tabs/home/RecoveryCard.tsx#L177), [:201](../src/components/tabs/home/RecoveryCard.tsx#L201) | Placeholder temperatures for a sauna / cold session. Stored, never scored | ? | unknown † | — |

## 5. Cycle length & deload

Four copies of the cycle length (three saying `6`, one saying `4`) and three of
the deload factor. **No brief in `roadmap/` carries any of them.**

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 5.1 | `CYCLE = 6` | [app.ts:3](../src/constants/app.ts#L3) | A training block is 6 weeks | named | unknown | **(no brief)** |
| 5.2 | `CYCLE = 6` | [utils.ts:11](../src/lib/utils.ts#L11) | File-private duplicate that shadows 5.1 — and this is the one all cycle math reads | unnamed | unknown | **(no brief)** |
| 5.3 | `wc === CYCLE` | [utils.ts:52](../src/lib/utils.ts#L52), [:62](../src/lib/utils.ts#L62) | **Week 6 is the deload week** — deload placement, explicitly gated by Step 0 | unnamed | unknown | **(no brief)** |
| 5.4 | `× 0.7` | [VolumeRow.tsx:28](../src/components/tabs/weights/VolumeRow.tsx#L28) | Deload = 70% of last weight **and** 70% of last reps | unnamed | unknown | **(no brief)** |
| 5.5 | `× 0.7` | [ExPlan.tsx:37](../src/components/tabs/weights/ExPlan.tsx#L37) | Deload button = 70% of reps, weight unchanged. **Disagrees with 5.4** — two deload models, one screen apart | unnamed | unknown | **(no brief)** |
| 5.6 | `"⚠️ Deload — 70%"` | [VolumeRow.tsx:24](../src/components/tabs/weights/VolumeRow.tsx#L24) | The label the user reads | unnamed | unknown | **(no brief)** |
| 5.7 | `cycle_length_weeks: 6` | [db/program.ts:259](../src/lib/db/program.ts#L259) + `programs` column default `6` | Third and fourth copies of 5.1, hardcoded rather than importing `CYCLE`. **Written, never read back** | unnamed | unknown † | **(no brief)** |
| 5.8 | `deload_week: 6` | [db/program.ts:260](../src/lib/db/program.ts#L260) | Persisted deload placement. Write-only | unnamed | unknown † | **(no brief)** |
| 5.9 | `{"type":"reps","factor":0.7}` | [db/program.ts:261](../src/lib/db/program.ts#L261) + `programs.deload_strategy` column default | The deload magnitude, as a **jsonb column default**. Write-only | unnamed | unknown | **(no brief)** |
| 5.10 | `4` | `program_phases.duration_weeks` column default (DB only) | A phase is 4 weeks — **contradicts `CYCLE = 6`** and is reachable by any insert that omits the column | unnamed | unknown | **(no brief)** |

## 6. Cardio & sport classification

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 6.1 | `>= 25` min | [lib/adaptations.ts:38](../src/lib/adaptations.ts#L38) | A session ≥25 min is endurance | unnamed | unknown | hr-zone-intensity-classification |
| 6.2 | `>= 8` min | [lib/adaptations.ts:39](../src/lib/adaptations.ts#L39) | 8–24 min is VO₂max; <8 min is anaerobic capacity | unnamed | unknown | hr-zone-intensity-classification |
| 6.3 | `2.0` | [lib/adaptations.ts:44](../src/lib/adaptations.ts#L44) | Garmin Training Effect ≥2.0 is "a real stimulus" for that system | unnamed | unknown | garmin-recovery-load-axis |
| 6.4 | `hard > easy` | [lib/adaptations.ts:52-62](../src/lib/adaptations.ts#L52) | Z4+Z5 time exceeding Z1+Z2 makes aerobic work VO₂max rather than base; unlabelled work defaults to base | unnamed | unknown | hr-zone-intensity-classification |
| 6.5 | default `vo2max` | [lib/adaptations.ts:228](../src/lib/adaptations.ts#L228) | A sport session with no logged duration is VO₂max work ("the typical intermittent-sport stimulus") | unnamed | unknown | hr-zone-intensity-classification |

## 7. Muscle & volume accounting

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 7.1 | `{1: 1, 2: 0.5, 3: 0.25}` | [utils.ts:479](../src/lib/utils.ts#L479) | A level-2 muscle receives half a set's stimulus, level-3 a quarter. **Every muscle-coverage number and the whole BodyMap is denominated in this** | unnamed | unknown | home-fused-reads **(due)** |
| 7.2 | `level === 1 → primary` | [db/muscles.ts:77](../src/lib/db/muscles.ts#L77) | Level 1 is a primary mover; 2 and 3 are both "secondary" — collapses 7.1's three tiers into two on write | unnamed | unknown † | home-fused-reads |
| 7.3 | `1` per bout | [utils.ts:489-492](../src/lib/utils.ts#L489) | One manual habit completion = one set of stimulus | unnamed | unknown | home-fused-reads **(being deleted)** |
| 7.4 | `5` | [utils.ts:338](../src/lib/utils.ts#L338) | 5 mobility min per muscle group per week is the target | unnamed | unknown | home-fused-reads **(due)** |
| 7.5 | `aggSets >= target` | [lib/adaptations.ts:135-139](../src/lib/adaptations.ts#L135) | "On track" is binary at the target; anything >0 below it is "needs work"; 0 is "untouched" — the three colours of the BodyMap | unnamed | unknown † | home-fused-reads **(due)** |
| 7.6 | 179 rows, level 1–3 | `exercise_muscle_groups` (DB) | 179 individual "this exercise hits this muscle at this level" claims, editable in-app | ? | unknown | **(no brief)** |

## 8. Estimated 1RM

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 8.1 | `1 + reps/30` | [utils.ts:123](../src/lib/utils.ts#L123) | Epley: published estimator | ? | unknown | **(no brief)** |
| 8.2 | `36/(37 − reps)` | [utils.ts:128](../src/lib/utils.ts#L128) | Brzycki: published estimator | ? | unknown | **(no brief)** |
| 8.3 | `reps >= 37 → 0` | [utils.ts:129](../src/lib/utils.ts#L129) | Guard at Brzycki's pole — mathematical, not physiological | no | unknown † | — |
| 8.4 | `(e + b) / 2` | [utils.ts:143](../src/lib/utils.ts#L143) | **Tekiō's own estimator**: the unweighted mean of Epley and Brzycki. Not a published formula; the comment says only "they diverge at the extremes" | ? | unknown | **(no brief)** |

## 9. Progression

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 9.1 | `7.5` | [ExPlan.tsx:19](../src/components/tabs/weights/ExPlan.tsx#L19) | Default weekly volume increase is +7.5% | unnamed | unknown | **(no brief)** |
| 9.2 | `min 5 / max 10` | [ExPlan.tsx:76](../src/components/tabs/weights/ExPlan.tsx#L76) | The defensible weekly-progression band is 5–10% | unnamed | unknown | **(no brief)** |
| 9.3 | `0 / +2.5 / +5 kg` | [VolumeRow.tsx:8-10](../src/components/tabs/weights/VolumeRow.tsx#L8) | The three load-jump options offered | unnamed | unknown † | — |
| 9.4 | round to `0.5` | [utils.ts:34](../src/lib/utils.ts#L34) | Plate granularity | no | unknown † | — |

## 10. Hydration & blood donation

Both fold into Recovery per the doctrine ledger, so their grounding follows the
fold.

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 10.1 | `2500` ml | [app.ts:5](../src/constants/app.ts#L5) | Daily hydration target | unnamed | unknown | home-fused-reads **(due — folding)** |
| 10.2 | `56` days | [app.ts:45](../src/constants/app.ts#L45) | Full-blood donation interval | unnamed | unknown | home-fused-reads **(due — folding)** |
| 10.3 | `14` days | [app.ts:46](../src/constants/app.ts#L46) | Plasma donation interval | unnamed | unknown | home-fused-reads **(due — folding)** |
| 10.4 | `56 * 86400000` | [OverviewTab.tsx:151](../src/components/tabs/OverviewTab.tsx#L151) | Duplicate of 10.2 as a magic literal, bypassing the constant | unnamed | unknown | home-fused-reads **(due — folding)** |
| 10.5 | `[100…500]` | [OverviewTab.tsx:59](../src/components/tabs/OverviewTab.tsx#L59) | Quick-add water increments — UI affordance | no | unknown † | — |

## 11. Correctly not gated

Listed so the boundary is visible, not because they need anything.

| Value | Where | Why not |
|---|---|---|
| `PREVIEW = 3`, `FILTER_AT = 30` | [HistoryList.tsx:6-8](../src/components/ui/HistoryList.tsx#L6) | List pagination |
| `revealed < 8` | [SupersetLogger.tsx:121](../src/components/tabs/weights/SupersetLogger.tsx#L121), [MobilityTab.tsx:150](../src/components/tabs/MobilityTab.tsx#L150) | Progressive disclosure |
| quality `1–5` stars | Sleep, sport and mobility forms | A subjective rating scale, not a dose |
| `SYNC_DAYS` 7 / 3 | [sync_activities.py](../scripts/garmin-sync/sync_activities.py), [sync_sleep.py](../scripts/garmin-sync/sync_sleep.py) | Backfill window |
| `/60`, `/1000`, `/3600` | garmin-sync, [utils.ts:154-179](../src/lib/utils.ts#L154) | Unit conversion |
| every hex in [colors.ts](../src/constants/colors.ts), and each adaptation's `color` | | Chart colours |

## 12. Not in the app yet

Gated by Step 0's table, but no code exists. Listed so a reader does not conclude
they were missed.

- **Nutrition FRS** — ~25 coefficients and cut-points (`0.25·P + 0.20·E + …`,
  protein 1.6–2.2 g/kg, hydration 33 ml/kg, deficit penalty k=2.5, 3-day
  smoothing 0.5/0.3/0.2, alcohol ×0.85 …) live only in
  [roadmap/nutrition-food-recovery-score.md](roadmap/nutrition-food-recovery-score.md)
  and its bench artifact. State: `unknown`, all of them.
- **Local recovery windows** — "commonly cited as 48–72 h"
  ([roadmap/home-fused-reads.md](roadmap/home-fused-reads.md)). That brief
  already says it requires `## Grounding` before implementation.

---

## 13. What this exercise found about the trigger

Pushback #5 replaced an unenforceable gate with "a crisp trigger". This is its
first test against real numbers rather than the four examples it was written
from. Result: **8 of 75 rows (11%) needed a judgement call Step 0 does not
make** — inside the bar #5 set. But the misses are not random. They cluster, and
one edit fixes most of them.

### 13.1 The gated table is a location list

**31 of 64 firing rows are `unnamed`.** Step 0 opens with a claim-shaped sentence
— *"writes, moves, or reinterprets a number that claims physiological meaning"* —
and then hands you a table of five locations. In practice the table is what gets
read, and every miss is a number that entered somewhere the table does not name:
`src/lib/`, `src/components/tabs/`, a jsonb column default, a magic literal. Note
that even for `src/constants/app.ts` the table lists *constants*, not the file —
so `WATER_GOAL_ML` and `DONATION_ELIGIBILITY_DAYS` sit two lines from `CYCLE` and
are not named.

The sharpest case is rows 2.1–2.5. `repRange` is gated by name and is **dead
code** — declared, never read. The live rep-range boundaries are `reps <= 5` /
`reps <= 15` at [lib/adaptations.ts:26-27](../src/lib/adaptations.ts#L26), which
the table does not name. Someone changing hypertrophy's rep range by editing the
gated constant would ship nothing, pass the gate, and believe they had grounded
the app's classifier.

**Proposed edit — reframe the "Gated" table.** Keep it, retitle it *"Where these
claims live today (non-exhaustive)"*, and add above it:

> The trigger is on the **claim**, not the file. This table maps the claims
> currently in the app; it is not the boundary of the gate. A copy in an unlisted
> file is still gated.

And add a Step 0 closing line:

> **Before you proceed, enumerate the copies.** `grep` the value and its
> siblings. If the number appears more than once, the grounding block covers
> every copy and the brief says so. Two copies that disagree are a bug the gate
> has just found — fix it in the same change.

That last sentence alone would have caught 5.4 vs 5.5 (two deload models, one
screen apart), 5.1/5.2/5.7/5.10 (`6, 6, 6, 4`), 2.1–2.5, and 10.2 vs 10.4.

### 13.2 A fourth inventory state

`convention` is defined as a *scout verdict*. Before any scout has run, all 75
rows are `unknown` — the column carries no information, and Mode B's clock
("anything still `unknown` after one cycle earns a deliberate run") points a
scout at `r05` rounding to the nearest 0.5 kg and at Brzycki's `reps >= 37`
divide-by-zero guard.

**Proposed edit — Step 3, verdict vocabulary table.** Add one row:

| Scout verdict | Inventory state | What it means for shipping |
|---|---|---|
| *(no run needed)* | **n/a — definitional** | The number fixes a unit, period or guard rather than asserting a dose–response. No search could return "supported", because there is no proposition to test. Record why in one line; it never enters the 6-week clock. |

This is an **inventory-only** state, not a fifth scout verdict — the scout's four
verdicts are unchanged. It applies to the 11 rows marked **†** and should stay
that small: if a row is arguable, it is `unknown`.

Note the boundary. `CYCLE = 6` is **not** definitional: "a block is 6 weeks with
a deload at week 6" is a dose claim about deload frequency, and it is the number
in §5 that most needs a run. `r05` is definitional: plates come in 2.5 kg pairs.

### 13.3 The DB shadow makes "defaults, not runtime edits" undecidable

Step 0 says the gate fires on *"the default — the constant, the seed row, the
migration"* and never on a runtime edit. `adaptation_targets` breaks this
cleanly: its 9 rows are byte-identical to the `adaptations.ts` defaults, they
**override** them at [lib/adaptations.ts:261](../src/lib/adaptations.ts#L261),
and no column records whether a row is still seeded or has been edited. So "is
this a default or a runtime edit?" has no answer, and the carve-out cannot be
applied. Row 7.6 (179 exercise→muscle links) is the same shape at scale.

**Proposed edit — extend the "Defaults, not runtime edits" paragraph:**

> Where a constant has a **DB shadow** — a table whose rows override it — the
> grounding block lands on the constant *and* the change re-seeds the shadow, or
> the app keeps showing the ungrounded value. Say in the brief which copy the app
> reads. Where seeded rows are indistinguishable from edited ones, treat the
> whole table as seeded and ground it.

### 13.4 The trigger is numeric; some claims carry no digit

Three rows assert physiology with no number in them. `ADAPTATION_PRINCIPLE`
(3.10) tells the user never to train Skill/Speed/Power/Strength to fatigue.
`KEYWORD_ADAPTATION` (2.6) rules that a kettlebell swing is power and not
strength. The endurance cue (3.9) claims Zone 2 "builds mitochondria & fat
oxidation". Step 0 fires on *"a weight, threshold, target, window, or
coefficient"* — none of these is one, and all three are exactly the kind of
confident, unsourced claim the gate exists to catch. `rx.cue` was already gated
"because prose states numbers too"; the real reason is broader — prose states
*claims*.

**Proposed edit — Step 0, after the trigger sentence:**

> A claim does not need a digit. Prose that **prescribes or classifies** ("never
> train to fatigue", "builds mitochondria", "a swing is power work") is gated on
> the same terms as a coefficient. Prose that merely **labels** is not:
> `summary: 'Muscle growth'` names the adaptation, it does not assert anything
> about how to train it.

This is the edit I am least sure about, because it widens the gate and *"a gate
that fires on everything is a gate nobody reads"* is the skill's own rule. The
prescribe/classify vs. label split is the narrowing that keeps it honest; if it
does not hold in practice, drop the edit rather than blunt the rule.

### 13.5 Formulas are not on the enumerated list

Rows 8.1–8.4. Epley and Brzycki are published estimators — citable, and squarely
physiological. "Coefficient" arguably reaches them, but nobody reading the list
would think of a formula. Worse, 8.4 blends the two by unweighted mean, which is
**Tekiō's own invention**; none of the three exemptions covers it, and it is the
one number in §8 that actually needs a run.

**Proposed edit** — add *formula or estimator* to Step 0's enumeration, and add a
fourth entry to the exemptions section, as a stated non-exemption:

> **Not an exemption: combining estimators.** Averaging, blending or
> interpolating between two published formulas produces a third that nobody
> published. That is a new claim, not a shape change.

### 13.6 A location-shaped hole in "Not gated"

The Not-gated list ends with *"anything in `src/components/ui/`"* — a blanket
exemption by directory, in a list whose other entries are all by kind. Rows 4.11
and 4.12 (the Garmin-score model switch; the 80/50 readiness bands that answer
the purpose sentence's "can I push today?") live one directory over in
`components/tabs/home/`, and nothing but that accident keeps them gated.

**Proposed edit:** change the entry to *"presentational primitives in
`src/components/ui/` that state no number"* — which is what was meant.

### 13.7 Exemption 1 will be misapplied within the week

The Habits reweight (rows 4.5–4.10) is Step 0's named example of exemption 1:
renormalisation preserves every relative claim. That is true, and this is not an
argument against the exemption. But the ratios being preserved are `unknown` —
0.45 : 0.15 : 0.15 : 0.15 has never been checked. Preserving an unchecked ratio
yields an unchecked ratio, so those rows stay `unknown` after the reweight ships
and must not be ticked off as handled.

**Proposed edit — exemption 1, one added sentence:**

> Renormalisation preserves relative claims; it does not create them. If the
> weights were `unknown` before, they are `unknown` after, and the inventory row
> does not clear.

### 13.8 Ambiguous, left ambiguous

Two cases with no proposed edit, because the resolution would cost more spec than
the numbers are worth:

- **Sentinel zeros** (1.10). `weeklyMuscleTarget: 0` sits in a gated field and
  asserts nothing — a `null` substitute read as a flag. Step 0 fires; a reader
  shrugs and moves on. Harmless, and the real fix (a proper `null`) is a code
  change, not a spec change.
- **Form placeholders** (4.14). The 80 °C / 10 °C hints are stored and never
  scored. "Copy that states no number" does not cover copy that states a number
  nothing reads. Not gated is the sensible call; writing the rule that says so
  costs more than it saves.

### 13.9 Where 7(b) starts

Ordered by the priority already agreed (targets before weights) and by what trips
the trigger on its own:

1. **§1 adaptation targets** (9 numbers + the DB shadow) — the fused Home read
   rewrites them, and Home's "what's missing" is denominated in them. One scout
   run: *weekly sets per muscle group for a trained adult*. Row 3.5 resolves in
   the same run — the hypertrophy card prescribes 10–20 sets/muscle/week while
   the target says 10.
2. **§4 recovery weights** (4.6–4.10) — the Habits reweight touches them, though
   per §13.7 the reweight itself does not ground them. Rows 4.11 and 4.12 belong
   in the same brief: they decide what the readiness number *means*.
3. **§5 cycle & deload** — no brief exists, four copies of the cycle length that
   do not agree, and two deload models one screen apart. Needs a brief created
   before a scout run has anywhere to land; the disagreement itself is a bug
   findable without any research.
4. **3.4 / 3.8 cues** — the known debt, plus its twin. Cheapest possible run:
   both are named protocols, and the only question is who said it and on what.
