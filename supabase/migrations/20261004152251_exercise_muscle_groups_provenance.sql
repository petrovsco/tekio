-- tekio.rfcs/rfcs/0074-exercise-catalogue-grounded-links.md §1: every muscle
-- link records where it came from. A wrong link (a Lats link on a curl) was found
-- on 2026-09-27 and nothing could say who wrote it.
--
-- Additive and nullable, so the build on master (whose Admin editor still
-- writes links without these columns) keeps working.
alter table public.exercise_muscle_groups add column if not exists origin text;

-- No default while the column is added, so the rows already here keep a null
-- date: their history is unknown, and the column says so rather than inventing
-- one. New rows get now() from the default set afterwards.
alter table public.exercise_muscle_groups add column if not exists created_at timestamptz;
alter table public.exercise_muscle_groups alter column created_at set default now();

-- catalogue: written from the committed catalogue (the first log of a lift, or
--            this RFC's audit); editor: the user named the movement;
-- migration: hand-written SQL, and every link that predates this column.
alter table public.exercise_muscle_groups add column if not exists source text;
update public.exercise_muscle_groups set source = 'migration' where source is null;
alter table public.exercise_muscle_groups drop constraint if exists exercise_muscle_groups_source_check;
alter table public.exercise_muscle_groups add constraint exercise_muscle_groups_source_check
  check (source in ('catalogue', 'editor', 'migration'));

-- Write-once origin, the same trigger as every other tagged table (RFC 0037).
drop trigger if exists exercise_muscle_groups_preserve_origin on public.exercise_muscle_groups;
create trigger exercise_muscle_groups_preserve_origin
  before update on public.exercise_muscle_groups
  for each row execute function public.preserve_origin();
