import { supabase } from '../supabase'
import { USER_ID, CARDIO_TYPE_MAP, CARDIO_TYPE_REVERSE } from '../../constants/app'
import type { CardioEntry } from '../../types'
import { withOrigin } from '../env'
import { userRows, deleteRow } from './_rows'

// One literal on purpose: PostgREST parses the select string at the type level,
// and a concatenation is just `string`, which costs the returned rows their
// column names.
const COLS = 'id, session_date, activity_type, duration_minutes, distance_km, avg_heart_rate, max_heart_rate, elevation_gain_m, zone_distribution, aerobic_te, anaerobic_te, training_effect_label, training_load, source, garmin_activity_id, notes, format, bout_seconds'

/* eslint-disable @typescript-eslint/no-explicit-any */
function toEntry(r: any): CardioEntry {
  return {
    id: r.id,
    date: r.session_date,
    // The fallback is for a column value the app's own list has no name for:
    // the check constraint permits ten activity types against CARDIO_TYPES' five.
    type: (CARDIO_TYPE_REVERSE[r.activity_type] ?? r.activity_type) as CardioEntry['type'],
    duration: Number(r.duration_minutes),
    distance: r.distance_km != null ? Number(r.distance_km) : undefined,
    avgHr: r.avg_heart_rate != null ? Number(r.avg_heart_rate) : undefined,
    maxHr: r.max_heart_rate != null ? Number(r.max_heart_rate) : undefined,
    elevationGain: r.elevation_gain_m != null ? Number(r.elevation_gain_m) : undefined,
    zoneDistribution: Array.isArray(r.zone_distribution) ? r.zone_distribution.map(Number) : undefined,
    aerobicTe: r.aerobic_te != null ? Number(r.aerobic_te) : undefined,
    anaerobicTe: r.anaerobic_te != null ? Number(r.anaerobic_te) : undefined,
    trainingEffectLabel: r.training_effect_label ?? undefined,
    trainingLoad: r.training_load != null ? Number(r.training_load) : undefined,
    source: (r.source ?? 'manual') as CardioEntry['source'],
    garminActivityId: r.garmin_activity_id != null ? Number(r.garmin_activity_id) : undefined,
    notes: r.notes ?? undefined,
    format: r.format ?? undefined,
    boutSeconds: r.bout_seconds != null ? Number(r.bout_seconds) : undefined,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** The columns a save and an update both write — the Garmin-only intensity
 *  columns are not among them, because a typed session never sets them.
 *  `entry.type` is a closed union, so the map covers it with no fallback. */
const toRow = (entry: Omit<CardioEntry, 'id'>) => ({
  session_date: entry.date,
  activity_type: CARDIO_TYPE_MAP[entry.type],
  duration_minutes: entry.duration,
  distance_km: entry.distance ?? null,
  avg_heart_rate: entry.avgHr ?? null,
  notes: entry.notes ?? null,
  format: entry.format ?? null,
  bout_seconds: entry.format === 'intervals' ? entry.boutSeconds ?? null : null,
})

export async function loadCardio(): Promise<CardioEntry[]> {
  const rows = await userRows('cardio_sessions', COLS, 'session_date')
  return rows.map(toEntry)
}

export async function saveCardioEntry(entry: Omit<CardioEntry, 'id'>): Promise<CardioEntry> {
  const { data, error } = await supabase
    .from('cardio_sessions')
    .insert(withOrigin({ user_id: USER_ID, ...toRow(entry) }))
    .select(COLS)
    .single()
  if (error) throw error
  return toEntry(data)
}

export const deleteCardioEntry = (id: string): Promise<void> => deleteRow('cardio_sessions', id)

export async function updateCardioEntry(
  id: string,
  patch: Omit<CardioEntry, 'id'>
): Promise<void> {
  const { error } = await supabase.from('cardio_sessions').update(toRow(patch)).eq('id', id)
  if (error) throw error
}
