-- Roadmap 044: exercise name aliases — one movement, many spellings, one search.
--
-- The same movement gets typed under different names (KB Swing / Kettlebell
-- Swing, Press-ups / Push-ups). Today each spelling creates its own row in
-- `exercises`, and the muscle read then splits one movement's sets across two
-- names — one of which usually has no muscle links at all, so it is a silent
-- hole in the body map.
--
-- Two decisions shape this table, both Peter's on 2026-09-07:
--
-- 1. An alias points at a canonical NAME, not at an exercise id. The obvious
--    shape (alias -> exercises.id) only ever holds rows for exercises that
--    somebody already created, so a brand-new user's alias table is empty and
--    none of this works for them — which is exactly the case this exists to
--    serve (the app opens to other people from 2.1.0). `user_id is null` marks
--    a system alias: shipped with the app, in force for everybody.
--
-- 2. Matching strips punctuation and spacing. "pushups", "push ups" and
--    "Push-Ups" all normalise to the same key, so one alias row covers a whole
--    family of spellings and the trailing-punctuation twin ("Hanging Leg
--    Raises:" — deleted by hand on 2026-09-03) can never be created again.
--    This is still an exact match, just after normalising; it is NOT the fuzzy
--    or phonetic matching the brief rules out, because a wrong guess would put
--    sets on the wrong muscles.
--
-- The app mirrors normalise_exercise_name() in TypeScript
-- (src/lib/exerciseName.ts). If one changes, change both — the unique indexes
-- below are what stops two rows colliding on the same key.

create or replace function public.normalise_exercise_name(name text)
returns text
language sql
immutable
strict
as $$
  select regexp_replace(lower(name), '[^a-z0-9]+', '', 'g')
$$;

comment on function public.normalise_exercise_name(text) is
  'Match key for exercise names: lowercased, letters and digits only. Mirrored in src/lib/exerciseName.ts (roadmap 044).';

create table if not exists public.exercise_aliases (
  id             uuid        primary key default uuid_generate_v4(),
  -- Plain uuid, no foreign key — the same shape as exercises.user_id, which
  -- has none either (there is no users table; user_profiles is keyed by id).
  user_id        uuid,
  alias          text        not null check (btrim(alias) <> ''),
  canonical_name text        not null check (btrim(canonical_name) <> ''),
  origin         text,
  created_at     timestamptz not null default now(),
  -- An alias that normalises to its own target is a no-op row that would only
  -- ever shadow the real name.
  constraint exercise_aliases_alias_differs
    check (public.normalise_exercise_name(alias)
        <> public.normalise_exercise_name(canonical_name))
);

comment on table public.exercise_aliases is
  'Alternative spellings for exercise names. user_id null = a system alias shipped with the app and in force for every user; a non-null user_id is that user''s own. Roadmap 044.';
comment on column public.exercise_aliases.canonical_name is
  'The exercises.name this alias resolves to. A name, not an id, so the seed works for a user with zero exercise rows.';

-- One winner per normalised alias, per scope. Two partial indexes rather than
-- one over coalesce(user_id, ...), so a user alias and a system alias may share
-- a spelling — the user's own wins in the app.
create unique index if not exists exercise_aliases_system_key
  on public.exercise_aliases (public.normalise_exercise_name(alias))
  where user_id is null;

create unique index if not exists exercise_aliases_user_key
  on public.exercise_aliases (user_id, public.normalise_exercise_name(alias))
  where user_id is not null;

-- Origin tagging (roadmap 037) for the user-added rows this table will take
-- later; the seed below is written by the migration, so it is production (null)
-- like every other pre-existing row. Write-once, same as the tagged roots.
create or replace trigger exercise_aliases_preserve_origin
  before update on public.exercise_aliases
  for each row execute function public.preserve_origin();

-- The browser reads this table and never writes it: today the list is seeded
-- here and enhanced by SQL, and there is no alias-management UI (doctrine R3).
-- Select-only says that out loud, rather than leaving a write door nothing uses.
alter table public.exercise_aliases enable row level security;
create policy "MVP open — read only" on public.exercise_aliases
  for select using (true);

-- ── Seed ──────────────────────────────────────────────────────────────────
--
-- System rows, so every user gets them. Each canonical_name below is a name
-- that exists in the shipped catalogue (roadmap 043); punctuation-insensitive
-- matching means one row per *word* difference, not one per spelling — so
-- "chinups", "Chin Ups" and "chin-ups" are all covered by the single row
-- 'Chin-ups' -> 'Chin-up'.
--
-- Air Bike / Assault Bike is deliberately absent: the catalogue has no
-- "Assault Bike" movement, only "Assault Bike Intervals", which names a
-- format rather than a movement. Air-bike work belongs to cardio.

insert into public.exercise_aliases (user_id, alias, canonical_name)
--
-- Every pair below is the SAME movement under another name. Pairs that were
-- tempting but name a different movement are left out on purpose, because a
-- wrong alias silently books sets onto the wrong muscles: split squat is not
-- Bulgarian split squat (rear foot elevated), cossack squat is not a lateral
-- lunge, a Romanian deadlift is not a single-leg RDL, a sit-up is not a
-- decline sit-up, and "Shoulder Press" sits between two rows that both exist
-- (Overhead Press, Dumbbell Shoulder Press) rather than clearly meaning one.

values
  (null, 'Press-ups',              'Push-ups'),
  (null, 'KB Swing',               'Kettlebell Swing'),
  (null, 'KB Swings',              'Kettlebell Swing'),
  (null, 'Kettlebell Swings',      'Kettlebell Swing'),
  (null, 'Chin-ups',               'Chin-up'),
  (null, 'Pull up',                'Pull-ups'),
  (null, 'Hanging Leg Raise',      'Hanging Leg Raises'),
  (null, 'Lateral Raises',         'Lat Raises'),
  (null, 'Side Raises',            'Lat Raises'),
  (null, 'Bicep Curl',             'Bicep Curls'),
  (null, 'Barbell Curl',           'Bicep Curls'),
  (null, 'Tricep Extension',       'Tricep Extensions'),
  (null, 'Calf Raise',             'Calf Raises'),
  (null, 'Row',                    'Rows'),
  (null, 'Barbell Row',            'Rows'),
  (null, 'Dip',                    'Dips'),
  (null, 'Squat',                  'Back Squat'),
  (null, 'Barbell Back Squat',     'Back Squat'),
  (null, 'Military Press',         'Overhead Press'),
  (null, 'OHP',                    'Overhead Press'),
  (null, 'Flat Bench Press',       'Bench Press'),
  (null, 'Barbell Bench Press',    'Bench Press'),
  (null, 'Conventional Deadlift',  'Deadlift'),
  (null, 'Skull Crushers',         'Skull Crusher'),
  (null, 'Hip Thrusts',            'Hip Thrust'),
  (null, 'Glute Bridges',          'Glute Bridge'),
  (null, 'Face Pull',              'Face Pulls'),
  (null, 'Goblet Squats',          'Goblet Squat'),
  (null, 'Box Jumps',              'Box Jump'),
  (null, 'Med Ball Slams',         'Med Ball Slam'),
  (null, 'Sled Pushes',            'Sled Push'),
  (null, 'Lat Pulldowns',          'Lat Pulldown'),
  (null, 'Leg Curls',              'Leg Curl'),
  (null, 'Leg Extensions',         'Leg Extension'),
  (null, 'Sprints',                'Sprint'),
  (null, 'Dead Hangs',             'Dead Hang'),
  (null, 'Pallof Presses',         'Pallof Press'),
  (null, 'Copenhagen Planks',      'Copenhagen Plank'),
  (null, 'Nordic Curl',            'Nordic Hamstring Curl'),
  (null, 'Nordics',                'Nordic Hamstring Curl'),
  (null, 'Bulgarian Split Squats', 'Bulgarian Split Squat'),
  (null, 'Side Lunge',             'Lateral Lunge'),
  (null, 'Hang Clean',             'Hang Power Clean'),
  (null, 'Broad Jumps',            'Broad Jump'),
  (null, 'Skater Hops',            'Skater Hop'),
  (null, 'Lateral Bounds',         'Lateral Bound'),
  (null, 'Pogo Hop',               'Pogo Hops'),
  (null, 'Reverse Flyes',          'Reverse Fly'),
  (null, 'Rear Delt Fly',          'Reverse Fly'),
  (null, 'Cable Woodchops',        'Cable Woodchop'),
  (null, 'Bench Dips',             'Bench Dip'),
  (null, 'Scap Push-Ups',          'Scap Push-Up'),
  (null, 'Clapping Push-ups',      'Clapping Push-up'),
  (null, 'One Arm Dumbbell Row',   'Single-Arm DB Row'),
  (null, 'Machine Curls',          'Machine Curl'),
  (null, 'Standing Calf Raises',   'Standing Calf Raise'),
  (null, 'Couch Stretches',        'Couch Stretch'),
  (null, 'Cobra',                  'Cobra Stretch'),
  (null, 'Foam Rolling Quads',     'Foam Roll Quads'),
  (null, 'Foam Rolling Glutes',    'Foam Roll Glutes'),
  (null, 'Foam Rolling Hamstrings','Foam Roll Hamstrings'),
  (null, 'Hip CAR',                'Hip CARs'),
  (null, 'Shoulder CAR',           'Shoulder CARs'),
  (null, 'Leg Swing',              'Leg Swings'),
  (null, 'Ankle Bounces',          'Ankle Bounce'),
  (null, 'Legs Up The Wall',       'Legs-Up-Wall'),
  (null, 'Snatches',               'Snatch'),
  (null, 'Power Cleans',           'Power Clean'),
  (null, 'Clean & Jerk',           'Clean and Jerk')
on conflict do nothing;
