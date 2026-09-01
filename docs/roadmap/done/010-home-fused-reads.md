# Roadmap: Home as fused stimulus × recovery reads

**Label:** feature
**Status:** done — built and shipped 2026-08-31 as roadmap 018 step 8 (v1.1.6 → v1.4.2). The fused Home is the app's Home tab: one gated verdict, the body map coloured by fused state, the whole-body strip, and drill-in on tap.
**Depends:** 018
**Origin:** fell out of writing [../doctrine.md](../../doctrine.md); the user's point
that recovery and stimulus must both be present for sustainable progress forced
a rethink of how recovery is represented.

## 1. The problem with the current representation

Recovery today is a **parallel axis** — a weekly readiness % on its own Home card
(`RecoveryCard`), sitting beside the nine adaptations. Two things are wrong with
that once you take the stimulus/recovery relationship seriously:

- **It reads as a separate concern**, when in fact no adaptation progresses
  sustainably without both sides. Stimulus alone injures; recovery alone adapts
  nothing.
- **It cannot be split per adaptation.** Sleep, sauna, cold, hydration, HRV and
  blood-donation status are *systemic*. Dividing one global number nine ways and
  presenting it as nine per-adaptation facts is one fact wearing a costume.

Equally, the natural fix — "make recovery the opposite end of the adaptation
axis" — encodes a falsehood: more rest is not less training. They are two
dimensions, not two poles.

## 2. The model (confirmed 2026-08-29 via the 018 canvas)

Two levels, each honest about its own scope:

| Level | Inputs | Question | Shape |
|---|---|---|---|
| **Systemic** | sleep, sauna, cold, hydration, HRV / Garmin readiness, donation status | *Can I push at all today?* | one global number |
| **Local** | hours since that muscle was last stimulated + recent volume load | *What can I train today?* | per muscle, from logged sets |

Local recovery needs **no new capture** — it is computable from
`session_sets` history today.

**Consequence for the reads:** a muscle stops being "covered" or "missing" and
gains a *state*: fresh & under-stimulated (train it), recently hit & recovering
(leave it), recovered & due (train it), chronically hammered (back off). That is
the two-sided sustainability requirement expressed as one read instead of two
competing ones — and it costs zero new sections.

**Skill** is exempt from *local muscular* recovery only. Motor consolidation is
sleep-dependent, so skill leans hardest on the systemic side. *(Obsolete
2026-08-29: the skill adaptation was dropped — roadmap 019.)*

## 3. What Home becomes

Per the doctrine's purpose ("tell me what's missing") and P2 (honest reads):

- **A body map** — spatial, coloured by the fused *state* above, not by set count.
- **A non-spatial read** for the whole-body qualities (VO₂max, anaerobic
  capacity, cardio-endurance — all cardio since the seven-model simplification,
  roadmap 019; power reads per muscle) that a silhouette cannot honestly carry.
- **One systemic readiness element** — small, global, gating both.
- **Tap to drill** — detail and capture appear at the point of need (P1). This is
  the just-in-time layer; nothing else is loaded until asked for.

Existing parts to reuse: `BodyMap.tsx`, `MuscleCoverageCard.tsx`,
`MuscleStatusList.tsx`, `AdaptationCard.tsx`, `RecoveryCard.tsx`.

## 4. Grounding required (tooling now exists)

The local level needs recovery-window numbers (how long until a muscle is
"recovered" — commonly cited as 48–72 h, varying by muscle size, training age and
session volume). That is exactly a §4.5 number claiming physiological meaning, so
it **requires `## Grounding` before implementation**.

**Run 2026-08-30 (018 step 7):** `/ground` now exists and five scout runs
covered this brief's numbers — the per-muscle recovery window, the push
threshold, the per-quality staleness windows, the weekly set-volume
target, and the blood-donation windows. The blocks are in
[Grounding](#grounding) at the end of this brief; nothing here is blocked
on grounding any more.

Good sign, not a problem: the gate caught its first real case unprompted.

## 5. Sequencing note (read before shelving Habits)

Shelving Habits requires dropping `RECOVERY_WEIGHTS.habits` and reweighting the
remaining four. **Do not do that surgery before this model is decided** — if the
recovery read is about to be rebuilt as systemic-plus-local, a rebalance of the
current weekly-rollup weights is work that gets thrown away. Order:

1. Shelf the Habits *tab* (config-level, reversible, no numbers touched).
2. Decide this model.
3. Do the weight surgery once, in whatever shape survives.

## 6. Open questions (owners)

**Both design questions below are now scheduled to be answered by a canvas, not
by argument** — see [018-home-design-canvas.md](018-home-design-canvas.md), which turns
each into a side-by-side variant. That brief also carries the JIT design-system
requirement and the order in which `/ground` runs.


These are **this brief's** kickoff questions, not blockers on the `science-scout`
work — that is tooling, and this brief is a consumer of it.

- **Resolved 2026-08-29 (018 canvas, fused boards `Home` / `HomeHeld`): the
  systemic number GATES the instruction — and only the instruction.** One
  verdict, never two signals the reader must combine: on a bad day the headline
  flips to "Hold", the readiness card takes the emphasis, and a banner names
  the cause. Three limits define the gate:
  1. **It never touches the facts.** The map, the ranked callouts and every
     number render identically on a Hold day. (The "grey everything out"
     phrasing in the old question died in review — it read as broken, not as
     not-recovered.)
  2. **It is advisory, not enforcing.** Capture is never blocked or hidden;
     training and logging on a Hold day work exactly as on a Push day. Peter,
     2026-08-29: it shows a recommendation, but the user decides how they
     actually feel.
  3. Its push threshold is grounded 2026-08-30: **33, convention** — no
     literature supports an absolute cutoff on a composite score; the
     grounded *method* is baseline-relative HRV (see
     [Grounding](#grounding)).
- **Resolved 2026-08-29 (same pick): whole-body qualities get ONE STATE EACH**
  (VO₂max, anaerobic capacity, cardio-endurance — the strip on the fused
  board), not one combined score. The open remainder *inside* this decision:
  **when does a state flip** from fed to missing? Each quality gets its own
  staleness window (days since last effective stimulus — the honest cadence
  differs per quality; for some it may be roughly weekly), and those windows
  are physiological numbers — grounded 2026-08-30: VO₂max 14 d, endurance
  14 d, anaerobic 28 d (see [Grounding](#grounding)). Today
  the canvas shows raw facts ("never", "53 d ago") and claims no flip logic.
- **Resolved 2026-08-26 by P5:** systemic chronic load is Garmin's acute load —
  consume `daily_metrics.acute_load` from
  [008-garmin-recovery-load-axis.md](008-garmin-recovery-load-axis.md), do not recompute it
  (that brief also rules it informational context, not a recovery-% input).
  Per-muscle chronic load is a *different scope*, computed from logged sets, and
  stays here. Whether it needs a rolling window at all — and what window — is the
  only science-gated remainder.

## Grounding

Five scout runs, 2026-08-30, dispatched by `/ground` (018 step 7). The
blocks below are the scouts' output verbatim. Verdict summary:

| Number | Verdict | Ships as |
|---|---|---|
| Per-muscle recovery window | partially supported | 48 h floor (honest band 48–72 h, dose-dependent) |
| Push threshold | method partially supported · fixed cutoff **convention** | 33 (industry red-zone boundary); upgrade path is baseline-relative HRV |
| Per-quality staleness windows | partially supported | VO₂max 14 d · endurance 14 d · anaerobic 28 d |
| Weekly set-volume target | supported | 10 fractional sets/muscle/week (band 10–20); honest cycle target 50–60 |
| Donation: suppression | partially supported | 48 h acute flag + 21 d aerobic-only tail; plasma 0 d |
| Donation: eligibility 56/14 | **convention** | unchanged — service rule, calendar only, never feeds readiness |

### Per-muscle recovery window

**Claim:** 48 h (`RECOVER_DAYS = 2`) after a resistance session, a muscle group is productively trainable again; before that, the Home muscle read marks it "still recovering".
**Searched:** 2026-08-30 · **Verdict:** partially supported
**Number to use:** 48–72 h — default 48 h. The window is real and 48–72 h is the honest bracket, but its length is dose-dependent (session volume, proximity to failure), so a single constant is a simplification; 48 h is the defensible floor because a "still recovering" flag that over-blocks is worse than one that under-blocks.

#### Evidence
- `[literature]` In trained men, mechanical performance after typical non-failure protocols (3×5, 6×5 bench/squat) recovered within ~24 h, while sets to failure (3×10) delayed neuromuscular and metabolic recovery by 24–48 h+. Crossover, 10 resistance-trained men — [Morán-Navarro et al. 2017, Eur J Appl Physiol](https://link.springer.com/article/10.1007/s00421-017-3725-7)
- `[literature]` High-volume work (8×10 @ 70%) left isometric force still impaired at 72 h, while high-intensity/low-volume work (8×3 @ 90%) recovered faster — session volume, not load, drove the longer window. Randomized crossover, 12 resistance-trained men (~6.3 y training age) — [Bartolomei et al. 2017, Eur J Appl Physiol](https://pubmed.ncbi.nlm.nih.gov/28447186/)
- `[literature]` Training age shortens the window: after maximal eccentric elbow-flexor exercise, trained men returned to baseline strength by day 3 while untrained men were still ~40% below baseline. Controlled comparison, 15 trained vs 15 untrained men — [Newton et al. 2008, J Strength Cond Res](https://pubmed.ncbi.nlm.nih.gov/18550979/)
- `[literature]` Muscle-group differences exist but run opposite to gym lore: arm muscles (elbow flexors/extensors) showed *greater and longer-lasting* strength loss than leg muscles after matched maximal eccentrics — "bigger muscle = longer recovery" is not supported. Counterbalanced crossover, 17 sedentary men, four limb muscles, 5-day follow-up — [Chen et al. 2011, Eur J Appl Physiol](https://link.springer.com/article/10.1007/s00421-010-1648-7)
- `[literature]` Frequency evidence brackets the window from above: training each muscle ≥2×/week beat 1×/week for hypertrophy (ES 0.49 vs 0.30), implying muscles are productively trainable again well within ~72–96 h. Systematic review + meta-analysis, 10 studies — [Schoenfeld, Ogborn & Krieger 2016, Sports Med](https://pubmed.ncbi.nlm.nih.gov/27102172/)
- `[practitioner consensus]` 48–72 h between sessions for the same muscle group as the default guidance, leaning toward 72 h when the goal is hypertrophy and shorter for low-damage heavy strength work. Held by Galpin and Huberman ([Huberman Lab, Galpin episode](https://www.hubermanlab.com/episode/dr-andy-galpin-how-to-build-strength-muscle-size-and-endurance)).
- `[single-practitioner position]` No fixed minimum window: 24 h between sessions is fine if per-session volume is modest; per-muscle frequency should scale with weekly volume (2–3×/week at moderate volumes). Israetel/RP only ([RP Strength on frequency](https://rpstrength.com/blogs/podcasts/training-frequency-decoded-the-11-set-rule-every-lifter-should-know)); Galpin holds the fixed 48-h floor, Attia silent (out of domain).

#### Where they split
Galpin treats 48 h as a physiological floor (protein synthesis needs 48–72 h; training sooner "blunts growth"); Israetel treats the window as a function of session dose, with no floor at modest volumes. The literature sides with Israetel on dose-dependence (Morán-Navarro, Bartolomei) but shows 48 h is a safe default for a typical moderate session. The decision this forces on Tekiō: is `RECOVER_DAYS` one constant, or a threshold modulated by the logged session's volume and proximity to failure? Ship the fixed 48 h for v1 — it sits inside both positions for a typical session — and name volume-modulation as the upgrade path. Do not split the difference to 60 h; nobody holds that number.

#### Caveats
- Population mismatch: all time-course studies are small (n = 10–17), young (~20s), male, and several use worst-case maximal eccentric protocols that overstate damage from ordinary training; Tekiō's one trained adult sits on the *fast* side of these curves (Newton 2008).
- What would move this number: session dose (high-volume or to-failure sessions → 72 h+ per Bartolomei/Morán-Navarro), age (practitioners report 72–96 h past ~40), and detraining (a layoff temporarily pushes recovery toward the untrained curve). A per-muscle-*size* modifier would not be grounded — Chen 2011 points the other way.

#### Source comment
`// 48 h (RECOVER_DAYS = 2) — floor of the 48–72 h post-session recovery window for a trained adult; dose-dependent, high-volume/failure sessions need 72 h+, see docs/roadmap/010-home-fused-reads.md#grounding`

### Push threshold (systemic readiness gate)

**Claim:** Below a readiness score of X (on Tekiō's 0–100 sleep+HRV roll-up), hard training is counterproductive — drives `PUSH_THRESHOLD` in `src/constants/app.ts`, which flips the Home verdict from "push" to an advisory "hold".
**Searched:** 2026-08-30 · **Verdict:** partially supported — the *practice* (modifying hard days when HRV sits below an individual rolling baseline) has RCT and meta-analytic support; a *fixed absolute cutoff* on a composite 0–100 score is convention only.
**Number to use:** 25–40 — default 33. No study tests an absolute cutoff, so the defensible placeholder is the industry red/yellow boundary ([Whoop's red zone is ≤33](https://support.whoop.com/s/article/WHOOP-Recovery?language=en_US); Garmin's "low" bands end near 25), which also sits inside the design board's observed gate window (holds at 31, passes at 66). The grounded *method*, if Tekiō ever upgrades the logic, is baseline-relative: hold when the 7-day rolling value drops below the individual baseline minus 0.5 × SD.

#### Evidence
- `[literature]` HRV-guided endurance training vs predefined training: significant medium effect on submaximal physiological parameters (g = 0.296) but small, non-significant effects on performance (g = 0.079) and VO₂peak (g = 0.171). Systematic review with meta-analysis, 8 studies / 9 interventions, n = 198 — [Düking et al. 2021, J Sci Med Sport](https://pubmed.ncbi.nlm.nih.gov/34489178/)
- `[literature]` HRV-guided training was superior for preserving vagal-related HRV indices, with only small non-significant advantages for VO₂max and endurance performance; authors note it may reduce the likelihood of negative responders. Methodological systematic review with meta-analysis — [Manresa-Rocamora et al. 2021, IJERPH](https://pubmed.ncbi.nlm.nih.gov/34639599/)
- `[literature]` The strongest single trial: hard sessions programmed only when 7-day rolling LnRMSSD sat within an individually determined smallest worthwhile change; HRV-guided group improved 3000 m time 2.1% (p = 0.004) vs 1.1% (ns) in the predefined group, while completing significantly *fewer* high-intensity sessions (13.2 vs 17.7). RCT, 40 recreational endurance runners, 8 weeks — [Vesterinen et al. 2016, Med Sci Sports Exerc](https://pubmed.ncbi.nlm.nih.gov/26909534/)
- `[literature]` Every studied decision rule is baseline-relative — smallest worthwhile change around an individual's own rolling LnRMSSD average — never an absolute number; single-day values are explicitly too noisy to act on. Expert methods review of HR/HRV monitoring — [Buchheit 2014, Front Physiol](https://internal-journal.frontiersin.org/articles/10.3389/fphys.2014.00073/full)
- `[literature]` Subjective self-reported wellness reflected acute and chronic training load with *superior* sensitivity and consistency compared to objective measures including HRV — which supports keeping the threshold advisory rather than binding. Systematic review, athlete populations — [Saw et al. 2016, Br J Sports Med](https://pubmed.ncbi.nlm.nih.gov/26423706/)
- `[practitioner consensus]` Use HRV as a multi-week, baseline-relative trend: establish a 21–30 day baseline, act only on deviations sustained ~3+ days, and pair it with resting HR and subjective feel — "a compass, not a judge." Held by Galpin and Huberman (Huberman Lab recovery guest series).
- `[single-practitioner position]` For lifting, autoregulate by in-session performance, soreness, and RIR — morning readiness scores play no role in the model. Israetel only; Galpin actively uses HRV trend monitoring, and the endurance literature is silent on resistance training.

#### Where they split
Galpin treats a depressed HRV trend as a real signal for shifting hard-day timing; Israetel's autoregulation ignores morning scores entirely and reads readiness from the first working sets. The literature sides with both, awkwardly: the effect exists but only in *endurance* training, and in every trial the low-HRV response was "train easy today," never "don't train." This forces two design choices on Tekiō: (1) the "hold" verdict should read as *modify* (drop intensity, keep moving), not *rest* — the Vesterinen group that trained hard less often still won; (2) whether the hold verdict applies to the Weights surface at all is a judgment call with no evidence behind it, only Israetel's dissent against it. The advisory-only, never-locks-capture framing absorbs both, which is exactly right.

#### Caveats
- Population mismatch: all trials are endurance training in recreational endurance athletes (largest trial n = 40; pooled n = 198); nothing on resistance training, and nothing on a single trained adult doing mixed lifting + cardio.
- Score mismatch: the trials measured morning LnRMSSD directly. Tekiō's 0–100 roll-up (Garmin-style sleep + HRV composite) is a proprietary-shaped transformation; no peer-reviewed validation of *any* manufacturer composite readiness score as a training-decision threshold was found (searched 2026-08-30).
- What would move this number: switching the verdict logic from an absolute cutoff to baseline-relative (7-day rolling below 60-day baseline − 0.5 × SD) would make the constant obsolete and would match the actual evidence; alternatively, any published validation of composite readiness scores against training outcomes.

#### Source comment
`// 33 — convention only (industry red/yellow boundary; Whoop red ≤33): no literature supports an absolute cutoff — the grounded method is baseline-relative (7d rolling < baseline − 0.5×SD, Vesterinen 2016), see docs/roadmap/010-home-fused-reads.md#grounding`

### Per-quality staleness windows (cardio detraining)

**Claim:** Per-quality staleness windows (days since last qualifying stimulus) — VO₂max, anaerobic capacity, aerobic endurance each flip from "fed" to "missing" on the Home read when the window elapses; window = detraining onset in a trained adult.
**Searched:** 2026-08-30 · **Verdict:** partially supported
**Number to use:** VO₂max **12–21 d — default 14 d**; aerobic endurance **10–21 d — default 14 d**; anaerobic capacity **21–42 d — default 28 d**. The aerobic/anaerobic split is real (glycolytic adaptations are roughly twice as durable), but the literature cannot separate VO₂max from endurance finely enough to justify two different aerobic windows — endurance decays at least as fast, so both get 14 d.

#### Evidence
- `[literature]` VO₂max declined 7% within the first 12–21 days of complete cessation and stabilised at −16% by day 56 in endurance-trained subjects. Longitudinal cessation study, 7 trained adults, timepoints 12/21/56/84 d — [Coyle et al. 1984, J Appl Physiol 57:1857-64](https://journals.physiology.org/doi/abs/10.1152/jappl.1984.57.6.1857) (PMID 6511559, verified via eutils).
- `[literature]` 14 days of cessation cut VO₂max −4.7% and raised submaximal HR +11 bpm in distance runners — both aerobic qualities measurably degraded at day 14. Controlled cessation study, 12 trained distance runners — [Houmard et al. 1992, Int J Sports Med 13:572-6](https://pubmed.ncbi.nlm.nih.gov/1487339/) (verified via eutils).
- `[literature]` 4 weeks of cessation cut time-to-exhaustion at ~75% VO₂max by 21% (79→62 min) while VO₂max was unchanged — endurance capacity is more fragile than VO₂max, not less. Cessation study, 9 well-trained endurance athletes — [Madsen et al. 1993, J Appl Physiol 75:1444-51](https://pubmed.ncbi.nlm.nih.gov/8282588/) (verified via eutils).
- `[literature]` A 2023 systematic review of detraining in endurance athletes confirms the same time-course: VO₂max −7% by day 12, −4.7% by day 14; TTE −9% after just 2 weeks. Systematic review — [Frontiers in Physiology 2023, art. 1334766](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2023.1334766/full).
- `[literature]` Glycolytic enzyme markers (PFK, LDH) were unaffected by a 7-week training interruption, while oxidative enzymes declined — anaerobic machinery is markedly more cessation-resistant. Training–detraining–retraining design, 6 subjects completing both phases — [Simoneau et al. 1987, Eur J Appl Physiol 56:516-21](https://pubmed.ncbi.nlm.nih.gov/3653091/) (verified via eutils).
- `[literature]` The canonical detraining reviews put short-term losses at VO₂max −4 to −14% within <4 weeks in highly trained subjects, driven early by blood-volume loss, with anaerobic/sprint performance largely maintained over short lay-offs. Narrative reviews — [Mujika & Padilla 2000 Part I, Sports Med 30:79-87](https://pubmed.ncbi.nlm.nih.gov/10966148/) and [Part II, Sports Med 30:145-54](https://pubmed.ncbi.nlm.nih.gov/10999420/) (verified via eutils).
- `[literature]` Endurance performance is maintained for up to 15 weeks with as few as 2 sessions/week if intensity is kept — the qualifying-stimulus cadence that keeps a quality "fed" is roughly weekly-or-better, well inside the detraining windows above. Narrative review of maintenance-dose studies — [Spiering et al. 2021, J Strength Cond Res 35:1449-58](https://journals.lww.com/nsca-jscr/fulltext/2021/05000/maintaining_physical_performance__the_minimal_dose.35.aspx) (PMID 33629972, verified via eutils).
- `[practitioner consensus]` Both cardio-domain roster voices program aerobic stimulus at weekly-or-tighter cadence — Attia ~4× zone 2 + 1× VO₂max session/week; Galpin 150–200 min/week zone 2 + 1 high-intensity interval session/week. Held by Attia, Galpin. A cadence prescription, not detraining evidence.

#### Where they split
The Attia–Galpin zone-2 *volume* split does not fork this constant — both imply every cardio quality is touched weekly. The real fork is semantic, between the literature tiers themselves: the **detraining literature** says "missing" honestly begins ~14 d (aerobic) / ~28 d (anaerobic) after the last stimulus, while the **maintenance-dose literature and both practitioners** imply the feeding cadence is ~7 d. Tekiō must choose what the flag means: "you are now losing it" (use 14/14/28) or "you have missed the cadence that keeps it" (halve the aerobic windows to ~7–10 d). The defaults above take the first meaning, because that is what the claim as posed asks for — but the choice should be made knowingly, not inherited.

#### Caveats
- Population mismatch: every cessation study is 7–12 highly trained endurance athletes stopping *all* training; Tekiō's user keeps lifting and doing other cardio, which partially preserves each quality — so cessation-derived windows flip "missing" slightly early. That errs in the safe direction for a what's-missing read.
- Granularity: studies sampled at days 12/14/21/28 — the windows are honest to ±week resolution; nothing finer than that is defensible, so do not display a day-precise "goes stale on" date.
- Anaerobic caveat: enzyme data (7 wk stable) is a proxy; whole-body glycolytic *performance* has an aerobic component and decays sooner, which is why the default is 28 d and not 42.
- What would move this number: a cessation study in recreationally trained adults with sub-14-day timepoints; or a decision to adopt the cadence semantics (→ 7–10 d aerobic windows).

#### Source comment
`// staleness: vo2max 14 d, endurance 14 d, anaerobic 28 d — detraining onset in trained adults (Coyle 1984; Houmard 1992; Madsen 1993; Simoneau 1987; Mujika & Padilla 2000), see docs/roadmap/010-home-fused-reads.md#grounding`

### Weekly set-volume target

**Claim:** 10 hard sets per muscle group per week (60 per 6-week cycle) is an effective hypertrophy/strength volume target; it drives the Home body-map fill fraction and the "what is missing" ranking.
**Searched:** 2026-08-30 · **Verdict:** supported
**Number to use:** 10–20 fractional sets/muscle/week — default 10/week (cycle target 50–60, default 60 only if deload-week sets count toward it). 10 sits at the floor of the meta-analytic effective band, which is the right anchor for a gap-finding read: filling it means "adequate stimulus," not "maximized stimulus."

#### Evidence
- `[literature]` Graded dose-response between weekly sets and hypertrophy: each additional weekly set added ~0.37% muscle growth (ES +0.023/set), with 10+ sets/week the highest category examined. Systematic review + meta-analysis, 15 studies / 34 treatment groups, mixed training status — [Schoenfeld et al. 2017, J Sports Sci](https://pubmed.ncbi.nlm.nih.gov/27433992/)
- `[literature]` The largest dose-response analysis to date confirms volume increases both hypertrophy and strength (100% posterior probability) with diminishing returns for both — considerably more pronounced for strength — and finds frequency has negligible effect on hypertrophy when volume is equated. Its best-fit model counts sets *fractionally* (indirect sets = 0.5). Bayesian meta-regression, 67 studies, n=2,058 (79% male, mean age ~25) — [Pelland et al. 2026, Sports Med](https://pubmed.ncbi.nlm.nih.gov/41343037/)
- `[literature]` 12–20 weekly sets per muscle group concluded as the optimum standard recommendation for hypertrophy in young trained men; no advantage for >20 sets in quadriceps/biceps. Systematic review, 7 RCTs, participants ≥1 yr training experience, aged 18–35, direct muscle measures — [Baz-Valle et al. 2022, J Hum Kinet](https://pubmed.ncbi.nlm.nih.gov/35291645/)
- `[literature]` Minimum effective dose for strength is far lower: a single set of 6–12 reps at ~70–85% 1RM, 2–3×/week to high effort, produces significant (though suboptimal) 1RM gains in resistance-trained men. Systematic review + meta-analysis — [Androulakis-Korakakis et al. 2020, Sports Med](https://pubmed.ncbi.nlm.nih.gov/31797219/)
- `[practitioner consensus]` ~10–20 working sets per muscle per week is the practical hypertrophy range for a trained, non-specializing adult. Held by Israetel and Galpin.
- `[single-practitioner position]` The MEV/MAV/MRV landmark model (per-muscle minimums ~6–10, adaptive range ~12–20, recoverable ceiling ~20+) is Israetel only; it is a planning *model*, not a measurement, and the rest of the roster does not use it.

#### Where they split
The volume literature has a real fork: the meta-analytic reading (Schoenfeld, Pelland, and Israetel's landmarks on the practitioner side) says more volume keeps buying growth well past 20 weekly sets, just at falling rates; the diminishing-returns/minimum-dose reading (Androulakis-Korakakis; the steep flattening of Pelland's own strength curve) says most of the gain is bought by the first few hard sets, and volume past a per-session quality threshold is largely junk. This forces Tekiō to decide what a full bar *means*: a floor (adequate — nothing missing) or an optimum (maximized). For a read whose job is "what is missing," the floor is correct — anchor at 10/week, the bottom of the optimum band. Ranking against 20/week would leave the map permanently nagging. Cavaliere's "harder not more" position is coach opinion and does not ground the number either way.

#### Caveats
- Population mismatch: evidence base is mostly young men (Pelland: 79% male, mean age 25; Baz-Valle: trained men 18–35), studying group averages over 6–12 weeks — per-muscle response in one trained adult will sit somewhere inside the band, not at a point.
- Set counting must match: the literature's band assumes fractional counting (indirect/secondary-mover sets ≈ 0.5). Tekiō's contribution-weighted `exercise_muscle_groups` counting is the right shape; counting every touching exercise as a full set would inflate the fill and hide real gaps.
- The ×6 arithmetic includes the deload week at full volume. Week 6 is deload by design (`CYCLE = 6`); if deload is programmed at ~half volume, the honest cycle band is 50–60, and a 60 target will show every muscle ~8–10% "missing" every cycle by construction.
- The live `weeklyMuscleTarget` values of 6 are below the hypertrophy optimum band (fine as a maintenance floor, under-calls growth); 10 is the defensible growth default.
- What would move this number: a specialization phase (deliberately 15–20+ on a target muscle), age >40 or recovery constraints (shift toward the floor), or Tekiō switching the read's meaning from "adequate" to "optimal" (then 12–20 becomes the band and the default moves to ~15).

#### Source comment
`// 60 — 10 fractional sets/muscle/week × 6-wk cycle; 10–20/wk is the meta-analytic effective band (Schoenfeld 2017, Pelland 2026, Baz-Valle 2022), see docs/roadmap/010-home-fused-reads.md#grounding`

### Blood donation: suppression window + eligibility

**Claim:** Whole-blood donation (~450–500 ml) measurably suppresses aerobic performance for **14–28 days** (default **21 d**), with a distinct acute phase in the first **48 h**; plasma donation suppresses aerobic performance for **0 days**. Drives the Home Push/Hold gate and the cardio-quality staleness reads (this brief, §3, §6). Separately: `DONATION_ELIGIBILITY_DAYS` (56 / 14) drives a calendar countdown only.
**Searched:** 2026-08-30 · **Verdict:** suppression window (whole blood) = **partially supported** · plasma multi-week suppression = **not supported** · eligibility 56 / 14 d = **convention only**
**Number to use:** whole blood 14–28 d — default **21 d** aerobic-only suppression, plus a separate **48 h** acute flag; plasma **0 d** aerobic (optional 24 h volume/hydration note); eligibility stays **56 / 14** unchanged as a service rule. 21 d is the point at which two of the three time-course studies show full recovery, and it is a value one of them actually measured rather than a midpoint.

#### Evidence
- `[literature]` At 24–48 h post-donation: Hb −7%, VO₂max −7%, maximal exercise capacity −10%; Hb still −4% at 14 d. Systematic review + meta-analysis, 18 before–after studies, GRADE-rated **low quality**, donations 400–500 ml — [Van Remoortel 2017, *Transfusion* 57(2):451–462](https://onlinelibrary.wiley.com/doi/abs/10.1111/trf.13893)
- `[literature]` The pooled 24–48 h VO₂ effect is **not statistically significant**: −2.4 ± 1.4 ml·kg⁻¹·min⁻¹, Cohen's d −0.26, 95% CI −1.46 to 0.94. Haematology *is* significant (Hb −1.05 g·dL⁻¹; Hct −3.71%; RBC −0.44 Mio µL⁻¹, d −4.23). Systematic review, 8 experimental studies, per-study n 9–24, 91% male, mean age 23.9 y — [Johnson 2019, *PLoS One* 14(4):e0215346](https://pmc.ncbi.nlm.nih.gov/articles/PMC6467450/)
- `[literature]` VO₂peak −6.5% at day 3 and time-trial −5.2%; **both back to baseline by day 14**. Hb still reduced at day 28; ferritin −46%, nadir day 14. Before–after time-course, 19 healthy men, measured pre and d3/7/14/28 — [Ziegler 2015, *Transfusion* 55(4):898–905](https://pubmed.ncbi.nlm.nih.gov/25512178/)
- `[literature]` Peak aerobic power significantly reduced at day 1 **and week 2, recovered by week 3**; time to fatigue and peak HR unaffected. Before–after, n=12 (10 M / 2 F) moderately active, 450 ml, weekly testing for 4 weeks — [Judd 2011, *J Strength Cond Res* 25(11):3035–3038](https://pubmed.ncbi.nlm.nih.gov/21993024/)
- `[literature]` Pmax, VO₂peak and Hb-mass reduced (p<0.001) **up to 4 weeks** after a single donation; max decreases 4%, 10%, 7%. RCT, 24 moderately trained men 18–30 y, VO₂peak ~57 ml·kg⁻¹·min⁻¹, 470 ml ×3 donations, measured at 2 d / 1 / 2 / 4 wk — [Meurrens 2016, *Sports Med Open* 2:43](https://pmc.ncbi.nlm.nih.gov/articles/PMC5118378/)
- `[literature]` **Plasma donation does not affect VO₂max**; only a 2 h decrement in time-to-exhaustion (−11%) and anaerobic measures (MAOD −15%). Whole blood by contrast: VO₂max −15% @2 h, −10% @2 d, −7% @7 d; time-to-exhaustion −19% @2 h, −7% @2 d — but **anaerobic measures unaffected**. Controlled two-group study, n=19 (10 plasma ~700 ml, 9 whole blood 450 ml), tested 2 h / 2 d / 7 d — [Hill 2013, *Appl Physiol Nutr Metab* 38(5):551–557](https://pubmed.ncbi.nlm.nih.gov/23668764/)
- `[literature]` Total Hb-mass fell 75 ± 15 g (−8.8 ± 1.9%) and fully recovered in a mean of **36 ± 11 days (range 20–59)**. CO-rebreathing, 29 men, mean age 30 ± 10 y, ~550 ml — [Pottgiesser 2008, *Transfusion* 48(7):1390–1397](https://pubmed.ncbi.nlm.nih.gov/18466177/)
- `[literature]` Shortening the whole-blood interval below the English standard (12 wk men / 16 wk women) collected more blood but produced more donation-related symptoms, lower Hb and ferritin, and more low-Hb deferrals. Pragmatic RCT, n=45,042 donors, 2 years — [Di Angelantonio 2017, *Lancet* 390:2360–2371 (INTERVAL)](https://pubmed.ncbi.nlm.nih.gov/28941948/)
- `[single-practitioner position]` **None found.** No located on-record position from Attia, Galpin, Huberman, Israetel or Harris on post-donation training suppression. Attia's nearest material is [AMA #58 on iron and ferritin](https://peterattiamd.com/ama58/), which is about iron status, not donation-induced performance loss. The advice circulating ("wait 24–48 h, no PRs for 7–10 days") comes from blood services and coaching blogs — tier 6, and it cannot ground a number.

#### Conventions (not evidence)
- **56 days** is a regulatory minimum, not a physiological finding: FDA requires no more than one whole-blood collection in 8 weeks — [21 CFR 630.15(a)](https://www.ecfr.gov/current/title-21/chapter-I/subchapter-F/part-630/subpart-B/section-630.15). It has *partial* physiological cover: Pottgiesser 2008 states its Hb-mass data validate 56 days for men — but its own range ran to 59 days, and England's standard is 12 weeks for men / 16 for women (INTERVAL), so services do not converge on 56.
- **14 days** for plasma is one national convention among many, not a physiological interval: 14 d in Finland, Czechia and Norway ([Finnish Blood Service](https://www.veripalvelu.fi/en/blood-donation/donate-blood/donate-plasma/)); 72 h in Austria; 96 h minimum in the 20th-edition European Guidelines; twice per 7 days in the US. The spread is roughly 25-fold.

#### Where they split
**The literature splits on the endpoint, not the effect.** Ziegler says performance is back at **day 14**; Judd says still down at day 14 and back at **week 3**; Meurrens says still down **at 4 weeks**. The two systematic reviews also disagree with each other about the *acute* phase — Van Remoortel reports a 7% VO₂max drop at 24–48 h, Johnson's pooled estimate has a CI crossing zero. Nobody has run a study powered to settle it; every time-course study here has n ≤ 29.

**What this forces Tekiō to choose — three decisions, not one:**

1. **Two-stage, not one window.** A single "suppressed for N weeks" flag misrepresents an effect that is −15% at 2 h and −5% at day 7. Store `48 h` (unanimous, large, gates a Hold) separately from `21 d` (decaying, contested, gates a note only).
2. **The note is aerobic-scoped.** Hill 2013 found anaerobic capacity and post-exercise lactate *unaffected* by whole-blood withdrawal, and Judd found time-to-fatigue and peak HR unaffected. A donation must not dim the strength/hypertrophy/power side of the muscle read — only VO₂max and cardio-endurance. A global Hold past 48 h over-claims.
3. **Plasma gets no multi-week note at all.** Currently `DONATION_ELIGIBILITY_DAYS` treats plasma as a donation type with a countdown; the readiness layer must not inherit the whole-blood window for it. The only evidence-supported plasma effect is ~2 h.

**And one doctrine split the constant itself creates:** the eligibility countdown is a *scheduling* fact wearing physiological clothes. It is a legal rule that varies 25-fold between countries for plasma. Per P5, it must not feed the systemic readiness number — it can render as a calendar chip, but the moment 56 days influences a Push/Hold verdict, the app is presenting a regulation as a recovery state. The two windows are also mismatched by design: 21 d of suppression inside a 56 d eligibility gap means the countdown is *never* the binding constraint on training.

#### Caveats
- **Population mismatch:** all time-course studies are small (n=12–29), 91% male, mean age 24–30, moderately-to-well trained (VO₂peak 46–57 ml·kg⁻¹·min⁻¹), single donation, **no iron supplementation**. The male, trained profile matches the single user well; the small n and low GRADE rating do not. Outcomes are lab VO₂peak and time-trial, not perceived session quality.
- **Iron status is the hidden variable.** Ferritin fell 46–50% with a nadir at day 14 (Ziegler, Meurrens), and Hb-mass recovery ranged 20–59 days between individuals (Pottgiesser). A donor with low baseline ferritin, or a repeat donor, sits at the long end of every window here. Tekiō does not capture ferritin, so it cannot personalise this.
- **What would move this number:** (a) a time-course study powered past n≈30 with measurements between day 14 and day 28 — the exact gap where the three studies disagree; (b) a ferritin or Hb-mass input, which would replace a fixed 21 d with a per-donation estimate; (c) Garmin VO₂max or acute-load data across an actual donation, which would let the app observe the user's own recovery curve and retire the constant entirely. (c) is the cheapest and is already half-built in brief 008.
- **Nothing here justifies changing 56 or 14.** They are correct as service rules and should be sourced to the user's own blood service, not to physiology. If the user donates in a country using 12-week intervals, 56 is simply wrong for them — a per-service value, not a constant.

#### Source comment
```
// 56 / 14 days — donation-service eligibility rules (FDA 21 CFR 630.15; plasma
// interval is national convention, 72 h–14 d across Europe), NOT physiology.
// Calendar countdown only; must not feed the readiness gate.
// See docs/roadmap/010-home-fused-reads.md#grounding

// 48 h acute, 21 d aerobic tail (range 14–28 d) — whole blood only, aerobic
// qualities only; plasma = 0 d. Endpoint contested (Ziegler 14 d / Judd 21 d /
// Meurrens 28 d). See docs/roadmap/010-home-fused-reads.md#grounding
```

## Acceptance

Added 2026-08-31 when the brief closed — it predates the checkbox convention.

- [x] The two-level model (systemic gate + per-muscle local state) is agreed and
      written down. **§2, agreed 2026-08-29 against the 018 canvas.**
- [x] Both §6 design questions are answered with the canvas as evidence.
      **The gate changes the instruction only and is advisory; whole-body
      qualities get one state each.**
- [x] Every physiological number this brief needs carries a `## Grounding`
      block. **Five scout runs, 2026-08-30.**
- [x] Home renders the fused read: body map coloured by state, a non-spatial
      whole-body read, one systemic readiness element, and tap-to-drill.
      **Shipped in 018 units 2–4; `src/lib/fusedRead.ts` is the pure layer,
      34 tests.**
- [x] Nothing else in the app claims to answer the same question twice.
      **`OverviewTab`, `RecoveryCard` and the three folded tabs are deleted.**
