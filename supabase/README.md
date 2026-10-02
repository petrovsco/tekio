# Supabase

The production database — project named "Tekiō" (its ref, `<project-ref>` below, is in the dashboard URL and in `VITE_SUPABASE_URL`) — is
the single source of truth (single-user app, live data, no sandbox). Schema
changes **are** tracked server-side (`supabase migration list` shows the full
history), but were historically applied directly via the dashboard / MCP and
were never mirrored into this repo. This folder closes that gap.

## One-time: adopt the existing schema as a baseline

> **Not done yet.** There is no `_remote_schema.sql` in `migrations/`, so the
> repo and the live database are still out of sync and the "going forward"
> workflow below rests on a baseline that does not exist. Tracked as
> `tekio.rfcs/rfcs/0016-supabase-migration-baseline.md`
> — this file documents *how*, the brief tracks that it is *outstanding*.

Requires the project's access token + DB password, so run this locally:

```bash
supabase login                                   # or export SUPABASE_ACCESS_TOKEN
supabase link --project-ref <project-ref>
supabase db pull                                 # → supabase/migrations/<ts>_remote_schema.sql
git add supabase/migrations && git commit -m "Baseline DB schema"
```

`db pull` reconciles the already-applied server migrations into one baseline
file representing the current schema. After this, the repo and DB are in sync.

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

Kept here because `db pull` cannot regenerate the data migrations. What still
has to be *decided* about them (commit as files, or accept as server-only) is in
the baseline brief (`tekio.rfcs/rfcs/0016-supabase-migration-baseline.md`), not here.

- **`program_phases_stage1`** — schema. Adds `program_days.queue_order /
  is_variant / variant_group_key`, the `program_week_overrides` table,
  `mobility_exercises.exercise_id`, and `user_programs.deload_committed_date`.
- **`migrate_5day_split_to_blocks`** — **data** backfill (below). Wraps the
  "5-Day High Efficiency Split" program's legacy flat days into one `weight`
  block each, tagging exercises `STRENGTH`. No phase is added, so the program
  stays sequential (index mode). `db pull` does **not** capture data migrations,
  so this SQL is preserved here for the record; it is idempotent and already
  applied.
- **`seed_volleyball_program_v1`** — **data** seed. Creates the active
  "Volleyball Performance & Healthspan" program (9 day rows = 7 weekday-pinned
  days + Thursday/Saturday variant days, 32 blocks, 78 tagged exercises, 2
  supersets, weekly principles). Drafted from the sports-physician context doc;
  sets/reps/loads are placeholders to refine in-app. Not captured by `db pull`.
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

```sql
do $$
declare
  d record;
  bid uuid;
begin
  for d in
    select id, name from program_days
    where program_id = 'de96fb1e-a1e2-4e20-8fa0-67728954d19d'
    order by sort_order
  loop
    if not exists (select 1 from program_day_blocks where program_day_id = d.id) then
      insert into program_day_blocks (program_day_id, name, block_type, sort_order)
      values (d.id, d.name, 'weight', 0)
      returning id into bid;

      update program_day_exercises
      set block_id = bid,
          training_tag = coalesce(training_tag, 'STRENGTH')
      where program_day_id = d.id and block_id is null;
    end if;
  end loop;
end $$;
```

## Edge functions

None. The two that existed (`assistant-chat` and `assistant-settings`) were
deleted with the in-app assistant on 2026-10-02
(`tekio.rfcs/rfcs/0034-v2-1-candidates-tbc.md`). The `assistant_settings` table
they read waits for the 2.2.0 release sweep.
