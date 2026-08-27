# Roadmap: Cross-adaptation set/rep classification — TBC

**Status:** TBC — captured for context, not yet decided.
**Kickoff:** start a fresh session with this file as the brief.

## The context we don't want to lose

Rep ranges for the resistance adaptations biologically **overlap** — a set of 5
builds both strength *and* meaningful hypertrophy; a set of 15 builds both
hypertrophy *and* some endurance. The app even reflects this in its coaching text
(`rx.reps` in `src/constants/adaptations.ts`): Strength "3–5", Hypertrophy
"5–30 (≈8–15)", Endurance "15–40+" — those ranges overlap on purpose.

**But the classifier does not overlap.** `classifyWeightSet()` in
`src/lib/adaptations.ts` is a strict partition:

```
reps ≤ 5   → strength
reps ≤ 15  → hypertrophy
else       → muscular_endurance
```

`repRange` metadata is disjoint (`[1,5]`, `[6,15]`, `[16,999]`). So every logged
set counts toward **exactly one** adaptation, never two. A set of 5 is 100%
strength / 0% hypertrophy; a set of 6 flips entirely to hypertrophy. This keeps
the numbers clean ("sum of per-adaptation muscle sets = total") and keeps the
Muscle Coverage card and adaptation dashboard consistent.

## The TBC question

Should boundary sets **bleed across adjacent buckets** (fuzzy classification),
e.g. a set of 5 reps = 0.7 strength + 0.3 hypertrophy, a set of 15 = partly
endurance? More physiologically honest, but:

- Muddies the per-adaptation numbers (no longer whole sets).
- Breaks the clean "sum = total" invariant that keeps the two dashboards agreeing.
- Needs a weighting curve decision (linear ramp at boundaries? overlap width?).

Speed & Power are `repRange: null` — never rep-classified; they only come from an
exercise tag/keyword. Any fuzzy scheme must leave those tag-driven adaptations
untouched.

## Decision needed before building

- Do we want fuzzy/overlapping classification at all, or keep the hard cut?
- If fuzzy: the overlap width + weighting curve, and how to preserve (or
  intentionally drop) the "sum = total" property both dashboards rely on.
