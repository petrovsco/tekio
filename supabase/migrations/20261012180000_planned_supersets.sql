-- tekio.rfcs/rfcs/0106-planned-supersets.md: planned lifts done back to back.
-- Plans sharing a value are one superset (two lifts) or circuit (three or
-- more), ordered by sort_order. Logging a grouped plan writes the same uuid to
-- session_exercises.superset_group_id, so plan and log agree with no mapping.
--
-- Expand only (supabase/README.md, the migration policy): a nullable column
-- the build on master never selects.
alter table public.planned_exercises
  add column if not exists superset_group_id uuid;

comment on column public.planned_exercises.superset_group_id is
  'Shared by the lifts of one planned superset or circuit; copied onto the logged session_exercises row. RFC 0106.';
