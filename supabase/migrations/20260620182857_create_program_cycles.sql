create table program_cycles (
  id uuid primary key default uuid_generate_v4(),
  user_program_id uuid not null references user_programs(id) on delete cascade,
  cycle_number integer not null,
  start_date date not null,
  end_date date,
  status text not null default 'active' check (status in ('active','paused','completed','abandoned')),
  created_at timestamptz not null default now(),
  unique (user_program_id, cycle_number)
);
alter table program_cycles enable row level security;
create policy "MVP open — tighten in v1.1" on program_cycles for all using (true);;
