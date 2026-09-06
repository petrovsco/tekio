# Roadmap: Garmin history backfill beyond sport — 157 cardio activities and 63 HIIT

**Label:** backlog
**Status:** backlog — a finding from 041's ten-year dry run, parked until Peter
says whether history before the app matters to him.

---

## 1. What this prevents, and the evidence

The Cardio tab's history and charts show three cardio sessions. Garmin holds
**157 cardio-type activities** for the same account (running, cycling,
swimming, rowing keys — 2016-09-09 to 2026-09-06, from the 041 dry run on
2026-09-06: 277 activities fetched, 120 of them unmapped, the rest cardio).
The sync has only ever run with a 7-day window, and it only started working on
2026-08-26, so everything before that is invisible to the app.

The same run left two blocks unmapped that are not sport either:

| Garmin `typeKey` | Count | Dates | What it is |
|---|---|---|---|
| `hiit` | 63 | 2023-06-26 .. 2026-01-29 | HIIT workouts — neither mono-structural cardio nor a named sport. None since January 2026. |
| `strength_training` | 43 | 2024-09-19 .. 2026-02-18 | Gym sessions recorded on the watch. Garmin's summary has no sets or reps, so there is nothing to put in `session_sets`. Stays skipped. |

None of the 120 unmapped activities falls on the same day as a hand-logged
sport row, so the claim rule from 041 has nothing to attach them to.

## 2. The case against

- **No read changes.** Home and Adaptations judge the last 14 days
  (roadmap 039 §6.6), and the cardio staleness read uses its own short
  window. Activities from 2024 change nothing on any surface that answers
  "what's missing" — the doctrine's §1 test. This is history for the list and
  the charts, which is decoration until a read wants it.
- **HIIT is a doctrine question, not a mapping.** Adding it means a new
  `cardio_sessions.activity_type` and a `CARDIO_TYPES` entry; the Training
  Effect classifier would then split each session between VO₂max and
  anaerobic capacity, which is honest (P2) — but Peter has logged no HIIT
  since January, so today it only ever fills the past.
- **Two hand-logged runs would double.** `cardio_sessions` has two manual
  running rows (2026-06-08, 2026-07-05) with no Garmin id; a cardio backfill
  inserts a second row next to each unless the claim rule from 041 is
  extended to cardio (same date + same `activity_type`).

## 3. Shape, if it goes ahead

1. Extend the claim step in `scripts/garmin-sync/sync_activities.py` to
   cardio: before upserting, claim a manual `cardio_sessions` row on the same
   date with the same `activity_type`, filling only its empty columns —
   exactly what `plan_sport` does. Cardio's "write the Garmin name to `notes`
   on every re-sync" behaviour goes at the same time; sport already never
   touches an existing row's notes.
2. Decide HIIT: either a fifth cardio type (`hiit` → `'hiit'`, with a
   `CARDIO_TYPES` label and the classifier left as is) or leave it skipped.
   Doctrine §4 checklist applies — it is an input to the cardio read, not a
   destination.
3. Run `gh workflow run garmin-activity-sync.yml -f days=3650 -f kinds=cardio
   -f dry_run=true`, read the plan, then run it for real.

## Acceptance

- [ ] A cardio backfill dry run shows the two manual running rows as
      *claimed*, not doubled.
- [ ] Peter has said yes or no to HIIT as a cardio type, and the map matches.
- [ ] The backfill has run; `cardio_sessions` holds the Garmin history; a dry
      re-run reports everything as already synced.
