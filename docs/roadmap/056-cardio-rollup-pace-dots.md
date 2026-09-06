# Roadmap: Pace dots on the rolled-up Cardio Progress frames

**Label:** backlog
**Status:** backlog — needs Peter's call: design-system §9 says "no resting dots", and this asks for an exception on one series in two frames. No → discard.

## Why

**The failure this prevents:** pick *This year* / Running on the Cardio tab
(2026-09-06) and the pace line is one short segment. Four runs sit in four
weeks; only the first two weeks are adjacent, so only they get a line
between them. The paces of the other two runs (6.5 and 7.26 min/km) exist,
but nothing on the resting chart shows them. Recharts draws a segment
between two neighbouring non-null points, and an isolated bucket — empty
weeks on both sides — has no neighbour. With resting dots off it has no
mark either. *All time* has the same gap for single-month islands (2025-02,
2025-03, 2025-09 for running).

**Evidence:** the 390 px screenshot from
[055](done/055-cardio-progress-rollup.md)'s browser check: the pace line
runs from the week of 26-06-01 to 26-06-08 and then stops, while hovering
26-06-29 and 26-08-24 shows a pace in the tooltip.

**The case against.** [design-system.md §9](../design-system.md) says lines
have no resting dots and the hover dot (r 3, ink) is how a single value is
seen — and it works: the tooltip and the active dot both show the isolated
pace. Dots on one series and none on the other is two visual languages on
one chart. The duration line has no such gap, because an empty bucket is a
real 0 and the line passes through it. And the rolled-up frames are opt-in
views on a capture tab (doctrine §1): the read that matters is Home.

## Shape

If yes: resting dots (r 2, `CHART.line2`, no stroke) on the pace `Line` in
CardioTab only when the grain is `week` or `month`; the per-session frames
keep the shared `CHART_LINE`. Design-system §9 then records the exception in
one line, since "no resting dots" would no longer be true as written.

Not `connectNulls`: joining across an empty month draws a trend that never
happened (P2), which is the thing 055 kept the empty buckets to avoid.

## Doctrine checklist

1. **Which read does this sharpen?** The Cardio Progress chart, rolled-up
   frames only. No new surface.
2. **What does it let me stop doing?** Nothing.
3. **Input or destination?** Neither — presentation of an existing series.
4. **Honest shape of the data?** A value that exists gets a mark; a bucket
   with no distance stays a hole.
5. **A number claiming physiological meaning?** No.

## Acceptance

- [ ] Peter decides. No → `discarded`, with the §9 rule as the reason.
- [ ] Yes → an isolated pace bucket in *This year* and *All time* shows a
      dot; *Last 30 days* and *Last 90 days* are unchanged; design-system §9
      names the exception; checked in a browser at 390 px.
