# Roadmap: Ground the 1RM estimate WeightsTab prints

**Label:** feature
**Status:** in progress — picked up and committed to 2.1.0 on 2026-09-09. Peter chose reading 1 the same day (**ground it**) and changed what ships with it: the estimate stops being computed continuously and appears only when a max attempt is declared, and it is offered only for sets of 2–5 reps. The scout run now has four claims, not three — see *Peter's decision*. Found 2026-09-08 while landing candidate A1 of [048](done/048-simplification-candidates.md); inventory rows 8.1, 8.2 and 8.4 have said `unknown` / **(no brief)** since the inventory was written, and this file is the brief they were missing.
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

1. **Which read does this sharpen?** Weights capture, not a read — which is
   itself part of the argument. §1 says the read is the product and capture is
   overhead.
2. **What does it let me stop doing?** Under reading 2, showing a number nobody
   acts on. Under reading 1, wondering whether it is right.
3. **Input or destination?** Neither; a label on an existing surface.
4. **Honest shape?** A single scalar per entry, plus one all-time maximum. If it
   stays, the error band is part of the honest shape — an estimate printed to the
   kilogram implies a precision no 1RM formula has.
5. **Physiological number?** Yes — that is the whole brief.

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
