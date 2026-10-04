-- Rename the skill_* domain to sport_* for naming consistency (MVP-phase refactor).
-- ALTER ... RENAME preserves all existing rows and FK integrity.

-- Tables
alter table public.skill_sessions        rename to sport_sessions;
alter table public.skill_types           rename to sport_types;
alter table public.skill_areas           rename to sport_areas;
alter table public.skill_drills          rename to sport_drills;
alter table public.skill_progressions    rename to sport_progressions;
alter table public.skill_session_drills  rename to sport_session_drills;

-- Columns: skill_type_id -> sport_type_id
alter table public.sport_sessions rename column skill_type_id to sport_type_id;
alter table public.sport_areas    rename column skill_type_id to sport_type_id;
alter table public.goals          rename column skill_type_id to sport_type_id;

-- Columns: skill_area_id -> sport_area_id
alter table public.sport_drills       rename column skill_area_id to sport_area_id;
alter table public.sport_progressions rename column skill_area_id to sport_area_id;

-- New: average heart rate on a sport session
alter table public.sport_sessions add column if not exists avg_heart_rate integer;

-- Section config key used by the app's nav/home
update public.user_section_config set section_key = 'Sports' where section_key = 'Skills';
