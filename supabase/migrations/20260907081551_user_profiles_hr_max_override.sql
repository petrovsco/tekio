-- Typed HRmax override (roadmap 059). The app's HRmax is derived from the
-- user's own synced rows — the highest session max HR that a second session
-- comes within 3 bpm of, over a rolling 24 months (tekio.rfcs/rfcs/059
-- §Grounding) — never from an age formula, which misses an individual by
-- ±9–11 bpm. This column is the one typed exception: a chest-strap maximal
-- test. NULL = the observed peak stands alone, which is every profile before
-- this migration. In the app a synced peak more than 3 bpm above the
-- override wins back.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS hr_max_override integer;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_hr_max_override_check;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_hr_max_override_check
  CHECK (hr_max_override IS NULL OR hr_max_override > 0);
