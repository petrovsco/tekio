#!/usr/bin/env python3
"""Token-persisting Garmin login, shared by sync_sleep.py and sync_activities.py.

The DI access token lives about an hour and is renewed with a refresh token that
Garmin **rotates on every use** — the old refresh token dies the moment the new
one is issued. So a token pinned in a GitHub Actions secret is good for exactly
one refresh: every run after that replays a dead token, the refresh fails
(garminconnect swallows that error), and the stale access token gets a 401 that
surfaces as the unhelpful "Failed to retrieve social profile".

The token therefore has to live somewhere the job can *write*. It lives in
Supabase `integration_tokens` (RLS on, no policies — service_role only), and
each run:

  1. reads the current token from Supabase, falling back to GARMIN_TOKENSTORE
     the first time, or whenever a freshly generated one is pasted in;
  2. hands garminconnect a **file path**, not the JSON — the library only
     persists a rotation when the tokenstore is a path (client.load() is what
     sets its `_tokenstore_path`; inline JSON leaves it None);
  3. writes the file back to Supabase afterwards, whether the run succeeded or
     failed, so a rotation that happened mid-run is never lost.

Env vars:
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEKIO_USER_ID  required
  GARMIN_TOKENSTORE   the JSON blob from gen_token.py — bootstrap and recovery
"""
from __future__ import annotations

import base64
import json
import os
import sys
import tempfile
import time
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

import requests
from garminconnect import Garmin

PROVIDER = "garmin"

# What Supabase already holds, so a run only writes when the token actually changed.
_persisted: str | None = None


def env(name: str, required: bool = True) -> str | None:
    val = os.getenv(name)
    if required and not val:
        sys.exit(f"Missing required env var: {name}")
    return val


def _rest_headers() -> dict[str, str]:
    key = env("SUPABASE_SERVICE_ROLE_KEY")
    return {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}


def _rest_url() -> str:
    return f"{env('SUPABASE_URL').rstrip('/')}/rest/v1/integration_tokens"


def _load_stored() -> str | None:
    """Read the token Supabase holds, or None on the very first run."""
    global _persisted
    resp = requests.get(
        _rest_url(),
        params={
            "select": "token",
            "user_id": f"eq.{env('TEKIO_USER_ID')}",
            "provider": f"eq.{PROVIDER}",
        },
        headers=_rest_headers(),
        timeout=30,
    )
    if not resp.ok:
        # Not fatal — GARMIN_TOKENSTORE can still carry this run. Say it loudly
        # anyway: without the write-back the token dies again after one refresh.
        print(f"WARNING: could not read the stored token ({resp.status_code}): {resp.text}")
        return None
    rows = resp.json() or []
    _persisted = rows[0]["token"] if rows else None
    return _persisted


def _persist(path: str) -> None:
    """Write the tokenstore file back to Supabase if the library rotated it."""
    global _persisted
    try:
        blob = Path(path).read_text(encoding="utf-8").strip()
    except OSError:
        return
    if not blob or blob == _persisted:
        return
    try:
        json.loads(blob)  # never store a truncated or half-written file
    except ValueError:
        print("WARNING: the tokenstore file is not valid JSON — not saving it.")
        return

    resp = requests.post(
        _rest_url(),
        params={"on_conflict": "user_id,provider"},
        headers={**_rest_headers(), "Prefer": "resolution=merge-duplicates,return=minimal"},
        json=[{
            "user_id": env("TEKIO_USER_ID"),
            "provider": PROVIDER,
            "token": blob,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }],
        timeout=30,
    )
    if not resp.ok:
        # Loud: the rotated token is now the only working one and it is about to
        # be lost, so the next run would start from a dead one.
        print(f"ERROR: failed to save the rotated token ({resp.status_code}): {resp.text}")
        return
    _persisted = blob
    print(f"  saved the rotated token to Supabase — {describe(blob)}")


def _jwt_exp(token: str | None) -> float | None:
    """The expiry claim out of a JWT. Not verified — we only want the timestamp."""
    if not token or token.count(".") != 2:
        return None
    payload = token.split(".")[1]
    payload += "=" * (-len(payload) % 4)
    try:
        return float(json.loads(base64.urlsafe_b64decode(payload))["exp"])
    except Exception:
        return None


def describe(blob: str) -> str:
    """One-line, secret-free summary of a token blob, for the run log."""
    try:
        data = json.loads(blob)
    except ValueError:
        return "not valid JSON"
    exp = _jwt_exp(data.get("di_token"))
    if exp is None:
        parts = ["access token unreadable"]
    else:
        left = exp - time.time()
        parts = [
            f"access token good for {left / 60:.0f}min" if left > 0
            else f"access token expired {-left / 3600:.1f}h ago"
        ]
    parts.append("refresh token present" if data.get("di_refresh_token") else "NO refresh token")
    return ", ".join(parts)


def _sources() -> list[tuple[str, str]]:
    """Token blobs to try, freshest first, skipping an identical repeat.

    Supabase leads because it holds the rotated token. GARMIN_TOKENSTORE is the
    recovery path: paste a freshly generated blob into the secret and the next
    run adopts it and writes it back — no database edit needed.
    """
    ordered: list[tuple[str, str]] = []
    seen: set[str] = set()
    candidates = (("Supabase", _load_stored()), ("GARMIN_TOKENSTORE", os.getenv("GARMIN_TOKENSTORE")))
    for label, blob in candidates:
        blob = (blob or "").strip()
        if blob and blob not in seen:
            seen.add(blob)
            ordered.append((label, blob))
    return ordered


def _authenticate(path: str) -> Garmin:
    sources = _sources()
    if not sources:
        sys.exit(
            "No Garmin token available. Generate one with gen_token.py and set it as the "
            "GARMIN_TOKENSTORE secret — see scripts/garmin-sync/README.md."
        )

    last_error: Exception | None = None
    for label, blob in sources:
        Path(path).write_text(blob, encoding="utf-8")
        print(f"Trying the token from {label} — {describe(blob)}")
        client = Garmin()
        try:
            client.login(path)
        except Exception as err:  # any failure here just means "try the next source"
            _persist(path)  # a rotation can land before the call that fails
            last_error = err
            print(f"  rejected: {err}")
            continue
        _persist(path)
        return client

    sys.exit(
        f"Garmin rejected every token we have (last error: {last_error}).\n"
        "The refresh token is dead — Garmin rotates it on every use, so this happens if a "
        "run refreshed it and could not save the new one.\n"
        "Fix: run `python gen_token.py` locally (it can answer the MFA prompt) and paste the "
        "output into the GARMIN_TOKENSTORE secret. The next run adopts it automatically."
    )


@contextmanager
def garmin_client() -> Iterator[Garmin]:
    """A logged-in client whose rotated token is saved back on the way out."""
    with tempfile.TemporaryDirectory() as tmp:
        # The .json suffix matters: garminconnect treats any other path as a directory.
        path = os.path.join(tmp, "garmin_tokens.json")
        client = _authenticate(path)
        try:
            yield client
        finally:
            _persist(path)  # catches a refresh that happened mid-run
