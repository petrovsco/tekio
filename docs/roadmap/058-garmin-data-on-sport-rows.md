# Roadmap: Garmin data on sport rows

**Label:** feature
**Status:** in progress — picked up 2026-09-07; working the five Shape steps in order, migration first. Split out of [005](done/005-hr-zone-intensity-classification.md) on 2026-09-07 (Peter's call) so that brief could close.
**Release:** 2.1.0

## Why

A synced tennis match arrives with everything a synced cardio session does —
aerobic and anaerobic Training Effect, Garmin's primary-benefit label, max HR,
training load, seconds in each HR zone — and the sync throws all of it away:
[041](done/041-garmin-sport-activity-sync.md) stores only the duration and the
average HR. So every match, synced or hand-logged, credits endurance by
convention (`SPORT_DEFAULT_ADAPTATION`, inventory row 6.5, D36), while the
cardio classifier next to it reads the same Garmin numbers through the
grounded rules of [005](done/005-hr-zone-intensity-classification.md).

The three synced matches in the 2026-09-06 dump show what is being dropped:

| Date | Aerobic TE | Anaerobic TE | Label | Avg / max HR | Z4 min | Z5 min |
|---|---|---|---|---|---|---|
| 2026-09-04 | 3.1 | 2.5 | SPEED | 146 / 173 | 14.4 | 0 |
| 2026-09-01 | 2.7 | 2.2 | SPEED | 139 / 171 | 2.5 | 0 |
| 2025-10-05 | 2.3 | 2.0 | RECOVERY | 124 / 172 | 1.7 | 0 |

Under the cardio rules all three still read **endurance** (aerobic TE ≥ 2.0,
Z5 = 0), so no verdict moves today. What moves is honesty: the sport read
stops being a constant. A match below the aerobic floor credits nothing, a
match with 8 min in Z5 credits VO₂max, and 6.5's convention shrinks to the
hand-logged rows it was written for. Fork 2 in 005 chose endurance for a
hand-logged match *because* Z5 = 0 on every synced one — that argument only
stays checkable if the zones are stored.

## The case against

- **Small payoff now.** Three synced rows, all above the floor; the 50
  hand-logged matches stay endurance by convention either way. This is why it
  left 005 instead of holding it open.
- **A migration on the shared database.** Additive columns only — adds are
  fine, drops are release-blocked
  ([025](done/025-release-blocked-schema-drops.md)) — mirroring what
  `cardio_sessions` already has.
- **Two classifiers reading one rule set.** The cardio rules must not be
  copied into a sport twin; the shared core is extracted once and both call it.

## Shape

1. **Migration** — `sport_sessions` gains the Garmin columns `cardio_sessions`
   got in `20260713193142_cardio_garmin_activity_fields.sql` and before it:
   `max_heart_rate`, `aerobic_te`, `anaerobic_te`, `training_effect_label`,
   `training_load`, `zone_distribution` (jsonb `[z1..z5]` seconds). It already
   has `avg_heart_rate`, `source` and `garmin_activity_id` (041).
2. **Sync** — `plan_sport` in `scripts/garmin-sync/sync_activities.py` writes
   them on an inserted row and on a claimed manual row (fill-empty-only, the
   054 rule), reusing `_zones` and the `_num` mapping the cardio row builder
   uses. A one-off run backfills the three synced rows (dry → real → dry
   clean, as 054 did).
3. **App** — `SportEntry` gains the optional fields `CardioEntry` has
   (`maxHr`, `aerobicTe`, `anaerobicTe`, `trainingEffectLabel`,
   `trainingLoad`, `zoneDistribution`); `src/lib/db/sport.ts` selects and maps
   them. No form field — sport rows never type these.
4. **Classifier** — the steady-row core of `classifyCardioAdaptations` (Z5
   dose → label fallback → aerobic floor → duration floor) becomes one function
   over a shared "Garmin intensity" shape; `classifySportAdaptations` calls it
   and falls to `SPORT_DEFAULT_ADAPTATION` only when the row carries no Garmin
   data. `format` is never read on a sport row. `analyze_dump.py` mirrors it
   for `tennis_v2`; `adaptations.test.ts` gets the three matches plus a
   below-floor and a Z5 case.
5. **Inventory** — row 6.5's note ("until sport rows carry Garmin data") is
   updated. No new number, so no `/ground` run.

## Doctrine checklist

1. **Which read does this sharpen?** The cardio-adaptation bands on Home and
   Adaptations, where a match's stimulus is counted.
2. **What does it let me stop doing?** Treating a sport row as a different kind
   of thing from a cardio row; 6.5 shrinks to hand-logged rows.
3. **Input or destination?** Input — columns feeding an existing read.
4. **Honest shape of the data?** Per session, the same six Garmin numbers as
   cardio; rolled up by the same rules.
5. **Does it write a number claiming physiological meaning?** No — the rules
   and thresholds are 005's, already grounded (D33–D36); this widens their
   input. Vendor data, the `/ground` Step 0 exemption.

## Out of scope

- A typed avg HR on a hand-logged match as a share of HRmax —
  [059](059-profile-hrmax-typed-hr-path.md).
- A singles / doubles distinction (D36: alike until a verified doubles study
  exists).
- Any Garmin type other than `tennis_v2` (the sync's `SPORT_TYPE_KEYS`).

## Acceptance

- [ ] Migration applied; `supabase/migrations/` carries it.
- [ ] The sync writes the six columns for `tennis_v2` on insert and on claim (fill-empty-only); the three synced matches are backfilled.
- [ ] `SportEntry` + `db/sport.ts` read them; `classifySportAdaptations` routes through the shared core; tests cover above-floor, below-floor and Z5 cases.
- [ ] `analyze_dump.py` mirrors the sport path; the 277-session table shows the three matches still endurance.
- [ ] Inventory row 6.5's note updated; `npm run check:docs` passes.
