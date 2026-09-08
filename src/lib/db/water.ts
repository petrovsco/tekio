import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { WaterEntry } from '../../types'
import { withOrigin } from '../env'
import { userRows, deleteRow } from './_rows'

export async function loadWater(): Promise<WaterEntry[]> {
  const rows = await userRows('water_logs', 'id, log_date, amount_ml', 'log_date')
  return rows.map(r => ({
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

export const deleteWaterEntry = (id: string): Promise<void> => deleteRow('water_logs', id)

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
