# Roadmap: HR-based intensity classification for cardio & sport sessions

**Label:** feature
**Status:** in progress — 2026-09-07: fork 1b shipped (v2.0.24); bout length on intervals rows landed — column, form field, the ≤ 2 min rule (v2.0.25). Left: filling the 63 synced HIIT rows' bouts (name-based backfill on Peter's go, or the Garmin typed-splits probe), Garmin columns on sport rows, the typed-HR path.
**Release:** 2.1.0
**Note:** Narrowed 2026-09-02: inventory rows 3.7–3.9 (the cardio `rx` prose) move to [039](done/039-adaptations-read-grounding.md); this brief keeps the classifier thresholds (rows 6.1–6.5). [031](done/031-adaptations-drill-down-read.md) §3b defers its effort-plane read until this lands.

## Progress log

- 2026-09-05 — Committed to 2.1.0 by Peter. Kickoff = a `/ground` run on rows 6.1–6.5 plus the two unindexed rules, then the classifier.
- 2026-09-06 (day) — Data condition met: the whole Garmin history (277 sessions, all with Training Effect, 124 with HR zones) sits in the gitignored `scripts/garmin-sync/dumps/`; since 054 (v2.0.17) the 220 cardio sessions are in `cardio_sessions` with `format = 'intervals'` on the 63 HIIT ones.
- 2026-09-06 (evening) — Picked up. Two science-scout runs — A: the intensity criterion for a session with Garmin data; B: the fallback with none — landed in [grounding/005](../grounding/005-hr-zone-intensity-classification.md#grounding) after every citation passed eutils / Crossref. Classifier rewritten on them (v2.0.23), tests moved, the dump re-run (§Result). Inventory rows 6.1–6.7, ledger D33–D36.
- 2026-09-07 — Fork 1 → **(b)** on Peter's call: tempo / lactate-threshold runs credit endurance (`THRESHOLD_LABELS` deleted, row 6.6 retired, D34 amended, 039 S9 carries a boundary note; 42 runs and 3 rides regain credit, §Result). HRmax: Peter sets the watch to 185 (220 − 35) and lets Garmin's auto-detect follow (v2.0.24). Next: bout length.
- 2026-09-07 (later) — Bout length: `cardio_sessions.bout_seconds` (migration applied), `CardioEntry.boutSeconds`, a Bout (MM:SS) field in the log form and the edit modal shown only when format = intervals (P1), `ANAEROBIC_BOUT_MAX_S = 120` decides first on an intervals row (inventory 6.8, D34). `analyze_dump.py` projects the name-based backfill: 43 `[N4x4]` → VO₂max, 19 EMOM / `[4x60]` → anaerobic (v2.0.25).

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
| label regex (no row) | TEMPO / THRESHOLD / VO2 / … → VO₂max | partially supported | TEMPO / LACTATE_THRESHOLD fall to the aerobic floor and credit endurance (fork 1b, 2026-09-07; 6.6 retired after one day as "credits nothing"); VO₂max-family labels a fallback only when zones are absent (6.7) |
| 6.5 sport default `vo2max` | no duration → VO₂max; timed → the duration ladder | not supported; endurance = convention | every match is endurance, timed or not |

## Decisions (2026-09-06)

- **One adaptation per session, or none.** The double count (a 4×4 as VO₂max
  *and* anaerobic capacity) is gone; `[]` is a real answer (D33).
- **Structure first.** `format = 'intervals'` is read before any Garmin number
  — the session-goal method of the training-load literature (Seiler & Kjerland
  2006; Sylta 2014). Bout length is not on the row yet, so: Z5 ≥ 8 min confirms
  VO₂max; anaerobic TE > aerobic TE is Garmin's own primary rule, kept as the
  vendor tie-break for anaerobic capacity; everything else is VO₂max (D34).
- **Fork 1 — threshold running, decided (b) on 2026-09-07 (Peter).** Shipped
  as (a) for one day: TEMPO / LACTATE_THRESHOLD credited nothing, keeping
  endurance = Zone 2. Peter's two arguments carried: the classifier says what a
  session *trained*, not whether it was the polarized way to train it — a
  tempo run raises sustainable pace, which is the endurance adaptation by a
  harder route than Zone 2 — and under (a) a third of the running history sat
  in an uncounted eighth bucket the read could not see, which is the bigger
  honesty failure. Galpin's long-duration category is cut by structure, not by
  HR zone. 039 S9's Zone 2 *prescription* stands as the default shape of an
  endurance session, not the boundary of what counts as one; S9 carries a
  boundary note saying so.
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
| running | 132 | 75 → 118 | 57 → 13 | 9 → 0 | 0 → 1 |
| hiit | 63 | 27 → 0 | 34 → 60 | 46 → 3 | 0 → 0 |
| cycling | 24 | 21 → 14 | 3 → 0 | 5 → 0 | 0 → 10 |
| walking | 9 | 9 → 0 | 0 | 0 | 0 → 9 |
| tennis (synced) | 3 | 1 → 3 | 2 → 0 | 3 → 0 | 0 |

The one uncredited run and the 10 uncredited rides sit below the aerobic
floor (TE < 2.0). Under fork 1a — 2026-09-06, one day — the 42 TEMPO /
LACTATE_THRESHOLD runs and 3 such rides credited nothing too; (b) returned
them to endurance. The 3 anaerobic HIIT rows are "HIIT - Custom" and two "HIIT - EMOM" —
the vendor tie-break firing. With `bout_seconds` filled from the session names
(§What remains) the 63 HIIT rows would read 43 VO₂max + 20 anaerobic (19 named
+ the Custom tie-break) instead of 60 + 3. **0 of 277 sessions reach 8 min in Z5** (HIIT
max 6.2, running max 3.4), so the Z5 rule never fires on this history — see
the HRmax item below.

## What remains

- **Bout length on synced rows.** The column, the field and the rule exist
  (v2.0.25), but every synced row has `bout_seconds = NULL`, so the 63 HIIT
  rows still classify by the Z5 dose and the TE tie-break (60 VO₂max, 3
  anaerobic) and the 15 "HIIT - EMOM" and 4 "[4x60] Slam/Jump" sessions read
  as VO₂max. Two ways to fill them:
  1. *Name-based backfill.* Peter names his sessions with the protocol, and the
     sync puts the Garmin name in `notes`: `[N4x4]` = 240 s, `[4x60]` = 60 s,
     "HIIT - EMOM" = a 60-s round. Projected read: 43 → VO₂max (unchanged),
     19 → anaerobic capacity; "HIIT - Custom" stays on the tie-break.
     Reversible with `set bout_seconds = null`. **Peter's go** — the grounding
     ranks a name-inferred bout below a measured one. Preview, then apply:
     ```sql
     select notes, count(*) from cardio_sessions
       where source = 'garmin' and format = 'intervals' and bout_seconds is null
       group by notes order by 2 desc;
     update cardio_sessions set bout_seconds = 240
       where source = 'garmin' and format = 'intervals' and bout_seconds is null and notes like '%[N4x4]%';
     update cardio_sessions set bout_seconds = 60
       where source = 'garmin' and format = 'intervals' and bout_seconds is null
         and (notes like '%[4x60]%' or notes ilike '%EMOM%');
     ```
  2. *Garmin typed splits.* `lapCount` = 1 on all 63, so the plain laps
     endpoint carries nothing; Garmin's HIIT timers (EMOM / AMRAP / custom)
     store rounds as *typed splits* (`INTERVAL_ACTIVE` / `INTERVAL_REST`).
     Probe one EMOM activity through the workflow's dump mode before building
     the fill — a second call per activity, intervals rows only.
- **Garmin data on sport rows.** A migration mirroring `cardio_sessions`'
  Garmin columns, the sync writing them for `tennis_v2`, and
  `classifySportAdaptations` reading them through the same rules — the seam is
  the function's unused parameter.
- **The typed-HR path for manual steady rows.** Grounded in run B (≤ ~83 %
  HRmax endurance, ≥ ~89–90 % VO₂max) but the app holds no profile HRmax. The
  watch's HRmax is settled — Peter sets it to 185 (220 − 35, 2026-09-07) and
  lets Garmin's auto-detect raise it; a running spike of 214 had likely set it
  too high, which is why 0 of 277 sessions reached 8 min in Z5. An in-app
  HRmax is a number with physiological meaning, so it needs a `/ground` run
  (220 − age vs Tanaka 2001 vs the observed peak) before the path is built.
- **Strength on the watch** (`strength_training` ×43) stays unmapped: applied
  to it the TE rules invent stimulus (run A caveat).

## Out of scope

- Per-second HR time-series.
- Changing the resistance (rep-based) classification.

## Acceptance

- [x] Every rule in §Evidence grounded or retired — inventory rows 6.1–6.7, ledger D33–D36 (2026-09-06).
- [x] Classifier rewritten on the blocks: one adaptation or none per session; `format = 'intervals'` never endurance; anaerobic TE never awards anaerobic capacity; threshold credits nothing; walks credit nothing; sport = endurance. `adaptations.test.ts` and `fusedRead.test.ts` moved with it (v2.0.23).
- [x] Re-run over the 277-session dump before shipping; `analyze_dump.py` mirrors old and new (§Result).
- [x] Bout length on intervals rows: `bout_seconds` column, a Bout (MM:SS) field shown only when format = intervals, `ANAEROBIC_BOUT_MAX_S = 120` decides first on an intervals row (v2.0.25, 2026-09-07).
- [ ] The 63 synced HIIT rows carry a bout — name-based backfill on Peter's go, or the typed-splits fill.
- [ ] Garmin typed-splits probe: does one EMOM activity return its rounds?
- [ ] Sport rows store Garmin TE, label and zones; `classifySportAdaptations` reads them.
- [x] Peter: the watch's HRmax set — 185 (220 − 35), Garmin's auto-detect follows (2026-09-07).
- [ ] The typed-HR path for manual steady rows (needs a grounded profile HRmax).
- [x] Peter: fork 1 decided and recorded here — (b), 2026-09-07; shipped in v2.0.24.
