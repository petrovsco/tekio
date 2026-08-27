# Roadmap: HR-based intensity classification for cardio & sport sessions

**Status:** planned

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
