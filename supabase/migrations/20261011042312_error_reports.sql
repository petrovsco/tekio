-- tekio.rfcs/rfcs/0103-error-reports-to-agent-fixes.md, stage 1: an unexpected
-- error (a crash, a write the database refused, an error nothing caught) is
-- sent by the app on its own, and lands here as one row per fault.
--
-- One row per signature, not per occurrence: the signature is a hash of the
-- error's name, message and top stack frames, so the same fault seen many
-- times is one row with a count. The payload is built from a whitelist in
-- src/lib/errorReport.ts and never carries a logged value; the note is the
-- only free text, and the user sends it only by tapping Send.
--
-- The client never touches the table. RLS is on with no policy at all, and
-- the two functions below are the only door: insert or count, and attach a
-- note. Nobody can read a report from the browser, so a user's note is not
-- readable by any other user once there are several (RFC 0003). The agent
-- that reads them (stage 3) uses the service role, which RLS does not bind.
--
-- Expand only (supabase/README.md, the migration policy): a new table and two
-- new functions that the build on master never calls.
create table if not exists public.error_reports (
  id          uuid        primary key default uuid_generate_v4(),
  signature   text        not null unique check (length(signature) between 1 and 64),
  -- The latest occurrence's payload; earlier ones differ only in time and trail.
  payload     jsonb       not null check (jsonb_typeof(payload) = 'object')
              check (octet_length(payload::text) <= 16384),
  -- Every note sent for this fault, oldest first.
  note        text,
  count       integer     not null default 1 check (count > 0),
  first_seen  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),
  -- Stage 2 and 3 move these; the client only ever writes 'new'.
  status      text        not null default 'new'
              check (status in ('new', 'triaged', 'fixing', 'fixed', 'wontfix')),
  -- The issue or pull request that answers it.
  link        text
);

comment on table public.error_reports is
  'Unexpected errors the app sent on its own, one row per signature, with an optional user note. RFC 0103.';

alter table public.error_reports enable row level security;

-- One occurrence: a new row, or the existing one counted and given the newer
-- payload. A fault that comes back after it was fixed reopens as new.
create or replace function public.report_error(p_signature text, p_payload jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.error_reports (signature, payload)
  values (p_signature, p_payload)
  on conflict (signature) do update set
    payload   = excluded.payload,
    count     = public.error_reports.count + 1,
    last_seen = now(),
    status    = case when public.error_reports.status = 'fixed' then 'new'
                     else public.error_reports.status end;
$$;

-- A note the user chose to send. It goes on the same row as the report it was
-- written about; if that insert has not landed yet, this one makes the row, so
-- a note is never lost to a race. It never counts an occurrence.
create or replace function public.add_error_report_note(p_signature text, p_payload jsonb, p_note text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.error_reports (signature, payload, note)
  select p_signature, p_payload, left(trim(p_note), 2000)
  where length(trim(p_note)) > 0
  on conflict (signature) do update set
    note = case when public.error_reports.note is null then excluded.note
                else public.error_reports.note || E'\n\n' || excluded.note end;
$$;

revoke all on function public.report_error(text, jsonb) from public;
revoke all on function public.add_error_report_note(text, jsonb, text) from public;
grant execute on function public.report_error(text, jsonb) to anon, authenticated;
grant execute on function public.add_error_report_note(text, jsonb, text) to anon, authenticated;
