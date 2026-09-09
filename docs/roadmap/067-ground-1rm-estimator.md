# Roadmap: Ground the 1RM estimate WeightsTab prints

**Label:** feature
**Status:** in progress — picked up and committed to 2.1.0 on 2026-09-09. Peter chose reading 1 the same day (**ground it**) and changed what ships with it: the estimate stops being computed continuously and appears only when a max attempt is declared, and it is offered only for sets of 2–5 reps. The scout ran 2026-09-09 and the block is below: Epley and Brzycki **partially supported**, their average **convention only** (nobody has studied averaging), the 2–5 window **supported but narrower than the evidence requires**. Three decisions are back with Peter before code moves — the averaging step, the ceiling, and how the app learns a set was taken to failure. Found 2026-09-08 while landing candidate A1 of [048](done/048-simplification-candidates.md); inventory rows 8.1, 8.2 and 8.4 have said `unknown` / **(no brief)** since the inventory was written, and this file is the brief they were missing.
**Release:** 2.1.0

## Why this exists

`npm run knip` flagged `epley1RM` and `brzycki1RM` as unused exports, and
candidate A1 of 048 described them as "two more dead functions" with a note
that *if they are ever revived* they are formulas and `/ground` applies.

The tense is wrong. They are not dead and they are not waiting to be revived —
they ship. `estimate1RM` in `src/lib/utils.ts` averages the two, `best1RM`
wraps it, and `WeightsTab` prints the result beside a logged entry as
**"≈NNkg 1RM"**. A number claiming physiological meaning is on screen today,
and nothing in `docs/roadmap/` lists it.

The [grounding inventory](../grounding-inventory.md) §8 already knows, which is
exactly the problem the `pending-work-in-roadmap` house rule names: the
inventory is a reference doc, so `unknown` + **(no brief)** records a gap that
nothing schedules. A reader has to already be looking at §8 to find it.

## What the app actually claims

Three claims, one screen:

| Row | Formula | Status today |
|---|---|---|
| 8.1 | Epley — `weight × (1 + reps/30)` | published estimator, `unknown` |
| 8.2 | Brzycki — `weight × 36/(37 − reps)` | published estimator, `unknown` |
| 8.4 | **`(epley + brzycki) / 2`** | **not a published formula** — Tekiō's own |

Row 8.3 (the `reps >= 37` guard) is settled: [066](done/066-inventory-definitional-rows.md)
marked it `n/a — definitional`, because the denominator is zero at 37 reps and
the guard patches a hole in the arithmetic rather than asserting anything about
a body. It needs nothing here.

8.4 is the one that matters. Epley and Brzycki are both real, both cited for
decades, and both have known error bands that widen with reps — but *averaging
two estimators* is a third estimator, and the only justification in the code is
a comment saying "they diverge at the extremes". Nobody has checked whether the
mean of two biased estimates is better than either, or in which rep range.

## The doctrine question that comes first

**This may not need grounding at all**, and that is Peter's call, not a scout's.
Two readings, and they lead to different work:

1. **It is a claim.** "≈114 kg" next to a set is the app telling him what he
   could lift. Then §4 question 5 fires, `/ground` runs against 8.1, 8.2 and
   8.4, and the averaging step either earns a citation or is replaced by one
   named estimator with its error band stated.
2. **It is a display convenience.** The `≈` is doing real work, nothing reads
   the number back — no target, no readiness gate, no adaptation credit depends
   on it — and doctrine §1 says a number that changes nothing is decoration. In
   that reading the honest fix is to **delete it**, not ground it.

Reading 2 is worth taking seriously. Grepped again on 2026-09-09: `best1RM` is
called only inside `WeightsTab`. Nothing else in the app consumes an estimated
1RM — no target reads it, no readiness gate, no adaptation credit.

## What is actually on screen

Four renders, in two places — and **no chart series**. The 2026-09-08 line above
naming one was wrong: `historical1RM` in `WeightsTab` is a maximum over every
logged set, not a trend line.

| Where | What it prints |
|---|---|
| Est. 1RM panel, while sets are being typed | the live estimate for the sets so far |
| the same panel | `· best NNN kg` — the highest estimate ever logged for that exercise |
| the same panel | a **PR** badge when the live estimate reaches or beats that best |
| History list, per entry | the `≈NNkg 1RM` chip |

The PR badge is the one that needs a replacement rather than a deletion. It is
the only place in Weights that says *this was your best*, and today it says it in
estimated kilograms. Under reading 2 it either goes with the estimator or
re-bases on something measured — the heaviest set at equal or higher reps.

## Peter's decision — 2026-09-09

**Reading 1: it is a claim, and it gets grounded.** The `≈` does not excuse the
number; `/ground` runs against inventory rows 8.1, 8.2 and 8.4.

He changed the shape of the feature in the same breath, and the two changes are
part of this brief rather than a follow-up:

**1. Computing it all the time is wrong.** Today the estimate is recalculated on
every keystroke while sets are typed and printed against every logged entry
whether or not a max was ever on the lifter's mind. It should be **on demand** —
shown when the user says they are attempting a one-rep max, not offered
unprompted against ordinary volume work. A number that answers a question nobody
asked is the decoration doctrine §1 warns about, even when the arithmetic behind
it is sound.

**2. A real 1RM is the truest answer, and estimating exists to avoid its
risk.** Testing an actual max is the only measurement that claims nothing, but a
true max attempt carries injury risk that ordinary training does not. The
estimate is the safer substitute — and it is only a substitute inside a narrow
rep window. **Estimate from 2–5 reps. Above 5 reps, do not estimate at all**:
the formulas drift too far from what a max really is for the answer to be worth
printing.

**This adds a fourth claim to ground**, and it is the one that decides the
feature's shape:

| Claim | Where it comes from |
|---|---|
| 8.1 Epley | shipped, `unknown` |
| 8.2 Brzycki | shipped, `unknown` |
| 8.4 the average of the two | shipped, Tekiō's own |
| **the 2–5 rep window** | **new — Peter's judgement on 2026-09-09, not yet checked** |

The window is an app claim the moment the app refuses to estimate above 5 reps,
so the scout answers it directly: how does the error of these estimators grow
with reps, and where does it stop being worth printing? If the evidence puts the
boundary somewhere other than 5, the evidence wins and this brief records the
move. Under-5 is the user's floor either way — the scout can narrow that window,
not widen it.

## Doctrine checklist

Answered against the decided shape (on demand, 2–5 reps), not against what
ships today.

1. **Which read does this sharpen?** Weights capture. On its own that is the
   weakest possible answer — §1 says the read is the product and capture is
   overhead — and it is why the always-on version failed. On demand it is a
   different object: the user asks *what is my max* at the moment they are
   choosing what to put on the bar, and the answer changes that choice.
2. **What does it let me stop doing?** Printing a number nobody asked for
   against every set, and wondering whether the number is right.
3. **Input or destination?** Neither. It is an answer, returned when asked,
   inside a surface that already exists.
4. **Honest shape?** A scalar with an error band, valid only inside a rep
   window — and a *measured* max is a different kind of fact from an estimated
   one, so the two must not print identically. An estimate shown to the
   kilogram implies a precision no rep-max formula has.
5. **Physiological number?** Yes — that is the whole brief.

## Gate record — `/ground` steps 0 and 1

**Step 0, the trigger: it fires.** Formulas and estimators are named in the
trigger spec, and the blend is named in it explicitly — *"Not an exemption:
combining estimators… `estimate1RM` is the live instance."* The rep ceiling is a
second firing on its own: refusing to estimate above N reps classifies, which
the spec gates whether or not a digit is attached.

**Copies enumerated** (2026-09-09): one each. `epley1RM`, `brzycki1RM`,
`estimate1RM` and `best1RM` exist only in `src/lib/utils.ts`; the only consumers
are `WeightsTab` and `src/test/utils.test.ts`. Nothing in `scripts/`,
`supabase/` or the edge functions carries a second copy, so there is no pair of
copies that could disagree.

**Step 1, the doctrine kills — none of them lands.** *A number I can't act on*
was the real threat, and it is what the on-demand change answers: asked for at
the moment of a max attempt, the number changes the load on the bar. P4 does not
apply (this is not a setting). P5 does not apply (it is a per-set fact, not one
global fact split N ways). R1 and R3 do not apply (no new section, no new
machinery). The §5 ledger has Weights as **Core — capture**, neither folded nor
shelved, so this is not work with a delete-by date on it.

**Step 2 ran 2026-09-09** — one run, because all four claims rest on one
question: how well do rep-max formulas estimate a true max, and over what rep
range is the estimate worth printing.

## Grounding

Run 2026-09-09, one scout, one question — *how well do rep-max formulas estimate
a true max, and over what rep range is the estimate worth printing?* The five
PMIDs and two PMC records below were checked against NCBI eutils on receipt;
titles, journals and years match.

**Claim:** An estimated 1RM in kg, printed on demand from a logged set, offered only for sets of **2–5 reps** and refused above 5. It drives the load the user puts on the bar for a declared max attempt, and the basis of the PR badge in `WeightsTab`.
**Searched:** 2026-09-09 · **Verdict:** partially supported

**Per-claim verdicts**

| Claim | Verdict |
|---|---|
| 8.1 Epley `w × (1 + r/30)` | **partially supported** — coach's chart at origin, independently validated later; small mean bias at low reps, exercise-specific |
| 8.2 Brzycki `w × 36/(37 − r)` | **partially supported** — same shape of evidence as Epley; nothing separates the two inside 2–5 reps |
| 8.4 `(epley + brzycki) / 2` | **convention only** — no study located that tests any averaged rep-max equation. Not "refuted"; *nobody has looked* |
| the 2–5 rep window | **supported, but narrower than the evidence requires** — every source that names a range puts the ceiling at 6, 8 or 10, never below 5 |

**Number to use:** rep window **2–10 reps** is what the literature supports; default the ceiling at **5** as shipped, because 5 sits comfortably inside every published window and Peter's rule permits narrowing only. Print the result as a **±5 % band or to the nearest 2.5 kg**, never to the kilogram — a *tested* 1RM in a trained adult has a day-to-day CV of 3.3 %, so a single-kg estimate claims precision the measurement itself does not have.

### Evidence

**Where the two formulas come from**

- `[literature]` Brzycki's equation was published as a two-page practitioner article by a university strength coach in a physical-education teaching journal, not as a validation study. Brzycki M, *JOPERD* 1993;64(1):88–90 — [Princeton listing](https://brzycki.scholar.princeton.edu/publications/strength-testing-%e2%80%93-predicting-one-rep-max-reps-fatigue) · [publisher](https://www.tandfonline.com/doi/abs/10.1080/07303084.1993.10606684). I could not open the full text, so whether it reports any original sample is unconfirmed.
- `[literature]` Epley's equation first appears as a "Poundage Chart" in a self-published training book (Epley B, *Boyd Epley Workout*, Body Enterprises, Lincoln NE, 1985). No peer-reviewed derivation, no population, no error band at origin. Located only through secondary citation — [Wikipedia's reference list](https://en.wikipedia.org/wiki/One-repetition_maximum) is the closest thing to a public record.
- **Consequence:** at origin both are conventions. Their standing rests entirely on validation work done later by other people, listed below.

**How accurate they are against a tested 1RM**

- `[literature]` Seven equations including Epley and Brzycki correlated r > 0.95 with tested 1RM, yet mean differences were significantly non-zero for most equations in the bench press and squat, and *every* equation significantly underestimated the deadlift. Cross-validation, 67 untrained college students (40 M, 27 F), three lifts. LeSuer DA et al., *J Strength Cond Res* 1997;11(4):211–213 — [abstract](https://journals.lww.com/nsca-jscr/abstract/1997/11000/the_accuracy_of_prediction_equations_for.1.aspx). The high r is the trap: it hides a real, exercise-specific bias.
- `[literature]` Prediction was more accurate whenever fewer than 10 repetitions to fatigue were used, both before and after 12 weeks of training. Repeated-measures validation, 103 untrained young women, bench press, reps-to-fatigue at randomly assigned 60–90 % 1RM. Mayhew JL et al., *J Strength Cond Res* 2008;22(5):1570–1577 — [PubMed](https://pubmed.ncbi.nlm.nih.gov/18714230/).
- `[literature]` 18 published equations cross-validated; the authors recommend using loads that yield **4–10 reps to failure** and publish two refined equations rather than endorsing a classical one. 43 recreationally active men (leg extension) / 39 (bench press), age 20.6 ± 1.5 y, reps-to-failure at 80 % 1RM. Roberts TD et al., *J Strength Cond Res* 2025;39(2):e96–e105 — [PubMed](https://pubmed.ncbi.nlm.nih.gov/39495260/).
- `[literature]` A back-squat validation in Division I college footballers reports Epley and Brzycki predicting a tested 1RM to within roughly **2.7 kg and 3.1 kg** from 3RM and 5RM tests, with one formula better at 3 reps and the other better at 5. DiStasio TJ, Master's research paper, Southern Illinois University, 2014 — [record](https://opensiuc.lib.siu.edu/gs_rp/573/). **n not obtained and the formula↔rep-count pairing is unresolved**: the full text returned HTTP 403 and two secondary citations pair them oppositely. Grey literature, trained population, treat as suggestive only.

**How the error grows with reps**

- `[literature]` Prediction accuracy falls monotonically as the test moves away from 1 rep. R² for predicted 1RM was, at 5RM / 10RM / 20RM: chest press 0.993 / 0.976 / 0.955; leg press 0.974 / 0.933 / 0.915. 70 subjects (34 M, 36 F), 18–69 y, 1/5/10/20 RM on both lifts. Reynolds JM, Gordon TJ, Robergs RA, *J Strength Cond Res* 2006;20(3):584–592 — [PubMed](https://pubmed.ncbi.nlm.nih.gov/16937972/). **5 reps was the lowest tested; nothing here compares 2 with 5.**
- `[literature]` A 4–6 RM test predicted 1RM better than a 7–10 RM test (higher adjusted R², lower SEE). 34 healthy males 19–32 y, five exercises, 48 h between tests. Dohoney P et al., *J Exerc Physiol Online* 2002;5(3):54–59 — [record](https://augusta.elsevierpure.com/en/publications/prediction-of-one-repetition-maximum-1-rm-strength-from-a-4-6-rm-/). This is the closest thing located to a direct rep-window comparison, and it lands on 4–6.
- `[literature]` **The dominant moderator is the exercise, not the person.** At 80 % 1RM the leg press yielded 13.1 reps [95 % CI 9.8–17.5] but the bench press 8.8 [7.7–10.1]; sex, age and training status showed little influence. Between-individual SD was 2.51 reps at 80 % 1RM and 4.36 at 60 %. Meta-regression of 952 reps-to-failure tests, 7,289 individuals, 269 studies. Nuzzo JL, Pinto MD, Nosaka K, Steele J, *Sports Med* 2024;54(2):303–321 — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10933212/). A single rep→%1RM curve is therefore wrong for *some* exercise no matter which curve you pick, and the error shrinks as load approaches 100 % — which is the real argument for a low-rep window.
- `[literature]` A weight-dependent formula fitted to 303,494 near-failure sets from 14,966 users across 388 exercises reduced inconsistency 17–22 % against four classical benchmarks including Epley and Brzycki, attributing 91 % of the gain to a load-dependent conversion factor the classical formulas lack. Marzagão T, arXiv:2603.17495, 18 Mar 2026 — [preprint](https://arxiv.org/abs/2603.17495). **Not peer-reviewed, and the dataset contains no tested 1RM** — the metric is internal consistency between sets, not agreement with a measured max. Evidence that the classical formulas carry structural bias; not evidence of its size in kg.

**The noise floor of the thing being estimated**

- `[literature]` A *tested* 1RM has a median test–retest CV of 4.2 % (median ICC 0.97); 3.3 % in trained subjects, 5.5 % in untrained; 4.1 % upper body, 4.7 % lower. Systematic review, 32 studies, pooled n = 1,595. Grgic J et al., *Sports Med Open* 2020;6:31 — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7367986/).
- **Definitional, checkable arithmetic (not a claim about bodies):** Epley and Brzycki are algebraically *identical* at exactly 10 reps — setting `1 + r/30 = 36/(37 − r)` gives `r² − 7r − 30 = 0`, i.e. `r = 10`, both equal `w × 4/3`. Inside 2–5 reps they differ by **3.7–3.9 % of the load** (at 5 reps ×1.1250 vs ×1.1667; at 2 reps ×1.0286 vs ×1.0667). On a 100 kg 5-rep set: 112.5 kg vs 116.7 kg, mean 114.6 kg. **The gap the average is papering over is about the same size as the day-to-day noise of a real tested max.**

**Is a 1RM attempt riskier than a heavy 2–5?**

- `[literature]` No study located compares injury rate between 1RM testing and heavy submaximal sets in trained adults. The best injury epidemiology available reports 1.0–4.4 injuries/1000 h of training in powerlifting and 2.4–3.3/1000 h in weightlifting **without separating maximal from submaximal work**. Systematic review, 17 reports. Tung MJ et al., *BMJ Open Sport Exerc Med* 2024;10(4):e001884 — [PubMed](https://pubmed.ncbi.nlm.nih.gov/39650568/).
- `[literature]` 1RM testing injured 2 of 83 healthy elderly subjects (2.4 %; 8 % of the no-experience subgroup) across five exercises; the authors call 1RM testing "an acceptable tool" with extra care for the inexperienced. Shaw CE, McCully KK, Posner JD, *J Cardiopulm Rehabil* 1995;15(4):283–287 — [PubMed](https://pubmed.ncbi.nlm.nih.gov/8542534/). Elderly, not a trained adult.
- `[literature]` The one review that argues *against* direct 1RM testing does so on cardiovascular grounds, and explicitly names **repetitions to failure** as a co-contributor: "movement against high resistance and muscle fatigue both increase blood pressure." Narrative review. Niewiadomski W et al., *J Hum Kinet* 2008;19:109–120 — [PDF](https://johk.pl/wp-content/uploads/2023/02/10.2478_v10078-008-0008-8.pdf). This matters directly: an Epley/Brzycki estimate is only valid from a set taken to or near failure, so the substitution does not remove the risk the review names.
- `[literature]` 34 healthy young males completed 1RM plus 4–6 RM plus 7–10 RM testing on five exercises with **no injuries and no muscle soreness reported**. Dohoney P et al. 2002, as above — [record](https://augusta.elsevierpure.com/en/publications/prediction-of-one-repetition-maximum-1-rm-strength-from-a-4-6-rm-/).
- `[single-practitioner position]` Estimating from a submaximal set "is safer than attempting a true 1RM test, which carries a higher risk of injury," for people training without coaching. Galpin — [Ask Andy Galpin](https://ask.andygalpin.com/s/2M5kZk3T). Israetel and Patrick are silent on this; Attia's related position (below) is about heavy axial loading generally, not about maxes specifically.
- `[single-practitioner position]` Heavy hip-hinging under axial load "should be approached with care because of the risk of injury to the spine." Attia — [AMA #32](https://peterattiamd.com/ama32/). This is a claim about heavy loading, not a claim that 1 rep is riskier than 3.

**The roster on the rep window**

- `[single-practitioner position]` "Stay within a 3 to 8 rep range when estimating your max, as the accuracy decreases with higher repetitions (over 10 reps)." Galpin — [Ask Andy Galpin](https://ask.andygalpin.com/s/2M5kZk3T). The only roster member with a located position on this number; Israetel, Attia, Patrick and Huberman are silent. Note his **floor is 3, not 2**, and his ceiling is 8.
- `[practitioner consensus]` None found. No two roster members in the strength domain hold a stated position on rep-max estimation windows, so there is nothing to report as consensus.
- **Convention only:** the widespread advice to "average multiple formulas" and to "use 3–5 reps" traces to 1RM-calculator websites, not to studies. That is a convention for making a calculator's output feel stable, and it grounds nothing.

### Where they split

**The real fork is not between practitioners — it is between the app's ceiling and every published window.** Peter picked 5. Dohoney's data land on 4–6, Roberts recommends 4–10, Mayhew and LeSuer say "under 10," Reynolds says 5 beats 10 beats 20, and Galpin — the roster's strongest training physiologist — says 3–8. **Nobody puts the honest ceiling below 5, and everybody who names one puts it at or above 6.** A ceiling of 5 is therefore defensible and conservative; it is not the number the evidence would have chosen, and the cost is refusing usable 6–8 rep sets. Recording the disagreement, as asked: the evidence would allow the ceiling to move up to **8**, and arguably 10, before anything in the literature objects.

**The second fork is the averaging step, and it forces a choice.** Because Epley and Brzycki cross at exactly 10 reps, the mean does nothing at 10 and does its *maximum* work in the 2–5 window Peter just chose — 3.7–3.9 % of the load. Averaging also guarantees, by construction, that when one formula is closer at a given rep count (as DiStasio suggests happens at 3 and at 5) the app never has the better answer, in exchange for never having the worse one. That is a hedge, not an estimate, and no citation can be attached to it. Three shapes, and Tekiō must pick one:

1. **Name one estimator** and cite it. Nothing in the evidence separates Epley from Brzycki inside 2–5 reps, so the choice is made on a stated non-evidential ground — Brzycki is the more conservative of the two in this window (it never claims a higher max than Epley below 10 reps), which suits a number used to load a bar for a real attempt. Honest, citable, and the code comment says which and why.
2. **Print the band the two formulas span** — "112–117 kg" — instead of collapsing it into an invented midpoint. Same information, no third estimator, and it makes the uncertainty visible where doctrine §4 question 4 asks for the honest shape.
3. **Keep the average** and label it in the inventory as `convention — no supporting evidence located`. Defensible only if the block above ships next to it.

Shape 2 is what the evidence actually supports; shape 1 is what a single printed kg figure requires. Shape 3 is the status quo with an honest label.

**The third fork is one the brief does not yet name.** Every validation study above measured **repetitions to fatigue** — the set was taken to or very near failure. `estimate1RM` currently accepts any logged set. A 5-rep set with 3 reps left in the tank produces a systematically low estimate, and nothing in the formula can detect it. Nuzzo's between-individual SD of 2.51 reps at 80 % 1RM is the population-scale version of the same problem. So the on-demand gate needs **two** conditions, not one: reps within the window **and** the set declared as taken to failure. Without the second, the rep ceiling grounds nothing, because the input the formulas were validated on is not the input the app is feeding them.

### Caveats

- **Population mismatch.** The two biggest validation samples are untrained: LeSuer n = 67 untrained students, Mayhew n = 103 untrained women. Roberts used recreationally active young men (n = 43/39), Dohoney healthy young men (n = 34), Reynolds a mixed 18–69 y sample (n = 70). Tekiō serves one trained adult male. Nuzzo's meta-regression is reassuring here — training status was *not* a clear moderator of reps at a given %1RM — but no located study validates Epley or Brzycki at 2–3 reps in a trained lifter. **The floor of the window is an extrapolation.**
- **Exercise mismatch is the bigger one.** Nuzzo's leg-press-vs-bench-press gap (13.1 vs 8.8 reps at the same %1RM) says one formula cannot be right for every exercise. Tekiō applies the same formula to every logged lift. The error shrinks as reps fall — which is the strongest evidence-based argument for the low window — but it does not vanish.
- **The floor of 2 buys nothing measurable.** No study compares a 2-rep estimate with a 5-rep one. Reynolds' gradient implies fewer reps is better, but the Epley–Brzycki spread at 2 reps (3.7 %) is already about the size of a tested 1RM's own trained-subject CV (3.3 %). **Treat 2, 3, 4 and 5 as one band; do not build anything that prefers a 2-rep estimate.**
- **The risk premise is a convention, not a finding.** It is held by Galpin and is entirely plausible, but no located study compares injury rates between max attempts and heavy 2–5 rep sets in trained adults, and the one safety review that argues against 1RM testing names reps-to-failure as part of the same hazard. If the brief wants to say "estimating is safer," it should say *we assume* it is safer.
- **Grey and unreviewed sources flagged:** DiStasio 2014 is an unpublished Master's paper whose full text I could not open (n unknown, formula↔rep pairing unresolved); arXiv:2603.17495 is a non-peer-reviewed preprint with no tested 1RM in its data.
- **What would move this number:** a validation of Epley/Brzycki at 2–3 reps to failure in trained lifters with Bland–Altman limits of agreement (nothing located); a per-exercise conversion factor, which the Nuzzo tables already begin and the arXiv preprint attempts at scale; or Tekiō's own record — once the user logs a real tested 1RM alongside in-window estimates for the same lift, the app has a personal calibration that beats every population equation here.

### Source comment

```ts
// Epley 1985 (Boyd Epley Workout, Body Enterprises) — a coach's poundage chart, validated later by others;
// mean bias small at <10 reps but exercise-specific. See docs/roadmap/067-ground-1rm-estimator.md#grounding

// Brzycki 1993, JOPERD 64(1):88-90 — a coach's article, validated later by others; identical to Epley at
// exactly 10 reps, ~3.8% lower at 2-5. See docs/roadmap/067-ground-1rm-estimator.md#grounding

// (epley + brzycki) / 2 — CONVENTION, not a published estimator: no study tests an averaged rep-max equation.
// The two differ ~3.8% at 2-5 reps and agree exactly at 10. See docs/roadmap/067-ground-1rm-estimator.md#grounding

// Rep ceiling 5 — deliberately conservative: published windows are 4-6 (Dohoney 2002), 4-10 (Roberts 2025),
// <10 (Mayhew 2008, LeSuer 1997). Valid only for sets taken to failure.
// See docs/roadmap/067-ground-1rm-estimator.md#grounding
```

### Three decisions this run hands back

The block above forces choices the scout cannot make. Recorded here before any
code moves, per the gate's rule that a contradicted value is a decision and not
a find-and-replace:

1. **The averaging step** — one named estimator, the span of the two, or the
   average kept and labelled a convention.
2. **The ceiling** — 5 stands unless Peter moves it. The evidence would allow 8.
3. **To failure** — the formulas were validated on sets taken to fatigue, so the
   app needs to know a set was, and today it has no way to.

## Acceptance

- [x] Peter picks a reading: **ground it** (2026-09-09), with the two changes in
      *Peter's decision*
- [ ] `/ground` run against inventory rows 8.1, 8.2, 8.4 **and the 2–5 rep
      window**, its `## Grounding` block landed here, source comments on the
      formulas
- [ ] 8.4 either cites support for averaging, or the code drops to one named
      estimator and the inventory row retires
- [ ] The rep window ships as a hard rule: no estimate above the grounded
      ceiling, and the ceiling's source is in the code comment
- [ ] The estimate is on demand — nothing computes or prints a 1RM until a max
      attempt is declared; the Est. 1RM panel no longer follows every keystroke
      and the history chip no longer labels ordinary volume work
- [ ] The PR badge still says *this was your best* on a basis that survives the
      change — a real max where one exists, an in-window estimate otherwise
- [ ] A real, measured 1RM is distinguishable from an estimate wherever both can
      appear (the truest number is not printed as if it were a guess, or the
      reverse)
- [ ] `docs/grounding-inventory.md` §8 no longer says **(no brief)**
- [ ] The matching box in [048](done/048-simplification-candidates.md) Acceptance
      ("the four found-on-the-way items each have a brief or a recorded
      decision") counts this one as covered
