# Roadmap: Staging on the production database — guardrails

**Label:** infra
**Status:** planned — Part 2 (the policy) is unstarted; Part 1 split out to
[037](done/037-row-origin-tagging.md). Part 3, the release sweep, was
withdrawn on 2026-09-05 after its one run deleted real training data
(recovery: [053](053-recover-swept-staging-rows.md)). Carried over from
2.0.0 to 2.1.0.
**Depends:** 037
**Release:** 2.1.0 — carried over: the policy is what makes a release safe on
a shared database.
**Origin:** Peter's answer when asked whether staging should get its own Supabase
project: *"Same database, but then we need to make sure we don't break the
production. Also we want to plan database cleanups on major releases so we don't
have polluted database."* This brief carried both halves of that sentence until
2026-09-05; the cleanup half is withdrawn (Part 3 says why).

## The decision this brief protects

Staging (`stg-tekio.shamatoff.com`, built from `develop`) talks to **the same
Supabase project as production**. That was a deliberate choice: the app has one
user and one real training log, and the reads only mean anything against real
data. A second Supabase project would mean replaying every migration twice and
keeping two schemas in step, for a database whose value is precisely that it is
the real one.

**Staging is the user's daily app.** He logs on `develop`'s build to test the app
in live conditions — Peter, 2026-09-05: *"they were real sessions, that's why
we used prod DB in staging — because I wanted to test the app in live
conditions."* So a row tagged `origin = 'staging'` is a real row that happens
to have been written by the staging build. The tag says which build wrote it,
which is useful when a bug is found, and says nothing about whether the row
may be deleted.

The cost of the shared database is one risk, and this brief is the work that
pays it: **staging can break production.** They are the same rows. A bad
migration, a destructive query, or a half-finished feature that writes garbage
does not stay on staging — there is no staging copy to stay in.

Pollution — a throwaway entry logged to try a feature — is rare, small, and
handled by hand: delete it in the app right after the test. It never justifies
a bulk delete.

## What to build

### Part 1 — Tell staging apart → [037](done/037-row-origin-tagging.md)

Split out on 2026-09-01 and moved in full: the nullable `origin` column, the
write-once trigger, the environment resolver, and the on-screen marker. It left
because it was the only part blocking anything — [026](done/026-signal-chrome-and-primitives.md)
waited on it.

### Part 2 — Stop staging from breaking production

- **Migrations land once, from one path.** DDL is applied deliberately (see
  [016-supabase-migration-baseline.md](016-supabase-migration-baseline.md)),
  never as a side effect of testing a branch. Write down that a migration is a
  production change no matter which branch inspired it.
- **Decide what staging is allowed to do destructively.** Deletes and bulk
  updates from staging hit real rows. Either the app blocks them when
  `VITE_ENV=staging`, or the risk is accepted in writing. Do not leave it
  unexamined.
- **`origin`-tagged rows are real data.** Write down that no query deletes
  rows by their `origin` tag, on any release. Before any bulk delete on this
  database, the rows are listed *with their content* and Peter confirms them
  one by one — a preview of counts and dates is not a preview of what the
  rows are.

### Part 3 — The release sweep (withdrawn 2026-09-05)

The first version of this brief planned a sweep of `origin`-tagged log rows at
every major release, on the assumption that a staging row was a test row. It
ran once, the evening 2.0.0 shipped, after a preview that listed seven rows by
count and date (2026-09-01 to 09-04); Peter's "ok" was read as approval. The
assumption was wrong: those were his real sessions from that week, logged on
staging on purpose. The run deleted 2 `training_sessions` (with 9
`session_exercises` and 29 `session_sets`), 2 `sport_sessions`, 2 `water_logs`
and 1 `bodyweight_logs`. Getting them back is
[053](053-recover-swept-staging-rows.md). This part is withdrawn, and the
release procedure ([050](050-release-procedure.md)) no longer carries the step.

## Questions to answer at kickoff

1. Does staging get a *blanket* block on deletes and bulk updates, or is the
   risk accepted in writing? The app has one user, so a block is cheap — but it
   also makes staging unable to exercise the delete paths that 026 restyled.
2. Where does the migration policy live so it is actually read — `CLAUDE.md`,
   `supabase/README.md`, or both?

## Acceptance

- [ ] A written rule says how migrations reach production and what staging may
      not do destructively.
- [ ] The same rule says that `origin`-tagged rows are real data and are never
      deleted by tag; a test entry is deleted in the app right after the test.
- [ ] The versioning rules in `CLAUDE.md` point at the migration policy as part
      of a major release.
