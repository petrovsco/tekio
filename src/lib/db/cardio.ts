import { supabase } from '../supabase'
import { userId } from '../session'
import { CARDIO_TYPE_MAP, CARDIO_COLS as COLS, toCardioEntry as toEntry, loadCardio as dbLoadCardio } from '@tekio/db'
import type { CardioEntry } from '../../types'
import { withOrigin } from '../env'
import { appDb, deleteRow } from './_rows'

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

export const loadCardio = (): Promise<CardioEntry[]> => dbLoadCardio(appDb())

export async function saveCardioEntry(entry: Omit<CardioEntry, 'id'>): Promise<CardioEntry> {
  const { data, error } = await supabase
    .from('cardio_sessions')
    .insert(withOrigin({ user_id: userId(), ...toRow(entry) }))
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
