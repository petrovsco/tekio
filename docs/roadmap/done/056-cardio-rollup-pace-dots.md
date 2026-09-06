# Roadmap: Pace dots on the rolled-up Cardio Progress frames

**Label:** feature
**Status:** done — shipped 2026-09-06 (v2.0.22): `hasLonePace` in utils.ts, `LoneDot` on the pace line in CardioTab for the week and month grains, §9 amended. Checked at 390 px: the two lone weeks in *This year* (Running) and the two lone months in *All time* (Cycling) draw a dot, joined points and the per-session frames none.

## Why

**The failure this prevents:** pick *This year* / Running on the Cardio tab
(2026-09-06) and the pace line is one short segment. Four runs sit in four
weeks; only the first two weeks are adjacent, so only they get a line
between them. The paces of the other two runs (6.5 and 7.26 min/km) exist,
but nothing on the resting chart shows them. Recharts draws a segment
between two neighbouring non-null points, and an isolated bucket — empty
weeks on both sides — has no neighbour. With resting dots off it has no
mark either. *All time* has the same gap wherever a month sits alone — for
cycling, 2024-07 and 2025-08. (The first draft of this brief named 2025-02,
2025-03 and 2025-09 for running; the tooltip walk on 2026-09-06 showed
2025-02 and 2025-03 are neighbours and 2025-09 joins 2025-08, so running has
no lone month today.)

**Evidence:** the 390 px screenshot from
[055](055-cardio-progress-rollup.md)'s browser check: the pace line
runs from the week of 26-06-01 to 26-06-08 and then stops, while hovering
26-06-29 and 26-08-24 shows a pace in the tooltip.

**The case against.** [design-system.md §9](../../design-system.md) says lines
have no resting dots and the hover dot (r 3, ink) is how a single value is
seen — and it works: the tooltip and the active dot both show the isolated
pace. Dots on one series and none on the other is two visual languages on
one chart. The duration line has no such gap, because an empty bucket is a
real 0 and the line passes through it. And the rolled-up frames are opt-in
views on a capture tab (doctrine §1): the read that matters is Home.

## Shape

Peter's call (2026-09-06): **lone points only**, not the whole series. A
pace bucket whose neighbours on both sides carry no pace has no segment to
sit on, so it is drawn as a dot (r 2, `CHART.line2`, no stroke) — the
one-point form of a line, not a second visual language. A bucket joined to a
neighbour stays bare, as §9 says. The test is `hasLonePace` in utils.ts; the
`dot` on the pace `Line` in CardioTab is wired only when the grain is `week`
or `month`, so the per-session frames keep the shared `CHART_LINE`.
Design-system §9 records the exception in one clause, since "no resting
dots" is no longer true as written.

The two shapes not taken: dots on every rolled-up pace point (the brief's
first draft — a stronger §9 exception, and two languages on one chart), and
discarding (tap-to-see is enough on a capture tab).

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

- [x] Peter decides — 2026-09-06: yes, lone points only.
- [x] A lone pace bucket in *This year* and *All time* shows a dot and a
      joined one does not; *Last 30 days* and *Last 90 days* are unchanged;
      design-system §9 names the exception; checked in a browser at 390 px
      (2026-09-06: Running / *This year* — dots at 26-06-29 and 26-08-24
      only; Cycling / *All time* — dots at 2024-07 and 2025-08 only; Running
      / *All time* — none, as no month is lone; *Last 90 days* — none; no
      console errors).
