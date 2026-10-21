import type { DonationEntry } from '../../types'
import * as db from '@tekio/db'
import { appDb } from './_rows'

// The writes live in `@tekio/db` with the loader, so the API logs a donation
// exactly as the app does (RFC 0094 step 2d).
export const loadDonations = (): Promise<DonationEntry[]> => db.loadDonations(appDb())
export const saveDonationEntry = (entry: Omit<DonationEntry, 'id'>): Promise<DonationEntry> => db.saveDonationEntry(appDb(), entry)
export const updateDonationEntry = (id: string, patch: Omit<DonationEntry, 'id'>): Promise<void> => db.updateDonationEntry(appDb(), id, patch)
export const deleteDonationEntry = (id: string): Promise<void> => db.deleteDonationEntry(appDb(), id)
