-- Roadmap 037: row origin tagging.
-- One nullable `origin` column on the cascade-root tables that take a user
-- write, so rows created from staging or local dev can be told apart from
-- the user's real training log. Null means "production, or pre-dates this
-- migration" — the safe default, because a cleanup only ever deletes rows it
-- can positively identify as NOT production.
--
-- Children are deliberately untagged: deleting a training_sessions row already
-- cascades to session_exercises and session_sets.

do $$
declare t text;
begin
  foreach t in array array[
    'training_sessions',
    'exercises',
    'cardio_sessions',
    'mobility_sessions',
    'mobility_exercises',
    'sport_sessions',
    'bodyweight_logs',
    'water_logs',
    'blood_donations',
    'sauna_sessions',
    'cold_sessions',
    'programs',
    'user_programs'
  ]
  loop
    execute format('alter table public.%I add column if not exists origin text', t);
  end loop;
end $$;

-- `origin` is write-once: set on insert, never changed by an update.
--
-- This is load-bearing, not decoration. saveBodyweightEntry is an upsert on
-- (user_id, log_date). Without this, verifying an edit form from localhost on a
-- day Peter had already weighed in would take the conflict branch and stamp
-- origin = 'dev' onto his real row — which the release cleanup would then
-- delete. Write-once means an update never re-tags, so the real row keeps its
-- null and survives. The converse holds too: editing a staging row from
-- production cannot launder it into looking real.
create or replace function public.preserve_origin()
returns trigger
language plpgsql
as $$
begin
  new.origin := old.origin;
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'training_sessions',
    'exercises',
    'cardio_sessions',
    'mobility_sessions',
    'mobility_exercises',
    'sport_sessions',
    'bodyweight_logs',
    'water_logs',
    'blood_donations',
    'sauna_sessions',
    'cold_sessions',
    'programs',
    'user_programs'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_preserve_origin', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.preserve_origin()',
      t || '_preserve_origin', t
    );
  end loop;
end $$;
