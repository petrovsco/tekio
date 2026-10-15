"""Close a Garmin sync run in `sync_runs`, so the app's "Garmin · 08:02" line
beside the wordmark is true whichever workflow ran last (RFC 0110).

Run as the last step of every sync workflow, `if: always()`:

  SYNC_RUN_ID  the row the app asked for (garmin-sync-now.yml); empty on a
               scheduled run, which writes its own row instead
  JOB_STATUS   ${{ job.status }} — 'success' closes the row 'ok', anything else 'failed'
  TEKIO_USER_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  as for the syncs

A failure here never fails the job: the data is already in, and only the line
would be stale.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone

import requests

from garmin_auth import env, rest_headers, rest_url


def main() -> None:
    status = "ok" if os.getenv("JOB_STATUS") == "success" else "failed"
    now = datetime.now(timezone.utc).isoformat()
    run_id = os.getenv("SYNC_RUN_ID", "").strip()
    if run_id:
        resp = requests.patch(
            rest_url("sync_runs"),
            params={"id": f"eq.{run_id}"},
            headers=rest_headers("return=minimal"),
            json={"status": status, "finished_at": now},
            timeout=30,
        )
    else:
        resp = requests.post(
            rest_url("sync_runs"),
            headers=rest_headers("return=minimal"),
            json={"user_id": env("TEKIO_USER_ID"), "provider": "garmin", "trigger": "schedule",
                  "status": status, "requested_at": now, "finished_at": now},
            timeout=30,
        )
    if resp.ok:
        print(f"Recorded the run as {status}.")
    else:
        print(f"::warning title=Sync run not recorded::{resp.status_code} {resp.text}")


if __name__ == "__main__":
    main()
