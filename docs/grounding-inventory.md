# Grounding inventory

Every number in Tekiō that claims physiological meaning — what it is, where it
lives, what it asserts, and whether anything backs it.

**Built 2026-08-26** as pushback #7(a) of
[roadmap/done/009-feature-grounding.md](roadmap/done/009-feature-grounding.md). This is an *index*,
not a grounding block: findings live in briefs (`/ground` Step 3) and this file
points at them. It sits outside `roadmap/` on purpose — briefs move to `done/`,
an index must not.

**No research was run building this.** #7(b) is opportunistic by design.

---

## How to read it

**State** uses the `/ground` Step 3 verdict vocabulary: `grounded` /
`convention` / `unknown`.

**Updated 2026-08-26 by the first scout runs** (#7(b), run 1): the adaptation
targets in §1 are no longer `unknown` — four are `grounded`, four are
`convention`, and row 1.10 (the `0` sentinel) is deliberately deferred. Every row
outside §1 is still `unknown`. The blocks live in
[roadmap/done/011-adaptation-weekly-targets.md](roadmap/done/011-adaptation-weekly-targets.md).

**Updated 2026-09-01 by the nine → seven simplification**
([done/019](roadmap/done/019-adaptation-model-simplification.md)): speed and skill
left the model, so rows 1.1, 1.6, 3.1 and 3.2 are struck as **retired** — the
constants are deleted, so those claims no longer ship. Nothing was renormalised:
every §1 target is a per-muscle or per-session threshold standing on its own, not
a share of a total, so removing two adaptations changed no surviving value.

**Updated 2026-08-30 by the 010 runs** (018 step 7): rows 10.2–10.4 and
4.12 are now `convention`; the §12 not-yet-in-app numbers (recovery window,
staleness windows, push threshold, donation suppression) are grounded —
blocks in [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding).

Rows marked **†** are ones I would *not* spend a scout run on — see
[§13.2](roadmap/015-ground-trigger-spec-fixes.md#132-a-fourth-inventory-state).

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

Counts: **75 rows** — 55 fire the trigger (34 `named`, 21 `unnamed`), 8 are
ambiguous, 3 do not fire, and 9 are struck through (fixed or retired, with
nothing left to ground). **21 of the 55 firing rows are `unnamed`** — see
[§13.1](roadmap/015-ground-trigger-spec-fixes.md#131-the-gated-table-is-a-location-list).
Recounted 2026-09-01; the previous figures (64 / 8 / 3) predated the 2026-08
de-duplication strikes as well as the 019 retirements.

**Struck-through rows are fixed or retired**, not grounded. 2026-08-26 removed
six duplicate/contradictory copies (§2, §5); every surviving claim is still
`unknown`. De-duplicating a number does not ground it — it just means there is
now one thing to ground. 2026-09-01 struck four more (1.1, 1.6, 3.1, 3.2) for a
different reason: the feature that carried them was deleted, so the claim stopped
shipping. Both kinds keep their row — the number is retired, not forgotten.

---

## Decisions from scout runs

One row per *decision* a scout run produced — the design calls, not the
numbers (states live in the tables below; full evidence lives in the
briefs). `/ground` Step 3 adds a row here whenever a run's block lands.

| # | Decision (date) | Load-bearing sources | Full record |
|---|---|---|---|
| D1 | Speed and power both get `6` = 2 sessions × 3 sets — an **exposure counter, not a dose**; weekly per-muscle sets is a category error for them, and nothing supports the old 3-vs-4 distinction (2026-08-26) | Absence in [ACSM position stands](https://journals.lww.com/acsm-msse/fulltext/2009/03000/progression_models_in_resistance_training_for.26.aspx) and Ralston 2017; Galpin prescribes both identically | [011 §Decisions](roadmap/done/011-adaptation-weekly-targets.md#decisions-taken--recorded-before-the-constants-moved) |
| D2 | Strength 8 → **6** — a *derived* value: per-exercise sources converted via the premise "1 strength exercise per muscle per session", **verified against this user's own logs** (35/35 pairs). Re-run if a second strength exercise per muscle appears (2026-08-26) | ACSM 2026 (2–3 sets/exercise, ≥2 sess/wk); [Ralston 2017](https://pubmed.ncbi.nlm.nih.gov/28755103/); Supabase check 2026-08-26 | [011 §Decisions](roadmap/done/011-adaptation-weekly-targets.md#decisions-taken--recorded-before-the-constants-moved) |
| D3 | Hypertrophy floor `10` and `rx` range `10–20` are **one claim, locked**: if the floor moves to 12, the range moves to 12–20 in the same edit (2026-08-26) | [Schoenfeld 2017](https://pubmed.ncbi.nlm.nih.gov/27433992/); [Baz-Valle 2022](https://pubmed.ncbi.nlm.nih.gov/35291645/) | [011 §Decisions](roadmap/done/011-adaptation-weekly-targets.md#decisions-taken--recorded-before-the-constants-moved) |
| D4 | VO₂max stays **1/wk** — the scout's own raise-to-2 recommendation was withdrawn when the Step 2 check exposed its citations (exploratory design read as randomised; one misattributed paper). "1 maintains, 2 is where gains appear" is app copy, not a target (2026-08-26) | [Lenk 2025](https://pubmed.ncbi.nlm.nih.gov/40976973/) (correctly read); maintenance literature | [011 §cardio decision](roadmap/done/011-adaptation-weekly-targets.md#decision--cardio-weekly-session-targets-rows-1719) |
| D5 | Endurance target **deliberately left at a known-wrong value** (2 sessions ≈ 50 min/wk): the *unit* is wrong, not the integer, and moving the integer would fake plausibility. The fix is the shape change owned by 012; the Attia-vs-Galpin bout fork is decided there (2026-08-26) | [Murphy 2019](https://pubmed.ncbi.nlm.nih.gov/31267483/); WHO 150–300 min/wk | [011 §endurance](roadmap/done/011-adaptation-weekly-targets.md#endurance-the-value-is-fine-the-unit-is-wrong) |
| D6 | Muscle recovery flag = fixed **48 h** for v1 (floor of the 48–72 h band); dose-modulation (volume / proximity to failure) is the named upgrade path, not built. No 60 h midpoint — nobody holds it (2026-08-30) | [Morán-Navarro 2017](https://link.springer.com/article/10.1007/s00421-017-3725-7); [Bartolomei 2017](https://pubmed.ncbi.nlm.nih.gov/28447186/) | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) |
| D7 | The Hold verdict means **modify, not rest** — in every trial the winning low-readiness response was "train easy today", never "don't train"; the gate stays advisory (2026-08-30) | [Vesterinen 2016](https://pubmed.ncbi.nlm.nih.gov/26909534/); [Saw 2016](https://pubmed.ncbi.nlm.nih.gov/26423706/) | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) |
| D8 | Push threshold ships as **33, convention** (industry red-zone boundary); the *grounded* method is baseline-relative HRV (7-day rolling vs own baseline − 0.5 × SD), which would retire the constant (2026-08-30) | [Whoop recovery zones](https://support.whoop.com/s/article/WHOOP-Recovery?language=en_US) (convention); [Buchheit 2014](https://internal-journal.frontiersin.org/articles/10.3389/fphys.2014.00073/full); Vesterinen 2016 | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) |
| D9 | Staleness flags mean "**you are now losing it**" — VO₂max 14 d, endurance 14 d, anaerobic 28 d — not "you missed the ~7-day feeding cadence"; the semantic fork was chosen, not inherited (2026-08-30) | [Coyle 1984](https://journals.physiology.org/doi/abs/10.1152/jappl.1984.57.6.1857); [Houmard 1992](https://pubmed.ncbi.nlm.nih.gov/1487339/); [Simoneau 1987](https://pubmed.ncbi.nlm.nih.gov/3653091/) | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) |
| D10 | A full map bar means **adequate, not maximized**: anchor at 10 fractional sets/muscle/week (floor of the 10–20 band); sets are counted fractionally; the honest cycle target is 50–60 because week 6 deloads (2026-08-30) | [Schoenfeld 2017](https://pubmed.ncbi.nlm.nih.gov/27433992/); [Pelland 2026](https://pubmed.ncbi.nlm.nih.gov/41343037/); [Androulakis-Korakakis 2020](https://pubmed.ncbi.nlm.nih.gov/31797219/) | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) |
| D11 | Donation suppression is **two-stage and aerobic-only**: 48 h acute (gates a Hold) + 21 d note on VO₂max/endurance only — it never dims strength or anaerobic reads; plasma gets no multi-week note at all (2026-08-30) | [Hill 2013](https://pubmed.ncbi.nlm.nih.gov/23668764/); [Ziegler 2015](https://pubmed.ncbi.nlm.nih.gov/25512178/); [Meurrens 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC5118378/) | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) |
| D12 | Eligibility 56/14 is a **calendar chip only, never a readiness input** (P5): a per-service legal rule, not physiology — 21 d of suppression inside a 56 d gap means the countdown is never the binding constraint (2026-08-30) | [21 CFR 630.15](https://www.ecfr.gov/current/title-21/chapter-I/subchapter-F/part-630/subpart-B/section-630.15); [INTERVAL trial](https://pubmed.ncbi.nlm.nih.gov/28941948/) | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) |

## 1. Adaptation targets — what Home calls "missing"

The purpose sentence rests on these. Ground them first (Mode B, "targets before
weights").

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 1.1 | ~~`6`~~ | — | **Retired 2026-09-01.** Speed was dropped from the model (nine → seven, [done/019](roadmap/done/019-adaptation-model-simplification.md)). The constant is deleted, so the claim no longer ships. Its `convention` verdict stands as history in [011 §Grounding](roadmap/done/011-adaptation-weekly-targets.md#grounding); the reasoning behind the value survives inside row 1.2 | — | — | — |
| 1.2 | `6` | [adaptations.ts:76](../src/constants/adaptations.ts#L76) | Power needs 6 sets/muscle/week (was 4; raised to match the now-retired speed entry, which is why it is 6) | named | **convention** | adaptation-weekly-targets · **shape:** [adaptation-target-shapes](roadmap/012-adaptation-target-shapes.md) |
| 1.3 | `6` | [adaptations.ts:107](../src/constants/adaptations.ts#L107) | Strength needs 6 sets/muscle/week (was 8) | named | **grounded** | adaptation-weekly-targets |
| 1.4 | `10` | [adaptations.ts:135](../src/constants/adaptations.ts#L135) | Hypertrophy needs 10 sets/muscle/week | named | **grounded** | adaptation-weekly-targets |
| 1.5 | `6` | [adaptations.ts:161](../src/constants/adaptations.ts#L161) | Muscular endurance needs 6 sets/muscle/week | named | **convention** | adaptation-weekly-targets |
| 1.6 | ~~`3`~~ | — | **Retired 2026-09-01.** Skill was dropped from the model ([done/019](roadmap/done/019-adaptation-model-simplification.md)); its data source had already gone when sports were rerouted to cardio ([done/006](roadmap/done/006-skill-adaptation-data-source.md)). Never grounded, and now never shipped | — | — | — |
| 1.7 | `1` | [adaptations.ts:188](../src/constants/adaptations.ts#L188) | Anaerobic capacity needs 1 session/week | named | **convention** | adaptation-weekly-targets · **shape:** [adaptation-target-shapes](roadmap/012-adaptation-target-shapes.md) §5 (open question: should it have a standing target at all?) |
| 1.8 | `1` | [adaptations.ts:219](../src/constants/adaptations.ts#L219) | VO₂max needs 1 session/week | named | **grounded** | adaptation-weekly-targets |
| 1.9 | `2` | [adaptations.ts:250](../src/constants/adaptations.ts#L250) | Endurance needs 2 sessions/week — **unit known wrong**, should be weekly minutes | named | **convention** | adaptation-weekly-targets · **shape:** [adaptation-target-shapes](roadmap/012-adaptation-target-shapes.md) (carries the Attia/Galpin fork) |
| 1.10 | `0` ×7 | `weeklyMuscleTarget` / `weeklySessionTarget` sentinels throughout [adaptations.ts](../src/constants/adaptations.ts) | *Nothing.* `0` means "this axis does not apply to this adaptation" — a stand-in for `null`, read as a flag at [lib/adaptations.ts:274](../src/lib/adaptations.ts#L274) | ? | unknown † | — |
| 1.11 | all 14, duplicated | `adaptation_targets` (DB), 9 rows — 7 live, plus dead `speed` / `skill` rows nothing reads since 2026-09-01 | Identical values to 1.2–1.5 and 1.7–1.9, and **they win** — [lib/adaptations.ts:272-273](../src/lib/adaptations.ts#L272) prefers the DB row over the constant | named | **grounded** | adaptation-weekly-targets |

> **1.11 matters more than it looks.** Grounding the constants changes nothing
> the user sees. The DB rows shadow every default, are currently byte-identical,
> and carry no marker distinguishing "seeded" from "user-edited". See
> [§13.3](roadmap/015-ground-trigger-spec-fixes.md#133-the-db-shadow-makes-defaults-not-runtime-edits-undecidable).

## 2. Rep-range classification

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 2.1 | `[1, 5]` | [adaptations.ts:94](../src/constants/adaptations.ts#L94) | 1–5 reps = strength | named | unknown | cross-adaptation-rep-ranges |
| 2.2 | `[6, 15]` | [adaptations.ts:125](../src/constants/adaptations.ts#L125) | 6–15 reps = hypertrophy | named | unknown | cross-adaptation-rep-ranges |
| 2.3 | `[16, 999]` | [adaptations.ts:153](../src/constants/adaptations.ts#L153) | 16+ reps = muscular endurance | named | unknown | cross-adaptation-rep-ranges |
| 2.4 | ~~`reps <= 5`~~ | — | **Fixed 2026-08-26.** `classifyWeightSet` now derives its boundaries from `repRange`, so 2.1–2.3 are the live values and there is one copy | — | — | — |
| 2.5 | ~~`reps <= 15`~~ | — | **Fixed 2026-08-26**, same change | — | — | — |
| 2.6 | 20 keyword rules | [adaptations.ts:277-304](../src/constants/adaptations.ts#L277) | "kettlebell swing is power", "pogo is power", etc. — a physiological classification carrying **no digit**. All 20 now point at power: the four sprint/reactive rules (`sprint`, `dash`, `agility`, `pogo`) tagged the retired `speed` adaptation until 2026-09-01 and were repointed with it ([done/019](roadmap/done/019-adaptation-model-simplification.md)) | ? | unknown | cross-adaptation-rep-ranges |

> **~~2.1–2.3 are dead code.~~ Fixed 2026-08-26** — `classifyWeightSet` now reads
> `repRange` ([lib/adaptations.ts](../src/lib/adaptations.ts#L23)), so the gated
> constant is the live one. Behaviour is unchanged, so no claim moved
> (exemption 2). The rows stay `unknown`: de-duplicating a number does not ground
> it. The finding it produced stands — see
> [§13.1](roadmap/015-ground-trigger-spec-fixes.md#131-the-gated-table-is-a-location-list).

## 3. `rx` prescriptions — 7 blocks, ~35 numbers in prose

One row per adaptation; the gated table covers `load / reps / sets / rest /
effort / cue` for all of them. All named, all `unknown`, and the cues are the
sharpest debt in the app because they read as settled fact.

| # | Numbers asserted | Where | Notable claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 3.1 | ~~Skill: 3–5 reps~~ | — | **Retired 2026-09-01** with row 1.6 — the whole `skill` entry, `rx` block included, is deleted ([done/019](roadmap/done/019-adaptation-model-simplification.md)) | — | — | — |
| 3.2 | ~~Speed: 0–30% 1RM, 1–5 reps, 3–5 sets, 2–5 min~~ | — | **Retired 2026-09-01** with row 1.1 — the whole `speed` entry, `rx` block included, is deleted. Velocity work now falls under power's band (row 3.3), which is 30–70% 1RM: a *narrower* load claim than the one it replaces, so nothing ungrounded was widened | — | — | — |
| 3.3 | Power: 30–70% 1RM, 1–5, 3–5, 2–5 min | [adaptations.ts:78-85](../src/constants/adaptations.ts#L78) | Load band for ballistic work | named | unknown | cross-adaptation-rep-ranges |
| 3.4 | Strength: 85–100% 1RM, 3–5, 3–5, 2–5 min, 1–2 RIR | [adaptations.ts:109-116](../src/constants/adaptations.ts#L109) | **Cue names "Galpin's 3–5 rule" as settled** — a `[single-practitioner position]` with no provenance ([adaptations.ts:115](../src/constants/adaptations.ts#L115)); the skill's own *Known debt* entry | named | unknown | cross-adaptation-rep-ranges |
| 3.5 | Hypertrophy: 30–80% 1RM, 5–30 (≈8–15), 10–20 sets/muscle/wk, 30 s–2 min, 0–4 RIR | [adaptations.ts:137-144](../src/constants/adaptations.ts#L137) | ~~contradicts row 1.4~~ **Resolved 2026-08-26**: not a contradiction. The target is the minimum-effective floor; the `rx` is the productive range *whose floor is that same number*. Both unchanged, now locked together in the source comment — neither moves without the other | named | **grounded** | adaptation-weekly-targets |
| 3.6 | Musc. endurance: <50% 1RM, 15–40+, 2–4, <60 s | [adaptations.ts:163-170](../src/constants/adaptations.ts#L163) | Load ceiling and rest floor | named | unknown | cross-adaptation-rep-ranges |
| 3.7 | Anaerobic: 20 s–2 min, 3–8 rounds, 1:2–1:4 rest | [adaptations.ts:189-196](../src/constants/adaptations.ts#L189) | Work:rest ratio | named | unknown | hr-zone-intensity-classification |
| 3.8 | VO₂max: ~90–100% HRmax, 3–8 min, 4–6 sets, ≈1:1 | [adaptations.ts:220-227](../src/constants/adaptations.ts#L220) | **Cue ships the "classic 4×4 min at 90–95% HRmax" protocol** ([adaptations.ts:226](../src/constants/adaptations.ts#L226)) — a named protocol, unattributed. Same failure class as 3.4 | named | unknown | hr-zone-intensity-classification |
| 3.9 | Endurance: Zone 2, 30 min–hours | [adaptations.ts:251-258](../src/constants/adaptations.ts#L251) | "Nasal-breathing pace"; "builds mitochondria & fat oxidation" — a **mechanistic** claim, no number | named | unknown | hr-zone-intensity-classification |
| 3.10 | *(none)* | [adaptations.ts:268-270](../src/constants/adaptations.ts#L268) | `ADAPTATION_PRINCIPLE`: "Power · Strength are quality-driven — never train to fatigue… Hypertrophy → Endurance are volume/fatigue-driven". A categorical physiological claim that **carries no digit at all**. Shortened 2026-09-01 by the removal of skill and speed — the same claim over fewer qualities, still ungrounded | ? | unknown | cross-adaptation-rep-ranges |

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
| 4.12 | `80` / `50` | [RecoveryCard.tsx:20-21](../src/components/tabs/home/RecoveryCard.tsx#L20) | ≥80% readiness is green (push), 50–79 amber, <50 red. **This is the app's answer to "am I recovered enough to push today?"** | unnamed | **convention** | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) — any fixed cutoff on a 0–100 composite is convention; grounded method is baseline-relative HRV |
| 4.13 | `sub >= 1` | [RecoveryCard.tsx:239](../src/components/tabs/home/RecoveryCard.tsx#L239) | A modality is "on target" at exactly 100% of its weekly target — no credit above, no partial band | unnamed | unknown † | home-fused-reads |
| 4.14 | `80` °C / `10` °C | [RecoveryCard.tsx:177](../src/components/tabs/home/RecoveryCard.tsx#L177), [:201](../src/components/tabs/home/RecoveryCard.tsx#L201) | Placeholder temperatures for a sauna / cold session. Stored, never scored | ? | unknown † | — |

## 5. Cycle length & deload

**Three bugs here were fixed 2026-08-26** (struck-through rows). What remains is
the claim itself: a 6-week block, deloading in week 6, at 70% of reps.
**Resolved 2026-08-26** — this was the one domain with nowhere for a block to
land; [roadmap/013-cycle-deload-grounding.md](roadmap/013-cycle-deload-grounding.md) was
created to carry it.

| # | Value | Where | Claim | Step 0 | State | Grounding brief |
|---|---|---|---|---|---|---|
| 5.1 | `CYCLE = 6` | [app.ts:3](../src/constants/app.ts#L3) | A training block is 6 weeks | named | unknown | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.2 | ~~`CYCLE = 6`~~ | — | **Fixed 2026-08-26** — `utils.ts` imports `CYCLE` from `constants/app` | — | — | — |
| 5.3 | `DELOAD_WEEK = CYCLE` | [app.ts:9](../src/constants/app.ts#L9), used at [utils.ts:51](../src/lib/utils.ts#L51), [:61](../src/lib/utils.ts#L61) | **Week 6 is the deload week** — deload placement. Named as of 2026-08-26; still ungrounded | named | unknown | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.4 | `DELOAD_REP_FACTOR = 0.7` | [app.ts:16](../src/constants/app.ts#L16), applied by `deloadSets` at [utils.ts:69](../src/lib/utils.ts#L69) | Deload = 70% of last reps, load unchanged. **Fixed 2026-08-26** — was three implementations, two of which disagreed | named | unknown | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.5 | ~~`× 0.7`~~ ×2 | — | **Fixed 2026-08-26.** `VolumeRow` previewed a deload scaling *weight and reps* that the app could never apply — `ExPlan`'s button, `ExPlan`'s exported helper and `programs.deload_strategy` all say reps-only. The preview was the outlier and now calls `deloadSets` | — | — | — |
| 5.6 | `"⚠️ Deload — 70% reps"` | [VolumeRow.tsx:24](../src/components/tabs/weights/VolumeRow.tsx#L24) | The label the user reads — now derived from 5.4 and says *what* is at 70% | named | unknown | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.7 | `cycle_length_weeks: CYCLE` | [db/program.ts:259](../src/lib/db/program.ts#L259) + `programs` column default `6` | **Fixed 2026-08-26** — was hardcoded `6`; now derives from 5.1. Still write-only | named | unknown † | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.8 | `deload_week: DELOAD_WEEK` | [db/program.ts:260](../src/lib/db/program.ts#L260) | **Fixed 2026-08-26** — was hardcoded `6`; now derives from 5.3. Still write-only | named | unknown † | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.9 | `factor: DELOAD_REP_FACTOR` | [db/program.ts:261](../src/lib/db/program.ts#L261) + `programs.deload_strategy` column default | **Fixed 2026-08-26** — the write now derives from 5.4. The **jsonb column default** still carries a literal `0.7`, and nothing reads either | unnamed | unknown | [cycle-deload-grounding](roadmap/013-cycle-deload-grounding.md) |
| 5.10 | ~~`4`~~ | — | **Fixed 2026-08-26** (migration `20260826144439`). The `program_phases.duration_weeks` default asserted a 4-week phase against `CYCLE = 6`; default dropped, so a missing value is now `NULL` — which the type already allowed. No number replaced it | — | — | — |

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
| 10.2 | `56` days | [app.ts:45](../src/constants/app.ts#L45) | Full-blood donation interval | unnamed | **convention** | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) — service rule, not physiology; calendar only |
| 10.3 | `14` days | [app.ts:46](../src/constants/app.ts#L46) | Plasma donation interval | unnamed | **convention** | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) — service rule, not physiology; calendar only |
| 10.4 | `56 * 86400000` | [OverviewTab.tsx:151](../src/components/tabs/OverviewTab.tsx#L151) | Duplicate of 10.2 as a magic literal, bypassing the constant | unnamed | **convention** | [010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding) — service rule, not physiology; calendar only |
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
  [roadmap/done/007-nutrition-food-recovery-score.md](roadmap/done/007-nutrition-food-recovery-score.md)
  and its bench artifact. State: `unknown`, all of them.
- **Local recovery windows** — **grounded 2026-08-30**: 48–72 h band,
  48 h default, dose-dependent
  ([010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding)).
- **Per-quality staleness windows** — **grounded 2026-08-30**: VO₂max 14 d,
  endurance 14 d, anaerobic 28 d
  ([010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding)).
- **Push threshold (planned constant, 33)** — **convention 2026-08-30**: no
  literature supports an absolute cutoff on a composite score; the grounded
  method is baseline-relative HRV
  ([010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding)).
- **Donation suppression window** — **grounded 2026-08-30**: 48 h acute +
  21 d aerobic-only tail, whole blood only; plasma none
  ([010 §Grounding](roadmap/done/010-home-fused-reads.md#grounding)).

---

## 13. What this exercise found about the trigger

The inventory doubled as the first real test of `/ground` Step 0's trigger and
found **eight gaps** — 8 of 75 rows (11%) needed a judgement call Step 0 does not
make. Each carries a proposed `SKILL.md` edit; **none are applied**.

**Moved 2026-08-26 to [roadmap/015-ground-trigger-spec-fixes.md](roadmap/015-ground-trigger-spec-fixes.md)**
under the `pending-work-in-roadmap` house rule: they are pending work, and this
file is an index. The `13.x` numbering is preserved there, so existing references
to §13.1–§13.8 still resolve.

The back-fill running order that was §13.9 now lives in
[roadmap/done/009-feature-grounding.md](roadmap/done/009-feature-grounding.md) beside pushback #7,
whose 7(b) it sequences.
