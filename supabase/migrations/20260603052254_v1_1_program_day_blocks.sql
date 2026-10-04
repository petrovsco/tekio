
-- ============================================================================
-- v1.1 — Multi-block program days
-- ============================================================================

-- New table: groups exercises into named blocks within a program day
create table program_day_blocks (
  id               uuid primary key default uuid_generate_v4(),
  program_day_id   uuid not null references program_days(id) on delete cascade,
  name             text not null,
  block_type       text not null check (block_type in (
                     'weight', 'mobility', 'conditioning', 'sport', 'warmup', 'recovery'
                   )),
  scheduled_time   text,          -- 'HH:MM' string, null = no fixed time
  duration_minutes int,
  notes            text,
  sort_order       int not null default 0
);

alter table program_day_blocks enable row level security;
create policy "MVP open — tighten in v1.1" on program_day_blocks for all using (true);
create index idx_program_day_blocks_day on program_day_blocks(program_day_id);

-- program_day_exercises: block link + rich prescription fields for non-weight exercises
alter table program_day_exercises
  add column block_id      uuid references program_day_blocks(id) on delete set null,
  add column training_tag  text check (training_tag in (
                             'STRENGTH', 'POWER', 'PREHAB', 'CORE',
                             'MOBILITY', 'CONDITIONING', 'WARMUP', 'RECOVERY', 'SKILL'
                           )),
  add column duration_text text,    -- '5 min', '30 min' for timed exercises
  add column tempo         text,    -- '3s eccentric', 'Zone 2', 'Max intent'
  add column sets_text     text,    -- '4', '3' — prescribed set count
  add column reps_text     text,    -- '5', '30s per side', '3 rotations each direction'
  add column weight_text   text;    -- '87 kg', 'bodyweight', 'light cable'

create index idx_program_day_exercises_block on program_day_exercises(block_id)
  where block_id is not null;

-- program_days: scheduling context and day-level metadata
alter table program_days
  add column day_of_week    text check (day_of_week in (
                              'Monday', 'Tuesday', 'Wednesday', 'Thursday',
                              'Friday', 'Saturday', 'Sunday'
                            )),
  add column focus          text,
  add column recovery_notes text[];

-- programs: support day-based cycles and protocol-level principles
alter table programs
  add column cycle_unit        text not null default 'weeks'
                                 check (cycle_unit in ('weeks', 'days')),
  add column weekly_principles jsonb;
;
