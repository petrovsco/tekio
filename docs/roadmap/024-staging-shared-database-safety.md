# Roadmap: Staging on the production database — guardrails and release cleanup

**Label:** infra
**Status:** planned — kickoff-ready. Decided 2026-08-30 when staging was set up;
nothing built yet. The staging deployment itself (domain, gate, env vars) is not
part of this brief — that is already done.
**Release:** 2.0.0 — tagged 2026-09-01: the restyle train's browser verification
writes test rows into the shared database, so Part 1 lands before it
([026](026-signal-chrome-and-primitives.md) depends on this brief).
**Origin:** Peter's answer when asked whether staging should get its own Supabase
project: *"Same database, but then we need to make sure we don't break the
production. Also we want to plan database cleanups on major releases so we don't
have polluted database."* This brief carries both halves of that sentence.

## The decision this brief protects

Staging (`stg-tekio.shamatoff.com`, built from `develop`) talks to **the same
Supabase project as production**. That was a deliberate choice: the app has one
user and one real training log, and the reads only mean anything against real
data. A second Supabase project would mean replaying every migration twice and
keeping two schemas in step, for a database whose value is precisely that it is
the real one.

The cost of that choice is two risks, and this brief is the work that pays them:

1. **Staging can break production.** They are the same rows. A bad migration, a
   destructive query, or a half-finished feature that writes garbage does not
   stay on staging — there is no staging copy to stay in.
2. **Staging pollutes production.** Every test entry logged while trying a
   feature on `develop` is a real row in the real training log. Left alone, the
   charts, the cycle maths and the muscle read all slowly drift away from what
   Peter actually did.

## The load-bearing problem: you cannot clean up what you cannot identify

The obvious plan — "sweep the test rows at each major release" — does not work
today, because **nothing distinguishes a row created on staging from a row Peter
logged for real.** Both are inserts by `USER_ID` into the same tables. A cleanup
would either be done by hand from memory, or would delete real training data.

So the ordering is forced: **tagging comes before cleanup.** Any cleanup ritual
written before rows are identifiable is a ritual that cannot be performed.

## What to build

### Part 1 — Tell staging apart (do this first)

- **Mark the rows.** Give the write path a way to record which environment
  created a row. The cheapest honest shape is one nullable `origin` (or `env`)
  text column on the tables that take user writes, defaulting to null for
  everything that already exists, and set to `'staging'` only when the app is
  running on staging. Null therefore means "production or pre-dates the
  column" — which is the safe default, because cleanup only ever deletes rows
  it can positively identify as staging.
- **Tell the app where it is running.** A build-time env var (e.g.
  `VITE_ENV=staging`, set on Vercel's Preview environment only) that the data
  layer reads when inserting. Production builds leave it unset.
- **Show it on screen.** A persistent, unmissable staging marker in the UI —
  the point is that Peter never logs a real session into staging by mistake,
  which is the failure mode that makes all of the above necessary.

### Part 2 — Stop staging from breaking production

- **Migrations land once, from one path.** DDL is applied deliberately (see
  [016-supabase-migration-baseline.md](016-supabase-migration-baseline.md)),
  never as a side effect of testing a branch. Write down that a migration is a
  production change no matter which branch inspired it.
- **Decide what staging is allowed to do destructively.** Deletes and bulk
  updates from staging hit real rows. Either the app blocks them when
  `VITE_ENV=staging`, or the risk is accepted in writing. Do not leave it
  unexamined.

### Part 3 — The cleanup ritual at major releases

Only meaningful once Part 1 ships.

- On every **major** version bump (the ones Peter confirms — see the branching
  and versioning rules in `CLAUDE.md`), sweep rows marked `origin = 'staging'`.
- Write the sweep as a reviewable query per table, not one blanket delete, and
  **report a count before deleting anything**. The database holds live
  single-user data with no sandbox; a cleanup that cannot be previewed is a
  worse problem than the pollution it fixes.
- Record what was deleted, and when, so the record survives the session.

## Questions to answer at kickoff

1. Which tables actually need the `origin` column? Probably the ones with user
   writes (`training_sessions`, `session_exercises`, `session_sets`,
   `cardio_sessions`, bodyweight, mobility, water, donations) — confirm against
   the schema rather than assuming.
2. Is `origin` the right shape, or is a single `is_staging boolean` enough? A
   text column costs nothing extra and leaves room for other origins (the Garmin
   sync already writes rows no human typed).
3. Should the staging marker be a banner, a colour change, or both?

## Acceptance

- [ ] Staging builds set a distinguishing env var, and the data layer records it
      on every user-created row.
- [ ] The migration adding the column is applied, with existing rows left null.
- [ ] Staging is visually unmistakable in the browser.
- [ ] A written rule says how migrations reach production and what staging may
      not do destructively.
- [ ] A cleanup procedure exists that previews counts before deleting, and it
      has been run once end to end on real staging rows.
- [ ] The versioning rules in `CLAUDE.md` point at the cleanup as part of a major
      release.
