# Roadmap: Restore the Garmin sync (token regen + backfill)

**Label:** infra
**Status:** done — 2026-08-27: the token was minted and the sync verified by Peter. The steps below are kept as the runbook for the next time the token dies.

The code fix shipped 2026-08-26. What is left is the part CI cannot do for
itself: mint one fresh Garmin token, then let the jobs take over.

No new physiological number is written, so this does not trigger `/ground`
(doctrine §4.5) — it restores an existing data path.

## Why it broke

`GARMIN_TOKENSTORE` held a **static** token blob. Garmin's DI access token lives
about an hour and is renewed with a refresh token that Garmin **rotates on every
use** — the old one dies the moment a new one is issued. `garminconnect` persists
that rotation, but *only when the tokenstore is a file path*; the scripts passed
it as inline JSON, which leaves the library's `_tokenstore_path` at `None`, so
nothing was ever saved. Every run replayed the same, already-spent refresh token.

The refresh failure is swallowed by the library, so the stale access token went
out anyway and Garmin answered 401 — surfacing as the misleading
`GarminConnectAuthenticationError: Failed to retrieve social profile`, which
reads like a broken endpoint rather than a dead credential. That is why it went
unfixed for weeks.

Verified directly against garminconnect 0.3.11: `client.loads(json)` leaves
`_tokenstore_path` `None`; `client.load(path)` sets it, and a refresh then
rewrites the file.

## What already shipped

- `scripts/garmin-sync/garmin_auth.py` — shared login. Reads the token from
  Supabase `integration_tokens`, hands the library a **file path**, and writes
  the rotated token straight back, including when the run later fails.
- Both sync scripts use it; their duplicated `login()` / `_env` helpers are gone.
- `integration_tokens` table (RLS on, no policies — service_role only, the same
  posture as `assistant_settings`).
- `garminconnect` pinned to `>=0.3.11,<0.4`. The old unpinned `>=0.2.25` silently
  crossed the 0.2→0.3 rewrite (garth → native client, new token format), which is
  how the format changed underneath a secret nobody had touched.
- Failure output now names the source it tried, prints token expiry, and says to
  re-run `gen_token.py`.

## Steps

1. **Mint a token** (local machine — it can answer the MFA prompt; CI cannot):

   ```powershell
   cd scripts\garmin-sync
   python -m pip install -r requirements.txt
   $env:GARMIN_EMAIL = "you@example.com"
   $env:GARMIN_PASSWORD = "your-garmin-password"
   python gen_token.py
   $env:GARMIN_PASSWORD = $null
   ```

2. **Paste the JSON** into repo → Settings → Secrets and variables → Actions →
   `GARMIN_TOKENSTORE`. It is JSON now (`{"di_token": …}`), not the old base64
   blob — replace the whole value.

3. **Run *Garmin sleep sync*** from the Actions tab. Expect in the log:

   ```
   Trying the token from Supabase — …           (fails: the dead one)
   Trying the token from GARMIN_TOKENSTORE — …  (succeeds)
     saved the rotated token to Supabase — access token good for ~60min
   Logged in as <name>
   ```

   The first line is only there on this first run; afterwards Supabase holds the
   live token and wins immediately.

4. **Run *Garmin activity sync*** and confirm the same. Then check that the rows
   landed — `sleep_logs` and `cardio_sessions` both read 0 rows as of
   2026-08-26, consistent with the sync never having succeeded.

5. **Backfill** (this absorbs the Phase 1 remainder that used to live in
   [008-garmin-recovery-load-axis.md](008-garmin-recovery-load-axis.md)): the activity
   sync has never run with a raised `SYNC_DAYS`, so `cardio_sessions` only ever
   held what the daily cron picked up. Re-run *Garmin activity sync* with
   `SYNC_DAYS` temporarily raised in
   [.github/workflows/garmin-activity-sync.yml](../../../.github/workflows/garmin-activity-sync.yml)
   (e.g. `365`), let it finish, then set it back to `7`.

6. **Confirm the day after.** The real proof is the *second* daily run, because
   that is the one the old setup could never survive. If it logs
   `Trying the token from Supabase` and succeeds, the rotation chain is holding.

## If it fails again

The run now says which token it tried and how stale it was. Two cases:

- **`saved the rotated token to Supabase` never appears** — the write-back is
  failing (look for the `ERROR: failed to save the rotated token` line). The
  credential is being lost every run and the old bug is effectively back.
- **Every source rejected** — the refresh token really is dead; repeat steps 1–2.

A `WARNING: could not read the stored token` line means the Supabase read failed
and the run fell back to the secret. That run may work, but nothing persists —
treat it as urgent, not cosmetic.
