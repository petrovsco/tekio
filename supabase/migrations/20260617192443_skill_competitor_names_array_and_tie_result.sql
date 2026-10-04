alter table public.skill_sessions add column competitor_names text[];
update public.skill_sessions set competitor_names = array[competitor_name] where competitor_name is not null;
alter table public.skill_sessions drop column competitor_name;

alter table public.skill_sessions drop constraint skill_sessions_result_check;
alter table public.skill_sessions add constraint skill_sessions_result_check check (result = any (array['win'::text, 'loss'::text, 'tie'::text]));;
