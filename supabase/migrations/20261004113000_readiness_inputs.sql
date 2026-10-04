-- tekio.rfcs/rfcs/0092-readiness-method-in-profile.md: the readiness method a
-- person chose in Profile, and the two typed readiness inputs (a 1-minute
-- morning HRV reading, and a five-item how-you-feel check-in).
--
-- Expand only (supabase/README.md, the migration policy): one nullable column
-- and one new table. The build on master reads neither.

-- Null = automatic: the best method the person has data for. A value is the
-- method they picked in Profile.
alter table public.user_profiles
  add column if not exists readiness_method text
  check (readiness_method in ('overnight_hrv', 'morning_hrv', 'check_in'));

-- One row per person per morning. Morning HRV and the check-in are separate
-- methods with separate baselines; they share a row only because both are
-- typed on waking. Overnight HRV stays in sleep_logs.hrv and is never mixed
-- with morning_hrv.
create table if not exists public.readiness_inputs (
  id            uuid        primary key default uuid_generate_v4(),
  user_id       uuid        not null,
  log_date      date        not null,
  -- rMSSD in ms from a phone-camera app or chest strap, lying down on waking.
  morning_hrv   numeric     check (morning_hrv > 0 and morning_hrv < 400),
  -- The check-in: each 1-5, 5 always the good end (McLean 2010 form).
  energy        smallint    check (energy between 1 and 5),
  soreness      smallint    check (soreness between 1 and 5),
  sleep_quality smallint    check (sleep_quality between 1 and 5),
  stress        smallint    check (stress between 1 and 5),
  mood          smallint    check (mood between 1 and 5),
  origin        text,
  created_at    timestamptz not null default now(),
  constraint readiness_inputs_one_per_day unique (user_id, log_date),
  -- A check-in is all five answers or none.
  constraint readiness_inputs_checkin_complete check (
    (energy is null and soreness is null and sleep_quality is null and stress is null and mood is null)
    or (energy is not null and soreness is not null and sleep_quality is not null and stress is not null and mood is not null)
  )
);

comment on table public.readiness_inputs is
  'Typed readiness inputs, one row per user per morning: morning HRV (ms) and the five-item check-in (1-5, 5 good). RFC 0092.';

-- Write-once origin tag, like every other user table (RFC 0037).
create or replace trigger readiness_inputs_preserve_origin
  before update on public.readiness_inputs
  for each row execute function public.preserve_origin();

alter table public.readiness_inputs enable row level security;
create policy "MVP open — tighten in v1.1" on public.readiness_inputs
  for all using (true) with check (true);
