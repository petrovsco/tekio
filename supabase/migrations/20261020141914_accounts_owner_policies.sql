-- RFC 0003 step 1 (expand): owner policies beside the open ones.
-- tekio.rfcs/rfcs/0003-lock-the-database.md
--
-- Every policy here is TO authenticated and asks one function who is asking,
-- so a move to another Postgres host rewrites app.current_user_id(), not the
-- policies. Postgres ORs permissive policies: while the "MVP open" ones stand,
-- nothing changes for the build on master, which signs nobody in. They, and the
-- older auth.uid() policies, are dropped by the lock
-- (tekio.rfcs/rfcs/0003/lock.sql) once master signs in. This file only adds.

create schema if not exists app;
grant usage on schema app to anon, authenticated, service_role;

-- The user id the data is filed under. A login that adopted existing rows
-- carries it in app_metadata, which only the server can write; any other login
-- files its rows under its own id.
create or replace function app.current_user_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select coalesce(nullif(auth.jwt() -> 'app_metadata' ->> 'user_id', '')::uuid,
                  auth.uid())
$$;

revoke all on function app.current_user_id() from public;
grant execute on function app.current_user_id() to anon, authenticated, service_role;

-- ── User tables: the owner reads and writes their own rows ──────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'blood_donations', 'bodyweight_logs', 'cardio_sessions', 'cold_sessions',
    'mobility_sessions', 'planned_exercises', 'planned_sessions',
    'readiness_inputs', 'sauna_sessions', 'sleep_logs', 'sport_sessions',
    'sync_runs', 'training_sessions', 'user_section_config',
    'exercises', 'sport_types'
  ] loop
    execute format(
      'create policy "Owner reads and writes" on public.%I for all to authenticated
         using (user_id = (select app.current_user_id()))
         with check (user_id = (select app.current_user_id()))', t);
  end loop;
end $$;

create policy "Owner reads and writes" on public.user_profiles for all to authenticated
  using (id = (select app.current_user_id()))
  with check (id = (select app.current_user_id()));

-- ── Child tables reach their owner through the parent ───────────────────────
create policy "Owner reads and writes" on public.session_exercises for all to authenticated
  using (exists (select 1 from public.training_sessions t
                 where t.id = session_id and t.user_id = (select app.current_user_id())))
  with check (exists (select 1 from public.training_sessions t
                 where t.id = session_id and t.user_id = (select app.current_user_id())));

create policy "Owner reads and writes" on public.session_sets for all to authenticated
  using (exists (select 1 from public.session_exercises se
                 join public.training_sessions t on t.id = se.session_id
                 where se.id = session_exercise_id and t.user_id = (select app.current_user_id())))
  with check (exists (select 1 from public.session_exercises se
                 join public.training_sessions t on t.id = se.session_id
                 where se.id = session_exercise_id and t.user_id = (select app.current_user_id())));

create policy "Owner reads and writes" on public.mobility_exercises for all to authenticated
  using (exists (select 1 from public.mobility_sessions m
                 where m.id = session_id and m.user_id = (select app.current_user_id())))
  with check (exists (select 1 from public.mobility_sessions m
                 where m.id = session_id and m.user_id = (select app.current_user_id())));

-- ── The catalogue: any signed-in user reads it, nobody writes it ────────────
create policy "Signed-in users read" on public.muscle_groups for select to authenticated using (true);
create policy "Signed-in users read" on public.movement_patterns for select to authenticated using (true);
create policy "Signed-in users read" on public.adaptation_targets for select to authenticated using (true);

create policy "Signed-in users read the catalogue" on public.exercises for select to authenticated
  using (user_id is null and is_system);
create policy "Signed-in users read the catalogue" on public.sport_types for select to authenticated
  using (user_id is null and is_system);

create policy "Signed-in users read" on public.exercise_aliases for select to authenticated
  using (user_id is null or user_id = (select app.current_user_id()));

-- Muscle links: read for the catalogue's lifts and your own; written only for
-- an exercise you created (a new lift, a new mobility exercise).
create policy "Signed-in users read" on public.exercise_muscle_groups for select to authenticated
  using (exists (select 1 from public.exercises e
                 where e.id = exercise_id
                   and (e.user_id is null or e.user_id = (select app.current_user_id()))));
create policy "Owner writes own exercise links" on public.exercise_muscle_groups for all to authenticated
  using (exists (select 1 from public.exercises e
                 where e.id = exercise_id and e.user_id = (select app.current_user_id())))
  with check (exists (select 1 from public.exercises e
                 where e.id = exercise_id and e.user_id = (select app.current_user_id())));
