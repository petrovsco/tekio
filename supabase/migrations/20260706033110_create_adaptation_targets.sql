create table if not exists adaptation_targets (
  adaptation text primary key,
  weekly_muscle_target integer not null default 0,
  weekly_session_target integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into adaptation_targets (adaptation, weekly_muscle_target, weekly_session_target) values
  ('skill', 0, 3),
  ('speed', 3, 0),
  ('power', 4, 0),
  ('strength', 8, 0),
  ('hypertrophy', 10, 0),
  ('muscular_endurance', 6, 0),
  ('anaerobic_capacity', 0, 1),
  ('vo2max', 0, 1),
  ('endurance', 0, 2)
on conflict (adaptation) do nothing;;
