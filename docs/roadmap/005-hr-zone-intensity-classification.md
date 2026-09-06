# Roadmap: HR-based intensity classification for cardio & sport sessions

**Label:** feature
**Status:** planned — committed to 2.1.0 by Peter on 2026-09-05; the kickoff is a `/ground` run on the classifier's rules (inventory rows 6.1–6.5 plus the two unindexed ones in §Evidence), then the classifier itself. The data condition is met since 2026-09-06: the whole Garmin history (277 sessions, every one with Training Effect, 124 with HR zones) sits in the gitignored `scripts/garmin-sync/dumps/` and shows where the current rules misread.
**Release:** 2.1.0
**Note:** Narrowed 2026-09-02: inventory rows 3.7–3.9 (the cardio `rx` prose) move to [039](done/039-adaptations-read-grounding.md); this brief keeps the classifier thresholds (rows 6.1–6.5). [031](done/031-adaptations-drill-down-read.md) §3b defers its effort-plane read until this lands.

## Goal

Classify cardio and sport sessions into the correct cardio adaptation
(Endurance / VO₂max / Anaerobic) from what the session actually was — its
intensity and structure — not from its length alone, and ground every rule
that does so.

## Context

Two classifiers live in [src/lib/adaptations.ts](../../src/lib/adaptations.ts)
today:

- **Garmin cardio rows** (`aerobic_te` / `anaerobic_te` present) go through
  `classifyCardioAdaptations`: the dominant system always counts, plus any
  system whose Training Effect is ≥ 2.0 (`TE_STIMULUS_THRESHOLD`, row 6.3);
  the aerobic side lands on VO₂max when Garmin's `trainingEffectLabel`
  matches `TEMPO|THRESHOLD|VO2|ANAEROBIC|SPRINT|SPEED`, on endurance when it
  matches `RECOVERY|BASE`, and otherwise by HR-zone share (Z4+Z5 vs Z1+Z2,
  row 6.4).
- **Manual cardio rows and every sport row** go through
  `classifyCardioByDuration`: `≥25 min → endurance, ≥8 min → VO₂max, else
  anaerobic` (rows 6.1, 6.2); a sport row with no duration is VO₂max (6.5).

Neither set of rules has been grounded, and the 2026-09-06 history dump
(below) shows both misreading the user's own sessions.

## Evidence — the Garmin history against the current rules (2026-09-06)

Source: `scripts/garmin-sync/dumps/garmin-activities-2026-09-06.json` (the
workflow's `dump` artifact; personal data, gitignored) read with
`scripts/garmin-sync/analyze_dump.py`, which mirrors the classifier in Python
and prints, per activity type, what the rules would count. 277 activities,
2023-05-13 to 2026-09-06, all with Training Effect; HR zones on 124 (26 % of
runs, 25 % of rides, 57 % of HIIT).

| Sessions | What the current rules say | Why that is not the honest read |
|---|---|---|
| **43 × "[N4x4] Indoor Rowing"** on the HIIT profile | 11 read as *endurance* — Garmin's whole-session label is `AEROBIC_BASE` or `RECOVERY` (avg HR ≈ 140 over 4-min intervals plus rests) | A Norwegian 4×4 is the app's own VO₂max protocol (D23). The label summarises the whole session and flattens the intervals. |
| 45 of the 63 HIIT sessions | count as *anaerobic capacity* too, via anaerobic TE ≥ 2.0 (6.3) | The app's anaerobic grounding (3.7) needs all-out 20 s–2 min efforts; a 4-min interval at ~90 % is not that. The 2.0 line double-counts the 4×4 as two adaptations. |
| Running: 33 `TEMPO` + 9 `LACTATE_THRESHOLD` of 132 | read as *VO₂max* via the label regex | Threshold running is neither easy endurance nor even-max intervals. The regex is a rule with no inventory row. |
| Walking ×9, aerobic TE 0.3–1.3 | read as full *endurance* sessions — "the dominant system always counts" | A 30-min walk at HR 102 is not an endurance stimulus. A second rule with no inventory row. |
| Strength on the watch ×43 (`strength_training`) | label `ANAEROBIC_CAPACITY` ×38, aerobic TE ≥ 2.0 in 38 → the rules would call 37 of them *VO₂max* | Never mapped (054), but it shows the TE rules are only meaningful for steady cardio; applied to anything else they invent stimulus. |
| Every sport row (tennis ×3 synced, 50 by hand) | duration path: a 46-min match is an *endurance* session | Garmin's tennis summaries carry TE (2.7 / 2.2, `SPEED`) and zones that 041 did not store. |
| HIIT structure | `lapCount` = 1 on all 63 | The interval structure is not in the activity summary; it needs Garmin's splits endpoint (a second call per activity). |

What Garmin's summary does give, on every session: `aerobicTrainingEffect`,
`anaerobicTrainingEffect`, `trainingEffectLabel`, `averageHR`, `maxHR`,
`activityTrainingLoad`; on about half: `hrTimeInZone_1..5`, `vO2MaxValue`.

**Questions for the `/ground` run:**

1. What do Garmin's (Firstbeat's) aerobic and anaerobic Training Effect
   measure, and can the aerobic value separate endurance from VO₂max work at
   all? (6.3, and the label regex)
2. Which HR-zone share marks a session as VO₂max rather than base, and does
   it hold for interval sessions where the average hides the work? (6.4)
3. The duration cut-offs 25 / 8 min (6.1, 6.2) against the grounded
   protocols: a 4×4 is ~30 min including rests, an anaerobic 4–8 × 20 s–2 min
   session is 10–20 min — the cut-offs may be inverted for interval work.
4. Is "VO₂max" the honest default for an intermittent sport with no data (6.5)?

## Scope

- Ground the rules above; replace or delete each with a sourced one. Every
  change is re-run over the 277-session dump before it ships, so the
  classifier is judged on the user's history, not on a test fixture.
- Store Garmin's TE, label and zones on sport rows too (a migration mirroring
  `cardio_sessions`' Garmin columns) so a synced tennis match is classified
  the same way as a synced run.
- Manual rows: keep a fallback for sessions with no Garmin data — avg HR as a
  fraction of an HRmax from the profile, or duration as today — and say which.
- Read `cardio_sessions.format` (054 adds it: `'steady' | 'intervals'`,
  Peter's 2026-09-06 decision that HIIT is a format of a modality, not a
  type). A session flagged *intervals* is never endurance, whatever Garmin's
  whole-session label says; whether it is VO₂max or anaerobic is the
  grounding's call, from TE and zones or from lap structure via the splits
  endpoint.
- Update `classifyCardio` / the sport loop and the `adaptations.test.ts` cases.

## Out of scope

- Per-second HR time-series.
- Changing the resistance (rep-based) classification.

## First step

Run `/ground` on the four questions with the evidence table as the trigger;
`analyze_dump.py` is the check for every rule the run changes.
