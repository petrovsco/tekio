import type { DonationEntry } from '../../types'
import { api, body, done } from '../api'

// Written through the API (RFC 0094 step 4), so a donation is logged exactly as a phone app or the agent logs one.
// Loaded with the rest at start (./start.ts).
export const saveDonationEntry = (entry: Omit<DonationEntry, 'id'>): Promise<DonationEntry> =>
  body(api.POST('/api/donations', { body: entry }))
export const updateDonationEntry = (id: string, patch: Omit<DonationEntry, 'id'>): Promise<void> =>
  done(api.PUT('/api/donations/{id}', { params: { path: { id } }, body: patch }))
export const deleteDonationEntry = (id: string): Promise<void> =>
  done(api.DELETE('/api/donations/{id}', { params: { path: { id } } }))
