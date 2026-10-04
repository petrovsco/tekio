-- RFC 0016: these ten "MVP open" policies were added to the live database by
-- hand and no migration created them, so a replay of the history came out
-- without them. This records them. On the live database every one already
-- exists and the block changes nothing. The open posture itself is deliberate
-- until RFC 0003; do not tighten it here.
do $$
declare
  t text;
begin
  foreach t in array array[
    'blood_donations', 'bodyweight_logs', 'cardio_sessions', 'exercises',
    'mobility_sessions', 'programs', 'sport_sessions', 'sport_types',
    'training_sessions', 'user_programs'
  ] loop
    if to_regclass('public.' || t) is not null and not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t
        and policyname = 'MVP open — tighten in v1.1'
    ) then
      execute format(
        $p$create policy "MVP open — tighten in v1.1" on public.%I for all to public using (true) with check (true)$p$,
        t
      );
    end if;
  end loop;
end $$;
