-- Garmin data on sport rows (roadmap 058): the intensity columns cardio_sessions
-- got in 20260713193142_cardio_garmin_activity_fields.sql (max_heart_rate and
-- zone_distribution were already in its baseline), so a synced tennis match is
-- classified through the same grounded rules as a synced ride instead of by
-- convention. Additive only — drops are release-blocked (025). Types mirror
-- cardio_sessions exactly; zone_distribution holds Garmin hrTimeInZone as a
-- jsonb array of seconds [z1,z2,z3,z4,z5]. quality / competitors / result stay
-- manual — Garmin cannot know them.
ALTER TABLE public.sport_sessions
  ADD COLUMN IF NOT EXISTS max_heart_rate integer,
  ADD COLUMN IF NOT EXISTS aerobic_te numeric,
  ADD COLUMN IF NOT EXISTS anaerobic_te numeric,
  ADD COLUMN IF NOT EXISTS training_effect_label text,
  ADD COLUMN IF NOT EXISTS training_load numeric,
  ADD COLUMN IF NOT EXISTS zone_distribution jsonb;
