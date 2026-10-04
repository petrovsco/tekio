-- 1) Clear critical rls_disabled_in_public on adaptation_targets: enable RLS
--    and match the existing "MVP open" posture so the client (read + update) keeps working.
alter table public.adaptation_targets enable row level security;

create policy "MVP open — tighten in v1.1"
  on public.adaptation_targets
  for all
  using (true)
  with check (true);

-- 2) Pin search_path on the 4 flagged functions (function_search_path_mutable).
--    Bodies reference unqualified public objects, so pin to public rather than ''.
alter function public.cycle_week(date, integer, date) set search_path = public;
alter function public.is_deload_date(date, integer, integer, date) set search_path = public;
alter function public.session_exercise_volume(uuid) set search_path = public;
alter function public.update_updated_at() set search_path = public;;
