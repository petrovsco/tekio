-- Roadmap 037, follow-up: sport_types was missed in the first pass.
-- getOrCreateSportType auto-creates a row from a typed sport name, exactly like
-- exercises and mobility_exercises, so a test name would pollute the catalog
-- permanently. It is a cascade root (sport_sessions and sport_areas hang off it).
alter table public.sport_types add column if not exists origin text;

drop trigger if exists sport_types_preserve_origin on public.sport_types;
create trigger sport_types_preserve_origin
  before update on public.sport_types
  for each row execute function public.preserve_origin();
