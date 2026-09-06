# Roadmap: HR-based intensity classification for cardio & sport sessions

**Label:** feature
**Status:** in progress — 2026-09-06: both scout runs landed, the classifier was rewritten on them and re-run over the 277-session dump (v2.0.23). Left: bout length on intervals rows, Garmin columns on sport rows, and two calls for Peter (the watch's HRmax; fork 1 on threshold running).
**Release:** 2.1.0
**Note:** Narrowed 2026-09-02: inventory rows 3.7–3.9 (the cardio `rx` prose) move to [039](done/039-adaptations-read-grounding.md); this brief keeps the classifier thresholds (rows 6.1–6.5). [031](done/031-adaptations-drill-down-read.md) §3b defers its effort-plane read until this lands.

## Progress log

- 2026-09-05 — Committed to 2.1.0 by Peter. Kickoff = a `/ground` run on rows 6.1–6.5 plus the two unindexed rules, then the classifier.
- 2026-09-06 (day) — Data condition met: the whole Garmin history (277 sessions, all with Training Effect, 124 with HR zones) sits in the gitignored `scripts/garmin-sync/dumps/`; since 054 (v2.0.17) the 220 cardio sessions are in `cardio_sessions` with `format = 'intervals'` on the 63 HIIT ones.
- 2026-09-06 (evening) — Picked up. Two science-scout runs — A: the intensity criterion for a session with Garmin data; B: the fallback with none — landed in [grounding/005](../grounding/005-hr-zone-intensity-classification.md#grounding) after every citation passed eutils / Crossref. Classifier rewritten on them (v2.0.23), tests moved, the dump re-run (§Result). Inventory rows 6.1–6.7, ledger D33–D36.

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

## Grounding

Two blocks, verbatim, in
[docs/grounding/005-hr-zone-intensity-classification.md](../grounding/005-hr-zone-intensity-classification.md#grounding)
(the 039 precedent: the evidence stays put when this brief retires). Verdicts:

| Rule | Was | Verdict | Now |
|---|---|---|---|
| 6.1 duration ≥ 25 min → endurance | every row without Garmin data | not supported as a classifier; 25 kept as a convention floor | an endurance-credit floor for steady/unstated rows with no HR data; below it, no credit |
| 6.2 duration ≥ 8 min → VO₂max, else anaerobic | same | not supported | retired |
| 6.3 TE ≥ 2.0 = a stimulus for that system | both systems, plus "dominant always counts" | convention as an aerobic floor; not supported for anaerobic and for "dominant" | aerobic side only; anaerobic TE never awards anaerobic capacity; walks at TE 0.3–1.3 credit nothing |
| 6.4 Z4+Z5 > Z1+Z2 → VO₂max | — | not supported | ≥ 8 min in Garmin Z5 (≥ 90 % HRmax; range 5–10) → VO₂max; Z4 never decides |
| label regex (no row) | TEMPO / THRESHOLD / VO2 / … → VO₂max | partially supported | TEMPO / LACTATE_THRESHOLD = threshold, credits nothing (6.6); VO₂max-family labels a fallback only when zones are absent (6.7) |
| 6.5 sport default `vo2max` | no duration → VO₂max; timed → the duration ladder | not supported; endurance = convention | every match is endurance, timed or not |

## Decisions (2026-09-06)

- **One adaptation per session, or none.** The double count (a 4×4 as VO₂max
  *and* anaerobic capacity) is gone; `[]` is a real answer (D33).
- **Structure first.** `format = 'intervals'` is read before any Garmin number
  — the session-goal method of the training-load literature (Seiler & Kjerland
  2006; Sylta 2014). Bout length is not on the row yet, so: Z5 ≥ 8 min confirms
  VO₂max; anaerobic TE > aerobic TE is Garmin's own primary rule, kept as the
  vendor tie-break for anaerobic capacity; everything else is VO₂max (D34).
- **Fork 1 — threshold running, shipped as (a):** TEMPO / LACTATE_THRESHOLD
  credits nothing, keeping endurance = Zone 2 as 039 S9 grounded it. (b) would
  widen endurance to "continuous aerobic work below VO₂max" and re-open 039
  S9. **Peter's call**; (a) changes no grounded definition. Under (a) a
  tempo-heavy week reads "endurance missing" — that is the polarized claim,
  stated on purpose.
- **Fork 2 — a hand-logged match:** endurance, not "adaptation unknown" (which
  would erase 50 of 53 matches from the read) and not VO₂max (Z5 = 0 on every
  synced match). Singles and doubles alike until a verified doubles study
  exists (D36).
- **Typed avg HR on manual steady rows** (≤ ~83 % HRmax endurance, ≥ ~89–90 %
  VO₂max) is grounded in run B but not built: the app holds no profile HRmax.
  It belongs with the HRmax item below.

## Result — the 277-session dump, before → after

`python3 scripts/garmin-sync/analyze_dump.py <dump.json>` mirrors both rule
sets (`classify_old`, `classify`) and prints this table; sessions per
adaptation, and "before" could count one session twice.

| Type | n | endurance | VO₂max | anaerobic | none |
|---|---|---|---|---|---|
| running | 132 | 75 → 76 | 57 → 13 | 9 → 0 | 0 → 43 |
| hiit | 63 | 27 → 0 | 34 → 60 | 46 → 3 | 0 → 0 |
| cycling | 24 | 21 → 11 | 3 → 0 | 5 → 0 | 0 → 13 |
| walking | 9 | 9 → 0 | 0 | 0 | 0 → 9 |
| tennis (synced) | 3 | 1 → 3 | 2 → 0 | 3 → 0 | 0 |

The 43 uncredited runs are the 42 TEMPO / LACTATE_THRESHOLD ones (fork 1a)
plus one below the aerobic floor; the 13 uncredited rides sit at aerobic TE
< 2.0. The 3 anaerobic HIIT rows are "HIIT - Custom" and two "HIIT - EMOM" —
the vendor tie-break firing. **0 of 277 sessions reach 8 min in Z5** (HIIT
max 6.2, running max 3.4), so the Z5 rule never fires on this history — see
the HRmax item below.

## What remains

- **Bout length on intervals rows.** The grounding's own rule — ≤ 2 min
  all-out → anaerobic capacity, > 2 min → VO₂max — needs the work-bout length,
  which neither the row nor Garmin's summary carries (`lapCount` = 1 on all
  63). Until it exists the 15 "HIIT - EMOM" and 4 "[4x60] Slam/Jump" sessions
  read as VO₂max. Shape: a `cardio_sessions.bout_seconds` column, a field
  shown only when format = intervals (P1), the Garmin splits endpoint filling
  it for synced rows.
- **Garmin data on sport rows.** A migration mirroring `cardio_sessions`'
  Garmin columns, the sync writing them for `tennis_v2`, and
  `classifySportAdaptations` reading them through the same rules — the seam is
  the function's unused parameter.
- **The watch's HRmax (Peter).** A running spike recorded 214 bpm; the 4×4
  bouts peak at 185–191 yet the median Z5 share is ~2 %. Either Garmin's HRmax
  is auto-detected from that spike or set too high. Set it by hand in Garmin
  Connect; the Z5 rule and the typed-HR path both wait on it.
- **Fork 1 (Peter).** Keep (a) or widen endurance (b). If (b), one change:
  route `THRESHOLD_LABELS` rows to endurance and re-open 039 S9.
- **Strength on the watch** (`strength_training` ×43) stays unmapped: applied
  to it the TE rules invent stimulus (run A caveat).

## Out of scope

- Per-second HR time-series.
- Changing the resistance (rep-based) classification.

## Acceptance

- [x] Every rule in §Evidence grounded or retired — inventory rows 6.1–6.7, ledger D33–D36 (2026-09-06).
- [x] Classifier rewritten on the blocks: one adaptation or none per session; `format = 'intervals'` never endurance; anaerobic TE never awards anaerobic capacity; threshold credits nothing; walks credit nothing; sport = endurance. `adaptations.test.ts` and `fusedRead.test.ts` moved with it (v2.0.23).
- [x] Re-run over the 277-session dump before shipping; `analyze_dump.py` mirrors old and new (§Result).
- [ ] Bout length on intervals rows (column + P1 field + splits endpoint) and the ≤ 2 min rule wired.
- [ ] Sport rows store Garmin TE, label and zones; `classifySportAdaptations` reads them.
- [ ] Peter: the watch's HRmax verified or set; then the typed-HR path for manual steady rows (needs a profile HRmax).
- [ ] Peter: fork 1 decided and recorded here.
