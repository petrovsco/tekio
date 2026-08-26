# Garmin → Supabase sync

Two daily [GitHub Actions](../../.github/workflows/) jobs pull your Garmin Connect
data and upsert it into Supabase:

- **[Sleep](../../.github/workflows/garmin-sleep-sync.yml)** (`sync_sleep.py`) →
  `sleep_logs`: duration, **Sleep Score**, HRV, resting HR, bed/wake times.
- **[Activities](../../.github/workflows/garmin-activity-sync.yml)**
  (`sync_activities.py`) → `cardio_sessions`: cardio activities
  (cycling / running / swimming / rowing) with distance, elevation, avg/max HR,
  HR-zone time, and **Aerobic / Anaerobic Training Effect**. The app uses the
  Training Effect + zones to classify each ride into the correct cardio
  adaptation (`classifyCardioAdaptations` in `src/lib/adaptations.ts`) — a hard
  ride can count toward both VO₂max and anaerobic capacity.

Both use the unofficial Garmin Connect API (via [`garminconnect`](https://github.com/cyberjunky/python-garminconnect)).
Fine for reading your own account on this single-user app; it can break if Garmin
changes their internal API (bump the library version if so). Both share the same
secrets and are **idempotent** (sleep upserts on `(user_id, log_date)`; activities
on `(user_id, garmin_activity_id)`), so re-running is safe. Non-cardio activities
(tennis, strength, walks) are skipped — those stay manual.

## How it works

- Auth is **token-based** and lives in [garmin_auth.py](garmin_auth.py). A token
  blob is generated once locally (answering MFA if you have it on), so CI never
  needs your password and never hits an MFA prompt.
- **The token rotates, so it is stored where the job can write it.** Garmin's
  access token lasts about an hour and is renewed with a refresh token that
  Garmin replaces on every use — the previous one dies immediately. So the
  current token lives in the Supabase `integration_tokens` table (RLS on with no
  policies, so only the service-role key reaches it), and each run writes the
  rotated token straight back. The `GARMIN_TOKENSTORE` secret is only the
  *bootstrap*: it seeds the first run, and re-pasting a fresh blob is how you
  recover if the chain ever breaks.
- The blob is handed to `garminconnect` as a **file path**, never as inline
  JSON. This is not a style choice: the library only saves a rotated token when
  the tokenstore is a path, and passing JSON is what silently broke the sync
  before 2026-08-26.
- Each run syncs the last `SYNC_DAYS` nights (default 3) to catch late watch
  syncs. It's **idempotent** — upserts on the `(user_id, log_date)` key.
- Only objective columns are written (`source='garmin'`). Your subjective
  `quality` stars and `notes` are never overwritten.

## One-time setup

### 1. Generate the token blob (local machine)

Needs Python 3. If `python`/`pip` isn't found, install it first
(`winget install -e --id Python.Python.3.12`), then **reopen the terminal**.

**Windows (PowerShell):**

```powershell
cd scripts\garmin-sync
python -m pip install -r requirements.txt
$env:GARMIN_EMAIL = "you@example.com"
$env:GARMIN_PASSWORD = "your-garmin-password"
python gen_token.py
# when done, clear the password from the session:
$env:GARMIN_PASSWORD = $null
```

**macOS / Linux (bash):**

```bash
cd scripts/garmin-sync
python3 -m pip install -r requirements.txt
GARMIN_EMAIL=you@example.com GARMIN_PASSWORD='...' python3 gen_token.py
```

Answer the MFA prompt if asked, then copy the printed JSON
(`{"di_token": …, "di_refresh_token": …, "di_client_id": …}`).

### 2. Add GitHub Actions secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
| --- | --- |
| `GARMIN_TOKENSTORE` | the JSON blob from step 1 (bootstrap only — the live token then lives in Supabase) |
| `SUPABASE_URL` | `https://snpjfzfqjwkdwzzqfhsz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → **service_role** key (server-side only) |
| `TEKIO_USER_ID` | the `USER_ID` from `src/constants/app.ts` |

> The service_role key bypasses RLS. It only ever lives in GitHub secrets and
> runs server-side — never expose it in the browser/Vite build.

### 3. Run it

Actions tab → **Garmin sleep sync** / **Garmin activity sync** → **Run workflow**.
Check the logs, then confirm rows landed in `sleep_logs` / `cardio_sessions`.
After that they run daily (sleep 09:00 UTC, activities 09:20 UTC). Set
`SYNC_DAYS` higher on a manual run to backfill more history.

## Troubleshooting

Every run starts by naming the token it is using and how fresh it is, e.g.
`Trying the token from Supabase — access token good for 43min, refresh token
present`. Start there.

- **`Garmin rejected every token we have`** → the refresh token is dead. Re-run
  `gen_token.py` and paste the new blob into `GARMIN_TOKENSTORE`; the next run
  adopts it and writes it back to Supabase on its own. No database edit needed.
- **`ERROR: failed to save the rotated token`** → the run worked, but the token
  it rotated to was lost, so the *next* run will fail. Fix the Supabase write
  before anything else — this is the failure mode that broke the sync for weeks.
- **`WARNING: could not read the stored token`** → the Supabase read failed and
  the run fell back to the secret. It may still succeed, but nothing is being
  persisted. Not cosmetic.
- **`Failed to retrieve social profile`** → an old-style failure from before the
  2026-08-26 fix. It means "the token was rejected", not "the endpoint is down".
- **No sleep data** → the watch hadn't synced that night, or the device doesn't
  produce a Sleep Score. Duration still syncs even without a score.
- **Run it locally** to debug: set the same env vars and
  `python sync_sleep.py`. It shares the Supabase token store with CI, so a local
  run rotates the token CI uses — expect the next CI run to say `Supabase` and
  succeed, which is fine.
