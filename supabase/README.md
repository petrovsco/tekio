# Supabase

The production database — project ref **`snpjfzfqjwkdwzzqfhsz`** ("Tekiō") — is
the single source of truth (single-user app, live data, no sandbox). Schema
changes **are** tracked server-side (`supabase migration list` shows the full
history), but were historically applied directly via the dashboard / MCP and
were never mirrored into this repo. This folder closes that gap.

## One-time: adopt the existing schema as a baseline

> **Not done yet.** There is no `_remote_schema.sql` in `migrations/`, so the
> repo and the live database are still out of sync and the "going forward"
> workflow below rests on a baseline that does not exist. Tracked as
> [docs/roadmap/016-supabase-migration-baseline.md](../docs/roadmap/016-supabase-migration-baseline.md)
> — this file documents *how*, the brief tracks that it is *outstanding*.

Requires the project's access token + DB password, so run this locally:

```bash
supabase login                                   # or export SUPABASE_ACCESS_TOKEN
supabase link --project-ref snpjfzfqjwkdwzzqfhsz
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

## Applied out of band — the record

Kept here because `db pull` cannot regenerate the data migrations. What still
has to be *decided* about them (commit as files, or accept as server-only) is in
[the baseline brief](../docs/roadmap/016-supabase-migration-baseline.md), not here.

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
