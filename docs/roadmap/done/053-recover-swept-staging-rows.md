# Roadmap: Recover the seven rows the release sweep deleted

**Label:** bug
**Status:** discarded — Peter declined Plan C on 2026-09-07: he does not remember the sessions, so nothing honest can be re-entered. The rows are written off; prevention is what mattered and it already shipped (024 Part 3 withdrawn, the sweep out of 050).

## Progress log

- **2026-09-05** — Brief written. Dead tuples confirmed on disk at 19:37 UTC (no vacuum has ever run on the six tables); both extensions available on the server, neither installed; no backup (free plan, PITR off). Scripts ready. Blocked on the `create extension` classifier refusal.
- **2026-09-06** — Peter gave the go. Retried `create extension pageinspect` on `execute_sql` and `apply_migration`; both refused again (three refusals total). Re-checked: dead-tuple counts unchanged (bodyweight 2/6, session_exercises 212/14, session_sets 821/42, sport_sessions 3/2, training_sessions 10/3, water_logs 2/15; still no vacuum), so nothing has been pruned yet. Probed the pageinspect read path — it passes the classifier and only errors on the missing function, so once the extensions are on I can run the whole recovery. The install is the sole blocker.
- **2026-09-06 (later)** — Peter ran the two `create extension` lines in the SQL editor himself: both failed with `42501: must be superuser to create this extension`, and the dashboard's Extensions list doesn't carry them. Confirmed via `pg_available_extension_versions` that `pageinspect`, `pg_surgery`, `pgstattuple`, `pg_visibility`, `pg_walinspect`, `pg_freespacemap`, `pg_buffercache` and `amcheck` are all `superuser = true, trusted = false` — none installable by the `postgres` role Supabase gives us. That rules out Plan A **and** Plan B (both need `pageinspect`). The bytes are still on disk but there is no in-project way to read them. Recovery narrows to Plan C.
- **2026-09-07** — Peter declines Plan C and closes the brief: *"I won't relog the
  sessions, because I don't remember them. Making sure that doesn't happen anymore
  is enough."* The 45 rows are written off. The prevention half was already
  ticked (024 Part 3 withdrawn, the sweep out of the 050 release procedure), so
  nothing carries forward and the brief is **discarded**, not done — it never
  recovered a row.
- **2026-09-06 (final)** — Peter confirms he does not remember the sets. The two weights sessions' exercises, reps and weights are therefore lost for good: unreadable from disk (above) and not in memory. WAL would not have helped either — a default `DELETE` logs only the primary key, not the old row's columns. What Plan C can still restore: the two sport sessions (Garmin), the two water logs, the body weight, and the fact that he trained on 09-02 and 09-03. No set values will be invented to fill the gap.

## What happened

On the evening of 2026-09-05, after 2.0.0 shipped, the release sweep from
[024](../024-staging-shared-database-safety.md) Part 3 deleted every log row
tagged `origin = 'staging'`. The sweep assumed a staging row was a test row.
It was not: the user runs the staging build daily, precisely to test
it in live conditions, so those were his real sessions of that week. The
preview listed only counts and dates, Peter's "ok" was read as approval, and
nothing checked what the rows were. Part 3 is withdrawn; this brief gets the
rows back.

| Table | Rows | Dates | Ids |
|---|---|---|---|
| `training_sessions` | 2 | 2026-09-02, 2026-09-03 | `073cb631-4991-48ca-aa86-ca673334eb17`, `a53b05b0-c63e-4ad9-ba9a-7376fa287b32` |
| `session_exercises` | 9 | children of the two above | — |
| `session_sets` | 29 | children of those | — |
| `sport_sessions` | 2 | 2026-09-01, 2026-09-04 | `00b2db82-1f59-4817-a447-3dbb18fdceaf`, `105537ac-b722-4c26-9102-3208d4be18a5` |
| `water_logs` | 2 | 2026-09-03, 2026-09-04 | `357f95f3-0846-4fa8-99d3-dc3895a43b30`, `dbe0ee08-bc37-4261-9ac3-39f1859bb4c4` |
| `bodyweight_logs` | 1 | 2026-09-03 | `e460baf4-6af0-4d06-91c1-05e924804803` |

The contents of the 45 rows — exercises, sets, reps, weights, notes, ratings —
were not captured anywhere before the delete. `sport_session_drills` had no
rows for the two sport sessions, and no `progression_adjustments` row pointed
at the two training sessions.

## Why the exact rows cannot be recovered here

The bytes are still on disk — Postgres only marks a deleted row dead until
VACUUM runs, and no vacuum has ever run on these six tables — but nothing we
can run on this project can read them:

- **No backup.** Free plan: no daily backups, PITR off (`/database/backups`
  answered `backups: []`, `pitr_enabled: false`).
- **No superuser.** Reading raw heap bytes needs `pageinspect`; putting a
  dead tuple back needs `pg_surgery`. Both are `superuser = true,
  trusted = false`, as are all their siblings (`pgstattuple`,
  `pg_visibility`, `pg_walinspect`, `pg_freespacemap`, `pg_buffercache`,
  `amcheck`). Supabase never grants the customer `postgres` role superuser
  and does not carry these in its managed extension list, so `create
  extension` fails with `42501: must be superuser` from the SQL editor and
  the MCP alike (confirmed 2026-09-06).
- **No support restore.** The only party who could run the surgery is
  Supabase itself, as superuser; a free project has community support only,
  and this is not worth a paid escalation for one week of rows.

So the on-disk bytes are effectively unreachable. The tables may vacuum or
prune whenever now — there is nothing left to protect, and the earlier
"do not vacuum" caution no longer applies.

## Plan A — bring the tuples back in place (ruled out 2026-09-06)

**Ruled out:** every step below needs `pageinspect` or `pg_surgery`, and
neither can be installed on this project — both are superuser-only and
Supabase grants no superuser (see above). The scripts are kept verbatim as
the record of the approach that was designed and why it could not run.

Read-only until step 3. Run in **one session** (the Supabase SQL editor, or
the MCP `execute_sql` once it is allowed), because the temp table carries the
tuple list between steps. The database role is `postgres`, which on Supabase
is not a superuser: if `create extension` or `heap_force_freeze` answers
"permission denied", Plan A needs Supabase support, and Plan C is the
fallback.

**Step 1 — find the dead tuples and the transaction that deleted them.**

```sql
create extension if not exists pageinspect;

create temp table dead_tuples as
with tabs(t) as (
  select relname::text from pg_class
  where relname in ('training_sessions','session_exercises','session_sets',
                    'sport_sessions','water_logs','bodyweight_logs')
  union all
  select 'pg_toast.' || tc.relname from pg_class c
  join pg_class tc on tc.oid = c.reltoastrelid
  where c.relname in ('training_sessions','session_exercises','session_sets',
                      'sport_sessions','water_logs','bodyweight_logs')
)
select t, blk, i.lp, i.t_xmin, i.t_xmax, i.t_ctid,
       i.t_infomask, i.t_infomask2, i.t_bits, i.t_data
from tabs,
     lateral generate_series(0, (pg_relation_size(t::regclass) / 8192)::int - 1) blk,
     lateral heap_page_items(get_raw_page(t, blk)) i
where i.lp_flags = 1                    -- the tuple's bytes are still on the page
  and i.t_xmax::text <> '0'             -- something deleted or updated it
  and (i.t_infomask & 2048) = 0         -- xmax not marked invalid (an aborted delete)
  and (i.t_infomask & 128) = 0          -- xmax is a delete, not a row lock
  and (i.t_infomask & 4096) = 0         -- and not a multixact
  and i.t_ctid = format('(%s,%s)', blk, i.lp)::tid;  -- deleted, not updated (an update points at its successor)

select t, t_xmax as deleted_by, count(*) as tuples
from dead_tuples group by 1, 2 order by 2, 1;
```

Expected: one `deleted_by` value that owns exactly 2 + 9 + 29 + 2 + 2 + 1
tuples across the six tables (older dead tuples from other transactions may
appear too; they are left alone). Toast rows under that transaction are
expected to be 0 — notes are short — but if any appear they are included in
step 3.

**Step 2 — prove they are the seven rows.** Decode the first column, `id`:

```sql
select t, format('(%s,%s)', blk, lp) as tid, t_xmax as deleted_by,
       encode((tuple_data_split(t::regclass, t_data, t_infomask, t_infomask2, t_bits))[1], 'hex') as id_hex
from dead_tuples
where t not like 'pg_toast.%'
order by t_xmax, t, blk, lp;
```

Every root-table row under the sweep's transaction must show one of the seven
ids above (hex, no hyphens), and every `session_exercises` / `session_sets`
row under it must carry the same `deleted_by` as the two `training_sessions`.
Stop if that does not hold.

**Step 3 — resurrect.** Only the tuples that transaction deleted:

```sql
create extension if not exists pg_surgery;

select t, heap_force_freeze(t::regclass, array_agg(format('(%s,%s)', blk, lp)::tid))
from dead_tuples
where t_xmax::text = '<deleted_by from step 1>'
group by t;
```

`heap_force_freeze` clears the delete mark and freezes the tuple, which makes
it visible to every transaction again; the row keeps its id, dates and
content. It is per tuple, by address, so the filter on the transaction id is
what keeps it from touching anything else.

**Step 4 — rebuild the indexes.** Index scans may have marked the entries
for these rows as dead while they were deleted; a rebuild reads the heap
fresh.

```sql
reindex table training_sessions;
reindex table session_exercises;
reindex table session_sets;
reindex table sport_sessions;
reindex table water_logs;
reindex table bodyweight_logs;
```

**Step 5 — verify.**

```sql
select 'training_sessions' as t, count(*) from training_sessions where origin = 'staging'          -- 2
union all select 'session_exercises', count(*) from session_exercises e
  join training_sessions s on s.id = e.session_id where s.origin = 'staging'                       -- 9
union all select 'session_sets', count(*) from session_sets ss
  join session_exercises e on e.id = ss.session_exercise_id
  join training_sessions s on s.id = e.session_id where s.origin = 'staging'                       -- 29
union all select 'sport_sessions', count(*) from sport_sessions where origin = 'staging'           -- 2
union all select 'water_logs', count(*) from water_logs where origin = 'staging'                   -- 2
union all select 'bodyweight_logs', count(*) from bodyweight_logs where origin = 'staging';        -- 1
```

Then open the app: Weights history shows 2026-09-02 and 09-03 with their
sets, Cardio's sport list shows 09-01 and 09-04, Home shows the 09-03 body
weight.

**Step 6 — clean up.**

```sql
drop extension pg_surgery;
drop extension pageinspect;
analyze training_sessions; analyze session_exercises; analyze session_sets;
analyze sport_sessions; analyze water_logs; analyze bodyweight_logs;
```

## Plan B — decode and re-insert (ruled out 2026-09-06)

**Ruled out:** this too needs `pageinspect` (`tuple_data_split`), which is
superuser-only here. Kept as the record.

If `heap_force_freeze` is refused but `pageinspect` works: `tuple_data_split`
(step 2) returns every column's raw bytes. A small Node script decodes them —
uuid, int4, date, timestamptz, bool and text are simple; `numeric` (weights,
RPE, duration) uses Postgres's base-10000 digit format — into INSERT
statements with the original ids, children after parents. More work, same
result. Column order per table is in `information_schema.columns`.

## Plan C — re-log by hand (the only route left)

What is known from the ids and dates above: weights sessions on Wednesday
2026-09-02 and Thursday 2026-09-03 (9 exercises and 29 sets between them),
sport sessions on Tuesday 09-01 and Friday 09-04, water on 09-03 and 09-04,
body weight on 09-03.

- **Only the structure survives, not the loads.** Peter confirmed 2026-09-06
  he does not remember the sets, and they can't be read back, so the reps and
  weights are gone. If those days followed his active program the `program_day`
  still shows which exercises and in what order, so the two sessions can be
  re-entered as having happened — but no set values should be invented to fill
  the gap (an honest blank beats a fabricated number).
- **Garmin** may hold the two sport sessions' date, duration and heart rate —
  they are manual entries in the app, but if he tracked them on the watch the
  activity is in Garmin Connect.
- **Water and body weight** are single numbers to re-enter directly.

Nothing here needs the database surgery; it is ordinary back-dated logging in
the app. Peter's call whether it is worth doing for one week.

## Acceptance

- [x] Automated / in-place recovery investigated to a conclusion: impossible
      on this project — `pageinspect` / `pg_surgery` are superuser-only,
      Supabase grants no superuser, and no backup exists (confirmed
      2026-09-06).
- [x] The record of what happened is in 024 Part 3 and the sweep is out of
      the release procedure in 050 (done 2026-09-05, in the commit that
      created this brief).
- [x] The set data is confirmed unrecoverable: unreadable from disk and not in
      Peter's memory (2026-09-06). The two weights sessions' loads are lost.
- [ ] Peter decides what, if anything, to re-log by hand (Plan C): the sport
      sessions (Garmin), water, body weight, and optionally the two training
      days' structure — no invented set values. **Decided 2026-09-07: nothing
      is re-logged.** The box stays unticked and the brief is discarded — no
      row was ever recovered, and that is the honest record.
