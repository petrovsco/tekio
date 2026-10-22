import type { DonationEntry } from '../../types'
import * as db from '@tekio/db'
import { appDb } from './_rows'
import { api, body, done } from '../api'

// Loaded straight from the database still; written through the API (RFC 0094
// step 4), so a donation is logged exactly as a phone app or the agent logs one.
export const loadDonations = (): Promise<DonationEntry[]> => db.loadDonations(appDb())
export const saveDonationEntry = (entry: Omit<DonationEntry, 'id'>): Promise<DonationEntry> =>
  body(api.POST('/api/donations', { body: entry }))
export const updateDonationEntry = (id: string, patch: Omit<DonationEntry, 'id'>): Promise<void> =>
  done(api.PUT('/api/donations/{id}', { params: { path: { id } }, body: patch }))
export const deleteDonationEntry = (id: string): Promise<void> =>
  done(api.DELETE('/api/donations/{id}', { params: { path: { id } } }))
