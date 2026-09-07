# Roadmap: Threshold sessions are labelled, not bucketed

**Label:** feature
**Status:** done — shipped 2026-09-07 (v2.0.36): A + B together, since 059/060 had already landed the HRmax the typed path divides by. The chip is on the session rows and the count is under the endurance band.

## Why

Fork 1b in [005](005-hr-zone-intensity-classification.md) (2026-09-07) made
tempo and lactate-threshold sessions credit **endurance**, because that is the
adaptation they train. The price is that the endurance band on Home and
Adaptations now reads the same for a week of three easy runs and a week of
three tempo runs. The read has lost a fact it used to encode by accident —
under fork 1a those sessions credited nothing, so a tempo-heavy week showed
"endurance missing". That was the wrong fix (an uncounted eighth bucket), but
the fact itself is worth keeping visible: **which of my endurance sessions
pushed the threshold.**

Evidence from the Garmin history (2026-09-06 dump, 277 sessions): 42 of 132
runs, 3 of 24 rides and 13 of 63 HIIT sessions carry Garmin's `TEMPO` or
`LACTATE_THRESHOLD` primary-benefit label. Synced rows are already half-way
there — the Cardio session list prints the label lowercased in the meta line
("Recovery · aerobic 2.4 · anaerobic 0") — but nothing rolls it up, and a
hand-logged row has no threshold signal at all.

## The case against

- **R1 / the seven adaptations.** A threshold label must stay a *label*. The
  moment it gets its own band, count or target it is the eighth bucket fork 1b
  argued against, wearing a different costume. It rolls up *inside* the
  endurance band or not at all.
- **Capture is overhead.** A new field on the cardio form costs every manual
  session a tap. The honest signal for a manual row is avg HR as a share of a
  profile HRmax (run B of 005's grounding: 84–88 % HRmax = "endurance, flagged
  threshold"), and the app holds no HRmax yet — that is 005's typed-HR path.
- **A programming opinion by another route.** "Two threshold sessions this
  week" is a fact; "too many" is Seiler's polarized prescription. The label
  reports, it does not judge.

## Shape — three options, Peter picks

- **A. Synced rows only, zero capture.** A `Threshold` micro-label on session
  rows whose Garmin label is `TEMPO` or `LACTATE_THRESHOLD`, next to
  Intervals / Steady; the endurance band on Adaptations gains a sub-line,
  e.g. "3/4 sessions · 2 at threshold". No new column, no new claim (Garmin's
  own label — the vendor exemption in `/ground` Step 0). The recommended
  first step.
- **B. Manual rows via typed avg HR.** Once a grounded profile HRmax exists
  (005's typed-HR path), a hand-logged steady row at 84–88 % HRmax gets the
  same label. Rides on 005; no separate field.
- **C. An explicit intensity field on capture** (easy / threshold / hard).
  Most capture overhead; only if A + B leave manual rows dark for too long.

## Doctrine checklist

1. **Which read does this sharpen?** The Cardio session list and the endurance
   band on Adaptations — the effort-plane read [031](031-adaptations-drill-down-read.md) §3b
   deferred until 005 landed.
2. **What does it let me stop doing?** The lowercased Garmin label in the row's
   meta line can become the one word, so the row says less, not more.
3. **Input or destination?** An annotation on an existing read. Never a band.
4. **Honest shape of the data?** Per session, yes/no; rolled up as a count
   inside the endurance band.
5. **Does it write a number claiming physiological meaning?** A: no — Garmin's
   label, vendor exemption. B: the 84–88 % band is grounded in 005 run B but
   needs a grounded HRmax first — `/ground` before B ships.

## Out of scope

- A threshold *target* or a threshold *adaptation*. Seven stays seven.
- Changing what threshold sessions credit (fork 1b stands).

## What shipped — 2026-09-07 (v2.0.36)

Peter picked **A + B together**, and B cost a few lines rather than a brief of
its own: 059 had already built the 84–88 % band and its comment pointed here.
C (an intensity picker on the cardio form) stays out.

- **One predicate, two paths** — `isThresholdCardio` in
  `src/lib/adaptations.ts`: Garmin's word when the row carries one (`TEMPO` /
  `LACTATE_THRESHOLD`), otherwise a typed average HR in `typedHrBand`'s
  `'threshold'` band. The typed path skips an `intervals` row — the average of
  a 4×4 is meaningless — while Garmin's word stands on any row it appears on,
  the HIIT sessions included. `isThresholdSport` is Garmin's word only: a
  match's average HR is the average of an intermittent effort (059 decision 4),
  so a hand-logged match is never flagged.
- **The row** — a `Threshold` micro-label beside Intervals / Steady, and on a
  flagged row Garmin's word leaves the small grey line, so the row says less,
  not more (checklist item 2). Every other row keeps its word — VO₂max,
  Recovery, Aerobic Base still say something the chip does not.
- **The rollup** — `thresholdEnduranceCount` counts only sessions that *credit*
  endurance, so a HIIT row Garmin called `TEMPO` (VO₂max by its work bout) is
  not in it. It prints as a second small line under the endurance band of the
  effort spectrum; the line above it is already full at that width.
- **No new number, so no `/ground` run.** Garmin's two words are the vendor's
  own label (Step 0 exemption) and the band edges are 059's grounded constants
  (`HR_ENDURANCE_MAX_PCT`, `HR_VO2MAX_MIN_PCT`). Nothing here claims anything
  the app did not already claim.

Verified in the browser against the real history: 58 of 273 session rows carry
the chip, and none of them still prints Garmin's word. The 14-day endurance
band reads "3/4 sessions · 3 d ago" over "0 at threshold" — those three were
two tennis matches and a recovery run, so zero is the right answer.

## Acceptance

- [x] Peter picks the shape (A first, then B, C only if needed). — A + B, 2026-09-07.
- [x] Synced threshold rows carry a visible label in the session list.
- [x] The endurance band shows how many of its sessions were at threshold.
- [x] Manual rows: B built, or explicitly left dark with the reason here. — B built; a manual steady row with a typed avg HR at 84–88 % of the profile HRmax is flagged.
