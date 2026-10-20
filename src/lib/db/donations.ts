import { supabase } from '../supabase'
import { userId } from '../session'
import { DONATION_TYPE_MAP, DONATION_COLS as COLS, toDonationEntry as toEntry, loadDonations as dbLoadDonations } from '@tekio/db'
import type { DonationEntry } from '../../types'
import { withOrigin } from '../env'
import { appDb, deleteRow } from './_rows'

/** The columns a save and an update both write. `entry.type` is a closed union,
 *  so the map covers it and no fallback is reachable on the way in. */
const toRow = (entry: Omit<DonationEntry, 'id'>) => ({
  donation_date: entry.date,
  donation_type: DONATION_TYPE_MAP[entry.type],
  notes: entry.notes ?? null,
})

export const loadDonations = (): Promise<DonationEntry[]> => dbLoadDonations(appDb())

export async function saveDonationEntry(entry: Omit<DonationEntry, 'id'>): Promise<DonationEntry> {
  const { data, error } = await supabase
    .from('blood_donations')
    .insert(withOrigin({ user_id: userId(), ...toRow(entry) }))
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
