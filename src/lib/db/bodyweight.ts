import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { BodyweightEntry } from '../../types'
import { withOrigin } from '../env'
import { userRows, deleteRow } from './_rows'

export async function loadBodyweight(): Promise<BodyweightEntry[]> {
  const rows = await userRows('bodyweight_logs', 'id, log_date, weight, notes', 'log_date')
  return rows.map(r => ({
    id: r.id,
    date: r.log_date,
    weight: Number(r.weight),
  }))
}

export async function saveBodyweightEntry(entry: Omit<BodyweightEntry, 'id'>): Promise<BodyweightEntry> {
  const { data, error } = await supabase
    .from('bodyweight_logs')
    .upsert(
      withOrigin({ user_id: USER_ID, log_date: entry.date, weight: entry.weight }),
      { onConflict: 'user_id,log_date' }
    )
    .select('id, log_date, weight')
    .single()
  if (error) throw error
  return { id: data.id, date: data.log_date, weight: Number(data.weight) }
}

export const deleteBodyweightEntry = (id: string): Promise<void> => deleteRow('bodyweight_logs', id)

export async function updateBodyweightEntry(
  id: string,
  patch: Omit<BodyweightEntry, 'id'>
): Promise<void> {
  const { error } = await supabase
    .from('bodyweight_logs')
    .update({ log_date: patch.date, weight: patch.weight })
    .eq('id', id)
  if (error) throw error
}
