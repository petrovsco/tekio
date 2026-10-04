alter table public.skill_types
  add column has_competitor boolean not null default false;

alter table public.skill_sessions
  add column competitor_name text,
  add column result text check (result in ('win', 'loss'));

insert into public.skill_types (user_id, name, is_system, has_competitor)
values ('a0000000-0000-0000-0000-000000000001', 'Tennis', true, true)
on conflict (user_id, name) do update set has_competitor = true;;
