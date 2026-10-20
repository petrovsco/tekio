import type { SleepEntry, SleepQuality } from '@tekio/core'
import { userRows, type Db } from './db'

// ── Sleep (sleep_logs: log_date / duration_hours / quality) ─────────────────

export type SleepRow = {
  id: string
  log_date: string
  duration_hours: number | string | null
  quality: number | null
  sleep_score: number | null
  sleep_score_qualifier: string | null
  hrv: number | null
  resting_hr: number | null
  source: string | null
  notes: string | null
}

export const SLEEP_COLS = 'id, log_date, duration_hours, quality, sleep_score, sleep_score_qualifier, hrv, resting_hr, source, notes'

export function mapSleep(r: SleepRow): SleepEntry {
  return {
    id: r.id,
    date: r.log_date,
    hours: r.duration_hours != null ? Number(r.duration_hours) : 0,
    quality: r.quality != null ? (r.quality as SleepQuality) : undefined,
    score: r.sleep_score != null ? Number(r.sleep_score) : undefined,
    scoreQualifier: r.sleep_score_qualifier ?? undefined,
    hrv: r.hrv != null ? Number(r.hrv) : undefined,
    restingHr: r.resting_hr != null ? Number(r.resting_hr) : undefined,
    source: r.source === 'garmin' ? 'garmin' : 'manual',
    notes: r.notes ?? undefined,
  }
}

export async function loadSleep(db: Db): Promise<SleepEntry[]> {
  const rows = await userRows(db, 'sleep_logs', SLEEP_COLS, 'log_date')
  return rows.map(mapSleep)
}
