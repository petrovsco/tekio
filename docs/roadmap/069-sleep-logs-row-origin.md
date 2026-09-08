# Roadmap: `sleep_logs` was left out of row-origin tagging

**Label:** bug
**Status:** planned — found on the way through
[048](done/048-simplification-candidates.md); filed 2026-09-08 with the fact
corrected (see *048 called this a one-line fix; it is not*).

## Goal

Every root row a person writes from the app records which build wrote it —
`dev`, `staging`, or null for production. That is
[037](done/037-row-origin-tagging.md)'s guarantee, and it is what lets anyone
looking at the training log later tell a row the user really logged from a row
somebody created while trying something out.

**A night of sleep typed into the app does not record it.** Fourteen tables
carry the `origin` column; `sleep_logs` is not one of them, and
`saveSleepEntry` (`src/lib/db/recovery.ts`, the `upsert` on
`sleep_logs`) is the one write in `recovery.ts` that does not call
`withOrigin(...)` — the `insert` for sauna and cold sessions a few lines below
it does.

So a night logged from localhost or from stg-tekio.shamatoff.com lands looking
exactly like a night Peter typed on the real site. Nothing deletes it — the
release sweep that used to read these tags was withdrawn on 2026-09-05 after it
destroyed real data ([053](done/053-recover-swept-staging-rows.md)) — but the
attribution is wrong, and attribution is the whole point of the column.

## Why it is worth fixing

Sleep is not a minor table. It is one of the systemic recovery inputs doctrine
§P5 names, it feeds the readiness read on Home, and it is the table most likely
to be written by hand *during a browser check* — "log a night, see whether the
sheet updates" is the standard way to verify a Recovery change. Every one of
those checks currently leaves a row indistinguishable from a real one.

It is also the last hole in 037. The brief says *every* user-write root row;
the code says thirteen of fourteen tables and one file with two writes that
disagree with each other.

## 048 called this a one-line fix; it is not

[048](done/048-simplification-candidates.md)'s "found on the way" list says
*"One-line fix"* — add `withOrigin(...)` to the upsert. That is wrong, and
acting on it would break every sleep save from dev and staging:

- **`sleep_logs` has no `origin` column at all.** Checked against the live
  database on 2026-09-08: the fourteen tables that have one are
  `blood_donations`, `bodyweight_logs`, `cardio_sessions`, `cold_sessions`,
  `exercise_aliases`, `exercises`, `mobility_sessions`, `programs`,
  `sauna_sessions`, `sport_sessions`, `sport_types`, `training_sessions`,
  `user_programs`, `water_logs`. `withOrigin` on a table without the column
  sends an unknown column and PostgREST rejects the whole insert.
- So the fix is **a tracked migration plus the one line**, not the one line.
  The migration also has to install the `preserve_origin` trigger on the
  table — the `do $$ … $$` loops in
  `supabase/migrations/20260901110325_row_origin_tagging.sql` are the shape to
  copy.

The trigger is load-bearing here for exactly the reason the 037 migration's own
comment gives about bodyweight: `saveSleepEntry` is an **upsert on
`(user_id, log_date)`**, so a manual save on a night the Garmin sync already
created takes the conflict branch, which runs as an `UPDATE`. Without the
write-once trigger that update would stamp `origin = 'dev'` onto a row the sync
had created; with it, the row keeps the origin it was born with.

## Change

1. **Migration** — `add column if not exists origin text` on `sleep_logs`, plus
   `create trigger sleep_logs_preserve_origin before update … execute function
   public.preserve_origin()`. Additive and null-defaulted, so it cannot disturb
   an existing row. Track it the way the repo already tracks migrations
   (`supabase/migrations/`, mirrored server-side), under the policy in
   [024](024-staging-shared-database-safety.md).
2. **One line** — `withOrigin(...)` around the upsert payload in
   `saveSleepEntry`.

Nothing else in `recovery.ts` changes: `updateSleepEntry` must stay untagged
(an update never re-tags — that is the trigger's job), and the sauna/cold
writes are already correct.

## Out of scope

- **Back-filling the rows already written.** They are indistinguishable by
  definition; guessing which past nights came from a browser check would put a
  false tag in the record, which is worse than a null one.
- **`mobility_exercises`.** It was deliberately *un*-tagged by
  `20260901112000_row_origin_untag_mobility_exercises.sql` — a catalogue row,
  not a user-write root. Leave it.
- **Anything that reads the tag.** There is no sweep and this brief does not
  bring one back; 037's column is attribution only.

## Doctrine checklist

1. **Which read does this sharpen?** None directly — it protects the honesty of
   the data every recovery read sits on.
2. **What does it let me stop doing?** Wondering, when a strange night shows up
   in the log, whether it was real.
3. **Input or destination?** Neither; a column.
4. **Honest shape?** Not applicable.
5. **Physiological number?** No. Nothing about sleep's meaning changes.

## Acceptance

- [ ] `sleep_logs` has an `origin` column and a `preserve_origin` trigger,
      added by a tracked migration
- [ ] `saveSleepEntry` writes through `withOrigin(...)`
- [ ] A sleep entry saved from `npm run dev` lands with `origin = 'dev'`;
      re-saving the same night from dev on a row that already exists leaves the
      original `origin` untouched (the write-once check)
- [ ] The 048 entry is corrected in place so the "one-line fix" claim is not
      read again as true
