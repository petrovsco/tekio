-- tekio.rfcs/rfcs/done/0069-sleep-logs-row-origin.md: sleep_logs joins row-origin
-- tagging (tekio.rfcs/rfcs/done/0037-row-origin-tagging.md). Additive and
-- null-defaulted: every existing night keeps a null origin, which is not
-- back-filled — a guessed tag would be worse than none.
alter table public.sleep_logs add column if not exists origin text;

-- Write-once, the same trigger as the other fourteen tables. Load-bearing here:
-- saveSleepEntry upserts on (user_id, log_date), so a manual save on a night the
-- Garmin sync already created runs as an UPDATE and must not re-tag that row.
drop trigger if exists sleep_logs_preserve_origin on public.sleep_logs;
create trigger sleep_logs_preserve_origin
  before update on public.sleep_logs
  for each row execute function public.preserve_origin();
