# Supabase

The production database — project named "Tekiō" (its ref, `<project-ref>` below, is in the dashboard URL and in `VITE_SUPABASE_URL`) — is
the single source of truth (single-user app, live data, no sandbox). Schema
changes **are** tracked server-side (`supabase migration list` shows the full
history), but were historically applied directly via the dashboard / MCP and
were never mirrored into this repo. This folder closes that gap.

## The history is mirrored here

Every migration the server has recorded is a file in `migrations/`, under the
same version — `supabase migration list` shows no local-only and no
remote-only rows. The 28 that were only ever applied through the dashboard or
MCP (2026-05 to 2026-09) were pulled down on 2026-10-04 with
`supabase migration fetch`, which writes out the exact SQL the server stored
for each one; that includes the two data migrations
(`migrate_5day_split_to_blocks`, `seed_volleyball_program_v1`). The files
written by hand before then were renamed to the versions the server stamped.
`tekio.rfcs/rfcs/0016-supabase-migration-baseline.md` has the history.

To re-check that the files and the live schema agree (needs Docker running,
because the CLI replays the files into a throwaway local Postgres):

```bash
supabase link --project-ref <project-ref>
supabase migration list            # every row has both a local and a remote version
supabase db diff --linked          # no output = no drift
```

## Going forward

Every schema change is a file in `supabase/migrations/`:

```bash
supabase migration new <name>   # creates an empty timestamped .sql
#   …edit the file…
supabase db push                # applies to the linked project
```

If a change is ever applied out-of-band (dashboard / MCP `apply_migration`),
mirror it back here as a migration file so the two never drift.

## Two builds, one schema — the migration policy

Every build talks to this one project: production (`master`), staging
(`develop`) and local dev. While `develop` runs ahead of `master`, at least two
builds read and write the same tables, so a schema change has to be one both
can live with. The reasoning is `tekio.rfcs/rfcs/done/0024-staging-shared-database-safety.md`.

1. **A migration is a production change**, whichever branch asked for it. It
   is a file in `migrations/`, committed with the code that needs it, and
   applied once — `supabase db push`, or `apply_migration` under the same name
   so `supabase migration list` matches the file. Never as a side effect of
   testing a branch.
2. **Expand now, contract after the release.** What the build on `master`
   survives runs as soon as `develop` needs it: a new table, a new column that
   is nullable or has a default, a wider constraint, a new config row. What
   would break it waits: dropping or renaming a column or table `master`
   selects, narrowing a constraint `master` writes, deleting a config row
   `master` reads. A rename is add → backfill → drop the old one later.
3. **Transitional schema is queued, not remembered.** Anything that exists only
   so the two builds can run side by side — a column `develop` stopped reading,
   config that only production still shows, a constraint widened for the
   overlap — gets a row in the release's schema-drops brief: what it is, the
   version that stopped needing it, what still reads it, and the SQL. 2.1.0's
   was `tekio.rfcs/rfcs/done/0080-release-2-1-0-schema-drops.md`; the next
   release's brief is opened with its first row.
4. **That queue is the release sweep.** It runs at step 6 of the release
   procedure (`CLAUDE.md`), once `master` runs the new code: one tracked
   migration, then a check that the app's bootstrap still loads against the
   live schema.
5. **The sweep removes schema, never rows.** A row written by a staging or dev
   build — `origin` set — is real data: staging is used day to day, in live
   conditions, on purpose. No query deletes rows by their `origin` tag. A
   throwaway entry made to try a feature is deleted in the app right after the
   test. Before any bulk delete on this database, the rows are listed with
   their content, not counts and dates, and the owner of the data confirms
   them one by one.
6. **The app's own deletes on staging are accepted, not blocked.** An edit or
   delete in the staging app is the same one-row action production makes, taken
   by the person using it on their own data. The risk this policy guards
   against is schema changes and bulk SQL, not the app's delete buttons.

## Applied out of band — the record

The schema and data migrations that used to be recorded here are now files in
`migrations/` (see above). One change remains that no migration holds:

- **`cardio_work_distance_km` backfill** — **data**, 2026-09-09. Fills
  `cardio_sessions.work_distance_km` on 27 of the 43 `[N4x4] Indoor Rowing`
  rows, matched by `garmin_activity_id`, from the "Indoor Rowing" entries of
  the Notion *Gym Tracker* database. Garmin reports distance 0.0 for indoor
  rowing, so Notion is the only source; each figure covers the 16 minutes of
  4×4 work, not the whole session, which is why it is not `distance_km` (the
  column's own migration says why). The Notion row dated 2024-10-07 was mapped
  to the 2024-10-06 session — no rowing activity exists on 10-07 in the Garmin
  history and the row was typed on 10-09. The remaining 16 rowing rows have no
  Notion entry and stay NULL. Not captured by `db pull`.

## Edge functions

None. The two that existed (`assistant-chat` and `assistant-settings`) were
deleted with the in-app assistant on 2026-10-02
(`tekio.rfcs/rfcs/done/0034-v2-1-candidates-tbc.md`). The `assistant_settings` table
they read waits for the 2.2.0 release sweep.
