# Roadmap: Row origin tagging — tell staging and dev rows apart

**Label:** infra
**Status:** done — shipped and verified 2026-09-01. Split out of
[024](../024-staging-shared-database-safety.md) on 2026-09-01 so the restyle train
([026](026-signal-chrome-and-primitives.md)) is not parked behind the whole of
024. This is 024's Part 1, unchanged in intent and widened in one place (see
*Dev counts too*).
**Release:** 2.0.0

## Why this exists on its own

024 carries three parts: tag the rows (Part 1), stop staging breaking
production (Part 2), and the release cleanup ritual (Part 3). Only Part 1 blocks
anything — 026's acceptance logs a test entry of *every* type through EditModal
against the shared production database, and today nothing distinguishes those
rows from a session a user actually trained.

Parts 2 and 3 stay in 024. Part 3 is *only meaningful once this ships*: a
cleanup that cannot identify its targets is a cleanup that deletes real training
data or nothing at all.

## The load-bearing problem

Staging (`stg-tekio.shamatoff.com`), local dev and production all talk to **the
same Supabase project**. That was deliberate — the reads only mean anything
against real data, and a second project would mean two schemas kept in step
forever. The cost is that every test row is a real row in the real training log,
and **nothing marks it**. Both are inserts by `USER_ID` into the same tables.

So the ordering is forced: tagging comes before cleanup.

## Dev counts too — the one change from 024's wording

024 Part 1 says "set to `'staging'` only when the app is running on staging."
Taken literally that does not discharge 026's dependency: 026's browser
verification runs under `npm run dev` on **localhost**, which points at the same
Supabase project and would still write untagged rows.

So the column records *which environment wrote the row*, with three values —
`'dev'`, `'staging'`, and null for production. Null keeps its meaning from 024:
"production, or pre-dates the column", which is the safe default, because a
cleanup only ever deletes rows it can positively identify as **not** production.

## What to build

### 1. The column

One nullable `origin text` column, defaulting to null, on the tables that take a
user write. Existing rows stay null.

Tag at **cascade-root granularity** — the row that represents "a thing that was
logged", not its children. Deleting a `training_sessions` row already cascades
to `session_exercises` and `session_sets`, so tagging the children buys nothing
and triples the write-path surface:

| Table | Why it is a root |
|---|---|
| `training_sessions` | weights log; `session_exercises` → `session_sets` cascade |
| `exercises` | auto-created by `getOrCreateExercise` when a new name is typed — a test name pollutes autocomplete permanently |
| `cardio_sessions` | cardio log |
| `mobility_sessions` | mobility log; session exercises cascade |
| `sport_types` | auto-created by `getOrCreateSportType`, same as `exercises` |
| `sport_sessions` | sport log; `sport_session_drills` cascade |
| `bodyweight_logs` | bodyweight |
| `water_logs` | water |
| `blood_donations` | donations |
| `sauna_sessions` | recovery capture |
| `cold_sessions` | recovery capture |
| `programs` | program authoring; days/exercises/supersets cascade |
| `user_programs` | enrollment |

Deliberately excluded, and why:

- **`habits` / `habit_completions`** — shelved by the doctrine ledger and
  deleted from the app on 2026-09-05 ([035](035-habits-expiry-deletion.md)); the
  table drops wait in [025](025-release-blocked-schema-drops.md). Do not add a
  column to a table that is being dropped.
- **`muscle_groups`, `exercise_muscle_groups`, `movement_patterns`** —
  reference/admin data, not a training log. Pollution here is visible and
  hand-fixable.
- **`mobility_exercises`** — reads like a catalog table, is not one. It holds
  `(session_id, exercise_name, duration_minutes, exercise_id)` and cascades from
  `mobility_sessions`; the mobility catalog is `exercises`, reached through
  `getOrCreateExercise`. Checked during implementation, after tagging it by
  mistake.
- **`sleep_logs`** and the other Garmin-written tables — no app write path, so
  nothing would ever set the column from this brief. A `'garmin'` origin is a
  reasonable later use of the same column; it is not this brief.

### 2. `origin` is write-once

A `BEFORE UPDATE` trigger preserves the existing value (`NEW.origin :=
OLD.origin`) on every tagged table. This is not decoration — it closes a trap
that would otherwise delete real data:

`saveBodyweightEntry` is an **upsert** on `(user_id, log_date)`. Verifying
EditModal from localhost on a day the user has already weighed in would take the
conflict branch and stamp `origin = 'dev'` onto **their real row**, which the
Part 3 sweep would then delete. Write-once means an update never re-tags: the
real row keeps its null and survives.

The converse also holds — editing a staging row from production does not
launder it into looking real.

(A staging *edit* that corrupts the contents of a genuinely-real row is still
possible. That is the "staging can break production" risk, and it belongs to
024 Part 2, not here.)

### 3. Tell the app where it is running

One resolver, read by the data layer:

- `VITE_ENV` when set (Vercel Preview gets `VITE_ENV=staging`).
- Otherwise infer from hostname: `localhost` / `127.0.0.1` → `dev`, a host
  starting `stg-` → `staging`, anything else → production.

The fallback matters because the env var is set by hand in a dashboard nobody
re-reads. If it is ever forgotten, staging still identifies itself. Production
resolves to null through both paths.

### 4. Set it on insert, and only on insert

A single helper, applied at the root-insert call sites:

```ts
export const withOrigin = <T>(row: T) => (ORIGIN ? { ...row, origin: ORIGIN } : row)
```

When `ORIGIN` is null the helper is the identity function, so **a production
build emits exactly the payload it emits today** — that is the guarantee that
this cannot break production, and it is why the helper returns the row unchanged
rather than writing an explicit `origin: null`.

### 5. Show it on screen

A persistent, unmissable marker whenever the resolved environment is not
production, naming which one it is. The failure mode this exists to prevent is
a user logging a real session into staging by mistake.

Keep it plain — 026 restyles the whole shell right after this, so the marker
should be a few lines that survive that sweep, not a designed component.

## Out of scope

- The migration/DDL policy and the destructive-write rules — 024 Part 2.
- The cleanup sweep itself, its per-table preview queries and its record —
  024 Part 3. **Do not write a sweep in this brief**; a sweep authored before
  there is anything to sweep is a ritual that has never been run.
- Tagging Garmin-written rows.
- Backfilling any existing row. Every row that exists today is null and stays
  null, by design.

## Doctrine check (§4)

1. **Which read does this sharpen?** All of them, defensively — every read is
   computed from these rows, so untagged test data quietly corrupts the muscle
   read, the cycle maths and every chart. No new surface; R1 untouched.
2. **Stop doing:** guessing from memory which rows were tests.
3. **Input or destination?** Neither — infrastructure.
4. **Honest shape:** one nullable provenance field on the row it describes.
5. **Physiological number?** No. No `## Grounding` needed.

## Progress log

- **2026-09-01** — split out of 024. Migration applied
  (`20260901110325_row_origin_tagging`, plus two corrections: `sport_types`
  added, `mobility_exercises` removed once it turned out to be a session child
  rather than a catalog table). `src/lib/env.ts` + `withOrigin` wired into all
  13 root writes, `EnvBanner` mounted in the shell, 7 unit tests added.
  Verified against the live database: a cardio session logged from localhost
  landed with `origin = 'dev'`; the write-once trigger held in both directions;
  the bodyweight upsert left a real null-origin row untagged. Test row swept.
- **2026-09-01** — `VITE_ENV=staging` added to Vercel's **Preview** environment
  only (production left unset) via the Vercel CLI, and the preview redeployed so
  it is baked in; the redeploy took the `stg-tekio.shamatoff.com` alias.
  Confirmed by reading the built bundle: with the var set, Vite folds the
  resolver to `function(){return"staging"}`; with it unset the resolver reduces
  to pure hostname inference, which yields `production` on the production domain
  and so keeps `withOrigin` an identity function there.
  **Not checked with my own eyes:** the banner on live staging. Its gate
  credentials are Vercel *Secrets* and `vercel env pull` refuses to decrypt
  them, so signing in needs whoever holds them. The banner itself was verified on localhost
  and only its label differs.

## Acceptance

- [x] Migration applied: `origin text` on the 13 tables above, existing rows null.
- [x] A write-once trigger on each tagged table; an update cannot change `origin`.
- [x] The environment resolver returns `dev` on localhost and `staging` on a
      `stg-` host with no env var set.
- [x] Root inserts in `src/lib/db/` carry the origin; a production build's insert
      payload is unchanged.
- [x] `VITE_ENV=staging` is set on Vercel's Preview environment.
- [x] A non-production environment is unmistakable in the browser.
- [x] Verified in the browser: a row logged from localhost lands with
      `origin = 'dev'`, and editing an existing null-origin row leaves it null.
