#!/usr/bin/env python3
"""Pull Garmin Connect activities and upsert cardio ones into Supabase `cardio_sessions`.

Companion to sync_sleep.py — same token-based auth and idempotent-upsert pattern.
Only mono-structural cardio activities (cycling / running / swimming / rowing) are
synced; sports (tennis, etc.) and strength stay manual. Rows carry source='garmin'
plus the Training-Effect / HR-zone data the app uses to classify each session into
the right cardio adaptation (see src/lib/adaptations.ts:classifyCardioAdaptations).

Idempotent on the (user_id, garmin_activity_id) unique key, so re-running is safe.
NOTE: the Garmin activity name is written to `notes`, so a hand-edited note on a
synced ride is overwritten if that ride is re-synced (only within SYNC_DAYS).

Auth lives in garmin_auth.py — the token rotates on every run and is stored in
Supabase, not in the GitHub secret.

Env vars:
  SUPABASE_URL                e.g. https://xxxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY   service role key (server-side only — never ship to the browser)
  TEKIO_USER_ID               the single-user USER_ID rows are scoped to
  GARMIN_TOKENSTORE           bootstrap / recovery token blob (see garmin_auth.py)
  SYNC_DAYS                   how many trailing days to sync (default 7)
"""
from __future__ import annotations

import os
import sys
from datetime import date, timedelta

import requests

from garmin_auth import env, garmin_client

# Garmin activityType.typeKey -> the app's cardio_sessions.activity_type value.
# Anything not listed here (tennis, strength_training, walking, …) is skipped.
CARDIO_TYPE_KEYS = {
    # cycling
    "cycling": "cycling", "road_biking": "cycling", "mountain_biking": "cycling",
    "gravel_cycling": "cycling", "indoor_cycling": "cycling", "virtual_ride": "cycling",
    "cyclocross": "cycling", "recumbent_cycling": "cycling", "e_bike_fitness": "cycling",
    # running
    "running": "running", "treadmill_running": "running", "trail_running": "running",
    "track_running": "running", "virtual_run": "running", "indoor_running": "running",
    "street_running": "running", "obstacle_run": "running",
    # swimming
    "lap_swimming": "swimming", "open_water_swimming": "swimming", "swimming": "swimming",
    # rowing (app calls this "Indoor Rowing")
    "indoor_rowing": "rowing", "rowing": "rowing", "rowing_v2": "rowing",
}


def _as_int(v) -> int | None:
    return int(round(v)) if v is not None else None


def _num(v) -> float | None:
    """Round a Garmin float to 2 dp, or None."""
    return round(float(v), 2) if v is not None else None


def _zones(act: dict) -> list[float] | None:
    """hrTimeInZone_1..5 (seconds) -> [z1..z5], or None if Garmin sent none."""
    zones, any_present = [], False
    for i in range(1, 6):
        v = act.get(f"hrTimeInZone_{i}")
        if v is not None:
            any_present = True
        zones.append(round(float(v), 1) if v is not None else 0)
    return zones if any_present else None


def extract_row(user_id: str, act: dict) -> dict | None:
    """Map one Garmin activity to a cardio_sessions row, or None to skip it."""
    activity_id = act.get("activityId")
    type_key = ((act.get("activityType") or {}).get("typeKey") or "").lower()
    activity_type = CARDIO_TYPE_KEYS.get(type_key)
    if not activity_id or not activity_type:
        return None  # missing id, or not a cardio type we track

    start_local = act.get("startTimeLocal") or act.get("startTimeGMT")
    duration_s = act.get("duration") or act.get("movingDuration")
    if not start_local or not duration_s:
        return None

    row = {
        "user_id": user_id,
        "garmin_activity_id": activity_id,
        "source": "garmin",
        "session_date": str(start_local)[:10],
        "activity_type": activity_type,
        "duration_minutes": round(duration_s / 60, 2),
        "distance_km": round(act["distance"] / 1000, 3) if act.get("distance") else None,
        "elevation_gain_m": _num(act.get("elevationGain")),
        "avg_heart_rate": _as_int(act.get("averageHR")),
        "max_heart_rate": _as_int(act.get("maxHR")),
        "aerobic_te": _num(act.get("aerobicTrainingEffect")),
        "anaerobic_te": _num(act.get("anaerobicTrainingEffect")),
        "training_effect_label": act.get("trainingEffectLabel"),
        "training_load": _num(act.get("activityTrainingLoad")),
        "zone_distribution": _zones(act),
        "notes": act.get("activityName"),
    }
    # Never null-out a column Garmin didn't provide (preserves existing data on re-sync).
    return {k: v for k, v in row.items() if v is not None}


def upsert(rows: list[dict]) -> None:
    base = env("SUPABASE_URL").rstrip("/")
    key = env("SUPABASE_SERVICE_ROLE_KEY")
    resp = requests.post(
        f"{base}/rest/v1/cardio_sessions",
        params={"on_conflict": "user_id,garmin_activity_id"},
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
    days = int(os.getenv("SYNC_DAYS", "7"))

    end = date.today()
    start = end - timedelta(days=days - 1)
    # Everything needing Garmin happens inside the block; leaving it saves the
    # rotated token, so a later Supabase failure can't cost us the credential.
    with garmin_client() as client:
        print(f"Logged in as {client.display_name}")
        activities = client.get_activities_by_date(start.isoformat(), end.isoformat()) or []
    print(f"Fetched {len(activities)} activity(ies) {start}..{end}")

    rows: list[dict] = []
    for act in activities:
        row = extract_row(user_id, act)
        if row:
            te = f"aero {row.get('aerobic_te', '—')} / anaero {row.get('anaerobic_te', '—')}"
            print(f"  {row['session_date']} {row['activity_type']}: {row['duration_minutes']}min, TE {te}")
            rows.append(row)

    if not rows:
        print("No cardio activities to sync.")
        return

    upsert(rows)
    print(f"Upserted {len(rows)} activity(ies).")


if __name__ == "__main__":
    main()
