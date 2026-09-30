-- A third target shape: weekly minutes (tekio.rfcs/rfcs/done/0012-adaptation-target-shapes.md).
--
-- The build reads a row by the first non-zero of minutes → sessions → sets
-- (`targetShape` in src/lib/adaptations.ts), so a row can carry its new shape
-- beside the legacy value the build on `master` still reads:
--
--   power      weekly_session_target 2 — per muscle; master keeps reading
--              weekly_muscle_target 6, which the new build no longer consults.
--   endurance  weekly_minutes_target 150 — master keeps reading
--              weekly_session_target 2 and never selects this column.
--
-- Expand only. Zeroing the two legacy values is contract work and waits for
-- the release sweep (tekio.rfcs/rfcs/0080-release-2-1-0-schema-drops.md).
ALTER TABLE public.adaptation_targets
  ADD COLUMN IF NOT EXISTS weekly_minutes_target integer NOT NULL DEFAULT 0;

ALTER TABLE public.adaptation_targets
  DROP CONSTRAINT IF EXISTS adaptation_targets_weekly_minutes_target_check;
ALTER TABLE public.adaptation_targets
  ADD CONSTRAINT adaptation_targets_weekly_minutes_target_check
  CHECK (weekly_minutes_target >= 0);

UPDATE public.adaptation_targets
  SET weekly_session_target = 2, updated_at = now()
  WHERE adaptation = 'power';

UPDATE public.adaptation_targets
  SET weekly_minutes_target = 150, updated_at = now()
  WHERE adaptation = 'endurance';
