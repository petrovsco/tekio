import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { BodyweightEntry } from '../../types'
import { withOrigin } from '../env'

export async function loadBodyweight(): Promise<BodyweightEntry[]> {
  const { data, error } = await supabase
    .from('bodyweight_logs')
    .select('id, log_date, weight, notes')
    .eq('user_id', USER_ID)
    .order('log_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => ({
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

export async function deleteBodyweightEntry(id: string): Promise<void> {
  const { error } = await supabase.from('bodyweight_logs').delete().eq('id', id)
  if (error) throw error
}

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
