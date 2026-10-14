-- tekio.rfcs/rfcs/0107-timed-sets.md: holds (plank, dead hang, wall sit...)
-- measured in seconds. A timed set is one rep held for duration_s seconds, so
-- the reps column stays valid for every reader that knows nothing of time.
--
-- Expand only (supabase/README.md, the migration policy): a nullable column
-- the build on master never selects.
alter table public.session_sets
  add column if not exists duration_s integer
    check (duration_s is null or duration_s > 0);

comment on column public.session_sets.duration_s is
  'Seconds a hold lasted; null for a set counted in reps. A timed set stores reps = 1. RFC 0107.';
