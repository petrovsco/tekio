import type { DonationEntry } from '@tekio/core'
import { DONATION_TYPE_MAP, DONATION_TYPE_REVERSE } from './columns'
import { userRows, withOrigin, deleteRow, type Db, type WriteDb } from './db'

const DONATION_COLS = 'id, donation_date, donation_type, notes'

/* eslint-disable @typescript-eslint/no-explicit-any */
function toDonationEntry(r: any): DonationEntry {
  return {
    id: r.id,
    date: r.donation_date,
    // The fallback is for a column value the app's own list has no name for.
    type: (DONATION_TYPE_REVERSE[r.donation_type] ?? r.donation_type) as DonationEntry['type'],
    notes: r.notes ?? '',
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function loadDonations(db: Db): Promise<DonationEntry[]> {
  return donationsFromRows(await userRows(db, 'blood_donations', DONATION_COLS, 'donation_date'))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const donationsFromRows = (rows: any[]): DonationEntry[] => rows.map(toDonationEntry)

/** The columns a save and an update both write. `entry.type` is a closed union,
 *  so the map covers it and no fallback is reachable on the way in. */
const toRow = (entry: Omit<DonationEntry, 'id'>) => ({
  donation_date: entry.date,
  donation_type: DONATION_TYPE_MAP[entry.type],
  notes: entry.notes ?? null,
})

export async function saveDonationEntry(db: WriteDb, entry: Omit<DonationEntry, 'id'>): Promise<DonationEntry> {
  const { data, error } = await db.client
    .from('blood_donations')
    .insert(withOrigin(db, { user_id: db.userId, ...toRow(entry) }))
    .select(DONATION_COLS)
    .single()
  if (error) throw error
  return toDonationEntry(data)
}

export async function updateDonationEntry(db: Db, id: string, patch: Omit<DonationEntry, 'id'>): Promise<void> {
  const { error } = await db.client.from('blood_donations').update(toRow(patch)).eq('id', id)
  if (error) throw error
}

export const deleteDonationEntry = (db: Db, id: string): Promise<void> => deleteRow(db, 'blood_donations', id)
