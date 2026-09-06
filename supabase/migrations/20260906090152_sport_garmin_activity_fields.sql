-- Garmin sync for sport activities (roadmap 041): the same fields the cardio
-- sync got in 20260713193142_cardio_garmin_activity_fields.sql, so a tennis
-- match recorded on the watch lands in sport_sessions instead of being typed
-- in. quality / competitors / result stay manual — Garmin cannot know them.
ALTER TABLE public.sport_sessions
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS garmin_activity_id bigint;

ALTER TABLE public.sport_sessions
  DROP CONSTRAINT IF EXISTS sport_sessions_source_check;
ALTER TABLE public.sport_sessions
  ADD CONSTRAINT sport_sessions_source_check CHECK (source IN ('manual', 'garmin'));

-- Idempotent upsert key for the sync. NULLs are distinct, so the existing
-- manual rows (garmin_activity_id IS NULL) never collide with each other.
ALTER TABLE public.sport_sessions
  DROP CONSTRAINT IF EXISTS sport_sessions_user_garmin_activity_key;
ALTER TABLE public.sport_sessions
  ADD CONSTRAINT sport_sessions_user_garmin_activity_key UNIQUE (user_id, garmin_activity_id);
