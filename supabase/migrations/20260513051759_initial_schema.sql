
-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================================
-- DOMAIN 1: USERS & PROFILES
-- ============================================================================
create table user_profiles (
  id              uuid primary key,
  display_name    text,
  units           text not null default 'metric'
                    check (units in ('metric', 'imperial')),
  progression_model text not null default 'volume'
                    check (progression_model in ('volume', 'intensity', 'rpe', 'auto')),
  timezone        text not null default 'UTC',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table user_profiles is 'App-level user preferences. One row per auth user.';
comment on column user_profiles.progression_model is 'Which overload signal drives suggestions: volume (w×r), intensity (% 1RM zones), rpe, or auto (system picks).';

-- ============================================================================
-- DOMAIN 2: EXERCISE CATALOG
-- ============================================================================
create table movement_patterns (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  description text
);
comment on table movement_patterns is 'Biomechanical movement categories for exercise classification.';

create table muscle_groups (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  body_region text not null
                check (body_region in ('upper', 'lower', 'core', 'full_body'))
);

create table exercises (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid references user_profiles(id) on delete cascade,
  name                text not null,
  movement_pattern_id uuid references movement_patterns(id),
  equipment           text check (equipment in (
                        'barbell', 'dumbbell', 'kettlebell', 'bodyweight',
                        'machine', 'cable', 'band', 'other'
                      )),
  is_unilateral       boolean not null default false,
  is_system           boolean not null default false,
  created_at          timestamptz not null default now(),
  unique (user_id, name)
);
create index idx_exercises_user on exercises(user_id);
create index idx_exercises_system on exercises(is_system) where is_system = true;

create table exercise_muscle_groups (
  exercise_id     uuid not null references exercises(id) on delete cascade,
  muscle_group_id uuid not null references muscle_groups(id) on delete cascade,
  role            text not null check (role in ('primary', 'secondary', 'stabilizer')),
  primary key (exercise_id, muscle_group_id)
);
comment on column exercise_muscle_groups.role is 'primary = main mover, secondary = assist, stabilizer = isometric support.';

-- ============================================================================
-- DOMAIN 3: PROGRAM DESIGN
-- ============================================================================
create table programs (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references user_profiles(id) on delete cascade,
  name                text not null,
  description         text,
  cycle_length_weeks  int not null default 6,
  deload_week         int,
  deload_strategy     jsonb not null default '{"type": "reps", "factor": 0.7}'::jsonb,
  visibility          text not null default 'private'
                        check (visibility in ('private', 'public', 'unlisted')),
  forked_from_id      uuid references programs(id) on delete set null,
  is_template         boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_programs_user on programs(user_id);
create index idx_programs_public on programs(visibility) where visibility = 'public';
comment on column programs.deload_strategy is 'JSON: {"type": "reps"|"weight"|"both", "factor": 0.7}. Controls how deload targets are calculated.';
comment on column programs.forked_from_id is 'If this program was forked/cloned from another, points to the source. Enables sharing lineage.';

create table program_phases (
  id              uuid primary key default uuid_generate_v4(),
  program_id      uuid not null references programs(id) on delete cascade,
  name            text not null,
  sort_order      int not null default 0,
  duration_weeks  int not null default 4,
  goal            text check (goal in (
                    'strength', 'hypertrophy', 'endurance', 'power', 'deload', 'skill', 'general'
                  )),
  modifiers       jsonb not null default '{}'::jsonb,
  unique (program_id, sort_order)
);
comment on column program_phases.modifiers is 'Phase-level overrides: volume_pct, intensity_zone, rpe_target. Applied on top of base day prescriptions.';

create table program_days (
  id          uuid primary key default uuid_generate_v4(),
  program_id  uuid not null references programs(id) on delete cascade,
  phase_id    uuid references program_phases(id) on delete set null,
  name        text not null,
  sort_order  int not null default 0,
  unique (program_id, phase_id, sort_order)
);
create index idx_program_days_program on program_days(program_id);

create table program_day_exercises (
  id              uuid primary key default uuid_generate_v4(),
  program_day_id  uuid not null references program_days(id) on delete cascade,
  exercise_id     uuid not null references exercises(id) on delete cascade,
  sort_order      int not null default 0,
  notes           text,
  unique (program_day_id, sort_order)
);

create table program_day_sets (
  id                  uuid primary key default uuid_generate_v4(),
  day_exercise_id     uuid not null references program_day_exercises(id) on delete cascade,
  set_number          int not null,
  target_weight       decimal,
  target_reps         int,
  target_rpe          decimal(3,1),
  target_rir          int,
  rest_seconds        int,
  notes               text,
  unique (day_exercise_id, set_number)
);
comment on table program_day_sets is 'Prescribed set targets. NULL target_weight means "use progression engine to compute".';

create table program_supersets (
  id              uuid primary key default uuid_generate_v4(),
  program_day_id  uuid not null references program_days(id) on delete cascade,
  exercise_a_id   uuid not null references program_day_exercises(id) on delete cascade,
  exercise_b_id   uuid not null references program_day_exercises(id) on delete cascade,
  check (exercise_a_id <> exercise_b_id),
  unique (program_day_id, exercise_a_id, exercise_b_id)
);

create table user_programs (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references user_profiles(id) on delete cascade,
  program_id        uuid not null references programs(id) on delete cascade,
  start_date        date not null,
  current_day_index int not null default 0,
  last_advanced_date date,
  current_phase_id  uuid references program_phases(id) on delete set null,
  status            text not null default 'active'
                      check (status in ('active', 'paused', 'completed')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index idx_user_programs_active on user_programs(user_id, status) where status = 'active';

-- ============================================================================
-- DOMAIN 4: TRAINING LOG
-- ============================================================================
create table training_sessions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references user_profiles(id) on delete cascade,
  session_date    date not null,
  user_program_id uuid references user_programs(id) on delete set null,
  program_day_id  uuid references program_days(id) on delete set null,
  started_at      timestamptz,
  ended_at        timestamptz,
  duration_minutes int,
  is_deload       boolean not null default false,
  notes           text,
  created_at      timestamptz not null default now()
);
create index idx_sessions_user_date on training_sessions(user_id, session_date desc);
create index idx_sessions_program on training_sessions(user_program_id) where user_program_id is not null;

create table session_exercises (
  id                  uuid primary key default uuid_generate_v4(),
  session_id          uuid not null references training_sessions(id) on delete cascade,
  exercise_id         uuid not null references exercises(id) on delete cascade,
  sort_order          int not null default 0,
  superset_group_id   uuid,
  overall_rpe         decimal(3,1),
  notes               text
);
create index idx_session_exercises_session on session_exercises(session_id);
create index idx_session_exercises_exercise on session_exercises(exercise_id);
create index idx_session_exercises_superset on session_exercises(superset_group_id)
  where superset_group_id is not null;

create table session_sets (
  id                      uuid primary key default uuid_generate_v4(),
  session_exercise_id     uuid not null references session_exercises(id) on delete cascade,
  set_number              int not null,
  weight                  decimal not null,
  reps                    int not null,
  rpe                     decimal(3,1),
  rir                     int,
  rest_seconds            int,
  is_warmup               boolean not null default false,
  notes                   text,
  target_weight           decimal,
  target_reps             int,
  target_rpe              decimal(3,1),
  unique (session_exercise_id, set_number)
);
comment on table session_sets is 'Individual sets with both actual performance and prescribed targets. The delta drives the progression engine.';

create table progression_adjustments (
  id                      uuid primary key default uuid_generate_v4(),
  user_program_id         uuid not null references user_programs(id) on delete cascade,
  exercise_id             uuid not null references exercises(id) on delete cascade,
  triggered_by_session_id uuid references training_sessions(id) on delete set null,
  adjustment_type         text not null check (adjustment_type in (
                            'increase_weight', 'increase_reps', 'increase_sets',
                            'decrease_weight', 'decrease_reps', 'maintain', 'deload'
                          )),
  old_targets             jsonb not null,
  new_targets             jsonb not null,
  reason                  text,
  created_at              timestamptz not null default now()
);
create index idx_adjustments_program on progression_adjustments(user_program_id);

-- ============================================================================
-- DOMAIN 5: SKILLS & DRILLS
-- ============================================================================
create table skill_types (
  id        uuid primary key default uuid_generate_v4(),
  name      text not null,
  user_id   uuid references user_profiles(id) on delete cascade,
  category  text check (category in ('sport', 'martial_art', 'dance', 'music', 'other')),
  is_system boolean not null default false,
  unique (user_id, name)
);

create table skill_areas (
  id              uuid primary key default uuid_generate_v4(),
  skill_type_id   uuid not null references skill_types(id) on delete cascade,
  name            text not null,
  description     text,
  unique (skill_type_id, name)
);

create table skill_drills (
  id              uuid primary key default uuid_generate_v4(),
  skill_area_id   uuid not null references skill_areas(id) on delete cascade,
  name            text not null,
  description     text,
  user_id         uuid references user_profiles(id) on delete cascade,
  unique (skill_area_id, name)
);

create table skill_sessions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references user_profiles(id) on delete cascade,
  skill_type_id   uuid not null references skill_types(id) on delete cascade,
  session_date    date not null,
  with_trainer    boolean not null default false,
  quality         int check (quality between 1 and 5),
  duration_minutes int,
  notes           text,
  created_at      timestamptz not null default now()
);
create index idx_skill_sessions_user on skill_sessions(user_id, session_date desc);

create table skill_session_drills (
  id              uuid primary key default uuid_generate_v4(),
  session_id      uuid not null references skill_sessions(id) on delete cascade,
  drill_id        uuid not null references skill_drills(id) on delete cascade,
  duration_minutes int,
  quality         int check (quality between 1 and 5),
  notes           text
);

create table skill_progressions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references user_profiles(id) on delete cascade,
  skill_area_id   uuid not null references skill_areas(id) on delete cascade,
  milestone_name  text not null,
  achieved_date   date,
  notes           text,
  sort_order      int not null default 0
);
create index idx_skill_progressions_user on skill_progressions(user_id, skill_area_id);

-- ============================================================================
-- DOMAIN 6: BODY METRICS & HEALTH
-- ============================================================================
create table bodyweight_logs (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references user_profiles(id) on delete cascade,
  log_date  date not null,
  weight    decimal not null,
  notes     text,
  unique (user_id, log_date)
);

create table body_composition_logs (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references user_profiles(id) on delete cascade,
  log_date        date not null,
  body_fat_pct    decimal,
  lean_mass_kg    decimal,
  method          text check (method in ('dexa', 'caliper', 'bioimpedance', 'visual', 'other')),
  notes           text
);

create table sleep_logs (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references user_profiles(id) on delete cascade,
  log_date        date not null,
  duration_hours  decimal,
  quality         int check (quality between 1 and 5),
  bedtime         time,
  wake_time       time,
  hrv             int,
  resting_hr      int,
  notes           text,
  unique (user_id, log_date)
);

create table health_metrics (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references user_profiles(id) on delete cascade,
  log_date    date not null,
  metric_type text not null,
  value       decimal not null,
  unit        text not null,
  notes       text
);
create index idx_health_metrics_user on health_metrics(user_id, metric_type, log_date desc);

create table blood_work_panels (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references user_profiles(id) on delete cascade,
  panel_date date not null,
  lab_name   text,
  notes      text,
  created_at timestamptz not null default now()
);

create table blood_work_markers (
  id          uuid primary key default uuid_generate_v4(),
  panel_id    uuid not null references blood_work_panels(id) on delete cascade,
  marker_name text not null,
  value       decimal not null,
  unit        text not null,
  ref_min     decimal,
  ref_max     decimal,
  flag        text check (flag in ('normal', 'high', 'low', 'critical_high', 'critical_low'))
);

create table blood_donations (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references user_profiles(id) on delete cascade,
  donation_date   date not null,
  donation_type   text not null check (donation_type in ('full_blood', 'plasma', 'platelets')),
  notes           text
);
create index idx_donations_user on blood_donations(user_id, donation_date desc);

create table nutrition_logs (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references user_profiles(id) on delete cascade,
  log_date  date not null,
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack', 'daily_total')),
  calories  int,
  protein_g decimal,
  carbs_g   decimal,
  fat_g     decimal,
  fiber_g   decimal,
  notes     text
);
create index idx_nutrition_user on nutrition_logs(user_id, log_date desc);

create table supplements (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references user_profiles(id) on delete cascade,
  name       text not null,
  dosage     text,
  frequency  text,
  active     boolean not null default true,
  notes      text,
  created_at timestamptz not null default now()
);

create table supplement_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references user_profiles(id) on delete cascade,
  supplement_id uuid not null references supplements(id) on delete cascade,
  log_date      date not null,
  taken         boolean not null default true,
  notes         text,
  unique (supplement_id, log_date)
);

-- ============================================================================
-- DOMAIN 7: CARDIO & MOBILITY
-- ============================================================================
create table cardio_sessions (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references user_profiles(id) on delete cascade,
  session_date     date not null,
  activity_type    text not null check (activity_type in (
                     'running', 'cycling', 'swimming', 'rowing', 'walking',
                     'hiking', 'elliptical', 'jump_rope', 'other'
                   )),
  duration_minutes int not null,
  distance_km      decimal,
  avg_heart_rate   int,
  max_heart_rate   int,
  zone_distribution jsonb,
  notes            text,
  created_at       timestamptz not null default now()
);
create index idx_cardio_user on cardio_sessions(user_id, session_date desc);

create table mobility_sessions (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references user_profiles(id) on delete cascade,
  session_date   date not null,
  total_duration int,
  notes          text,
  created_at     timestamptz not null default now()
);

create table mobility_exercises (
  id               uuid primary key default uuid_generate_v4(),
  session_id       uuid not null references mobility_sessions(id) on delete cascade,
  exercise_name    text not null,
  duration_minutes int,
  notes            text
);

-- ============================================================================
-- DOMAIN 8: GOALS
-- ============================================================================
create table goals (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references user_profiles(id) on delete cascade,
  goal_type     text not null check (goal_type in (
                  'one_rm', 'body_weight', 'body_fat', 'skill_milestone',
                  'volume', 'endurance', 'custom'
                )),
  exercise_id   uuid references exercises(id) on delete set null,
  skill_type_id uuid references skill_types(id) on delete set null,
  target_value  decimal not null,
  target_unit   text not null,
  current_value decimal,
  deadline      date,
  status        text not null default 'active'
                  check (status in ('active', 'achieved', 'abandoned')),
  achieved_date date,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_goals_user on goals(user_id, status);

create table goal_milestones (
  id           uuid primary key default uuid_generate_v4(),
  goal_id      uuid not null references goals(id) on delete cascade,
  name         text not null,
  target_value decimal not null,
  achieved_date date,
  sort_order   int not null default 0,
  notes        text
);

create table program_goal_links (
  program_id   uuid not null references programs(id) on delete cascade,
  goal_id      uuid not null references goals(id) on delete cascade,
  relationship text not null default 'primary'
                 check (relationship in ('primary', 'supporting')),
  primary key (program_id, goal_id)
);
comment on table program_goal_links is 'Links programs to goals. A volleyball jump goal can be supported by a quad-focused lifting program.';
;
