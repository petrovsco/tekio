-- Bout length on intervals rows (roadmap 005). The work-bout length in seconds
-- — the 60 in "4×60 s", the 240 in a Norwegian 4×4. It decides which cardio
-- adaptation an `intervals` row credits: <= 120 s is anaerobic-capacity work,
-- longer is VO₂max (Gastin 2001; tekio.rfcs/grounding/005 run A). NULL = not stated,
-- which is every row before this migration; the classifier then falls back to
-- the Z5 dose and Garmin's TE tie-break. Meaningful only when format =
-- 'intervals'; the form shows the field only then (P1).
ALTER TABLE public.cardio_sessions
  ADD COLUMN IF NOT EXISTS bout_seconds integer;

ALTER TABLE public.cardio_sessions
  DROP CONSTRAINT IF EXISTS cardio_sessions_bout_seconds_check;
ALTER TABLE public.cardio_sessions
  ADD CONSTRAINT cardio_sessions_bout_seconds_check
  CHECK (bout_seconds IS NULL OR bout_seconds > 0);
