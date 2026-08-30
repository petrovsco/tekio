# Roadmap: Adaptation weekly targets — grounding the numbers Home calls "missing"

**Label:** feature
**Status:** done — 2026-08-26. All eight acceptance criteria are ticked below: two scout runs landed, every citation was verified against NCBI eutils, the constants and the `adaptation_targets` DB shadow both carry the grounded values, and row 3.5 is resolved. The follow-ups it created are briefs 012 and 013.
**Kickoff:** this file is the brief. It exists to carry a grounding decision, not a
feature.
**Origin:** run #7(b) of [009-feature-grounding.md](../009-feature-grounding.md) — the first
back-fill scout runs. Scope set by [grounding-inventory.md](../../grounding-inventory.md)
§1 (rows 1.1–1.5, 1.7–1.9, 1.11) and §3.5, and by §13.9's ordering
("targets before weights").

## Why this is its own brief

`/ground` Mode B says a one-decision brief is legitimate for a back-fill, and
this is the case it was written for.

[010-home-fused-reads.md](../010-home-fused-reads.md) is the natural-looking home — the
inventory points nine rows at it — but it is the wrong place, for three reasons:

1. It is marked **"proposed — do not build from this until the two-level model in
   §2 is confirmed."** The source comments written by this run sit on **shipped**
   constants. A comment citing a brief that says *don't build* is a comment that
   contradicts the code it annotates.
2. If that model is rejected or reshaped, the brief is rewritten or dropped and
   the grounding block is orphaned. `/ground` Step 3's maintenance rule forbids
   the obvious rescue — *"Grounding blocks travel with their brief — never copy
   one into a second file."*
3. These targets are not *about* the fused Home read. They are a standalone
   volume claim consumed by Home, the Adaptations tab and the body map, and they
   have to outlive any single redesign of the surface that reads them.

So the blocks live here. `010-home-fused-reads.md` keeps its own grounding
requirement — the per-muscle **recovery window**, which is a different question
and is still unrun.

## Scope

**In:** the nine weekly targets in [src/constants/adaptations.ts](../../../src/constants/adaptations.ts),
their nine shadow rows in the `adaptation_targets` table, and the hypertrophy
`rx.sets` conflict (inventory row 3.5).

**Out, deliberately:** row 1.6 (skill = 3 sessions/week) is blocked on a product
decision in [006-skill-adaptation-data-source.md](006-skill-adaptation-data-source.md),
not on evidence — grounding a target for an adaptation whose data source is
undecided would be grounding the wrong question. §4 recovery weights and §5
cycle/deload are separate runs, later. The nine `0` sentinels (row 1.10) assert
nothing and are not gated.

## The DB shadow (inventory row 1.11) — why this brief changes two things

`adaptation_targets` overrides the `adaptations.ts` defaults per row and **wins**
at [src/lib/adaptations.ts:261-262](../../../src/lib/adaptations.ts#L261). Grounding
the constant alone would change nothing the user sees, and would leave the
grounding block asserting something the running app contradicts.

Checked before touching anything, 2026-08-26: all nine rows were byte-identical
to the constants and shared a single `updated_at` of `2026-07-06 03:31:10.770859+00`
— one seed, never user-edited. That settles the "seeded vs user-edited"
ambiguity §13.3 raises, **for this run only**: the rows carry no marker, so the
same check has to be repeated next time rather than assumed.

Any value changed below is therefore changed in **both** places in the same
commit, and verified with a query.

---

## Decisions taken — recorded before the constants moved

`/ground`'s hard rule: *"If the scout contradicts the value already shipped, that
is a decision, not a find-and-replace. Record it in the brief before touching the
constant."* Two of the nine values below are contradicted. This section is that
record; the constants were edited after it was written.

### Resistance — `weeklyMuscleTarget` (sets / muscle group / week)

| Adaptation | Was | Now | Verdict | Why |
|---|---|---|---|---|
| Speed | 3 | **6** | `convention only` | No source doses speed in weekly sets per muscle. 3 is *below one session* of the app's own `rx` (3–5 sets), so a single session turned a muscle green. 6 = 2 sessions × 3 sets restores a floor of ≥2 sessions/week. |
| Power | 4 | **6** | `convention only` | Same absence, same fix. Nothing anywhere supports speed and power carrying **different** numbers — Galpin prescribes both identically — so the 3-vs-4 distinction was invented. |
| Strength | 8 | **6** | `grounded` (derived; premise verified — see below) | Every source agrees the strength dose sits *below* the hypertrophy dose; 8 vs 10 compressed that to almost nothing. |
| Hypertrophy | 10 | **10** (unchanged) | `grounded` | The one value with a direct, replicated per-muscle weekly threshold. |
| Muscular endurance | 6 | **6** (unchanged) | `convention only` | LME is dosed by load and reps, not weekly sets, in both ACSM position stands. The number stays; the label changes. |

### Resolving inventory row 3.5 — hypertrophy `10` vs `rx.sets: '10–20 / muscle / week'`

**Not a contradiction, and both stay as they are.** The target is the
minimum-effective floor; the `rx` is the productive range *whose floor is that
same number*. `10` = "you have done enough to grow"; `10–20` = "where growth is
actually driven". The defect was that this relationship was stated nowhere, which
is what made it read as one claim with two values. It is now stated in the source
comment, and the two are explicitly locked: if the floor ever moves to 12
(Baz-Valle's optimum for trained men), `rx.sets` moves to `12–20` in the same
edit. They are one claim and must never be edited independently.

### The empirical check that settled strength — and why it was needed

The scout's strength recommendation is **derived, not published**, and it said so
rather than hiding it. No source publishes a weekly per-muscle set target for
strength: ACSM 2026 gives *2–3 sets **per exercise**, ≥2 sessions/week*, and
Ralston 2017's bands are also per exercise. Converting either to Tekiō's
per-muscle-per-week unit needs one assumption — **~1 strength exercise per muscle
per session**. Under 2+ exercises per muscle the same sources support 8–12, and
the shipped `8` would have been correct.

That is an assumption about *this user*, so it was checked against this user's
data rather than assumed (Supabase, 2026-08-26):

> Across every session containing sets in the strength rep range (1–5, warm-ups
> excluded): **36 exercise instances, 29 sessions, 35 (muscle × session) pairs.
> Mean primary-mover exercises per muscle per session = 1.00. Max = 1. Pairs with
> 2+ = 0 (0.0%).**

The premise is not merely plausible here, it is exactly true — so the derivation
holds and `6` is the right value. **Two honest caveats** that the number's
verdict rests on:

- **The sample is thin for strength.** 36 exercise instances over 13 distinct
  weeks (2026-04-08 → 2026-08-20), median **1 set** per exercise instance
  (mean 1.25, max 2). This user does little 1–5-rep work, so *both* 8 and 6 are
  targets they rarely approach; the change makes the number honest, it does not
  change the app's verdict much today.
- **The user logs ~1 set per strength exercise, against ACSM's 2–3.** The target
  of 6 assumes 3 sets × 2 sessions. That gap is an observation about training,
  not a reason to move the constant, and it is deliberately not acted on here.

**If training changes, this number changes.** Add a second strength exercise per
muscle per session and 6 becomes wrong — 8–12 is then the supported range. That
is the trigger to re-run this decision.

### Deferred, with reason — the speed/power reshape

The scout's *preferred* answer for speed and power was not `6` but a shape
change: `weeklyMuscleTarget: 0` + `weeklySessionTarget: 2`, following the
`skill` precedent, because a weekly per-muscle **set** count for two qualities
the app itself labels *"never train to fatigue"* is a category error — measuring
a quality-driven adaptation with a fatigue-shaped metric.

**That is not a constant edit, and it is not done here.** For resistance
adaptations `volume[a] += 1` increments **per set**
([src/lib/adaptations.ts:218](../../../src/lib/adaptations.ts#L218)), while
`unit` renders from `modality`
([src/lib/adaptations.ts:288](../../../src/lib/adaptations.ts#L288)). Setting
`weeklySessionTarget: 2` on speed today would make the app compare a **set
count** against a **session target** and still label the result "sets" — a
silently wrong number, which is worse than the ungrounded one it replaced.
Making it honest needs a session-counting path for resistance adaptations, which
is a code change well outside this run's one question.

So `6` is taken as the scout's own stated fallback, and recorded for what it is:
**an exposure counter, not a dose.** The reshape is the real fix and belongs in
whichever brief rebuilds the adaptation reads — most likely
[010-home-fused-reads.md](../010-home-fused-reads.md).

---

## Grounding — resistance weekly set targets

*Scout block, revision 2, pasted verbatim. The only edit is the heading suffix,
which distinguishes it from the cardio block below.*

> **Correction flag (revision 2):** three defects fixed on review — the Pelland citation had a transposed PMID and the wrong year (now Pelland et al. **2026**, PMID 41343037); Stuart Phillips is described as **senior author**, not chair; and the strength evidence line no longer presents "≈4–6 sets/muscle/week" as an ACSM figure. **That third fix changes my confidence in the strength value.** ACSM states sets *per exercise per session*, and the conversion to a weekly per-muscle total rests on an assumption ACSM never makes. The recommendation to lower strength from 8 is unchanged in direction and the default is still 6, but **6 is now labelled a derivation rather than a published number**, and the conditional under which the current 8 is defensible is stated explicitly below. Nothing else in the block was altered.

**Claim:** A muscle group is "adequately stimulated" for a given resistance adaptation at N hard sets/muscle group/week — speed 3, power 4, strength 8, hypertrophy 10, muscular endurance 6. Drives the green / amber / grey colouring of every muscle on Tekiō's body map, i.e. the app's entire "what's missing" verdict.
**Searched:** 2026-08-26 · **Verdict:** partially supported — one of the five is well grounded, one is defensible-but-set-too-high on a derivation rather than a published number, and three are conventions with no weekly-set literature behind them.
**Number to use:**
- **hypertrophy 10–12 — default 10** (keep). The only one of the five with a direct, replicated weekly-per-muscle threshold.
- **strength 4–8 — default 6** (change from 8), *derived, not published*. Every strength-volume source doses **per exercise**, not per muscle per week; 6 assumes ~1 strength exercise per muscle per session across ≥2 sessions/week. If the user's strength sessions routinely run **2+ exercises per muscle**, the same sources support 8–12 and the existing 8 is fine. See the derivation note below before changing the constant.
- **muscular endurance 4–8 — default 6** (keep the number, relabel it). No weekly-set literature exists for LME; 6 is a maintenance-volume convention.
- **speed and power — both 6 if the field stays a weekly per-muscle set count** (change from 3 and 4), *or* preferably `weeklyMuscleTarget: 0` + `weeklySessionTarget: 2`, following the existing `skill` precedent. No source doses either quality in weekly sets per muscle, and nothing supports speed and power carrying different numbers.

### Evidence

- `[literature]` A threshold of ~**10 weekly sets per muscle group** was identified for near-maximal hypertrophy; each additional set raised effect size by 0.023 (≈0.37% extra gain), p = 0.002. Meta-regression, 34 treatment groups from 15 studies, trained and untrained — [Schoenfeld, Ogborn & Krieger 2017, *J Sports Sci* 35(11):1073–82](https://pubmed.ncbi.nlm.nih.gov/27433992/)
- `[literature]` Hypertrophy is "enhanced by higher volumes (**≥10 sets/week**)" and eccentric overload. For strength, the exact wording is: "voluntary strength was enhanced by lifting heavier loads (≥80% one-repetition maximum), through a complete range of motion, **for 2–3 sets**, at the beginning of training sessions, and **≥2 sessions/wk**" — that is sets **per exercise per session**; the position stand states **no weekly per-muscle set total for strength**. Power is enhanced by moderate loads (30–70% 1RM) and **low-to-moderate volume (≤24 repetitions·sets)** with maximal concentric intent. Umbrella review of 137 systematic reviews, >30,000 participants; senior author Stuart Phillips — [ACSM Position Stand, *Med Sci Sports Exerc* 2026 Apr;58(4):851–872](https://pubmed.ncbi.nlm.nih.gov/41843416/) ([ACSM summary](https://acsm.org/resistance-training-guidelines-update-2026/))
- `[literature]` Volume raises both hypertrophy and strength (posterior probability of positive slope 100% for each), but with **diminishing returns that are "considerably more pronounced" for strength than for hypertrophy**; ≈0.24% hypertrophy gain per extra set at an average of 12.25 weekly sets. Frequency had negligible effect on hypertrophy, a positive one on strength. 67 studies, 2,058 participants; sets classified direct vs indirect and weighted 1 / 0.5 / 0 — [Pelland JC, Remmert JF, Robinson ZP, Hinson SR, Zourdos MC 2026, *Sports Med* 56(2):481–505](https://pubmed.ncbi.nlm.nih.gov/41343037/)
- `[literature]` Graded dose-response for strength, but a **small one**: high weekly sets (≥10 **per exercise**) beat low (≤5 per exercise) by only ES 0.18 (95% CI 0.06–0.30), on mean ES of 0.82 vs 1.01 — i.e. low volume already delivered ~80% of the effect. 9 studies, 223 trained males, mean age 23.4 y. Authors recommend medium (5–9 sets/exercise/week) for novice–intermediate, medium *or* high for advanced — [Ralston, Kilgore, Wyatt & Baker 2017, *Sports Med* 47(12):2585–2601](https://pmc.ncbi.nlm.nih.gov/articles/PMC5684266/)
- `[literature]` "A range of **12–20 weekly sets per muscle group** may be an optimum standard recommendation for increasing muscle hypertrophy in young, trained men." >20 sets was no better than 12–20 for quadriceps (p = 0.19) or biceps (p = 0.59); only triceps favoured high volume (p = 0.01). 7 studies, participants ≥1 y training experience, 18–35 y; direct *and* indirect sets counted — [Baz-Valle, Balsalobre-Fernández, Alix-Fages & Santos-Concejero 2022, *J Hum Kinet* 81:199–210](https://pmc.ncbi.nlm.nih.gov/articles/PMC8884877/)
- `[literature]` Across strength, power, jump and sprint outcomes, more sets helped **uniformly** (SMD 0.05 [95% CrI 0.03–0.07] per set) with **no domain-specific set profile** — adding a cross-level interaction between outcome domain and sets did not improve the model. What *did* differ by domain was load: strength inflects ~70% 1RM, power peaks ~40–70% 1RM, jump ~30% 1RM, sprint favours heavy. Note this modelled **sets per session, not weekly sets per muscle group**. 295 studies, 535 groups, 6,710 participants — [Swinton, Schoenfeld & Murphy 2024, *Sports Med* 54(6):1579–94](https://pmc.ncbi.nlm.nih.gov/articles/PMC11239729/)
- `[literature]` The dose variable for local muscular endurance in the ACSM guideline is **load and repetitions, not weekly sets**: 40–60% 1RM, >15 reps, rest <90 s. No weekly per-muscle set count is given for LME in either the 2009 or the 2026 position stand — [ACSM 2009 Position Stand, Progression Models in Resistance Training, *Med Sci Sports Exerc* 41(3):687–708](https://pubmed.ncbi.nlm.nih.gov/19204579/)
- `[literature]` Hypertrophy increases as sets are taken closer to failure, with the slope **tapering past ~2 RIR**; strength gains were near-indifferent to proximity to failure. 55 hypertrophy and 67 strength studies — [Robinson et al. 2024, *Sports Med*](https://pubmed.ncbi.nlm.nih.gov/38970765/). Relevant because Tekiō counts a logged working set regardless of effort, while the literature's "set" is implicitly a hard one.
- `[literature]` For speed and power the dose unit in the literature is **contacts, sprints and sessions — never sets per muscle**: plyometric effects are moderated by jump contacts per session (>50–80) and total touches (>900, best >1400) across 2–4 sessions/week — [Nature *Sci Rep* 2025 plyometrics meta-analysis](https://www.nature.com/articles/s41598-025-10652-4); sprint work is dosed by maximal-velocity exposure volume, with neuromuscular demand rising ~6.32% MVC per 1 m/s — [*Appl Sci* 15(9):4959, 2025](https://www.mdpi.com/2076-3417/15/9/4959)
- `[practitioner consensus]` **10–20 hard sets/muscle/week** is the working hypertrophy range. Held by Israetel ("most lifters progress best between 10 and 20 hard sets per muscle per week") and Galpin/Huberman (10–20, with Galpin programming 15–20). — [RP Strength volume landmarks](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth), [Huberman Lab / Galpin](https://ai.hubermanlab.com/s/LTQQYNu_)
- `[practitioner consensus]` **Strength, speed and power are prescribed per session, not per week per muscle.** Galpin's 3–5 rule (3–5 reps, 3–5 sets, 3–5 min rest, 3–5×/week) is stated identically for strength, speed and power; Attia prescribes at the session level (3 full-body sessions/week) and offers no per-muscle weekly set number at all. Held by Galpin, Huberman, Attia — [Huberman Lab](https://ai.hubermanlab.com/s/LTQQYNu_), [Attia AMA #71](https://peterattiamd.com/ama71/)
- `[single-practitioner position]` **Maintenance volume ≈ 6 sets/muscle/week.** Israetel only; no one else in the roster names a maintenance figure, and no literature I found tests one. He explicitly frames MV/MEV/MAV/MRV as "starting points, not gospel" — a heuristic model, not a measurement — [RP Strength](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth)
- `[single-practitioner position]` **Muscular endurance = 3–5 sets/exercise, 12–25 reps, 3–4×/week.** Galpin/Huberman only; Israetel and Attia are silent on LME dosing — [Huberman Lab](https://ai.hubermanlab.com/s/LTQQYNu_). Note this is a *session* prescription, like everyone else's.

### The strength derivation, stated explicitly

No source publishes a weekly per-muscle set target for strength. The 4–8 range and the default of 6 are **my arithmetic**, and the block should be read that way:

- ACSM 2026 gives **2–3 sets per exercise**, **≥2 sessions/week**. Multiplying these yields 4–6 sets/muscle/week **only if you assume one strength exercise per muscle per session** — an assumption ACSM does not state anywhere.
- Ralston 2017 has the same shape problem in reverse: its bands (≤5 low, 5–9 medium, ≥10 high) are **per exercise per week**, and its recommendation for advanced trainees is medium *or* high. Under the one-exercise assumption that is 5–9+ sets/muscle/week; under two exercises it is 10–18.
- So the fragile step is not ACSM specifically — it is that **the entire strength-volume literature is dosed per exercise while Tekiō's field is per muscle.** The conversion factor is "exercises per muscle per session," a quantity the app can compute from logged data but the constant cannot know.

What survives the assumption regardless: **Pelland 2026** shows strength diminishes faster than hypertrophy, and **Ralston 2017** shows the low band already captured ~80% of the strength effect. Both say the strength threshold sits **below** the hypertrophy threshold of 10. Tekiō's current 8 vs 10 compresses that gap almost to nothing. Lowering to 6 widens it correctly under the one-exercise assumption; if the user's strength work is typically 2+ exercises per muscle per session, **8 is defensible and should be left alone**. Check the logged data before changing this constant — that check is cheap and it settles the question directly.

### Where they split

**Split 1 — what "adequate" means for hypertrophy: 10 or 12–20.** ACSM 2026 and Schoenfeld 2017 put the near-maximal threshold at ~10; Baz-Valle puts the *optimum* for trained men at 12–20; Israetel ramps MEV→MRV across a mesocycle, often past 20. These are not in conflict — they answer different questions. Tekiō has to pick which question green answers. Given the doctrine ("Tekiō tells me what's missing," not "Tekiō tells me I'm optimal"), green should mean **adequate**, so 10 is the right target and the 12–20 evidence belongs in the rx range, not the threshold.

**Split 2 — junk volume.** Pelland 2026's diminishing returns and Baz-Valle's null result between 12–20 and >20 sets (quads p = 0.19, biceps p = 0.59) argue the top of the range buys little; Israetel's MAV/MRV model argues you should keep climbing until performance degrades. Tekiō does not have to resolve this, because it only needs a floor — but it does mean **the target must never be set from the top of the productive range.** That is exactly the error in the current strength value.

**Split 3 — strength volume.** Ralston 2017 reports a graded dose-response favouring higher sets; Pelland 2026 finds strength has *more* pronounced diminishing returns than hypertrophy; ACSM 2026 lands lowest of all at 2–3 sets per exercise, ≥2 sessions/week. Every source agrees the strength dose is **lower than the hypertrophy dose**. Tekiō's 8 vs 10 encodes that ordering correctly but compresses it too much — under the one-exercise-per-muscle assumption the honest gap is roughly 6 vs 10. That assumption is the whole argument, so it is stated in full above rather than buried in a number.

**Split 4 — speed and power: not a split, an absence.** No source in either tier doses speed or power in weekly sets per muscle group. The literature dose is load, intent, contacts and sessions; the practitioners dose per session. A weekly per-muscle set count for these two is a **category error**, and Tekiō's own reference cards already say so — it labels them *never train to fatigue*, then measures them with a fatigue-shaped metric. Worse, the current values are internally inconsistent with the app's own rx: speed target 3 and power target 4 are each **at or below a single session's prescribed 3–5 sets**, so one session turns a muscle green while ACSM's floor is ≥2 sessions/week. And nothing anywhere supports speed and power carrying *different* numbers — Galpin gives them the identical 3–5 protocol. The design decision this forces: either move both to `weeklySessionTarget: 2` (the shape `skill` already uses, `weeklyMuscleTarget: 0`), or keep the per-muscle count and set both to 6 = 2 sessions × 3 sets, accepting that it is an exposure counter and not a dose.

**Resolution of the hypertrophy target-vs-rx conflict (`weeklyMuscleTarget: 10` vs `rx.sets: '10–20 / muscle / week'`).** These are **not** in conflict, and the relationship is the correct one: **the target is the minimum-effective floor; the rx is the productive range whose floor is that same number.** Both should stay as they are. What is missing is that the relationship is nowhere stated, which is how it read as a contradiction. Make it explicit in the source comment and, if the UI ever surfaces both together, in the card copy: 10 = "you have done enough to grow"; 10–20 = "where growth is actually driven." If you would rather green mean *optimal for a trained lifter*, the number to move to is **12** (Baz-Valle's floor for trained men) — and then the rx should read 12–20, so the two stay locked together. Do not leave them independently editable; they are one claim.

### Caveats

- **Per-exercise vs per-muscle (the structural one):** ACSM 2026 and Ralston 2017 both dose strength **per exercise**, and Swinton 2024 doses **per session**. Only the hypertrophy sources (Schoenfeld 2017, Baz-Valle 2022, ACSM 2026's hypertrophy line, Pelland 2026) dose **per muscle per week**, which is Tekiō's unit. This is why hypertrophy is the one solid number of the five and everything else needs an assumption to reach the app's shape.
- **Population mismatch:** the weekly-volume literature is overwhelmingly young (18–35 y), male, resistance-trained-but-not-elite, over 6–12 week interventions, with hypertrophy measured at quadriceps, biceps and triceps. Ralston's sample is 223 males, mean 23.4 y. A mid-30s consistently-training male is a good match for the hypertrophy work and an acceptable one for strength; nothing here is validated on a 6-week block structure with a week-6 deload, and nothing accounts for concurrent cardio and mobility volume, which the user has and the studies did not.
- **Set-counting mismatch:** Tekiō's 1.0 / 0.5 / 0.25 muscle weighting is close to Pelland 2026's direct/fractional/indirect scheme (1 / 0.5 / 0) — which that paper calls "essential for predicting adaptations" — but Tekiō's **0.25 tier has no analogue in any source**. Every set counted at 0.25 inflates the total against a target derived from studies that would have scored it 0. Expect Tekiō to reach a given number sooner than the literature intends, which argues for the floor of each range rather than the middle.
- **Effort mismatch — weaker than it first looks.** Tekiō counts a logged working set regardless of proximity to failure, while the literature's set is implicitly hard (Robinson 2024: the hypertrophy slope only flattens past ~2 RIR). But ACSM 2026 explicitly reports that "training to momentary muscle fatigue, equipment type, exercise complexity, set structure, time under tension, blood flow restriction, and periodization did not consistently impact training outcomes." So the umbrella-review-level evidence does *not* support a large penalty for effort-blind set counting. Net read: worth an RIR field eventually, not worth inflating the targets now to compensate.
- **Rep-range binning:** Tekiō assigns adaptation by rep range (strength 1–5, hypertrophy 6–15, LME 16+). None of the source studies partition weekly volume this way — they count all sets toward one outcome. So Tekiō's five targets are being applied to five *disjoint* set pools, while the literature's thresholds were measured on undivided pools. This systematically under-fills every bin and is a stronger argument than any individual number for keeping targets at the low end of their ranges.
- **What would move these numbers:** a meta-regression reporting per-muscle weekly-set thresholds separately for trained vs untrained (would firm up 10 vs 12); any strength trial reporting volume **per muscle per week** rather than per exercise (would convert the strength 6 from derivation to evidence, and is the single highest-value gap here); any RCT dosing local muscular endurance by weekly set count rather than reps per set; any study dosing power or speed per muscle per week (would justify keeping those fields at all); and an RIR field in Tekiō.

---

## Grounding — cardio weekly session targets

*Scout block, revision 2, pasted verbatim. The only edit is the heading suffix.
Revision 1 recommended raising VO₂max to 2; it failed the Step 2 check and the
scout withdrew the recommendation on re-examination — see the decision section
below for why that reversal is the run's most valuable output.*

**Claim:** Weekly session targets marking "adequate cardio stimulus" for a trained adult — anaerobic capacity 1/wk, VO₂max 1/wk, Zone-2 endurance 2/wk. Drives whether Tekiō's Home/Adaptations read calls each cardio quality "missing" this week, and therefore what the user trains next.
**Searched:** 2026-08-26 · **Verdict:** partially supported

**Number to use:**
- **VO₂max: keep 1.** No source in the record shows 1 session/wk failing. The one direct frequency study found significant VO₂max improvement at *every* frequency including once weekly, and three independent maintenance sources agree ~1/wk (even 0.5/wk) holds VO₂max when intensity is preserved. Since the target is an adequacy floor and not an optimum, 1 is the correct floor; 2 is where the largest effects appear and belongs in the app's copy, not in the constant.
- **Endurance (Zone 2): the session count is the wrong unit — use 150–240 min/wk, default 150 min.** Every recommendation in this space (WHO, Attia, Galpin) is denominated in weekly minutes, and a matched-volume meta-analysis finds bout structure irrelevant to cardiorespiratory fitness — so "2 sessions" permits 2 × 30 min = 60 min/wk, under half of every published floor. If the integer field must survive, **3** is the defensible count at Tekiō's current ≥30-min session definition; **2** is defensible only with an enforced ≥60 min/session floor.
- **Anaerobic capacity: 0 standing, 2/wk inside a 3–6 week block.** No evidence supports a permanent weekly anaerobic requirement for a non-competitive trained adult; the quality detrains slowly and the improvement literature is block-shaped. A standing `1` is a convention for *exposure*, not a grounded adequacy threshold.

### Evidence
- `[literature]` 4×4-min HIIT at once, twice or thrice weekly: **"Significant improvements in VO2max and TTE were observed across all training frequencies (p < 0.05)"**, Cohen's d for VO₂max 0.09–0.61 [95% CI −0.56 to 1.42] and TTE 0.02–0.77 [−0.65 to 1.61] across arms; **"The largest effects (d > 0.5) were found for VO2max and TTE in the groups training two or three times per week"**, with "no clear additional benefit from increasing the frequency to three sessions per week." Authors' own framing: *exploratory*, "preliminary findings… while acknowledging limited precision." **Not a randomised trial** — exploratory, 26 recreationally active participants (baseline VO₂max 51.3 ± 7.1 mL·kg⁻¹·min⁻¹), six weeks, individualised protocols, adherence 91–100% — [Lenk M, Matzka M, Lauber L, Kunz P, Sperlich B. *Physiol Rep* 2025 Sep;13(18):e70573, PMID 40976973](https://physoc.onlinelibrary.wiley.com/doi/10.14814/phy2.70573). *The abstract reports d as a range across arms and does not assign values to arms; the ordering (1× at the low end, 3× at the high end) is an inference from the "largest effects in the two- or three-times groups" sentence, not a stated result. Per-arm n, sex split and mean age are not in the abstract and I could not verify them — they are omitted here.*
- `[literature]` 4×4 min at 90–95% HRmax, 3×/wk for 8 weeks, raised VO₂max 7.2% vs 5.5% for 15/15 and less for continuous work. RCT, 40 moderately trained non-smoking men, four arms — [Helgerud et al. 2007, *Med Sci Sports Exerc* 39(4):665–71, PMID 17414804](https://rcc.hslu.ch/fileadmin/user_upload/downloads/sport/Aerobic_High-Intensity_Intervals_Improve_J.Helgerud_2007.pdf)
- `[literature]` One HIT session *every second week* (0.5/wk) maintained VO₂max as well as 1/wk across a 6-week off-season (64.0 vs 64.3 mL·kg⁻¹·min⁻¹). Randomised, 17 semi-professional Norwegian 2nd/3rd-division soccer players, 5 × 4 min at 87–97% HRpeak — [Slettaløkken & Rønnestad 2014, *J Strength Cond Res* 28(7):1946–51, PMID 24561653](https://pubmed.ncbi.nlm.nih.gov/24561653/)
- `[literature]` After a 10-week build (VO₂max +20–25%), cutting frequency from 6 d/wk to 4 or **2 d/wk** held VO₂max at trained levels for a further 15 weeks, provided intensity and duration were unchanged. n = 12, mean age 23 — [Hickson & Rosenkoetter 1981, *Med Sci Sports Exerc* 13(1):13–16, PMID 7219129](https://pubmed.ncbi.nlm.nih.gov/7219129/)
- `[literature]` Endurance performance is maintained up to 15 weeks at as few as 2 sessions/wk, or with volume cut 33–66% (to 13–26 min/session), **so long as intensity is maintained**; intensity, not frequency, is the load-bearing variable. Review of >4-week reduced-training studies — [Spiering, Mujika, Sharp & Foulis 2021, *J Strength Cond Res* 35(5):1449–1458, PMID 33629972](https://journals.lww.com/nsca-jscr/fulltext/2021/05000/maintaining_physical_performance__the_minimal_dose.35.aspx)
- `[literature]` The population-level aerobic dose is specified in **minutes**, not sessions: 150–300 min/wk moderate or 75–150 min/wk vigorous, or an equivalent combination — [WHO 2020 guidelines, *Br J Sports Med* 54:1451–62, PMC7719906](https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/)
- `[literature]` Splitting the same total duration, mode and intensity into multiple short bouts produced **no difference** in any cardiorespiratory-fitness outcome vs one continuous bout. Meta-analysis, 19 studies, 1080 participants — [Murphy et al. 2019, *Sports Medicine* 49(10):1585–1607, PMID 31267483](https://link.springer.com/article/10.1007/s40279-019-01145-2)
- `[literature]` A "1–2 sessions per week" activity pattern carried essentially the same mortality reduction as spread-out regular activity (all-cause HR 0.70 vs 0.65; CVD HR 0.60 vs 0.59, vs inactive). Pooled prospective analysis of 11 Health Survey for England / Scottish Health Survey cohorts — observational, tier 4 — [O'Donovan et al. 2017, *JAMA Intern Med* 177(3):335–342, PMID 28097313](https://pubmed.ncbi.nlm.nih.gov/28097313/)
- `[literature]` Anaerobic qualities detrain far more slowly than aerobic ones: reviews report glycolytic enzyme activity and short-term power largely preserved across several weeks of reduced or ceased training, while VO₂max falls early via reduced blood and plasma volume — [Mujika & Padilla 2000, *Sports Med* 30(2):79–87, PMID 10966148](https://link.springer.com/article/10.2165/00007256-200030020-00002); [Barbieri A, Fuk A, Gallo G, Gotti D, Meloni A, La Torre A, Filipas L, Codella R. *Front Physiol* 14:1334766, published 22 Jan 2024 (DOI year 2023), PMID 38344385](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2023.1334766/full). *(Both read via abstracts; full texts were paywalled or not retrieved. The anaerobic-retention claim rests on review summary statements, not on numbers I extracted from either full text — treat it as directional.)*
- `[literature]` Interference with hypertrophy, strength and power scales with endurance **frequency** (r = −0.26 to −0.35) and **duration** (r = −0.29 to −0.75); aerobic gains themselves are not compromised. Meta-analysis, 21 studies, 422 effect sizes — [Wilson et al. 2012, *J Strength Cond Res* 26(8):2293–2307, PMID 22002517](https://journals.lww.com/nsca-jscr/fulltext/2012/08000/concurrent_training__a_meta_analysis_examining.35.aspx)
- `[practitioner consensus]` High-intensity / VO₂max work belongs at 1–2 sessions per week, not more. Held by Attia (two zone-5 bouts in his own week) and Galpin (HIIT "once or twice a week"). — [Attia](https://peterattiamd.com/exercising-for-longevity-peter-on-zone-2-and-zone-5-training/), [Galpin](https://ai.hubermanlab.com/s/4bbtyw5L)
- `[single-practitioner position]` A Zone-2 session must run ≥45 min (60+ preferred) to stimulate the adaptation at all. San-Millán, relayed by Attia; Galpin states no bout-length floor and Murphy 2019 finds none for CRF. — [Attia/San-Millán #201 notes](https://podcastnotes.org/the-drive-with-dr-peter-attia/201-inigo-san-millan-ph-d-pt-2-deep-dive-back-into-zone-2-the-drive-with-peter-attia/)
- `[single-practitioner position]` Adaptations should be pursued in 6–12 week blocks rather than all at full capacity simultaneously. Galpin only; Attia runs all qualities concurrently year-round. — [Galpin via Huberman Lab](https://ai.hubermanlab.com/s/WwnlbVpN)

### Where they split
**Attia vs Galpin on Zone 2 is a unit disagreement as much as a volume one, and Tekiō has to pick a side.**

- **Attia:** ~3–4 hours/week, structured as roughly **four 45–60 min sessions** — "about three hours per week of zone 2, or four 45-minute sessions, is the minimum required for most people to derive a benefit and make improvements." The long bout is load-bearing, because San-Millán's mechanism (mitochondrial adaptation, fat mobilisation, lactate clearance) is claimed to need ≥45 min of continuous exposure. Under Attia, a session count *is* meaningful, but only with a duration floor.
- **Galpin:** **150–200 min/week** of Zone 2, accumulated however it fits, up to and including daily. No bout-length requirement. Under Galpin, session count is a meaningless unit and only weekly minutes are real.

Converted: Attia = 180–240 min/wk over ~4 sessions; Galpin = 150–200 min/wk over any number. The literature partly adjudicates — Murphy 2019 finds accumulated ≡ continuous for cardiorespiratory fitness at matched volume, which favours Galpin's unit; San-Millán's long-bout requirement rests on mechanism, not on a frequency trial, so it stays a single-practitioner position.

**The decision this forces:** Tekiō's current `weeklySessionTarget: 2` with a 30-minute session definition satisfies *neither* position — it certifies 60 min/wk as adequate, below Galpin's floor, below Attia's, and below WHO's. Do not split the difference. Either (a) move endurance to a weekly-minutes target of 150 (Galpin/Murphy/WHO side, and the honest shape given Garmin already supplies duration), or (b) keep the count and enforce a ≥60 min per-session floor so 2 sessions clears 120 min (Attia side). Option (a) is the better fit: session count is honest for VO₂max and anaerobic work, where the dose is defined by interval structure and the literature genuinely reports sessions/week, and dishonest for Zone 2, where it is not.

**Second split — should anaerobic capacity have a standing target at all?** Galpin's block model says qualities are trained in sequence; Attia's model runs everything concurrently and year-round. The detraining literature sides with Galpin here: anaerobic capacity is among the slowest qualities to decay, so a permanent weekly `1` makes Tekiō display a gap for something whose absence for several weeks costs nothing measurable. A permanent target also inflates the mutually-exclusive cardio count to 4 sessions/wk on top of several weights sessions — and Wilson 2012 shows interference with power and explosive strength scales with exactly that endurance frequency.

### Caveats
- **Correction to an earlier draft of this block, recorded so the reasoning is auditable.** A prior version recommended raising VO₂max from 1 to 2 on the premise that "1×/wk produces essentially no improvement (d = 0.09)." That premise misread Lenk 2025. The paper reports **significant improvement at every frequency including once weekly**, the 0.09–0.61 figures are a *range across arms* rather than a per-arm result, and every confidence interval crosses zero (−0.56 to 1.42). The paper is also **exploratory, not randomised** — tier 3 at best on the hierarchy above, not tier 2. The surviving claim is only that 2–3×/wk showed the largest effects with no added benefit at 3. That is a statement about the **optimum**, and Tekiō's target is explicitly an **adequacy floor**. It does not justify changing a shipped value, and the recommendation is now to keep 1.
- **Nothing in the record shows 1 VO₂max session/wk being insufficient.** Three independent maintenance sources point the other way: Hickson 1981 (2 d/wk held a 20–25% gain for 15 weeks), Spiering 2021 (2 sessions/wk for up to 15 weeks), and Slettaløkken 2014 (0.5/wk maintained VO₂max in athletes at 64 mL·kg⁻¹·min⁻¹). The consistent qualifier across all three is that **intensity must be preserved** — which is the real risk to Tekiō's read, since a session auto-classified as VO₂max from Garmin zone distribution may not have hit 90–100% HRmax. If anything is worth tightening here, it is the classifier's intensity criterion, not the count.
- **Where 2 belongs instead:** as copy, not as a constant. "1 session maintains; 2 is where gains appear" is an honest and actionable thing for the Adaptations read to say, and it costs nothing to state without moving the gap threshold.
- **Population mismatch:** Lenk 2025 ran six weeks in recreationally active participants with no concurrent resistance load; the user is mid-30s with several weights sessions plus mobility weekly. Hickson 1981 (n = 12, mean age 23) and Slettaløkken 2014 (n = 17, VO₂max ~64) are both small, and neither is a mid-30s generalist. Helgerud 2007 is male-only. Concurrent load plausibly *raises* the recovery cost of a second weekly VO₂max session without changing its stimulus value — another reason not to move the floor up.
- **The anaerobic number is a convention regardless of value.** There is no adequacy-threshold literature for anaerobic capacity in non-competitive trained adults — the SIT improvement studies run 3×/wk for 4–7 weeks, which is a block, and the health/longevity dose-response literature is about VO₂max and total volume, not anaerobic capacity. Whatever integer Tekiō writes here is a scheduling convention for keeping the quality in the rotation, and should be labelled as such rather than presented as a physiological floor.
- **What would move these numbers:** (1) a properly randomised frequency trial in concurrently-training adults over 30 — none found, and the only frequency study located is exploratory with intervals spanning zero; (2) Tekiō persisting session *duration* (Garmin already supplies it), which would let endurance become a minutes target and retire the unit problem entirely; (3) any trial showing a per-bout duration threshold for Zone-2 mitochondrial adaptation — that would promote San-Millán's claim out of mechanism and vindicate a session-count unit for endurance.

---

## Decision — cardio weekly session targets (rows 1.7–1.9)

**No cardio value changes.** All three constants stay at their shipped values;
what changes is that they are now labelled.

| Adaptation | Was | Now | Verdict | Why |
|---|---|---|---|---|
| Anaerobic capacity | 1 | **1** (unchanged) | `convention only` | No adequacy-threshold literature exists for a non-competitive trained adult. The improvement literature is block-shaped (SIT trials run 3×/wk for 4–7 weeks), and the quality detrains slowly. `1` is a scheduling convention for keeping it in rotation, not a physiological floor. |
| VO₂max | 1 | **1** (unchanged) | `grounded` | Three independent maintenance sources agree ~1/wk holds VO₂max when intensity is preserved. The target is an adequacy floor, and nothing in the record shows 1/wk being insufficient. |
| Endurance | 2 | **2** (unchanged) | `convention only` — **known-wrong unit** | The value is not the problem; the *unit* is. See below. |

### The scout reversed its own recommendation — and that is the useful part

The first cardio block recommended raising VO₂max from 1 to 2, on the premise
that the one direct frequency study found "essentially no improvement at 1×/wk
(d = 0.09)". The Step 2 check caught two defects, and on re-examination the
premise did not survive:

- **Lenk 2025** (*Physiol Rep* 13(18):e70573, PMID 40976973) is real, but it is
  **exploratory, not randomised** — its own title says so — and its abstract
  reports *"significant improvements in VO2max and TTE across **all** training
  frequencies (p < 0.05)"*, including once weekly. The 0.09–0.61 figures are a
  **range across arms**, not a per-arm result, and every confidence interval
  crosses zero (−0.56 to 1.42).
- A second citation attributed to "Bernat-Adell et al. 2024" is actually
  **Barbieri A et al., *Front Physiol* 14:1334766, PMID 38344385** — wrong
  authors, wrong year, a hard-rule violation.

The surviving claim is only that 2–3 sessions/week showed the *largest* effects.
That is a statement about the **optimum**, and Tekiō's target is an **adequacy
floor** — so it does not justify moving a shipped value. **`1` stays, and is now
better supported than it was before the run.** Where `2` belongs is the app's
copy: *"1 session maintains; 2 is where gains appear"* is honest, actionable, and
costs nothing to say without moving the gap threshold.

This is what the gate is for. The run's headline output was a recommendation to
change a number; the check killed it, and the number it was going to replace was
right all along.

### Endurance: the value is fine, the unit is wrong

`weeklySessionTarget: 2` for Zone 2 satisfies **no** published position. Tekiō
classifies a session as endurance at **≥25 min**
([src/lib/adaptations.ts:38](../../../src/lib/adaptations.ts#L38)), so two sessions
certifies **~50 min/week** as adequate — against WHO's 150–300 min/wk moderate,
Galpin's 150–200, and Attia's 180–240. Murphy 2019 (PMID 31267483; 19 studies,
1080 participants) finds bout structure irrelevant to cardiorespiratory fitness
at matched volume, which says the honest unit is **weekly minutes**, not a
session count.

Raising the integer does not fix this: even `3` yields only ~75 min/week at the
current classification threshold, still half of every published floor. **So the
integer is deliberately left alone** — changing it would buy a more plausible
number without making it true, which is the failure mode this gate exists to
prevent. The fix is a shape change (follow-up #2), the same blocker that stops
speed and power moving to session targets — and it is the *same* blocker, which
is why both now live in [012-adaptation-target-shapes.md](../012-adaptation-target-shapes.md).

**The Attia-vs-Galpin fork this forces** is a real design decision and is *not*
resolved here: Attia's ~180–240 min/wk in four 45–60 min bouts, where the long
bout is load-bearing (San-Millán's mechanism), versus Galpin's 150–200 min/wk
accumulated any way with no bout-length floor. Murphy 2019 partly adjudicates in
Galpin's favour. Whoever implements [012-adaptation-target-shapes.md](../012-adaptation-target-shapes.md)
picks a side and records it.

### Where the scout's other findings landed

- **Anaerobic capacity probably should not have a standing target at all.**
  Galpin's block model versus Attia's concurrent model, with the detraining
  literature siding with Galpin. A permanent `1` also pushes the mutually
  exclusive cardio count to 4 sessions/wk on top of several weights sessions —
  and Wilson 2012 (PMID 22002517) shows interference with power and explosive
  strength scales with exactly that endurance frequency. Recorded, not acted on:
  "0 standing, 2 inside a block" is a periodisation feature, not a constant.
- **The real risk to the VO₂max read is the classifier, not the count.** Every
  maintenance source qualifies its result with *"provided intensity is
  maintained"*. A session auto-classified as VO₂max from Garmin zone distribution
  may never have reached 90–100% HRmax. That points at
  [005-hr-zone-intensity-classification.md](../005-hr-zone-intensity-classification.md),
  not at this brief.

## Follow-ups this brief creates

| # | Item | Why it is not done here |
|---|---|---|
| 1 | **Session-counting for resistance adaptations**, so speed and power can move to `weeklySessionTarget` and stop being measured with a fatigue-shaped metric. | Not a constant edit — `volume[a]` counts sets, `unit` derives from `modality`. Code change, outside this run's one question. **Now briefed in [012-adaptation-target-shapes.md](../012-adaptation-target-shapes.md)** — #1, #2 and #3 are one problem, not three. |
| 2 | **Weekly-minutes target for endurance**, replacing the session count, and picking a side in the Attia/Galpin fork. Garmin already supplies duration. | Same class as #1: a shape change to the target model, not a value. **Briefed in [012-adaptation-target-shapes.md](../012-adaptation-target-shapes.md).** |
| 3 | **Anaerobic capacity as a block-periodised quality** rather than a standing weekly target. | A periodisation feature, not a number. Carried as an open question in [012-adaptation-target-shapes.md](../012-adaptation-target-shapes.md) §5. |
| 4 | **Row 1.6 — skill = 3 sessions/week.** | Deliberately deferred: blocked on the product decision in [006-skill-adaptation-data-source.md](006-skill-adaptation-data-source.md), not on evidence. |
| 5 | **Tighten the VO₂max classifier's intensity criterion.** | Belongs to [005-hr-zone-intensity-classification.md](../005-hr-zone-intensity-classification.md). |
| 6 | **An RIR / effort field.** | Named as the single change that would make Tekiō's "set" mean what the literature's "set" means. Not urgent — ACSM 2026 reports training to momentary fatigue did not consistently affect outcomes. |

## Acceptance

- [x] One scout run per decision, not one per number — five resistance targets in one run, three cardio targets in another.
- [x] Every `[literature]` citation independently verified against NCBI eutils **before** the block was pasted. Three defects caught across the two runs: a PMID resolving to an unrelated heart-failure paper, a wrong author/year attribution, and an exploratory study described as randomised whose stated result was reported backwards.
- [x] Both blocks were **sent back** rather than pasted. The doctrine's own instruction — *"Send a bad block back rather than pasting it"* — was the operative rule of this session.
- [x] Where a scout contradicted a shipped value, the decision was recorded in this brief **before** the constant was touched.
- [x] Constants carry source comments naming the verdict (`convention only` where coach- or heuristic-backed).
- [x] The `adaptation_targets` DB shadow re-seeded in the same change and verified by query — the app shows the grounded numbers, not the old ones.
- [x] Inventory row 3.5 (hypertrophy target vs `rx.sets`) resolved, and the two locked together in the comment.
- [x] Row 1.6 (skill) deliberately out of scope and recorded as such.
