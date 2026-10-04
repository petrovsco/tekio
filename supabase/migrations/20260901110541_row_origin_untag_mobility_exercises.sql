-- Roadmap 037, correction. mobility_exercises was tagged on the assumption that
-- it was a catalog table like `exercises`. It is not: it holds (session_id,
-- exercise_name, duration_minutes, exercise_id) and is a *child* of
-- mobility_sessions, which already cascades to it. The mobility catalog is
-- `exercises`, reached via getOrCreateExercise.
--
-- Tagging a child buys nothing and would only invite a sweep to delete rows out
-- from under a session that is staying. Safe to drop outright rather than queue
-- in roadmap 025: the column was added in the same session, holds no data, and
-- no shipped code reads it.
drop trigger if exists mobility_exercises_preserve_origin on public.mobility_exercises;
alter table public.mobility_exercises drop column if exists origin;
