# Roadmap: Garmin daily load & readiness → Recovery axis (Garmin sync Phase 2)

**Label:** feature
**Status:** backlog — phase 1 code shipped but has never produced a row, so the field names are unverified; phase 2 is the recovery-load axis.

> **Stale destination (noted 2026-09-01):** the Context section below
> describes `RecoveryCard` and `RECOVERY_WEIGHTS`, both retired 2026-08-31
> when the fused Home shipped (roadmap 014/018). Systemic readiness is now
> sleep + HRV in `src/lib/fusedRead.ts` behind Home's SYSTEMIC READINESS
> card — which is exactly where a Garmin Training Readiness score and
> acute-load chip would surface. The open decision (display-only vs scored
> in) survives unchanged; re-aim the implementation steps at the fused read
> at kickoff.

## Goal

Pull Garmin's **daily whole-body** metrics — **Training Readiness** score (0–100)
and **Acute Load** (training-load balance / ACWR) — into the app and surface them
on the **Recovery / Readiness axis**. These are *not* a 10th adaptation; they are
daily fatigue/readiness signals that sit alongside sleep, mobility, sauna, cold and
recovery habits (like the Garmin **Sleep Score** already does).

This is Phase 2 of the Garmin work. Phase 1 (activities → `cardio_sessions` +
Training-Effect adaptation classifier) shipped 2026-07-13 — see
[[project_tekio_garmin_cardio_sync]] and the two Garmin scripts under
`scripts/garmin-sync/`.

**Phase 1 is unblocked (2026-08-27).** The sync had been failing since it
shipped (a dead Garmin token — fixed 2026-08-26); the token was minted and the
pipeline verified, so this brief's prerequisite is met. See
[done/017-garmin-sync-token-restore.md](done/017-garmin-sync-token-restore.md).

## Context (what exists today)

- **Recovery axis** lives in [src/components/tabs/home/RecoveryCard.tsx](../../src/components/tabs/home/RecoveryCard.tsx).
  It computes a **weekly** `readiness` % as a weighted roll-up of per-modality
  sub-scores (each `clamp01(achieved / weekly target)`):
  `RECOVERY_WEIGHTS` = { sleep .45, mobility .15, sauna .15, cold .15, habits .10 }
  (corrected 2026-08-26 — this brief had drifted; `habits` is being dropped, see
  [014-doctrine-ledger-execution.md](014-doctrine-ledger-execution.md))
  and `RECOVERY_TARGETS` in [src/constants/app.ts](../../src/constants/app.ts).
- **Sleep Score precedent** — the pattern to copy. `sleep_logs` gained
  `sleep_score` / `source` via the Garmin sleep sync; the per-night sub-score
  prefers the Garmin score over raw duration (RecoveryCard.tsx ~L62-67). Do the
  analogous thing for readiness/load.
- **Sync plumbing** — `scripts/garmin-sync/sync_sleep.py` + `sync_activities.py`
  (GitHub Actions cron, `garminconnect`, service-role upsert, token blob secret).
  Add a third pull here, or fold into an existing daily job.

## Data source (garminconnect, unofficial — verify field names on first run)

- **Training Readiness**: `client.get_training_readiness(cdate)` → list; first item
  has `score` (0–100), `level` (e.g. LOW/MODERATE/HIGH/MAXIMUM), plus factor
  breakdown (`sleepScore`, `recoveryTime`, `hrvFactorPercent`, `acuteLoad`, …).
- **Acute Load / training-load balance**: `client.get_training_status(cdate)` →
  nested; acute load lives under `mostRecentTrainingLoadBalance` →
  `metricsTrainingLoadBalanceDTOMap[...]` (keys: `monthlyLoadAcute`,
  `trainingBalanceFeedbackPhrase` like PRODUCTIVE/OVERREACHING/DETRAINING). Also
  exposes `mostRecentVO2Max`. **This JSON is messy — log the raw payload on the
  first manual run and pin the exact keys before trusting them.**
- (Optional) Body Battery / resting HR via `get_user_summary(cdate)` if useful.

## Storage design

Readiness/load are **one row per day** (not per-session), so don't reuse a session
table. Recommended: a new `daily_metrics` table keyed `UNIQUE (user_id, metric_date)`
for idempotent upsert, columns e.g. `training_readiness int`, `readiness_level text`,
`acute_load numeric`, `load_balance text` (feedback phrase), `vo2max numeric`,
`source text default 'garmin'`. Mirror the migration into `supabase/migrations/`.

## The open decision (resolve at kickoff)

How do the daily Garmin metrics relate to the **weekly** readiness roll-up?

1. **Display-only (recommended first cut):** show *today's* Training Readiness and
   an Acute-Load status chip (Productive / Overreaching / Detraining) at the top of
   RecoveryCard, without changing the weighted %. Lowest risk, immediately useful,
   avoids conflating a daily point-in-time score with a weekly-target roll-up.
2. **Scored in:** add a weekly-average readiness sub-score to `RECOVERY_WEIGHTS`
   (re-normalise the weights). More "integrated" but muddies the daily-vs-weekly
   semantics and double-counts sleep (readiness already folds in sleep score).

Lean #1; leave #2 as a follow-up once the data's been observed for a couple weeks.
Acute load is best shown as informational load-management context, **not** folded
into a recovery % (high load is training signal, not low recovery).

## Implementation steps

1. Migration: create `daily_metrics` (+ unique key, source check). Apply to live DB
   **before** pushing any frontend that SELECTs it — Vercel auto-deploys `master`.
2. `sync_daily.py` (or extend an existing script) + workflow env; log raw payloads
   on first run to lock field names.
3. Types (`DailyMetric`) + a `daily.ts` db loader; load in `bootstrap()`.
4. RecoveryCard: add a "Today" readiness readout + acute-load chip (option #1).

## Out of scope

- Folding readiness into the weighted readiness % (option #2) — deferred.
- Any new adaptation; per-session load already lives on `cardio_sessions.training_load`.

## Gotchas

- **Don't push column/table-selecting frontend before the migration is live** (breaks
  bootstrap on the auto-deploy). See [[reference_supabase_mcp_reconnect]].
- Garmin readiness/load JSON keys are unstable across the unofficial API — treat the
  first workflow run as field-discovery.
- Daily metric vs weekly roll-up: pick the semantics deliberately (the open decision).
