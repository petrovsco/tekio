# Roadmap: Cardio Progress chart — roll up by week and month in the long frames

**Label:** feature
**Status:** done — shipped 2026-09-06 (v2.0.21): `rollupCardio` + `grainForFrame` in utils.ts, the grain wired into CardioTab, checked in a browser at 390 px. The one gap found on the way (an isolated pace bucket draws no mark) is brief 056.

## Why

**The failure this prevents:** pick *All time* on the Cardio tab's Progress
chart and the running line is unreadable. Since the Garmin backfill
([054](054-garmin-history-backfill-cardio-hiit.md)) the chart holds
three years of sessions, one point each, and at 390 px the plot is about
300 px wide — roughly 2 px per point. The ticks pile up, the line is a
hairball, and the one question the frame exists to answer ("is my running
volume climbing or falling over the years?") gets no answer.

**Evidence** (live `cardio_sessions`, 2026-09-06):

| Type | All time | Weeks with a session | Months with a session | This year | Last 90 days |
|---|---|---|---|---|---|
| Running | 133 | 71 | 29 | 4 | 3 |
| Indoor Rowing | 43 | 41 | 14 | 4 | 0 |
| Cycling | 24 | 8 | 6 | 4 | 4 |
| Custom | 20 | 12 | 6 | 0 | 0 |

Runs per year: 62 in 2023, 35 in 2024, 32 in 2025, 4 so far in 2026. So a
full year of the 2023 kind is also too many points for one chart, while the
30- and 90-day frames never come close.

**The case against.** The dense view is opt-in: the frame defaults to *Last
90 days*, which today shows three running points, and Peter has to choose
*All time* to see the problem. The chart also sits on a capture tab and feeds
no Home read — doctrine §1 says time spent there is worth less than time
spent on the read. Both are true, and they are why this brief is small: no
new surface, no new number, one pure function and a grain picker.

## Shape

**The grain follows the frame.** The frame is the thing Peter chose, so the
grain is predictable and the card can say what a point is:

| Frame | One point is | Points today (running) |
|---|---|---|
| Last 30 days, Last 90 days | one session (as now) | 1, 3 |
| This year | one week | 4 (a 2023-sized year: at most 52) |
| All time | one month | 29, growing by 12 a year |

Not a point-count threshold: a threshold would change what a point means the
day one more session is logged, and nothing on the card would say so.

**What a rolled-up point holds.** Sessions (a count), duration (the sum of
minutes), distance (the sum of km over the sessions that have one), and pace
as summed minutes over summed km for those same sessions — distance-weighted,
because a plain mean of paces lets a 3 km jog count as much as a 20 km run.
The tooltip leads with the count ("3 sessions") so the reader knows a point is
a sum.

**Empty buckets stay.** Every week or month between the first and last session
in the frame is drawn, with duration 0 and no pace. A six-month gap in running
then shows as a gap; hiding the empty months would draw a trend that never
happened (P2). Recharts leaves a hole in the pace line where the value is
`null`, which is the honest picture.

**Labels.** Weeks label with their Monday (`weekKey`, taking `weekStartDay`
from `usePrefs` so the weeks match the sport card's), months with `YYYY-MM`.
The year is then part of the long-frame labels and the `spansYears` year
prefix only applies to the per-session grains. The card names the grain next
to the frame select ("per month"), in the same type as the legend.

**Code.** One pure function next to `weekKey` and `withinTimeFrame` in
[src/lib/utils.ts](../../../src/lib/utils.ts) — `rollupCardio(sessions, grain,
weekStart)` returning the bucket rows above — with cases in
[src/test/utils.test.ts](../../../src/test/utils.test.ts) for the sums, the
weighted pace, a session without distance, and an empty bucket in the middle.
[CardioTab](../../../src/components/tabs/CardioTab.tsx) maps the frame to a
grain and feeds the result to the same `LineChart`; the per-session path
keeps its `date#index` keys. `SportProgress` stays its own weekly bar chart —
it counts sessions, this one sums minutes, and they should not merge.

## Doctrine checklist

1. **Which read does this sharpen?** The Cardio tab's Progress chart, in its
   *This year* and *All time* frames. No new surface.
2. **What does it let me stop doing?** Nothing to cut. The year prefix on
   ticks and the duplicate-key suffix narrow to the per-session grains.
3. **Input or destination?** Neither — a presentation change to an existing
   chart. Home and Adaptations keep their own grounded windows and do not
   read `TIME_FRAMES` (utils.ts says so above the constant).
4. **Honest shape of the data?** Per session while the points fit; per week
   or per month as sums when they do not, with the count shown and the empty
   periods kept.
5. **A number claiming physiological meaning?** No. Sums and a weighted mean
   of logged minutes and km; no threshold, no claim. No grounding section.

## Out of scope

- Rolling up the sport card (it already buckets by week).
- A frame picker on Home or Adaptations (reads never take these frames).
- Changing what the 30- and 90-day frames draw.

## Acceptance

- [x] *All time* / Running draws one point per month, and the ticks read at
      390 px without overlapping.
- [x] *This year* draws one point per week, keyed by the same Monday as the
      sport card.
- [x] A rolled-up point's tooltip shows the session count, total minutes,
      total km and the distance-weighted pace; a bucket with no distance shows
      no pace.
- [x] Empty weeks and months inside the frame's span are drawn with zero
      duration, not skipped.
- [x] *Last 30 days* and *Last 90 days* are unchanged: one point per session.
- [x] `rollupCardio` has unit tests; `npm run build`, `npm run test` and
      `npm run check:docs` pass; the chart is checked in a browser at 390 px
      with a screenshot in the commit's summary.

## First step

Write `rollupCardio` and its tests, then wire the grain into `CardioTab`.
Verify against the live rows: Running / All time should show 29 points.

## Outcome (2026-09-06)

- *All time* / Running draws 40 monthly points, May 2023 to August 2026: the
  29 months with a run plus the empty ones between them (the "29 points" above
  counted only months with a session; the empty-buckets rule adds the rest).
  Five x ticks, none overlapping. June 2023 alone holds 25 runs and 1157 min,
  which pushed the duration axis to four digits — it widens to 36 px when any
  bucket passes 1000 min, so "1200" no longer clips to "200".
- *This year* / Running draws 13 weekly points from the week of 2026-06-01;
  four hold a run. A rolled-up tooltip reads, for example, "2023-06 · 25
  sessions · 175.11 km" over duration and pace; an empty week reads "0
  sessions" with duration 0 and no pace line.
- The function went at the *end* of utils.ts rather than beside
  `withinTimeFrame`: ten grounding-inventory line anchors point below line 50
  and a mid-file insert would have shifted all of them.
- Found on the way: a pace bucket with empty neighbours on both sides draws
  nothing, because a line needs two adjacent points and the design system
  (§9) turns resting dots off. The value is in the tooltip and on the hover
  dot. Whether that series gets an exception is Peter's call — brief 056.
