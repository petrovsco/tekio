-- Recovery / Readiness axis: sauna + cold plunge session tables, and open up the
-- pre-scaffolded sleep_logs table for the (auth-less, single-user) app.
-- All additive; mirrors the MVP-open RLS posture used by cardio_sessions/water_logs.

create table if not exists public.sauna_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  session_date date not null,
  duration_minutes numeric not null,
  temperature_c numeric,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.cold_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  session_date date not null,
  duration_minutes numeric not null,
  temperature_c numeric,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.sauna_sessions enable row level security;
alter table public.cold_sessions  enable row level security;

-- MVP-open policies (wide-open by design for the single-user MVP; see RLS posture note).
create policy "MVP open — tighten in v1.1" on public.sauna_sessions for all using (true) with check (true);
create policy "MVP open — tighten in v1.1" on public.cold_sessions  for all using (true) with check (true);

-- sleep_logs already exists but lacked the MVP-open policy, so the anon/single-user app couldn't touch it.
create policy "MVP open — tighten in v1.1" on public.sleep_logs for all using (true) with check (true);

create index if not exists sauna_sessions_user_date_idx on public.sauna_sessions (user_id, session_date desc);
create index if not exists cold_sessions_user_date_idx  on public.cold_sessions  (user_id, session_date desc);

comment on table public.sauna_sessions is 'Sauna recovery sessions (Recovery/Readiness axis).';
comment on table public.cold_sessions  is 'Cold plunge / cold-exposure recovery sessions (Recovery/Readiness axis).';
