-- Finish the skill_* -> sport_* rename: constraint & index NAMES only.
-- The July 2026 `rename_skill_domain_to_sport` migration renamed tables and
-- columns, but Postgres does not auto-rename dependent constraint/index names,
-- so objects like `skill_sessions_pkey` still linger on the sport_* tables.
-- This is purely cosmetic (no table/column/data changes) and reversible.
--
-- Note on technique:
--   * PRIMARY KEY / UNIQUE constraints are backed by an index of the same name.
--     `ALTER INDEX ... RENAME TO` renames BOTH the index and its associated
--     constraint in one statement, so those go through ALTER INDEX below.
--   * FOREIGN KEY / CHECK constraints have no backing index, so they use
--     `ALTER TABLE ... RENAME CONSTRAINT`.

-- ----------------------------------------------------------------------------
-- 1. PK / UNIQUE constraints (+ their backing index) via ALTER INDEX
-- ----------------------------------------------------------------------------
alter index public.skill_areas_pkey                    rename to sport_areas_pkey;
alter index public.skill_areas_skill_type_id_name_key  rename to sport_areas_sport_type_id_name_key;
alter index public.skill_drills_pkey                   rename to sport_drills_pkey;
alter index public.skill_drills_skill_area_id_name_key rename to sport_drills_sport_area_id_name_key;
alter index public.skill_progressions_pkey             rename to sport_progressions_pkey;
alter index public.skill_session_drills_pkey           rename to sport_session_drills_pkey;
alter index public.skill_sessions_pkey                 rename to sport_sessions_pkey;
alter index public.skill_types_pkey                    rename to sport_types_pkey;
alter index public.skill_types_user_id_name_key        rename to sport_types_user_id_name_key;

-- ----------------------------------------------------------------------------
-- 2. Plain (non-constraint) indexes via ALTER INDEX
-- ----------------------------------------------------------------------------
alter index public.idx_skill_progressions_user rename to idx_sport_progressions_user;
alter index public.idx_skill_sessions_user     rename to idx_sport_sessions_user;

-- ----------------------------------------------------------------------------
-- 3. FOREIGN KEY / CHECK constraints via ALTER TABLE ... RENAME CONSTRAINT
-- ----------------------------------------------------------------------------
-- sport_areas
alter table public.sport_areas rename constraint skill_areas_skill_type_id_fkey to sport_areas_sport_type_id_fkey;

-- sport_drills
alter table public.sport_drills rename constraint skill_drills_skill_area_id_fkey to sport_drills_sport_area_id_fkey;
alter table public.sport_drills rename constraint skill_drills_user_id_fkey       to sport_drills_user_id_fkey;

-- sport_progressions
alter table public.sport_progressions rename constraint skill_progressions_skill_area_id_fkey to sport_progressions_sport_area_id_fkey;
alter table public.sport_progressions rename constraint skill_progressions_user_id_fkey       to sport_progressions_user_id_fkey;

-- sport_session_drills
alter table public.sport_session_drills rename constraint skill_session_drills_drill_id_fkey   to sport_session_drills_drill_id_fkey;
alter table public.sport_session_drills rename constraint skill_session_drills_session_id_fkey to sport_session_drills_session_id_fkey;
alter table public.sport_session_drills rename constraint skill_session_drills_quality_check   to sport_session_drills_quality_check;

-- sport_sessions
alter table public.sport_sessions rename constraint skill_sessions_skill_type_id_fkey to sport_sessions_sport_type_id_fkey;
alter table public.sport_sessions rename constraint skill_sessions_user_id_fkey       to sport_sessions_user_id_fkey;
alter table public.sport_sessions rename constraint skill_sessions_quality_check      to sport_sessions_quality_check;
alter table public.sport_sessions rename constraint skill_sessions_result_check       to sport_sessions_result_check;

-- sport_types
alter table public.sport_types rename constraint skill_types_category_check to sport_types_category_check;
alter table public.sport_types rename constraint skill_types_user_id_fkey   to sport_types_user_id_fkey;

-- goals (column skill_type_id was renamed to sport_type_id in the prior migration)
alter table public.goals rename constraint goals_skill_type_id_fkey to goals_sport_type_id_fkey;
