-- Distance covered during the *work* bouts of an intervals session, in km.
--
-- Not `distance_km`, on purpose. Garmin reports distance 0.0 for every indoor
-- rowing activity (the watch has no link to the erg), so the only distance
-- Peter has for his Norwegian 4×4 rowing is the figure he typed into Notion
-- after each session — and that figure covers the four 4-minute intervals
-- (16 min of work), not the 33–52 minutes the watch recorded. Putting it in
-- `distance_km` would make the app divide whole-session time by interval
-- distance and print a pace ~2.7× too slow (SessionList prints
-- `calcPace(duration, distance)`; CardioTab charts the same ratio).
--
-- NULL = no work distance recorded, which is every row before this migration
-- and stays true for the 16 rowing sessions with no Notion entry. No app code
-- reads the column yet; it exists so the one progression signal this protocol
-- produces — 3.66 km → 4.47 km over 27 sessions at a fixed 16 min of work —
-- survives as a number rather than as prose in `notes`.
ALTER TABLE public.cardio_sessions
  ADD COLUMN IF NOT EXISTS work_distance_km numeric;

ALTER TABLE public.cardio_sessions
  DROP CONSTRAINT IF EXISTS cardio_sessions_work_distance_km_check;
ALTER TABLE public.cardio_sessions
  ADD CONSTRAINT cardio_sessions_work_distance_km_check
  CHECK (work_distance_km IS NULL OR work_distance_km > 0);
