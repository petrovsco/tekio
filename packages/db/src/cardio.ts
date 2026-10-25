import type { CardioEntry } from '@tekio/core'
import { CARDIO_TYPE_MAP, CARDIO_TYPE_REVERSE } from './columns'
import { userRows, withOrigin, deleteRow, type Db, type WriteDb } from './db'

// One literal on purpose: PostgREST parses the select string at the type level,
// and a concatenation is just `string`, which costs the returned rows their
// column names.
const CARDIO_COLS = 'id, session_date, activity_type, duration_minutes, distance_km, avg_heart_rate, max_heart_rate, elevation_gain_m, zone_distribution, aerobic_te, anaerobic_te, training_effect_label, training_load, source, garmin_activity_id, notes, format, bout_seconds'

/* eslint-disable @typescript-eslint/no-explicit-any */
function toCardioEntry(r: any): CardioEntry {
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

export async function loadCardio(db: Db): Promise<CardioEntry[]> {
  return cardioFromRows(await userRows(db, 'cardio_sessions', CARDIO_COLS, 'session_date'))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const cardioFromRows = (rows: any[]): CardioEntry[] => rows.map(toCardioEntry)

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

export async function saveCardioEntry(db: WriteDb, entry: Omit<CardioEntry, 'id'>): Promise<CardioEntry> {
  const { data, error } = await db.client
    .from('cardio_sessions')
    .insert(withOrigin(db, { user_id: db.userId, ...toRow(entry) }))
    .select(CARDIO_COLS)
    .single()
  if (error) throw error
  return toCardioEntry(data)
}

export async function updateCardioEntry(db: Db, id: string, patch: Omit<CardioEntry, 'id'>): Promise<void> {
  const { error } = await db.client.from('cardio_sessions').update(toRow(patch)).eq('id', id)
  if (error) throw error
}

export const deleteCardioEntry = (db: Db, id: string): Promise<void> => deleteRow(db, 'cardio_sessions', id)
