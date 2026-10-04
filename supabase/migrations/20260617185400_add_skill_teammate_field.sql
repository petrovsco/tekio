alter table public.skill_types
  add column has_teammate boolean not null default false;

alter table public.skill_sessions
  add column teammate_names text[];;
