#!/usr/bin/env python3
"""Pull Garmin Connect activities and upsert them into Supabase.

Companion to sync_sleep.py — same token-based auth and idempotent-upsert pattern.
Two kinds of activity are synced, into two tables:

- **cardio** (cycling / running / swimming / rowing) -> `cardio_sessions`, with
  the Training-Effect / HR-zone data the app uses to classify each session into
  the right cardio adaptation (see src/lib/adaptations.ts:classifyCardioAdaptations).
- **sport** (tennis, …) -> `sport_sessions` (roadmap 041), with duration and
  average HR only. Quality, competitors and the result stay manual — Garmin
  cannot know them — so a synced row shows up as an entry still to be rated.

Strength activities stay manual.

Both are idempotent on the (user_id, garmin_activity_id) unique key. Sport rows
go one step further: before anything is inserted, each activity looks for a
hand-logged session on the same date for the same sport and **claims** it —
the manual row receives the Garmin id plus duration / avg HR where those were
empty — instead of a second row appearing next to it. That is the everyday
flow (log the match with its score in the evening, the 5 AM sync adds the watch
data) and it is what makes a full-history backfill safe on top of months of
manual rows. An activity whose id is already in the table is skipped outright,
so a re-run writes nothing.

`notes`: a Garmin activity name is written on a newly inserted row only —
hand-written sport notes (match scores live there) are never touched. Cardio
rows still take the Garmin name on every re-sync (within SYNC_DAYS).

Auth lives in garmin_auth.py — the token rotates on every run and is stored in
Supabase, not in the GitHub secret.

Env vars:
  SUPABASE_URL                e.g. https://xxxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY   service role key (server-side only — never ship to the browser)
  TEKIO_USER_ID               the single-user USER_ID rows are scoped to
  GARMIN_TOKENSTORE           bootstrap / recovery token blob (see garmin_auth.py)
  SYNC_DAYS                   how many trailing days to sync (default 7; raise for a backfill)
  SYNC_KINDS                  comma list of cardio, sport (default: both)
  DRY_RUN                     true → fetch and print the plan, write nothing. Also
                              lists the activity types nothing maps yet, so the
                              maps below grow from real data, not guesses.
"""
from __future__ import annotations

import os
import sys
from collections import Counter
from datetime import date, timedelta

import requests

from garmin_auth import env, garmin_client

# Garmin activityType.typeKey -> the app's cardio_sessions.activity_type value.
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

# Garmin activityType.typeKey -> sport_types.name. Only keys seen on a real
# activity go in here (run with DRY_RUN=true to see what is being skipped).
# Anything in neither map (strength_training, hiit, walking, …) is skipped.
SPORT_TYPE_KEYS = {
    "tennis_v2": "Tennis",  # Garmin's key for tennis since its 2023 rework (10-year dry run, 2026-09-06)
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


def _type_key(act: dict) -> str:
    return ((act.get("activityType") or {}).get("typeKey") or "").lower()


def _basics(act: dict) -> tuple[int, str, float] | None:
    """(activity id, session date, duration in minutes), or None if any is missing."""
    activity_id = act.get("activityId")
    start_local = act.get("startTimeLocal") or act.get("startTimeGMT")
    duration_s = act.get("duration") or act.get("movingDuration")
    if not activity_id or not start_local or not duration_s:
        return None
    return int(activity_id), str(start_local)[:10], round(duration_s / 60, 2)


# ── cardio ─────────────────────────────────────────────────────────────────────

def extract_row(user_id: str, act: dict) -> dict | None:
    """Map one Garmin activity to a cardio_sessions row, or None to skip it."""
    activity_type = CARDIO_TYPE_KEYS.get(_type_key(act))
    basics = _basics(act)
    if not activity_type or not basics:
        return None
    activity_id, session_date, duration_min = basics

    row = {
        "user_id": user_id,
        "garmin_activity_id": activity_id,
        "source": "garmin",
        "session_date": session_date,
        "activity_type": activity_type,
        "duration_minutes": duration_min,
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


# ── sport ──────────────────────────────────────────────────────────────────────

def is_variant(sport_name: str, base: str) -> bool:
    """Is a sport_types name the Garmin sport or a variant of it?

    Garmin knows "tennis"; the app also has "Tennis Doubles". A manual row of
    either may be the match the watch recorded, so a variant is the base name
    followed by a space and more words. "Beach Volleyball" is *not* a variant of
    "Volleyball" — Garmin keeps those apart itself.
    """
    n, b = sport_name.strip().lower(), base.strip().lower()
    return n == b or n.startswith(b + " ")


def plan_sport(user_id: str, acts: list[dict], existing: list[dict]) -> dict:
    """Decide what each sport activity does to sport_sessions, without writing.

    `existing` is every sport_sessions row of the user, each with `id`,
    `session_date`, `garmin_activity_id`, `duration_minutes`, `avg_heart_rate`
    and `sport_types.name` (embedded as {"sport_types": {"name": …}}).

    Returns {"skipped": [...], "claimed": [(row_id, patch, label)],
             "inserted": [row, …]} where an inserted row carries `sport_name`
    in place of `sport_type_id` — the caller resolves the id.
    """
    known_ids = {r["garmin_activity_id"] for r in existing if r.get("garmin_activity_id")}
    unclaimed = [r for r in existing if not r.get("garmin_activity_id")]
    plan: dict = {"skipped": [], "claimed": [], "inserted": []}

    # Oldest first, so two matches on one day claim manual rows deterministically.
    for act in sorted(acts, key=lambda a: str(a.get("startTimeLocal") or a.get("startTimeGMT") or "")):
        base = SPORT_TYPE_KEYS.get(_type_key(act))
        basics = _basics(act)
        if not base or not basics:
            continue
        activity_id, session_date, duration_min = basics
        avg_hr = _as_int(act.get("averageHR"))
        label = f"{session_date} {base}: {duration_min}min" + (f", {avg_hr} bpm" if avg_hr else "")

        if activity_id in known_ids:
            plan["skipped"].append(label)
            continue

        match = next(
            (r for r in unclaimed
             if r["session_date"] == session_date
             and is_variant(((r.get("sport_types") or {}).get("name") or ""), base)),
            None,
        )
        if match:
            unclaimed.remove(match)
            patch = {"garmin_activity_id": activity_id, "source": "garmin"}
            if match.get("duration_minutes") is None:
                patch["duration_minutes"] = duration_min
            if match.get("avg_heart_rate") is None and avg_hr is not None:
                patch["avg_heart_rate"] = avg_hr
            name = (match.get("sport_types") or {}).get("name") or base
            plan["claimed"].append((match["id"], patch, f"{label} → claims manual {name} row"))
            continue

        row = {
            "user_id": user_id,
            "sport_name": base,
            "session_date": session_date,
            "duration_minutes": duration_min,
            "avg_heart_rate": avg_hr,
            "notes": act.get("activityName"),
            "source": "garmin",
            "garmin_activity_id": activity_id,
        }
        plan["inserted"].append({k: v for k, v in row.items() if v is not None})
    return plan


# ── Supabase REST ──────────────────────────────────────────────────────────────

def _rest(path: str) -> str:
    return f"{env('SUPABASE_URL').rstrip('/')}/rest/v1/{path}"


def _headers(prefer: str | None = None) -> dict[str, str]:
    key = env("SUPABASE_SERVICE_ROLE_KEY")
    h = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    if prefer:
        h["Prefer"] = prefer
    return h


def _check(resp: requests.Response, what: str) -> None:
    if not resp.ok:
        sys.exit(f"Supabase {what} failed ({resp.status_code}): {resp.text}")


def upsert(rows: list[dict]) -> None:
    resp = requests.post(
        _rest("cardio_sessions"),
        params={"on_conflict": "user_id,garmin_activity_id"},
        headers=_headers("resolution=merge-duplicates,return=minimal"),
        json=rows,
        timeout=30,
    )
    _check(resp, "cardio upsert")


def fetch_sport_state(user_id: str) -> tuple[dict[str, str], list[dict]]:
    """(sport type name, lower-cased -> id) and every sport_sessions row of the user."""
    resp = requests.get(
        _rest("sport_types"),
        params={"select": "id,name", "user_id": f"eq.{user_id}"},
        headers=_headers(), timeout=30,
    )
    _check(resp, "sport_types read")
    types = {r["name"].strip().lower(): r["id"] for r in resp.json() or []}

    resp = requests.get(
        _rest("sport_sessions"),
        params={
            "select": "id,session_date,garmin_activity_id,duration_minutes,avg_heart_rate,sport_types(name)",
            "user_id": f"eq.{user_id}",
            "limit": "10000",
        },
        headers=_headers(), timeout=30,
    )
    _check(resp, "sport_sessions read")
    return types, resp.json() or []


def create_sport_type(user_id: str, name: str) -> str:
    """Mirror of getOrCreateSportType in src/lib/db/sport.ts, minus the flags —
    a sync cannot know whether a sport has competitors; the user sets that when
    first editing the row."""
    resp = requests.post(
        _rest("sport_types"),
        headers=_headers("return=representation"),
        json={"user_id": user_id, "name": name, "is_system": False,
              "has_competitor": False, "has_teammate": False},
        timeout=30,
    )
    _check(resp, f"sport_types insert ({name})")
    return resp.json()[0]["id"]


def apply_sport_plan(user_id: str, plan: dict, types: dict[str, str]) -> None:
    for row_id, patch, _ in plan["claimed"]:
        resp = requests.patch(
            _rest("sport_sessions"),
            params={"id": f"eq.{row_id}"},
            headers=_headers("return=minimal"),
            json=patch, timeout=30,
        )
        _check(resp, f"sport_sessions claim ({row_id})")

    rows = []
    for row in plan["inserted"]:
        row = dict(row)
        name = row.pop("sport_name")
        key = name.strip().lower()
        if key not in types:
            types[key] = create_sport_type(user_id, name)
            print(f"  created sport type {name}")
        row["sport_type_id"] = types[key]
        rows.append(row)
    if rows:
        # ignore-duplicates: a concurrent or repeated run can never double-insert
        # an activity, and never overwrites a row that is already there.
        resp = requests.post(
            _rest("sport_sessions"),
            params={"on_conflict": "user_id,garmin_activity_id"},
            headers=_headers("resolution=ignore-duplicates,return=minimal"),
            json=rows, timeout=30,
        )
        _check(resp, "sport_sessions insert")


def print_unmapped_inventory(unmapped: dict[str, list[dict]], existing: list[dict]) -> None:
    """Dry-run help for growing the maps: per unmapped typeKey, the date range
    and which hand-logged sports fall on the same days (is `hiit` really the
    volleyball training?). Keys with a handful of activities are listed one by
    one so a stray `skating_ws` can be recognised."""
    manual_by_date: dict[str, list[str]] = {}
    for r in existing:
        name = (r.get("sport_types") or {}).get("name")
        if name:
            manual_by_date.setdefault(r["session_date"], []).append(name)

    print("Unmapped activity types, against the hand-logged sport rows:")
    for key, acts in sorted(unmapped.items(), key=lambda kv: -len(kv[1])):
        dated = [(b[1], b[2], a.get("activityName") or "") for a in acts if (b := _basics(a))]
        dated.sort()
        if not dated:
            continue
        overlap: Counter[str] = Counter()
        for d, _, _ in dated:
            overlap.update(manual_by_date.get(d, []))
        same_day = (", same day as manual " + ", ".join(f"{n} ×{c}" for n, c in overlap.most_common())) if overlap else ""
        print(f"  {key} ×{len(dated)}: {dated[0][0]}..{dated[-1][0]}{same_day}")
        if len(dated) <= 5:
            for d, mins, name in dated:
                print(f"    {d} {mins}min {name}".rstrip())


# ── main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    user_id = env("TEKIO_USER_ID")
    days = int(os.getenv("SYNC_DAYS", "7"))
    kinds = {k.strip().lower() for k in os.getenv("SYNC_KINDS", "cardio,sport").split(",") if k.strip()}
    unknown = kinds - {"cardio", "sport"}
    if unknown:
        sys.exit(f"SYNC_KINDS: unknown kind(s) {sorted(unknown)} — use cardio, sport")
    dry_run = os.getenv("DRY_RUN", "").strip().lower() in ("1", "true", "yes")
    if dry_run:
        print("DRY RUN — nothing will be written.")

    end = date.today()
    start = end - timedelta(days=days - 1)
    # Everything needing Garmin happens inside the block; leaving it saves the
    # rotated token, so a later Supabase failure can't cost us the credential.
    with garmin_client() as client:
        print(f"Logged in as {client.display_name}")
        activities = client.get_activities_by_date(start.isoformat(), end.isoformat()) or []
    print(f"Fetched {len(activities)} activity(ies) {start}..{end}")

    cardio_rows: list[dict] = []
    sport_acts: list[dict] = []
    unmapped: dict[str, list[dict]] = {}
    for act in activities:
        key = _type_key(act)
        if key in CARDIO_TYPE_KEYS:
            if "cardio" in kinds:
                row = extract_row(user_id, act)
                if row:
                    cardio_rows.append(row)
        elif key in SPORT_TYPE_KEYS:
            if "sport" in kinds:
                sport_acts.append(act)
        else:
            unmapped.setdefault(key or "(no typeKey)", []).append(act)
    if unmapped:
        counts = sorted(unmapped.items(), key=lambda kv: -len(kv[1]))
        print("Skipped, no mapping: " + ", ".join(f"{k} ×{len(v)}" for k, v in counts))

    if "cardio" in kinds:
        for row in cardio_rows:
            te = f"aero {row.get('aerobic_te', '—')} / anaero {row.get('anaerobic_te', '—')}"
            print(f"  {row['session_date']} {row['activity_type']}: {row['duration_minutes']}min, TE {te}")
        if not cardio_rows:
            print("No cardio activities to sync.")
        elif dry_run:
            print(f"Would upsert {len(cardio_rows)} cardio activity(ies).")
        else:
            upsert(cardio_rows)
            print(f"Upserted {len(cardio_rows)} cardio activity(ies).")

    if "sport" in kinds:
        types, existing = fetch_sport_state(user_id)
        if dry_run and unmapped:
            print_unmapped_inventory(unmapped, existing)
        if not sport_acts:
            print("No sport activities to sync.")
            return
        plan = plan_sport(user_id, sport_acts, existing)
        for label in plan["skipped"]:
            print(f"  {label} — already synced")
        for _, _, label in plan["claimed"]:
            print(f"  {label}")
        for row in plan["inserted"]:
            hr = f", {row['avg_heart_rate']} bpm" if row.get("avg_heart_rate") else ""
            new_type = "" if row["sport_name"].lower() in types else " (new sport type)"
            print(f"  {row['session_date']} {row['sport_name']}: {row['duration_minutes']}min{hr} → new row{new_type}")
        summary = (f"{len(plan['claimed'])} claimed manual row(s), {len(plan['inserted'])} new row(s), "
                   f"{len(plan['skipped'])} already synced")
        if dry_run:
            print(f"Would write: {summary}.")
        else:
            apply_sport_plan(user_id, plan, types)
            print(f"Wrote: {summary}.")


if __name__ == "__main__":
    main()
