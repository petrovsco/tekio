# Roadmap: HR-based intensity classification for cardio & sport sessions

**Label:** feature
**Status:** planned — committed to 2.1.0 by Peter on 2026-09-05 as a grounding candidate: the kickoff is a `/ground` run on the classifier thresholds (inventory rows 6.1–6.5), then the HR-aware classifier. The data condition still holds — avg HR must actually arrive in `cardio_sessions` (as of 2026-09-02, 1 of 3 logged sessions carried HR zones and Training Effect), and 041's sport sync widens that supply.
**Release:** 2.1.0
**Note:** Narrowed 2026-09-02: inventory rows 3.7–3.9 (the cardio `rx` prose) move to [039](done/039-adaptations-read-grounding.md); this brief keeps the classifier thresholds (rows 6.1–6.5). [031](done/031-adaptations-drill-down-read.md) §3b defers its effort-plane read until this lands.

## Goal

Use average heart rate — not just duration — to classify cardio and sport
sessions into the correct cardio adaptation (Endurance / VO₂max / Anaerobic).

## Context

Both cardio sessions and (as of July 2026) sport sessions capture an optional
**avg HR** field. But classification is still duration-only, via
`classifyCardioByDuration` in [src/lib/adaptations.ts](../../src/lib/adaptations.ts):
`≥25 min → endurance, ≥8 min → VO₂max, else anaerobic`.

Duration is a weak proxy: a 30-minute hard interval session is tagged "endurance"
just for being long, and a short easy jog is tagged "anaerobic". Now that avg HR
is available, intensity can be read directly.

## Scope

- Add an optional `maxHr` (or age → estimated HRmax) to the user profile so avg HR
  can be expressed as a % of max / HR zone.
- When avg HR is present, classify by HR zone (e.g. Z2 → endurance, Z4–5 →
  VO₂max, near-max short efforts → anaerobic); fall back to duration when HR is
  absent. Apply to **both** `CardioEntry` and `SportEntry` so the two stay
  consistent.
- Update `classifyCardio` / the sport loop and the `adaptations.test.ts` cases.

## Out of scope

- Per-session HR time-series / zone distribution (only avg HR is stored).
- Changing the resistance (rep-based) classification.

## First step

Add HRmax to the profile + a `hrZone(avgHr, maxHr)` helper, then branch
`classifyCardioByDuration` into an HR-aware classifier with duration fallback.
