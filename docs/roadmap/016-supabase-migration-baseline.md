# Roadmap: Baseline the Supabase schema into the repo

**Label:** infra
**Status:** planned — **needs the user to run it.** Requires the project access token and DB password, so an agent cannot do this half.

[supabase/README.md](../../supabase/README.md) documents a one-time "adopt the
existing schema as a baseline" step. It has never been run: there is no
`*_remote_schema.sql` in [supabase/migrations/](../../supabase/migrations/), only
eight hand-written files. Until it runs, the repo and the live database are not
in sync, and the README's own "going forward" workflow rests on a baseline that
does not exist.

## The gap

Schema changes **are** tracked server-side — `supabase migration list` shows the
full history — but were historically applied straight through the dashboard or
MCP `apply_migration` and never mirrored here. The eight files in
`supabase/migrations/` are the ones written after the scaffold landed; everything
before them exists only on the server.

## The step

```bash
supabase login                                   # or export SUPABASE_ACCESS_TOKEN
supabase link --project-ref snpjfzfqjwkdwzzqfhsz
supabase db pull                                 # → supabase/migrations/<ts>_remote_schema.sql
git add supabase/migrations && git commit -m "Baseline DB schema"
```

## What `db pull` will not capture

Three changes were applied out of band and are **data**, not schema, so the
baseline will silently skip them. They are recorded in prose in
[supabase/README.md](../../supabase/README.md) — which is the wrong place for
something still outstanding, and the reason this brief exists.

| Applied | Kind | Captured by `db pull`? |
|---|---|---|
| `program_phases_stage1` | schema — `program_days.queue_order / is_variant / variant_group_key`, `program_week_overrides`, `mobility_exercises.exercise_id`, `user_programs.deload_committed_date` | **Yes** — folds into the baseline |
| `migrate_5day_split_to_blocks` | **data** backfill — wraps the 5-Day Split's flat days into one `weight` block each, tagging exercises `STRENGTH` | **No** — SQL preserved in the README; idempotent, already applied |
| `seed_volleyball_program_v1` | **data** seed — the active Volleyball program (9 day rows, 32 blocks, 78 tagged exercises, 2 supersets) | **No** — not reproducible from the baseline |

After the pull, decide for each data migration whether to keep it as a numbered
file in `supabase/migrations/` (idempotent, so re-running is safe) or to accept
that it lives only in the live database. Either is defensible; leaving it
undecided in a README is not.

## Risk to check first

The live database is **single-user production data with no sandbox**. `db pull`
is read-only — it generates a file, it does not write to the server — so the step
itself is safe. The thing to watch is the commit afterwards: the generated
baseline may include RLS policies that are deliberately wide open
(`USING(true)`), which is the current intentional MVP posture and must not be
"tidied up" on sight. That posture changes in
[003-rls-auth-v1.1.md](003-rls-auth-v1.1.md), not here.

## Acceptance

- `supabase/migrations/` contains a `_remote_schema.sql` baseline, committed.
- A fresh `supabase db diff` against the linked project reports no drift.
- The two data migrations are either committed as files or explicitly recorded as
  server-only, and the README's "Applied this session" section is reduced to a
  pointer.
