-- Release 2.2.0 schema drops (tekio.rfcs/rfcs/0088-release-2-2-0-schema-drops.md).
-- Runs after 2.2.0 reached master: no build still reads these. Dropping the
-- program tables and water_logs deletes their rows, on the owner's word; both
-- were exported first. The two assistant edge functions are deleted before it.
alter table training_sessions drop column if exists user_program_id, drop column if exists program_day_id;
drop table if exists
  program_week_overrides, program_cycles, progression_adjustments,
  program_supersets, program_day_sets, program_day_exercises, program_day_blocks,
  program_days, program_phases, user_programs, programs
  cascade;
drop table if exists assistant_settings;
drop table if exists water_logs;
