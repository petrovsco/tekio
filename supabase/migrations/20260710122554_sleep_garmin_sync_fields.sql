-- Garmin sleep sync: give sleep_logs an objective score + provenance, and a
-- per-night uniqueness key so the daily sync can upsert idempotently.
-- Additive; sleep_logs has 0 rows so the unique constraint is safe to add now.
--
-- Field split rationale:
--   quality               = subjective 1–5 stars, hand-entered by the user (unchanged).
--   sleep_score           = Garmin's objective 0–100 Sleep Score.
--   sleep_score_qualifier = Garmin's categorical label (GOOD / FAIR / POOR / EXCELLENT).
--   source                = 'manual' | 'garmin' — lets synced and hand-logged nights
--                           coexist; the sync only writes objective columns so it
--                           never clobbers a user's subjective quality/notes.

alter table public.sleep_logs
  add column if not exists sleep_score int
    check (sleep_score is null or (sleep_score >= 0 and sleep_score <= 100)),
  add column if not exists sleep_score_qualifier text,
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'garmin'));

comment on column public.sleep_logs.sleep_score is 'Garmin objective Sleep Score (0–100), null for manual-only nights.';
comment on column public.sleep_logs.sleep_score_qualifier is 'Garmin categorical label: EXCELLENT / GOOD / FAIR / POOR.';
comment on column public.sleep_logs.source is 'Row provenance: manual (hand-logged) or garmin (daily sync).';

-- One sleep row per night; the daily sync upserts on this key.
alter table public.sleep_logs
  add constraint sleep_logs_user_date_uniq unique (user_id, log_date);
