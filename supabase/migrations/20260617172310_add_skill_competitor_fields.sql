-- Guarded 2026-10-04 (RFC 0016): skips on a database without the owner's
-- profile, so the history replays from empty. Live behaviour is unchanged.
alter table public.skill_types
  add column has_competitor boolean not null default false;

alter table public.skill_sessions
  add column competitor_name text,
  add column result text check (result in ('win', 'loss'));

insert into public.skill_types (user_id, name, is_system, has_competitor)
select 'a0000000-0000-0000-0000-000000000001', 'Tennis', true, true
where exists (select 1 from public.user_profiles where id = 'a0000000-0000-0000-0000-000000000001')
on conflict (user_id, name) do update set has_competitor = true;;
