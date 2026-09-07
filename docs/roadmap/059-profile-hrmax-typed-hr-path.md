# Roadmap: Profile HRmax and the typed-HR path

**Label:** feature
**Status:** planned — split out of [005](done/005-hr-zone-intensity-classification.md) on 2026-09-07 (Peter's call). Step 1 is a `/ground` run on the HRmax itself; nothing is built before it. Note the population below: today the path would fire on no row.
**Release:** 2.1.0

## Why

005's grounding (run B) settled how a hand-logged steady session with a typed
average HR should be read: as a share of HRmax — ≤ ~83 % endurance, 84–88 %
endurance flagged threshold, ≥ ~89–90 % VO₂max — before duration is consulted
at all. The rule is grounded and unbuilt for one reason: **the app holds no
HRmax.** `user_profiles` carries a display name, units, a progression model,
a timezone, the week start and the tracked muscle groups, and nothing about
the heart. Without the denominator a typed 150 bpm means nothing, so such a
row falls straight to the 25-min floor (row 6.1) and its HR is ignored.

The honest count, 2026-09-07: **the path serves no row yet.** All 220
`cardio_sessions` rows are Garmin-sourced with Training Effect, and no
`sport_sessions` row carries a typed HR without a Garmin id — since the
history backfill ([054](done/054-garmin-history-backfill-cardio-hiit.md)) and
the same-date claim, every session the user logs is the watch's. The path matters
for the day the watch is not worn, and for what the HRmax unlocks elsewhere:

- [057](057-threshold-sessions-labelled.md) shape B — the threshold label on a
  hand-logged row needs the 84–88 % band, so it needs this number.
- The Zone-2 gate 005's grounding called "the sturdier gate when HRmax is
  known" for rides and walks sitting on the aerobic TE 2.0 line (cycling's
  median TE is exactly 2.0) — a synced-row use, so the denominator is not only
  a manual-row concern.
- Every % figure in the grounding's translation of the synced matches ("72–85 %
  of the match's own peak") stays provisional until the app knows the HRmax
  the watch uses.

## The case against

- **Capture.** One number, typed once on the Profile tab — the cheapest
  capture the app has, but capture all the same. A birth year plus a formula
  would be cheaper still and less honest; the scout decides which the app
  stores.
- **It is a number with physiological meaning.** 220 − age (Peter set the
  watch to 185 = 220 − 35 on 2026-09-07) is the formula the literature has
  spent two decades replacing (Tanaka 2001 and its successors are the scout's
  first stop), and a running spike of 214 had earlier set the watch too high,
  which is why no session in the history reached 8 min in Z5. So `/ground`
  first: which HRmax does the app hold — a formula, the watch's own
  auto-detected value, or the observed peak over a window — and how often is
  it refreshed?
- **Consistency with the watch.** Garmin's zones (row 6.4's Z5 dose) are
  computed from the watch's HRmax. If the app holds a different number, a
  synced row's Z5 minutes and a typed row's % HRmax sit on two scales. The
  simplest honest answer may be to sync the watch's value.
- **Zero rows today.** See above. If 2.1.0 gets crowded this is the brief to
  move to backlog; what revives it is a manual row with a typed HR, or 057
  picking shape B.

## Shape

1. **`/ground`** — one science-scout run: the HRmax the app should hold
   (formula vs device auto-detect vs observed peak), its error band, and the
   refresh rule. Lands as a `## Grounding` block here and a source comment on
   the constant or column.
2. **Profile** — `user_profiles.hr_max` (or what the scout picked), a field on
   the Profile tab, the store carrying it to the classifier.
3. **Classifier** — on a steady or unstated row with no Training Effect and a
   typed `avgHr`, the % HRmax bands decide before the duration floor (run B's
   order: `format` → typed HR → duration). Two new inventory rows (the 83 %
   and the 89–90 % cuts) with a ledger entry; the 84–88 % band is a label, not
   a bucket, and belongs to 057 B.
4. **Sport rows** — the same rule on a hand-logged match with a typed HR,
   remembering the grounding's caveat that HR over-reads tennis by about a
   zone (Ferrauti 2001); the scout says whether the bands shift for sport.
5. Tests at each band edge. `analyze_dump.py` needs nothing — no synced row
   takes this path.

## Doctrine checklist

1. **Which read does this sharpen?** The cardio-adaptation bands on Home and
   Adaptations, for the rows the watch did not record.
2. **What does it let me stop doing?** Ignoring a typed HR; the duration floor
   stops being the only rule for a manual row.
3. **Input or destination?** Input — one profile number and one rule.
4. **Honest shape of the data?** One number per user, refreshed rarely; per
   session, a share of it.
5. **Does it write a number claiming physiological meaning?** Yes, twice — the
   HRmax and the % cuts. `/ground` before any code: the cuts are grounded in
   005 run B, the HRmax is not.

## Out of scope

- Reading the typed HR on `intervals` rows — the average is meaningless there
  (a 4×4 averages ~140 bpm); `format` wins.
- Changing Garmin's zones or re-deriving Z5 minutes from the app's HRmax.

## Acceptance

- [ ] `/ground` run on the profile HRmax landed here as `## Grounding`; the choice (formula / device / observed) recorded with its band.
- [ ] The profile holds the number; the Profile tab captures it.
- [ ] The typed-HR bands decide steady manual rows before the duration floor; inventory rows and a ledger entry; tests at the edges.
- [ ] Hand-logged sport rows with a typed HR use the same rule or the scout's sport variant.
- [ ] `npm run check:docs` passes.
