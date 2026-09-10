# Roadmap: Garmin sync for sport activities (tennis, padel, …)

**Label:** feature
**Status:** done — shipped (v2.0.8–2.0.10) and backfilled on 2026-09-06;
Peter rated both 2026 matches the same day (quality 5 and 4, both wins) and
the rows kept their Garmin source, which closes the round trip.
**Release:** 2.1.0

## Progress log

- **2026-09-06** — Migration `20260906090152_sport_garmin_activity_fields`
  applied. `sync_activities.py` now writes both tables; a sport activity
  *claims* a hand-logged row on the same date for the same sport (or a
  variant — "Tennis Doubles" for Garmin's tennis) before it inserts, and an
  activity already in the table is skipped outright. Workflow gained
  `days` / `kinds` / `dry_run` dispatch inputs. Garmin badge on `SportRow`.
- **2026-09-06** — Ten-year dry run (277 activities; the window opened
  2016-09-09 but the connected Garmin log starts 2023-05-13, see 054): the
  tennis key is **`tennis_v2`**, not `tennis`; no volleyball activities at all
  (the 12 hand-logged volleyball rows were never on the watch); unmapped: `hiit` ×63
  (2023-06..2026-01), `strength_training` ×43 (2024-09..2026-02), `walking`
  ×9, `skating_ws` ×1, `hiking` ×1 — none on the same day as a manual sport
  row, so nothing to claim. The 157 cardio-type activities in that history
  are not in `cardio_sessions` either — that, and HIIT, are brief 054.
- **2026-09-06** — Backfill run (`days=3650 kinds=sport`): 0 claimed, 3 new
  rows (2025-10-05, 2026-09-01, 2026-09-04 — the last two are the "missing
  tennis session" that triggered this brief), 0 already synced. A dry re-run
  afterwards: 3 already synced, 0 new. Headless check on the Cardio tab:
  three Garmin badges (two tennis, one running), the edit modal opens on a
  synced row with 47:14 and 146 bpm filled, 0 console errors.
- **2026-09-06** — Peter rated the 2026-09-01 and 2026-09-04 matches in the
  app (quality 5 and 4, result win); `sport_sessions` shows both with
  `source = 'garmin'` and their Garmin ids intact. Last box ticked.

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
in [doctrine.md](../../doctrine.md)'s ledger and in
[014](014-doctrine-ledger-execution.md),
[009](009-feature-grounding.md), [018](018-home-design-canvas.md#out-of-scope),
[028](028-cardio-tab-signal-restyle.md#out-of-scope) — that item is about unifying
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
  [`20260713193142_cardio_garmin_activity_fields.sql`](../../../supabase/migrations/20260713193142_cardio_garmin_activity_fields.sql).
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
  the user actually plays before hard-coding names (confirm against a real
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

- [x] `sport_sessions` has `source`, `garmin_activity_id`, and the unique
      upsert key, via a migration mirroring the cardio one.
- [x] The sync pulls sport-type Garmin activities (tennis confirmed first,
      others as their real `typeKey` values are confirmed) into
      `sport_sessions` with duration/avg HR/date/name filled and
      quality/competitors/result left blank. (`tennis_v2` is the only sport
      key in ten years of the connected Garmin history — see the log.)
- [x] Re-running the sync never duplicates a row or overwrites a quality
      rating the user already entered. (Dry re-run after the backfill: 3
      already synced, 0 new; `plan_sport` never writes `notes`, `quality`
      or `result` on an existing row.)
- [x] A Garmin-synced sport session shows the same `Garmin` badge as a synced
      cardio session and is editable through the existing form/`EditModal`.
- [x] `npm run build` passes; a real tennis session round-trips end to end
      (Garmin → sync → visible in Cardio tab → user fills in quality → saves).
      Peter rated the 2026-09-01 and 2026-09-04 sessions on 2026-09-06; the
      ratings are in the table next to the Garmin ids.
