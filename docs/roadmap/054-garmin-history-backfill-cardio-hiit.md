# Roadmap: Garmin history backfill beyond sport — 157 cardio activities and 63 HIIT

**Label:** feature
**Status:** planned — Peter said on 2026-09-06 that the history matters, and
settled the shape the same day: a cardio type is the modality, HIIT is a
format of one, walks are not recorded. Free to run before or after 005 — the
misreads 005 fixes touch sessions outside every live window.

---

## 1. What this prevents, and the evidence

The Cardio tab's history and charts show three cardio sessions. Garmin holds
**157 cardio-type activities** for the same account (running 132, cycling 24,
one treadmill run — 2023-05-13 to 2026-09-06). That is the whole history: the
2026-09-06 `dump` run asked for everything back to 2012 and still got 277
activities, so the user's Garmin log starts in May 2023. The sync has only ever
run with a 7-day window, and it only started working on 2026-08-26, so
everything before that is invisible to the app. The raw list is in the
gitignored `scripts/garmin-sync/dumps/` (JSON and a CSV), read with
`scripts/garmin-sync/analyze_dump.py`.

The same run left two blocks unmapped that are not sport either:

| Garmin `typeKey` | Count | Dates | What it is |
|---|---|---|---|
| `hiit` | 63 | 2023-06-26 .. 2026-01-29 | Not what the name suggests: 43 are **"[N4x4] Indoor Rowing"** — Norwegian 4×4 intervals on the rower, the app's own VO₂max protocol (D23) — plus 15 "HIIT - EMOM", 4 "[4x60] Slam/Jump", 1 custom. Garmin agrees it is aerobic work: aerobic TE is the dominant system in 60 of 63 (median 3.1 vs 2.1 anaerobic), Z4 holds the largest share of time. None since January 2026. |
| `strength_training` | 43 | 2024-09-19 .. 2026-02-18 | Gym sessions recorded on the watch. Garmin's summary has no sets or reps, so there is nothing to put in `session_sets`; its Training Effect for these is noise (label `ANAEROBIC_CAPACITY` ×38 from HR alone). Stays skipped. |

None of the 120 unmapped activities falls on the same day as a hand-logged
sport row, so the claim rule from 041 has nothing to attach them to.

The rest of the unmapped list — `walking` ×9, `hiking` ×1, `skating_ws` ×1 —
stays out **by Peter's decision (2026-09-06): walks are not recorded.** A
30-min walk at HR ~102 is not a stimulus the app should count (005's evidence
table shows the current rules would call it a full endurance session).

## 2. What has to be handled

- **The reads are safe.** Home and Adaptations judge the last 14 days
  (roadmap 039 §6.6) through `inRange`, and the cardio staleness read uses
  its own short window. Activities from 2024 change nothing on any surface
  that answers "what's missing". That is also why this can run before 005:
  the sessions its rules misread are all outside every live window.
- **The Cardio tab's Progress chart is not.** `CardioTab` plots *every*
  session of the chosen type, all time, one point each, with month-day
  labels and no year. After the backfill that is a 132-point line for
  running over three years, with "05-13" appearing three times. The list is
  fine (`HistoryList` previews 3 rows and expands on tap), and loading 160
  rows at bootstrap is nothing. The chart needs a time frame before the rows
  land — `SportProgress` already has one (All time / 30 / 90 days / This
  year) to copy.
- **HIIT is a format, not a type** (Peter, 2026-09-06). A cardio type is the
  modality — running, cycling, swimming, rowing — and any of them can be done
  as intervals. His "HIIT" was indoor rowing, which is a type the app has.
  So Garmin's `hiit` profile is never a fifth `activity_type`; it is a
  rowing (or running, …) session with a format of *intervals*. That is the
  honest shape (P2) and it is exactly the signal 005 needs: the current
  Training Effect rules read 11 of the 43 4×4 rowing sessions as *endurance*
  because Garmin's whole-session label says `AEROBIC_BASE`, and a session
  flagged *intervals* should never land there. The 20 non-rowing HIIT
  sessions ("HIIT - EMOM" ×15, "[4x60] Slam/Jump" ×4, one custom) are mixed
  bodyweight conditioning with no modality among the four — skipped, like
  strength on the watch, unless Peter names a type for them.
- **Two hand-logged runs would double.** `cardio_sessions` has two manual
  running rows (2026-06-08, 2026-07-05) with no Garmin id; a cardio backfill
  inserts a second row next to each unless the claim rule from 041 is
  extended to cardio (same date + same `activity_type`).

## 3. Shape

1. **Time frame on the cardio Progress chart** first: the chips
   `SportProgress` already has, defaulting to a window rather than all time,
   and the year on the axis when the frame spans more than one. A docs-free
   UI change, verified in the browser.
2. **`cardio_sessions.format`** — `text` nullable, `'steady' | 'intervals'`
   (null = not stated, which is every existing row). Shown on the row as a
   small label ("Intervals") the way `Garmin` is; `CardioLogForm` gets a
   toggle so a hand-logged interval run can say so too. 005 reads it.
3. **Extend the claim step** in `scripts/garmin-sync/sync_activities.py` to
   cardio: before upserting, claim a manual `cardio_sessions` row on the same
   date with the same `activity_type`, filling only its empty columns —
   exactly what `plan_sport` does. Cardio's "write the Garmin name to `notes`
   on every re-sync" behaviour goes at the same time; sport already never
   touches an existing row's notes.
4. **Map `hiit` by modality.** The activity name carries it: a name containing
   "Rowing" → `rowing` with `format = 'intervals'`, the Garmin name kept in
   `notes`. Names with no modality (EMOM, Slam/Jump, custom) are skipped and
   the dry run says so, per key and name. Walking, hiking and skating stay
   unmapped by decision — list them as skipped without the "grow the map"
   nudge.
5. Run `gh workflow run garmin-activity-sync.yml -f days=3650 -f kinds=cardio
   -f dry_run=true`, read the plan, then run it for real.

## Acceptance

- [ ] The cardio Progress chart has a time frame, defaults to a window, and
      shows the year when a frame spans more than one.
- [ ] `cardio_sessions.format` exists and shows on the row; a hand-logged
      session can be marked intervals.
- [ ] A cardio backfill dry run shows the two manual running rows as
      *claimed*, not doubled; the 43 "[N4x4] Indoor Rowing" as rowing +
      intervals; EMOM / Slam/Jump, walks, the hike and the skate as skipped.
- [ ] The backfill has run; `cardio_sessions` holds the Garmin history; a dry
      re-run reports everything as already synced.
