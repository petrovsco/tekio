import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { SleepEntry, SaunaEntry, ColdEntry, SleepQuality } from '../../types'

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

export async function loadSleep(): Promise<SleepEntry[]> {
  const { data, error } = await supabase
    .from('sleep_logs')
    .select(SLEEP_COLS)
    .eq('user_id', USER_ID)
    .order('log_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapSleep)
}

export async function saveSleepEntry(entry: Omit<SleepEntry, 'id'>): Promise<SleepEntry> {
  // Upsert on the per-night key: if the daily Garmin sync already created this
  // night, a manual add updates the subjective fields and leaves the objective
  // sleep_score untouched (it isn't in the payload).
  const { data, error } = await supabase
    .from('sleep_logs')
    .upsert({
      user_id: USER_ID,
      log_date: entry.date,
      duration_hours: entry.hours,
      quality: entry.quality ?? null,
      source: 'manual',
      notes: entry.notes ?? null,
    }, { onConflict: 'user_id,log_date' })
    .select(SLEEP_COLS)
    .single()
  if (error) throw error
  return mapSleep(data as SleepRow)
}

export async function updateSleepEntry(id: string, patch: Omit<SleepEntry, 'id'>): Promise<void> {
  const { error } = await supabase
    .from('sleep_logs')
    .update({
      log_date: patch.date,
      duration_hours: patch.hours,
      quality: patch.quality ?? null,
      notes: patch.notes ?? null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteSleepEntry(id: string): Promise<void> {
  const { error } = await supabase.from('sleep_logs').delete().eq('id', id)
  if (error) throw error
}

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

async function loadSessions(table: 'sauna_sessions' | 'cold_sessions') {
  const { data, error } = await supabase
    .from(table)
    .select('id, session_date, duration_minutes, temperature_c, notes')
    .eq('user_id', USER_ID)
    .order('session_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapSession)
}

async function saveSession(table: 'sauna_sessions' | 'cold_sessions', entry: { date: string; duration: number; tempC?: number; notes?: string }) {
  const { data, error } = await supabase
    .from(table)
    .insert({
      user_id: USER_ID,
      session_date: entry.date,
      duration_minutes: entry.duration,
      temperature_c: entry.tempC ?? null,
      notes: entry.notes ?? null,
    })
    .select('id, session_date, duration_minutes, temperature_c, notes')
    .single()
  if (error) throw error
  return mapSession(data)
}

async function updateSession(table: 'sauna_sessions' | 'cold_sessions', id: string, patch: { date: string; duration: number; tempC?: number; notes?: string }) {
  const { error } = await supabase
    .from(table)
    .update({
      session_date: patch.date,
      duration_minutes: patch.duration,
      temperature_c: patch.tempC ?? null,
      notes: patch.notes ?? null,
    })
    .eq('id', id)
  if (error) throw error
}

async function deleteSession(table: 'sauna_sessions' | 'cold_sessions', id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

export const loadSauna = (): Promise<SaunaEntry[]> => loadSessions('sauna_sessions')
export const saveSaunaEntry = (entry: Omit<SaunaEntry, 'id'>): Promise<SaunaEntry> => saveSession('sauna_sessions', entry)
export const updateSaunaEntry = (id: string, patch: Omit<SaunaEntry, 'id'>): Promise<void> => updateSession('sauna_sessions', id, patch)
export const deleteSaunaEntry = (id: string): Promise<void> => deleteSession('sauna_sessions', id)

export const loadCold = (): Promise<ColdEntry[]> => loadSessions('cold_sessions')
export const saveColdEntry = (entry: Omit<ColdEntry, 'id'>): Promise<ColdEntry> => saveSession('cold_sessions', entry)
export const updateColdEntry = (id: string, patch: Omit<ColdEntry, 'id'>): Promise<void> => updateSession('cold_sessions', id, patch)
export const deleteColdEntry = (id: string): Promise<void> => deleteSession('cold_sessions', id)
