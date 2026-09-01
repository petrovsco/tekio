import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { WaterEntry } from '../../types'
import { withOrigin } from '../env'

export async function loadWater(): Promise<WaterEntry[]> {
  const { data, error } = await supabase
    .from('water_logs')
    .select('id, log_date, amount_ml')
    .eq('user_id', USER_ID)
    .order('log_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id,
    date: r.log_date,
    amountMl: Number(r.amount_ml),
  }))
}

export async function saveWaterEntry(entry: Omit<WaterEntry, 'id'>): Promise<WaterEntry> {
  const { data, error } = await supabase
    .from('water_logs')
    .insert(withOrigin({
      user_id: USER_ID,
      log_date: entry.date,
      amount_ml: entry.amountMl,
    }))
    .select('id, log_date, amount_ml')
    .single()
  if (error) throw error
  return { id: data.id, date: data.log_date, amountMl: Number(data.amount_ml) }
}

export async function deleteWaterEntry(id: string): Promise<void> {
  const { error } = await supabase.from('water_logs').delete().eq('id', id)
  if (error) throw error
}

export async function updateWaterEntry(
  id: string,
  patch: Omit<WaterEntry, 'id'>
): Promise<void> {
  const { error } = await supabase
    .from('water_logs')
    .update({ log_date: patch.date, amount_ml: patch.amountMl })
    .eq('id', id)
  if (error) throw error
}
