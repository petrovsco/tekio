import type { ReadinessInput } from '@tekio/core'
import { userRows, type Db } from './db'

// ── Typed readiness inputs (readiness_inputs, RFC 0092) ─────────────────────
// One row per morning. A save writes only its own columns, so typing the
// morning HRV never clears a check-in on the same day, and the other way round.

export type ReadinessRow = {
  id: string
  log_date: string
  morning_hrv: number | string | null
  energy: number | null
  soreness: number | null
  sleep_quality: number | null
  stress: number | null
  mood: number | null
}

export const READINESS_COLS = 'id, log_date, morning_hrv, energy, soreness, sleep_quality, stress, mood'

export function mapReadinessRow(r: ReadinessRow): ReadinessInput {
  const complete = r.energy != null && r.soreness != null && r.sleep_quality != null
    && r.stress != null && r.mood != null
  return {
    id: r.id,
    date: r.log_date,
    morningHrv: r.morning_hrv != null ? Number(r.morning_hrv) : undefined,
    checkIn: complete
      ? { energy: r.energy!, soreness: r.soreness!, sleepQuality: r.sleep_quality!, stress: r.stress!, mood: r.mood! }
      : undefined,
  }
}

export async function loadReadinessInputs(db: Db): Promise<ReadinessInput[]> {
  const rows = await userRows(db, 'readiness_inputs', READINESS_COLS, 'log_date')
  return rows.map(mapReadinessRow)
}
