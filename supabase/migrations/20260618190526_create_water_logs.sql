create table public.water_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.user_profiles(id),
  log_date date not null,
  amount_ml integer not null check (amount_ml > 0),
  created_at timestamptz not null default now()
);

alter table public.water_logs enable row level security;

create policy "Users see own data" on public.water_logs
  for select using (user_id = auth.uid());

create policy "Users modify own data" on public.water_logs
  for all using (user_id = auth.uid());

create policy "MVP open — tighten in v1.1" on public.water_logs
  for all using (true) with check (true);
;
