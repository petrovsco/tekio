create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  icon text,
  cadence text not null check (cadence in ('daily','weekly','monthly')),
  target_count numeric not null default 1,
  unit text,
  muscle_group_id uuid references muscle_groups(id),
  exercise_id uuid references exercises(id),
  auto_source text not null default 'none'
    check (auto_source in ('none','weight_sets','mobility_minutes','water','cardio_sessions')),
  count_level smallint not null default 1 check (count_level between 1 and 3),
  contribution text not null default 'stimulus' check (contribution in ('stimulus','recovery')),
  active boolean not null default true,
  sort_order integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  period_start date not null,
  count numeric not null default 1,
  completed_at timestamptz not null default now(),
  notes text,
  unique (habit_id, period_start)
);

create index if not exists idx_habits_user on habits(user_id);
create index if not exists idx_habit_completions_habit on habit_completions(habit_id);

alter table habits enable row level security;
alter table habit_completions enable row level security;

create policy "MVP open — tighten in v1.1" on habits
  for all to public using (true) with check (true);
create policy "MVP open — tighten in v1.1" on habit_completions
  for all to public using (true) with check (true);;
