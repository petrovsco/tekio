#!/usr/bin/env python3
"""Pull Garmin Connect sleep data and upsert it into Supabase `sleep_logs`.

Runs headless in CI (GitHub Actions daily cron). Auth lives in garmin_auth.py —
the token rotates on every run and is stored in Supabase, not in the GitHub
secret, so the job never needs a password or an MFA prompt.

Only objective columns are written (duration, score, HRV, resting HR, bed/wake
times), with source='garmin'. Subjective `quality`/`notes` are never sent, so a
hand-logged night keeps its stars when Garmin enriches it. Upsert is idempotent
on the (user_id, log_date) unique key, so re-running is safe.

Env vars:
  SUPABASE_URL                e.g. https://xxxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY   service role key (server-side only — never ship to the browser)
  TEKIO_USER_ID               the single-user USER_ID rows are scoped to
  GARMIN_TOKENSTORE           bootstrap / recovery token blob (see garmin_auth.py)
  SYNC_DAYS                   how many trailing days to sync (default 3; catches late watch syncs)
"""
from __future__ import annotations

import os
import sys
from datetime import date, datetime, timedelta, timezone

import requests

from garmin_auth import env, garmin_client


def _time_of_day(epoch_ms_local: int | None) -> str | None:
    """Garmin *Local timestamps are epoch-ms that already read as wall-clock time
    when interpreted as UTC — so reading them as UTC yields the local HH:MM:SS."""
    if not epoch_ms_local:
        return None
    return datetime.fromtimestamp(epoch_ms_local / 1000, tz=timezone.utc).strftime("%H:%M:%S")


def _as_int(v) -> int | None:
    """Garmin sometimes returns HR/HRV/score as floats (e.g. 81.0); the DB columns are int."""
    return int(round(v)) if v is not None else None


def extract_row(user_id: str, raw: dict) -> dict | None:
    """Map one get_sleep_data payload to a sleep_logs row, or None if empty."""
    dto = (raw or {}).get("dailySleepDTO") or {}
    log_date = dto.get("calendarDate")
    seconds = dto.get("sleepTimeSeconds")
    if not log_date or not seconds:
        return None  # no scored sleep for this date yet

    scores = dto.get("sleepScores") or {}
    overall = scores.get("overall") or {}

    row = {
        "user_id": user_id,
        "log_date": log_date,
        "duration_hours": round(seconds / 3600, 2),
        "sleep_score": _as_int(overall.get("value")),
        "sleep_score_qualifier": overall.get("qualifierKey"),
        "source": "garmin",
        "bedtime": _time_of_day(dto.get("sleepStartTimestampLocal")),
        "wake_time": _time_of_day(dto.get("sleepEndTimestampLocal")),
        "hrv": _as_int(raw.get("avgOvernightHrv") or dto.get("avgOvernightHrv")),
        "resting_hr": _as_int(raw.get("restingHeartRate") or dto.get("restingHeartRate")),
    }
    # Drop keys the API didn't provide so we never null-out an existing column.
    return {k: v for k, v in row.items() if v is not None}


def upsert(rows: list[dict]) -> None:
    base = env("SUPABASE_URL").rstrip("/")
    key = env("SUPABASE_SERVICE_ROLE_KEY")
    resp = requests.post(
        f"{base}/rest/v1/sleep_logs",
        params={"on_conflict": "user_id,log_date"},
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        json=rows,
        timeout=30,
    )
    if not resp.ok:
        sys.exit(f"Supabase upsert failed ({resp.status_code}): {resp.text}")


def main() -> None:
    user_id = env("TEKIO_USER_ID")
    days = int(os.getenv("SYNC_DAYS", "3"))

    rows: list[dict] = []
    # Everything needing Garmin happens inside the block; leaving it saves the
    # rotated token, so a later Supabase failure can't cost us the credential.
    with garmin_client() as client:
        print(f"Logged in as {client.display_name}")
        for i in range(days):
            cdate = (date.today() - timedelta(days=i)).isoformat()
            row = extract_row(user_id, client.get_sleep_data(cdate))
            if row:
                score = row.get("sleep_score", "—")
                print(f"  {row['log_date']}: {row['duration_hours']}h, score {score}")
                rows.append(row)

    if not rows:
        print("No sleep data to sync.")
        return

    upsert(rows)
    print(f"Upserted {len(rows)} night(s).")


if __name__ == "__main__":
    main()
