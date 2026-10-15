-- Sync Garmin on demand from Home (RFC 0110).
--
-- One row per Garmin sync run. The app reads the newest finished one for the
-- "Garmin · 08:02" line beside the wordmark, and asks for a run with
-- `request_garmin_sync`, which writes a 'requested' row and starts
-- garmin-sync-now.yml on GitHub with that row's id. Every sync workflow — the
-- two daily ones and the on-demand one — closes its row as its last step
-- (scripts/garmin-sync/record_run.py), so the line is true whichever ran last.
--
-- Expand only (supabase/README.md, the migration policy): a new table and a new
-- function; the build on `master` reads neither.

create table if not exists public.sync_runs (
  id           bigint generated always as identity primary key,
  user_id      uuid        not null,
  provider     text        not null default 'garmin',
  trigger      text        not null check (trigger in ('app', 'schedule')),
  status       text        not null default 'requested' check (status in ('requested', 'ok', 'failed')),
  requested_at timestamptz not null default now(),
  finished_at  timestamptz
);

comment on table public.sync_runs is
  'One row per provider sync run: requested from the app, or recorded by a scheduled workflow. RFC 0110.';

create index if not exists sync_runs_user_provider_requested
  on public.sync_runs (user_id, provider, requested_at desc);

-- Same posture as every user table while the app has one user: open RLS. The
-- app only reads it; rows are written by the function below and by the
-- workflows' service-role key.
alter table public.sync_runs enable row level security;
create policy "MVP open — tighten in v1.1" on public.sync_runs
  for all using (true) with check (true);

-- Starts an on-demand Garmin sync and returns its row.
--
-- The anon key is in the browser bundle, so the limits live here, not in the
-- app: a run still open from the last 5 minutes is returned instead of starting
-- another, and at most 20 runs are asked for in a day. Garmin's rotating token
-- (integration_tokens) is why one run at a time matters: two runs started in the
-- same second can spend a refresh token the other has just rotated. The
-- workflows also share one GitHub concurrency group for the same reason.
--
-- The GitHub token is the one pg_cron already uses (RFC 0077), read from Vault
-- as `github_actions_dispatch_token`.
create or replace function public.request_garmin_sync(p_user_id uuid)
returns public.sync_runs
language plpgsql
security definer
set search_path = ''
as $$
declare
  run public.sync_runs;
  gh_token text;
begin
  select * into run
  from public.sync_runs
  where user_id = p_user_id and provider = 'garmin'
    and status = 'requested' and requested_at > now() - interval '5 minutes'
  order by requested_at desc
  limit 1;
  if found then
    return run;
  end if;

  if (select count(*) from public.sync_runs
      where user_id = p_user_id and trigger = 'app'
        and requested_at > now() - interval '1 day') >= 20 then
    raise exception 'Garmin has been asked 20 times today. The morning sync still runs.'
      using errcode = 'P0001';
  end if;

  select decrypted_secret into gh_token
  from vault.decrypted_secrets
  where name = 'github_actions_dispatch_token';
  if gh_token is null then
    raise exception 'request_garmin_sync: no github_actions_dispatch_token in Vault';
  end if;

  insert into public.sync_runs (user_id, provider, trigger)
  values (p_user_id, 'garmin', 'app')
  returning * into run;

  perform net.http_post(
    url     := 'https://api.github.com/repos/petrovsco/tekio/actions/workflows/garmin-sync-now.yml/dispatches',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || gh_token,
      'Accept', 'application/vnd.github+json',
      'X-GitHub-Api-Version', '2022-11-28',
      'User-Agent', 'tekio-sync-now'
    ),
    body    := jsonb_build_object('ref', 'develop', 'inputs', jsonb_build_object('run_id', run.id::text))
  );

  return run;
end;
$$;

comment on function public.request_garmin_sync(uuid) is
  'Called by the app (Home, RFC 0110): starts garmin-sync-now.yml and returns its sync_runs row. Rate-limited inside.';

revoke execute on function public.request_garmin_sync(uuid) from public;
grant execute on function public.request_garmin_sync(uuid) to anon, authenticated;
