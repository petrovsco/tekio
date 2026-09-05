# Roadmap: Garmin sync for sport activities (tennis, padel, …)

**Label:** feature
**Status:** planned — kickoff-ready. Decided 2026-09-02 after a user question
about a missing tennis session surfaced that Garmin sync only ever covered
mono-structural cardio. Committed to 2.1.0 by Peter on 2026-09-05.
**Release:** 2.1.0

---

## 1. What triggered this

The Garmin activity sync (`scripts/garmin-sync/sync_activities.py`) only maps
four `typeKey`s — cycling / running / swimming / rowing — into
`cardio_sessions`. Everything else, tennis included, is silently skipped by
design (`CARDIO_TYPE_KEYS`, line 36; docstring line 5: *"sports (tennis, etc.)
and strength stay manual"*). A logged tennis match on Garmin never appears in
Tekiō until typed in by hand via Cardio tab → Sport mode
(`SportLogForm.tsx` → `sport_sessions`).

This is not the "Sports → Cardio DB merge" referenced (but never written up)
in [doctrine.md](../doctrine.md)'s ledger and in
[014](done/014-doctrine-ledger-execution.md),
[009](done/009-feature-grounding.md), [018](done/018-home-design-canvas.md#out-of-scope),
[028](done/028-cardio-tab-signal-restyle.md#out-of-scope) — that item is about unifying
`sport_sessions` and `cardio_sessions` into one table. This brief keeps them
separate and just teaches the *sync* to also write into `sport_sessions`.
Whoever eventually does the DB merge should read both.

## 2. Brief checklist (doctrine §4)

1. **Which read does this sharpen?** No new surface — Cardio tab's existing
   Sport capture mode. Auto-fills a row instead of a blank form.
2. **What does it let me stop doing?** Typing duration + avg HR by hand for any
   sport session Garmin already recorded. Quality rating, competitor/teammate
   names, and result stay manual — Garmin has no way to know those.
3. **Is this an input or a destination?** Input. `sport_sessions` already
   exists; this feeds it a second way.
4. **What's the honest shape of the data?** Per-session, same shape as a
   manually-logged row — no rollup, no new visualization.
5. **Does it write a number claiming physiological meaning?** No. Duration and
   average HR are raw recorded facts, not a derived coefficient or threshold —
   same category as the (ungrounded) fields the cardio sync already writes.
   No `## Grounding` section needed.

## 3. What's already there to copy

`sync_activities.py` / `cardio_sessions` did this once already — mirror the
pattern:

- `cardio_sessions.source` (`'manual' | 'garmin'`), `garmin_activity_id`, and a
  `UNIQUE (user_id, garmin_activity_id)` upsert key —
  [`20260713193142_cardio_garmin_activity_fields.sql`](../../supabase/migrations/20260713193142_cardio_garmin_activity_fields.sql).
- `SessionList.tsx:61` renders a `Garmin` `MicroLabel` badge when
  `source === 'garmin'` — the "Running · GARMIN" chip already shipped.
- `EditModal` already handles editing any entry type generically, so a
  Garmin-sourced sport row is editable the same way a Garmin cardio row is.

## 4. What this brief needs to add

**Migration** (new file, mirrors the cardio one) on `sport_sessions`:
- `source text NOT NULL DEFAULT 'manual'` + CHECK (`'manual' | 'garmin'`)
- `garmin_activity_id bigint`
- `UNIQUE (user_id, garmin_activity_id)` (NULLs distinct, so existing manual
  rows never collide)
- `quality` is already nullable (`saveSportEntry` writes `entry.quality ||
  null`) — a synced row lands with `quality: null` and shows as needing input,
  the same way an incomplete manual entry does today.

**`sync_activities.py`** (or a sibling `sync_sport_activities.py` — pick one
during implementation, whichever keeps the token/auth/upsert plumbing
DRY-est):
- A second `typeKey` map, e.g. `SPORT_TYPE_KEYS = {"tennis": "Tennis", "padel":
  "Padel", ...}` — check Garmin's actual `typeKey` values for the sports
  Peter actually plays before hard-coding names (confirm against a real
  synced activity, don't guess the full Garmin taxonomy).
- For a matched sport activity: resolve/create the `sport_types` row (mirrors
  `getOrCreateSportType` in `src/lib/db/sport.ts`, but from Python against
  the REST API — check for a row by `name`, insert with
  `has_competitor: false, has_teammate: false` if missing), then upsert into
  `sport_sessions`: `session_date`, `duration_minutes`, `avg_heart_rate`,
  `notes` (Garmin activity name), `source: 'garmin'`, `garmin_activity_id`.
  Leave `quality`, `competitor_names`, `result`, `teammate_names`, `with_trainer`
  unset.
- Same idempotent-upsert-on-`(user_id, garmin_activity_id)` pattern as
  `cardio_sessions` — re-running must not duplicate or clobber a quality
  rating the user already filled in (the "never null-out a column Garmin
  didn't provide" comment in `extract_row` already protects this; keep it).

**Frontend** — likely close to free:
- `SessionList.tsx` already renders the `Garmin` badge off `source` for
  cardio; check whether the shared list component (or `SportLogForm`'s own
  history rendering) needs the same `source` field wired through
  `loadSports()`/`SportEntry` type, or whether it already flows through.
- No new UI screen — a synced-but-unrated session should just look like an
  incomplete entry the user taps to finish (quality rating + optional
  competitor/result), same interaction as fixing a typo in a manual entry.

**Workflow**: reuse `.github/workflows/garmin-activity-sync.yml` (same cron,
same job) rather than adding a second scheduled workflow, unless splitting the
Python script makes a second `workflow_dispatch` step meaningfully useful for
backfill/testing.

## Acceptance

- [ ] `sport_sessions` has `source`, `garmin_activity_id`, and the unique
      upsert key, via a migration mirroring the cardio one.
- [ ] The sync pulls sport-type Garmin activities (tennis confirmed first,
      others as their real `typeKey` values are confirmed) into
      `sport_sessions` with duration/avg HR/date/name filled and
      quality/competitors/result left blank.
- [ ] Re-running the sync never duplicates a row or overwrites a quality
      rating the user already entered.
- [ ] A Garmin-synced sport session shows the same `Garmin` badge as a synced
      cardio session and is editable through the existing form/`EditModal`.
- [ ] `npm run build` passes; a real tennis session round-trips end to end
      (Garmin → sync → visible in Cardio tab → user fills in quality → saves).
