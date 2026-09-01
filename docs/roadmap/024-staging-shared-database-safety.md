# Roadmap: Staging on the production database — guardrails and release cleanup

**Label:** infra
**Status:** planned — Part 1 split out to [037](done/037-row-origin-tagging.md) on
2026-09-01; what remains is the migration/destructive-write policy (Part 2) and
the release cleanup ritual (Part 3). The staging deployment itself (domain,
gate, env vars) is not part of this brief — that is already done.
**Depends:** 037
**Release:** 2.0.0 — the cleanup ritual is what makes a major release safe on a
shared database.
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

### Part 1 — Tell staging apart → [037](done/037-row-origin-tagging.md)

Split out on 2026-09-01 and moved in full: the nullable `origin` column, the
write-once trigger, the environment resolver, and the on-screen marker. It left
because it was the only part blocking anything — [026](026-signal-chrome-and-primitives.md)
waits on it — and because Part 3 below cannot be written until it ships.

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

Only meaningful once [037](done/037-row-origin-tagging.md) ships.

- On every **major** version bump (the ones Peter confirms — see the branching
  and versioning rules in `CLAUDE.md`), sweep rows whose `origin` is not null
  — 037 tags both `'staging'` and `'dev'`, and null means production.
- Write the sweep as a reviewable query per table, not one blanket delete, and
  **report a count before deleting anything**. The database holds live
  single-user data with no sandbox; a cleanup that cannot be previewed is a
  worse problem than the pollution it fixes.
- Record what was deleted, and when, so the record survives the session.

## Questions to answer at kickoff

1. Does staging get a *blanket* block on deletes and bulk updates, or is the
   risk accepted in writing? The app has one user, so a block is cheap — but it
   also makes staging unable to exercise the delete paths that 026 restyles.
2. Where does the migration policy live so it is actually read — `CLAUDE.md`,
   `supabase/README.md`, or both?

## Acceptance

- [ ] A written rule says how migrations reach production and what staging may
      not do destructively.
- [ ] A cleanup procedure exists that previews counts before deleting, and it
      has been run once end to end on real staging rows.
- [ ] The versioning rules in `CLAUDE.md` point at the cleanup as part of a major
      release.
