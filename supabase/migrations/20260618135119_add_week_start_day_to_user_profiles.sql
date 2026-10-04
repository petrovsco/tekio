ALTER TABLE public.user_profiles
  ADD COLUMN week_start_day text NOT NULL DEFAULT 'monday'
  CHECK (week_start_day IN ('sunday', 'monday'));;
