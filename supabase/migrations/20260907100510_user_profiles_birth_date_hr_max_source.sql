-- HRmax for any user (roadmap 060). 059's derived peak served only a user
-- with two years of synced rows, so the default becomes the Tanaka age
-- estimate (208 − 0.7 × age, tekio.rfcs/rfcs/done/059 §Grounding) from a birth
-- date, and the tracker's replicated peak becomes a proposal the user
-- accepts on the Profile — a sync never overwrites a number they set.
-- One stored number, last write wins: hr_max_override (059) keeps holding
-- it, and hr_max_source says whether the user typed it ('typed', another
-- device or a test) or accepted the tracker's peak ('tracker'). The estimate
-- is never stored. NULL birth date + NULL number = no HRmax, and the
-- typed-HR path stays off, which is every profile before this migration.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS birth_date date;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS hr_max_source text;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_hr_max_source_check;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_hr_max_source_check
  CHECK (
    (hr_max_override IS NULL AND hr_max_source IS NULL)
    OR (hr_max_override IS NOT NULL AND hr_max_source IN ('typed', 'tracker'))
  );
