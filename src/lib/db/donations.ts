import { supabase } from '../supabase'
import { USER_ID, DONATION_TYPE_MAP, DONATION_TYPE_REVERSE } from '../../constants/app'
import type { DonationEntry } from '../../types'
import { withOrigin } from '../env'
import { userRows, deleteRow } from './_rows'

const COLS = 'id, donation_date, donation_type, notes'

/* eslint-disable @typescript-eslint/no-explicit-any */
function toEntry(r: any): DonationEntry {
  return {
    id: r.id,
    date: r.donation_date,
    // The fallback is for a column value the app's own list has no name for.
    type: (DONATION_TYPE_REVERSE[r.donation_type] ?? r.donation_type) as DonationEntry['type'],
    notes: r.notes ?? '',
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** The columns a save and an update both write. `entry.type` is a closed union,
 *  so the map covers it and no fallback is reachable on the way in. */
const toRow = (entry: Omit<DonationEntry, 'id'>) => ({
  donation_date: entry.date,
  donation_type: DONATION_TYPE_MAP[entry.type],
  notes: entry.notes ?? null,
})

export async function loadDonations(): Promise<DonationEntry[]> {
  const rows = await userRows('blood_donations', COLS, 'donation_date')
  return rows.map(toEntry)
}

export async function saveDonationEntry(entry: Omit<DonationEntry, 'id'>): Promise<DonationEntry> {
  const { data, error } = await supabase
    .from('blood_donations')
    .insert(withOrigin({ user_id: USER_ID, ...toRow(entry) }))
    .select(COLS)
    .single()
  if (error) throw error
  return toEntry(data)
}

export const deleteDonationEntry = (id: string): Promise<void> => deleteRow('blood_donations', id)

export async function updateDonationEntry(
  id: string,
  patch: Omit<DonationEntry, 'id'>
): Promise<void> {
  const { error } = await supabase.from('blood_donations').update(toRow(patch)).eq('id', id)
  if (error) throw error
}
