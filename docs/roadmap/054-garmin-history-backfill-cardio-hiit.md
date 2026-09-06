# Roadmap: Garmin history backfill beyond sport — 157 cardio activities and 63 HIIT

**Label:** backlog
**Status:** backlog — a finding from 041's ten-year dry run, parked until Peter
says whether history before the app matters to him.

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

## 2. The case against

- **No read changes.** Home and Adaptations judge the last 14 days
  (roadmap 039 §6.6), and the cardio staleness read uses its own short
  window. Activities from 2024 change nothing on any surface that answers
  "what's missing" — the doctrine's §1 test. This is history for the list and
  the charts, which is decoration until a read wants it.
- **HIIT is a classifier question, not a mapping.** Adding it means a new
  `cardio_sessions.activity_type` and a `CARDIO_TYPES` entry — cheap. But the
  current Training Effect rules misread these exact sessions: 11 of the 43
  4×4 rowing sessions would count as *endurance* (Garmin's whole-session
  label says `AEROBIC_BASE`) and 45 of 63 would count as *anaerobic capacity*
  as well (anaerobic TE ≥ 2.0), though a 4-min interval is not the all-out
  effort the app's anaerobic grounding requires. Those rules are brief 005's
  to ground; bringing HIIT in before that fills the past with wrong reads.
  And Peter has logged no HIIT since January, so today it only ever fills
  the past anyway.
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
   `CARDIO_TYPES` label such as "Intervals", the Garmin name kept in `notes`
   so "[N4x4] Indoor Rowing" stays visible) or leave it skipped. Doctrine §4
   checklist applies — it is an input to the cardio read, not a destination.
   Do it after 005 grounds the rules that read it, or accept the misreads
   above in the meantime.
3. Run `gh workflow run garmin-activity-sync.yml -f days=3650 -f kinds=cardio
   -f dry_run=true`, read the plan, then run it for real.

## Acceptance

- [ ] A cardio backfill dry run shows the two manual running rows as
      *claimed*, not doubled.
- [ ] Peter has said yes or no to HIIT as a cardio type, and the map matches.
- [ ] The backfill has run; `cardio_sessions` holds the Garmin history; a dry
      re-run reports everything as already synced.
