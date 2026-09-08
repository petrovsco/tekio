import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { SleepEntry, SaunaEntry, ColdEntry, SleepQuality } from '../../types'
import { withOrigin } from '../env'
import { userRows, deleteRow } from './_rows'

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

/** The columns a save and an update both write. Deliberately not `sleep_score`,
 *  `hrv` or `resting_hr`: those are Garmin's and a typed night must not clear
 *  them — see the upsert note below. */
const sleepRow = (entry: Omit<SleepEntry, 'id'>) => ({
  log_date: entry.date,
  duration_hours: entry.hours,
  quality: entry.quality ?? null,
  notes: entry.notes ?? null,
})

export async function loadSleep(): Promise<SleepEntry[]> {
  const rows = await userRows('sleep_logs', SLEEP_COLS, 'log_date')
  return rows.map(mapSleep)
}

export async function saveSleepEntry(entry: Omit<SleepEntry, 'id'>): Promise<SleepEntry> {
  // Upsert on the per-night key: if the daily Garmin sync already created this
  // night, a manual add updates the subjective fields and leaves the objective
  // sleep_score untouched (it isn't in the payload).
  const { data, error } = await supabase
    .from('sleep_logs')
    .upsert(
      { user_id: USER_ID, source: 'manual', ...sleepRow(entry) },
      { onConflict: 'user_id,log_date' }
    )
    .select(SLEEP_COLS)
    .single()
  if (error) throw error
  return mapSleep(data as SleepRow)
}

export async function updateSleepEntry(id: string, patch: Omit<SleepEntry, 'id'>): Promise<void> {
  const { error } = await supabase.from('sleep_logs').update(sleepRow(patch)).eq('id', id)
  if (error) throw error
}

export const deleteSleepEntry = (id: string): Promise<void> => deleteRow('sleep_logs', id)

// ── Sauna & Cold (session tables, identical shape) ──────────────────────────

function mapSession(r: { id: string; session_date: string; duration_minutes: number | string; temperature_c: number | string | null; notes: string | null }) {
  return {
    id: r.id,
    date: r.session_date,
    duration: Number(r.duration_minutes),
    tempC: r.temperature_c != null ? Number(r.temperature_c) : undefined,
    notes: r.notes ?? undefined,
  }
}

const SESSION_COLS = 'id, session_date, duration_minutes, temperature_c, notes'

type SessionEntry = { date: string; duration: number; tempC?: number; notes?: string }
type SessionTable = 'sauna_sessions' | 'cold_sessions'

/** The columns a save and an update both write. */
const sessionRow = (entry: SessionEntry) => ({
  session_date: entry.date,
  duration_minutes: entry.duration,
  temperature_c: entry.tempC ?? null,
  notes: entry.notes ?? null,
})

async function loadSessions(table: SessionTable) {
  const rows = await userRows(table, SESSION_COLS, 'session_date')
  return rows.map(mapSession)
}

async function saveSession(table: SessionTable, entry: SessionEntry) {
  const { data, error } = await supabase
    .from(table)
    .insert(withOrigin({ user_id: USER_ID, ...sessionRow(entry) }))
    .select(SESSION_COLS)
    .single()
  if (error) throw error
  return mapSession(data)
}

async function updateSession(table: SessionTable, id: string, patch: SessionEntry) {
  const { error } = await supabase.from(table).update(sessionRow(patch)).eq('id', id)
  if (error) throw error
}

export const loadSauna = (): Promise<SaunaEntry[]> => loadSessions('sauna_sessions')
export const saveSaunaEntry = (entry: Omit<SaunaEntry, 'id'>): Promise<SaunaEntry> => saveSession('sauna_sessions', entry)
export const updateSaunaEntry = (id: string, patch: Omit<SaunaEntry, 'id'>): Promise<void> => updateSession('sauna_sessions', id, patch)
export const deleteSaunaEntry = (id: string): Promise<void> => deleteRow('sauna_sessions', id)

export const loadCold = (): Promise<ColdEntry[]> => loadSessions('cold_sessions')
export const saveColdEntry = (entry: Omit<ColdEntry, 'id'>): Promise<ColdEntry> => saveSession('cold_sessions', entry)
export const updateColdEntry = (id: string, patch: Omit<ColdEntry, 'id'>): Promise<void> => updateSession('cold_sessions', id, patch)
export const deleteColdEntry = (id: string): Promise<void> => deleteRow('cold_sessions', id)
