-- Starts the two Garmin syncs at 08:00 Sofia time, to the minute (RFC 0077).
--
-- GitHub's own `schedule:` trigger is best-effort, and in September 2026 it
-- started these jobs 5–8 hours late, some days not before noon. A
-- workflow_dispatch starts at once, so the database calls GitHub's dispatch
-- API itself. The workflows keep their cron lines as a fallback: the syncs are
-- idempotent, so a late second run changes nothing.
--
-- pg_cron runs in UTC. Each job is scheduled at both 05 and 06 UTC, and the
-- function keeps only the slot that is 08 in Europe/Sofia, so it survives the
-- switch between EEST (UTC+3) and EET (UTC+2) with no edit.
--
-- The two jobs are ten minutes apart because both refresh the same rotating
-- Garmin token (integration_tokens); started in the same second, one could
-- spend a refresh token the other has just rotated.
--
-- The GitHub token lives in Vault as `github_actions_dispatch_token` — a
-- fine-grained token on petrovsco/tekio with Actions: read and write. It is
-- inserted by hand, never in a migration (scripts/garmin-sync/README.md).

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.dispatch_garmin_sync(workflow text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  gh_token text;
begin
  if extract(hour from now() at time zone 'Europe/Sofia') <> 8 then
    return;
  end if;

  select decrypted_secret into gh_token
  from vault.decrypted_secrets
  where name = 'github_actions_dispatch_token';

  if gh_token is null then
    raise warning 'dispatch_garmin_sync: no github_actions_dispatch_token in Vault; % not started', workflow;
    return;
  end if;

  perform net.http_post(
    url     := 'https://api.github.com/repos/petrovsco/tekio/actions/workflows/' || workflow || '/dispatches',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || gh_token,
      'Accept', 'application/vnd.github+json',
      'X-GitHub-Api-Version', '2022-11-28',
      'User-Agent', 'tekio-pg-cron'
    ),
    body    := jsonb_build_object('ref', 'develop')
  );
end;
$$;

comment on function public.dispatch_garmin_sync(text) is
  'Called by pg_cron: starts a Garmin sync workflow on GitHub at 08:00 Europe/Sofia. Not for the app.';

-- In public, so PostgREST would expose it as an RPC; nobody but the owner
-- (pg_cron runs as postgres) may call it.
revoke execute on function public.dispatch_garmin_sync(text) from public, anon, authenticated;

select cron.schedule(
  'garmin-activity-sync-0800-sofia',
  '0 5,6 * * *',
  $$select public.dispatch_garmin_sync('garmin-activity-sync.yml')$$
);

select cron.schedule(
  'garmin-sleep-sync-0810-sofia',
  '10 5,6 * * *',
  $$select public.dispatch_garmin_sync('garmin-sleep-sync.yml')$$
);
