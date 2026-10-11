-- tekio.rfcs/rfcs/0104-planned-cardio-and-mobility.md: plans for Cardio and
-- Mobility, the same state planned_exercises gives lifts (RFC 0098).
--
-- A table of its own, not a kind column on planned_exercises: the build on
-- master lists every planned_exercises row on its Weights card, so a cardio
-- plan there would show as a lift on production until the release. Nothing
-- that computes a read selects from this table, so a plan cannot leak into a
-- number.
--
-- Expand only (supabase/README.md, the migration policy): a new table the build
-- on master never reads.
create table if not exists public.planned_sessions (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        not null,
  plan_date           date        not null,
  kind                text        not null check (kind in ('cardio', 'sport', 'mobility')),
  -- The cardio type or the sport, as planned; empty for mobility, whose plan
  -- is its list of stretches.
  name                text        not null default '',
  -- Targets, not results. The shape follows the kind:
  --   cardio:   {"duration": 40, "distance": 6, "format": "intervals", "boutSeconds": 240}
  --   sport:    {"duration": 90}
  --   mobility: {"exercises": [{"name": "Hip flexor stretch", "duration": 3}]}
  -- Every key is optional; logging may use other numbers.
  target              jsonb       not null default '{}'::jsonb check (jsonb_typeof(target) = 'object'),
  notes               text,
  sort_order          integer     not null default 0,
  planned_by          text        not null default 'user' check (planned_by in ('user', 'agent')),
  -- Set when the plan is logged, on the column for its kind. A plan with no
  -- link and a past date expired unlogged; it never becomes work by itself.
  cardio_session_id   uuid        references public.cardio_sessions(id)   on delete set null,
  sport_session_id    uuid        references public.sport_sessions(id)    on delete set null,
  mobility_session_id uuid        references public.mobility_sessions(id) on delete set null,
  origin              text,
  created_at          timestamptz not null default now()
);

create index if not exists planned_sessions_user_date on public.planned_sessions (user_id, plan_date);

comment on table public.planned_sessions is
  'Planned cardio, sport and mobility sessions: work written ahead of time that never counts toward a read until logged. RFC 0104.';

-- Write-once origin tag, like every other user table (RFC 0037).
create or replace trigger planned_sessions_preserve_origin
  before update on public.planned_sessions
  for each row execute function public.preserve_origin();

alter table public.planned_sessions enable row level security;
create policy "MVP open — tighten in v1.1" on public.planned_sessions
  for all using (true) with check (true);
