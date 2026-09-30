-- The 2.1.0 release sweep (tekio.rfcs/rfcs/done/0080-release-2-1-0-schema-drops.md).
--
-- Runs after 2.1.0 reached `master`, so no build still reads what goes here.
-- It removes schema, never rows (supabase/README.md, migration policy §5).

-- Retired with the tracked-groups setting in v2.0.108
-- (tekio.rfcs/rfcs/done/0046-retire-tracked-muscle-groups.md).
ALTER TABLE public.user_profiles
  DROP COLUMN IF EXISTS tracked_muscle_group_ids;

-- The two legacy target values kept only for the 2.0.x reader
-- (tekio.rfcs/rfcs/done/0012-adaptation-target-shapes.md). 2.1.0 reads a row
-- by the first non-zero of minutes → sessions → sets, so these were never
-- consulted: power reads 2 sessions per muscle, endurance 150 minutes.
UPDATE public.adaptation_targets
  SET weekly_muscle_target = 0, updated_at = now()
  WHERE adaptation = 'power';

UPDATE public.adaptation_targets
  SET weekly_session_target = 0, updated_at = now()
  WHERE adaptation = 'endurance';
