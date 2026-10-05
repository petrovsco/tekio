-- tekio.rfcs/rfcs/0098-planned-exercises.md: work written ahead of time, by the
-- user or an agent, that has not happened yet.
--
-- Its own table, not a status column on session_exercises: the build on
-- master reads every session_exercises row it finds, so a planned row there
-- would count as done on production until the release. Nothing that computes
-- a read selects from this table, so a plan cannot leak into a number.
--
-- Expand only (supabase/README.md, the migration policy): a new table the build
-- on master never reads.
create table if not exists public.planned_exercises (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        not null,
  plan_date           date        not null,
  -- The name as planned. It is resolved to an exercise only when the plan is
  -- logged, through the same path as any other log, so planning a new lift
  -- writes no exercise row and no muscle links.
  exercise            text        not null check (length(trim(exercise)) > 0),
  -- Targets, not results: [{"weight": 60, "reps": 8}, ...]. Logging may use
  -- other numbers; the logged sets live in session_sets as always.
  target_sets         jsonb       not null default '[]'::jsonb check (jsonb_typeof(target_sets) = 'array'),
  sort_order          integer     not null default 0,
  planned_by          text        not null default 'user' check (planned_by in ('user', 'agent')),
  -- Set when the plan is logged. A plan with no logged exercise and a past
  -- date expired unlogged; it never becomes work by itself.
  session_exercise_id uuid        references public.session_exercises(id) on delete set null,
  origin              text,
  created_at          timestamptz not null default now()
);

create index if not exists planned_exercises_user_date on public.planned_exercises (user_id, plan_date);

comment on table public.planned_exercises is
  'Planned exercises: work written ahead of time that never counts toward a read until logged. RFC 0098.';

-- Write-once origin tag, like every other user table (RFC 0037).
create or replace trigger planned_exercises_preserve_origin
  before update on public.planned_exercises
  for each row execute function public.preserve_origin();

alter table public.planned_exercises enable row level security;
create policy "MVP open — tighten in v1.1" on public.planned_exercises
  for all using (true) with check (true);
