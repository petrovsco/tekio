import type { SleepEntry, SleepQuality } from '@tekio/core'
import { userRows, withOrigin, deleteRow, type Db, type WriteDb } from './db'

// ── Sleep (sleep_logs: log_date / duration_hours / quality) ─────────────────

type SleepRow = {
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

const SLEEP_COLS = 'id, log_date, duration_hours, quality, sleep_score, sleep_score_qualifier, hrv, resting_hr, source, notes'

function mapSleep(r: SleepRow): SleepEntry {
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
  return sleepFromRows(await userRows(db, 'sleep_logs', SLEEP_COLS, 'log_date'))
}

export const sleepFromRows = (rows: SleepRow[]): SleepEntry[] => rows.map(mapSleep)

/** The columns a save and an update both write. Deliberately not `sleep_score`,
 *  `hrv` or `resting_hr`: those are Garmin's and a typed night must not clear
 *  them — see the upsert note below. */
const sleepRow = (entry: Omit<SleepEntry, 'id'>) => ({
  log_date: entry.date,
  duration_hours: entry.hours,
  quality: entry.quality ?? null,
  notes: entry.notes ?? null,
})

export async function saveSleepEntry(db: WriteDb, entry: Omit<SleepEntry, 'id'>): Promise<SleepEntry> {
  // Upsert on the per-night key: if the daily Garmin sync already created this
  // night, a manual add updates the subjective fields and leaves the objective
  // sleep_score untouched (it isn't in the payload). The origin tag is safe on
  // the conflict branch too: the write-once trigger keeps the row's own origin.
  const { data, error } = await db.client
    .from('sleep_logs')
    .upsert(
      withOrigin(db, { user_id: db.userId, source: 'manual', ...sleepRow(entry) }),
      { onConflict: 'user_id,log_date' }
    )
    .select(SLEEP_COLS)
    .single()
  if (error) throw error
  return mapSleep(data as SleepRow)
}

export async function updateSleepEntry(db: Db, id: string, patch: Omit<SleepEntry, 'id'>): Promise<void> {
  const { error } = await db.client.from('sleep_logs').update(sleepRow(patch)).eq('id', id)
  if (error) throw error
}

export const deleteSleepEntry = (db: Db, id: string): Promise<void> => deleteRow(db, 'sleep_logs', id)
