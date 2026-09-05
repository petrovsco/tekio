# Roadmap: Release-blocked schema drops — what develop has stopped reading

**Label:** infra
**Status:** blocked — committed, but it cannot run until 2.0.0 is released onto
`master`. Four items queued: one column drop, two leftovers from the
nine → seven adaptation simplification (019), and the two Habits tables (035).

## Why this brief exists

`develop` and `master` talk to **the same Supabase project** (see
[024-staging-shared-database-safety.md](024-staging-shared-database-safety.md)).
That makes a whole class of cleanup impossible to finish inside the brief that
creates it:

> When a feature on `develop` stops reading a column, the code change is safe to
> ship immediately — but **dropping the column is not**, because production is
> still running older code that selects it. A `select('… show_in_home …')`
> against a dropped column is a PostgREST error, `loadSectionConfig` throws, and
> `bootstrap()` fails: production's Home stops loading entirely.

So the drop is not "pending work someone forgot" — it is work that is
**correctly blocked** on the release. This file is where those drops wait, so
that the fact does not live only in a code comment. A comment is remembered, not
scheduled.

## The rule

1. When develop stops using a column, **stop writing and selecting it in the
   same change** — that part ships normally.
2. Leave the column in place. It must be nullable or carry a default, so the
   old code keeps working and the new code's inserts still satisfy it.
3. **Add a row to the queue below**, naming the column, the version that stopped
   reading it, and what still reads it.
4. When a release lands on `master` and production is running that code, run the
   queued drops and tick them off here.

## The queue

| Column | Stopped being read | Still read by | Safe to drop once |
|---|---|---|---|
| `user_section_config.show_in_home` | v1.4.2 (roadmap 018 unit 6) — the fused Home is not a list of section cards, so nothing consumes it; `OverviewTab` was its last consumer and is deleted | `master`'s `loadSectionConfig`, which selects it explicitly | `master` runs 2.0.0 or later |

The column is `boolean NOT NULL DEFAULT true`, so it keeps filling itself in
while it waits — the app not sending it is harmless.

The migration, when it runs:

```sql
alter table user_section_config drop column show_in_home;
```

### Also queued: the two adaptation leftovers from 019

Not column drops, but blocked by exactly the same shared-database rule — `master`
still renders nine adaptations, so neither can run before the release.

| Item | Stopped being read | Still read by | Safe to change once |
|---|---|---|---|
| `adaptation_targets` rows `speed` and `skill` | v2.0.0 (roadmap 019) — `ADAPTATIONS` no longer contains those keys, so nothing looks them up | `master`, which renders both adaptations and reads their stored targets | `master` runs 2.0.0 or later |
| `exercises_default_adaptation_check` still allows all nine values | v2.0.0 (roadmap 019) — the app only ever writes the seven | Nothing; it is permissive, so it costs nothing while it waits | `master` runs 2.0.0 or later |

Neither is urgent: dead rows nothing selects, and a constraint that is wider than
the app. They are here so the fact is scheduled rather than remembered. When they
run:

```sql
delete from adaptation_targets where adaptation in ('speed', 'skill');

alter table exercises drop constraint exercises_default_adaptation_check;
alter table exercises add constraint exercises_default_adaptation_check
  check (default_adaptation = any (array[
    'power', 'strength', 'hypertrophy', 'muscular_endurance',
    'anaerobic_capacity', 'vo2max', 'endurance'
  ]));
```

### Also queued: the Habits tables (035)

The Habits section was deleted from `develop` on 2026-09-05
([done/035](done/035-habits-expiry-deletion.md)): nothing on `develop` selects,
inserts or updates these two tables any more. `master` (1.x) still loads both
in `bootstrap()`, so dropping them now would break production's Home exactly
like the column drop above would.

| Item | Stopped being read | Still read by | Safe to drop once |
|---|---|---|---|
| `habits`, `habit_completions` (whole tables) | v1.18.0 (roadmap 035) — `src/lib/db/habits.ts` is deleted and nothing imports the types | `master`'s `bootstrap()`, which loads both on every start | `master` runs 2.0.0 or later |

Two things to know before running it (foreign keys confirmed against the live
schema on 2026-09-05). `habit_completions.habit_id` references `habits`, so the
order below matters. And `habits` references both `muscle_groups` and
`exercises` — the reason the Admin editor could never delete a group a habit
pointed at — so until the drop, a leftover habit row keeps blocking that delete
(the editor now words it as "something still references it").

```sql
drop table habit_completions;
drop table habits;
```

## Acceptance

- [ ] `master` is running the code that stopped reading these columns and rows.
- [ ] Each queued drop is applied as a tracked migration (per
      [016-supabase-migration-baseline.md](016-supabase-migration-baseline.md)),
      and its row is ticked off above.
- [ ] `select('*')` from the affected tables shows no leftover column, the
      `adaptation_targets` table holds seven rows, the check constraint names
      seven values, `habits` and `habit_completions` no longer exist, and the
      app still bootstraps on both branches.
