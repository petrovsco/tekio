-- Durable store for third-party OAuth tokens the sync jobs refresh on every run.
--
-- Garmin rotates the DI refresh token each time it is used, so a token pinned in
-- a GitHub Actions secret goes dead after the first refresh (see
-- scripts/garmin-sync/garmin_auth.py). The job reads the current token from here
-- and writes the rotated one straight back, so the chain never breaks.
--
-- Same posture as assistant_settings: RLS on with NO policies, so only the
-- service_role key (GitHub Actions) can read or write. The browser anon key
-- never sees these rows.

create table if not exists public.integration_tokens (
  user_id    uuid        not null,
  provider   text        not null,
  token      text        not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

comment on table public.integration_tokens is
  'Rotating third-party auth tokens for the sync jobs. service_role only (RLS on, no policies).';
comment on column public.integration_tokens.token is
  'Opaque blob owned by the client library — stored verbatim, never parsed by the app.';

alter table public.integration_tokens enable row level security;
