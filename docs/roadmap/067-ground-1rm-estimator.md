# Roadmap: Ground the 1RM estimate WeightsTab prints

**Label:** backlog
**Status:** backlog — found 2026-09-08 while landing candidate A1 of [048](048-simplification-candidates.md); needs Peter's decision before any scout run. Inventory rows 8.1, 8.2 and 8.4 have said `unknown` / **(no brief)** since the inventory was written; this file is the brief they were missing, not new work committed to.

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

Reading 2 is worth taking seriously. Grep before deciding: as of 2026-09-08
`best1RM` is called only inside `WeightsTab` (a per-entry label and a chart
series). Nothing else in the app consumes an estimated 1RM.

## Doctrine checklist

1. **Which read does this sharpen?** Weights capture, not a read — which is
   itself part of the argument. §1 says the read is the product and capture is
   overhead.
2. **What does it let me stop doing?** Under reading 2, showing a number nobody
   acts on. Under reading 1, wondering whether it is right.
3. **Input or destination?** Neither; a label on an existing surface.
4. **Honest shape?** A single scalar per entry, plus a trend line. If it stays,
   the error band is part of the honest shape — an estimate printed to the
   kilogram implies a precision no 1RM formula has.
5. **Physiological number?** Yes — that is the whole brief.

## Acceptance

- [ ] Peter picks a reading: ground it, or delete it
- [ ] If grounded: `/ground` run against inventory rows 8.1, 8.2 and 8.4, its
      `## Grounding` block landed here, source comments on the three formulas
- [ ] If grounded: 8.4 either cites support for averaging, or the code drops to
      one named estimator and the inventory row retires
- [ ] If deleted: `estimate1RM`, `best1RM`, `epley1RM`, `brzycki1RM` and the
      WeightsTab label and chart series go; rows 8.1–8.4 retire as removed
- [ ] `docs/grounding-inventory.md` §8 no longer says **(no brief)**
- [ ] The matching box in [048](048-simplification-candidates.md) Acceptance
      ("the four found-on-the-way items each have a brief or a recorded
      decision") counts this one as covered
