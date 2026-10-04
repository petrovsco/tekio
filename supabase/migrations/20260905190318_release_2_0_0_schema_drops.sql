-- Roadmap 025: drops queued behind the 2.0.0 release (master runs 2.0.0 since 2026-09-05).

-- 1. user_section_config.show_in_home — unread since v1.4.2 (roadmap 018 unit 6).
alter table user_section_config drop column show_in_home;

-- 2. Nine → seven adaptations (roadmap 019): the two retired targets and the wider check.
delete from adaptation_targets where adaptation in ('speed', 'skill');

alter table exercises drop constraint exercises_default_adaptation_check;
alter table exercises add constraint exercises_default_adaptation_check
  check (default_adaptation = any (array[
    'power', 'strength', 'hypertrophy', 'muscular_endurance',
    'anaerobic_capacity', 'vo2max', 'endurance'
  ]));

-- 3. Habits section deleted (roadmap 035): its two tables and its leftover config row.
drop table habit_completions;
drop table habits;
delete from user_section_config where section_key = 'Habits';;
