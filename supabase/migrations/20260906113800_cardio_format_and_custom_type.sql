-- Garmin history backfill (roadmap 054). Two things the cardio history needs:
--
-- 1. `format`: a cardio type is the modality (running, rowing, ...) and any of
--    them can be done as intervals, so interval-ness is a second column, never
--    a fifth type. NULL = not stated, which is every row before this migration.
--    Garmin's `hiit` profile sets it to 'intervals'; a hand-logged row can say
--    so from the form. Roadmap 005 reads it.
-- 2. 'custom' joins activity_type for the HIIT sessions with no modality among
--    the four (EMOM, slam/jump). The Garmin name in `notes` says what it was.
ALTER TABLE public.cardio_sessions
  ADD COLUMN IF NOT EXISTS format text;

ALTER TABLE public.cardio_sessions
  DROP CONSTRAINT IF EXISTS cardio_sessions_format_check;
ALTER TABLE public.cardio_sessions
  ADD CONSTRAINT cardio_sessions_format_check
  CHECK (format IS NULL OR format IN ('steady', 'intervals'));

ALTER TABLE public.cardio_sessions
  DROP CONSTRAINT IF EXISTS cardio_sessions_activity_type_check;
ALTER TABLE public.cardio_sessions
  ADD CONSTRAINT cardio_sessions_activity_type_check
  CHECK (activity_type IN ('running', 'cycling', 'swimming', 'rowing', 'custom',
                           'walking', 'hiking', 'elliptical', 'jump_rope', 'other'));
