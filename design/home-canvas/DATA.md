# Design fixture — one active user, 42-day cycle window

**Invented values, real shape.** This is the dataset the Home screen was designed
against: a single user mid-cycle, with the awkward cases the screen has to survive —
an upper/lower split that has drifted badly, stale water, no active program, and a
blood donation far enough back to matter to nothing. It was derived from a live pull
at design time; **every biometric figure here has since been replaced with an invented
one**, because a product repo holds fixtures, not people. Keep it that way when you
refresh it: change the numbers, keep the awkwardness.

## Muscles — working sets this cycle (42d), last stimulus

| Muscle | Region | Sets (42d) | Last | Days ago |
|---|---|---|---|---|
| Biceps | upper | 69 | 2026-08-21 | 6 |
| Upper Back / Traps | upper | 54 | 2026-08-21 | 6 |
| Triceps | upper | 48 | 2026-08-20 | 7 |
| Rhomboids | upper | 46 | 2026-08-21 | 6 |
| Anterior Deltoid | upper | 39 | 2026-08-20 | 7 |
| Lats | upper | 36 | 2026-08-21 | 6 |
| Chest | upper | 28 | 2026-08-20 | 7 |
| Forearms | upper | 27 | 2026-08-21 | 6 |
| Posterior Deltoid | upper | 25 | 2026-08-17 | 10 |
| Rotator Cuff | upper | 18 | 2026-08-17 | 10 |
| Lateral Deltoid | upper | 11 | 2026-08-12 | 15 |
| Calves | lower | 6 | 2026-07-28 | 30 |
| Quadriceps | lower | 3 | 2026-07-28 | 30 |
| Adductors | lower | 3 | 2026-07-28 | 30 |
| Glutes | lower | 3 | 2026-07-28 | 30 |
| Hamstrings | lower | 3 | 2026-07-28 | 30 |
| Erectors | core | 3 | 2026-07-28 | 30 |
| **Hip Flexors** | lower | **0** | never in window | — |
| **Obliques** | core | **0** | never in window | — |
| **Rectus Abdominis** | core | **0** | never in window | — |

Parent groups in the DB: Chest, Back, Arms, Shoulders (upper), Legs (lower), Core.
The honest story right now: **upper body hammered, lower body cold for a month,
core never touched.** Nothing has been trained in 6 days.

## Adaptations — sets by rep range

| Adaptation | Sets last 7d | Sets this cycle | Weekly target |
|---|---|---|---|
| Hypertrophy (6–15 reps) | 19 | 185 | 10 sets/muscle |
| Muscular Endurance (16+) | 6 | 57 | 6 sets/muscle |
| Strength (1–5) | 2 | 15 | 6 sets/muscle |
| Speed | 0 | 0 | 6 sets/muscle |
| Power | 0 | 0 | 6 sets/muscle |
| Skill | 0 | 0 | 3 sessions/wk |
| Anaerobic Capacity | 0 | 0 | 1 session/wk |
| Max Aerobic (VO2max) | 0 | 0 | 1 session/wk |
| Long-Duration Endurance | 0 | 0 | 2 sessions/wk |

Six of nine adaptations are at **zero** this cycle.

> **Model change 2026-08-29 (roadmap 019):** Speed and Skill are dropped and
> Power is muscle-linked — seven adaptations now. The table above is the raw
> 2026-08-27 pull and predates the change.

## Recovery — systemic inputs

Sleep (wearable import):
| Date | Hours | Sleep score | HRV | Resting HR |
|---|---|---|---|---|
| 2026-08-27 | 7.55 | 68 | 72 | 57 |
| 2026-08-26 | 7.83 | 77 | 74 | 56 |
| 2026-08-25 | 8.70 | 79 | 70 | 58 |

Water: last logged 2026-08-12, 700 ml. Recent daily range 700–2900 ml. Stale, 15 days.
Blood donation: full blood on 2026-02-11 — 197 days ago, well past any window.
Body weight: 77.4 kg on 2026-08-17. Trend: 74.0 (Mar) -> 75.0 -> 75.7 -> 76.7 -> 76.0 -> 76.5 -> 75.3 (Jul 28) -> 77.4. Up ~3.4 kg over 5 months.

## Cardio / sport

Cardio sessions: 2 ever, last 2026-07-05 (nothing in the cycle window).
Sports this cycle: Tennis 5 sessions, last 2026-08-11 (16 days ago), avg quality 4.2/5.
Tennis Doubles 2 sessions, last 2026-07-19, avg quality 4.0.
Mobility: 3 sessions ever, last 2026-03-23.

## Program

**No active program.** Two paused: "Volleyball Performance & Healthspan"
(started 2026-06-22) and "5-Day High Efficiency Split". This is itself an edge
case the Home screen has to handle honestly.
