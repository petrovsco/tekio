import type { DonationEntry } from '@tekio/core'
import { DONATION_TYPE_REVERSE } from './columns'
import { userRows, type Db } from './db'

export const DONATION_COLS = 'id, donation_date, donation_type, notes'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function toDonationEntry(r: any): DonationEntry {
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
  const rows = await userRows(db, 'blood_donations', DONATION_COLS, 'donation_date')
  return rows.map(toDonationEntry)
}
