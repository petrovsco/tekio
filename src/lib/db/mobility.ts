import type { MobilityEntry } from '../../types'
import { api, body, done } from '../api'

// Written through the API (RFC 0094 step 4), so a session is logged exactly as a phone app or the agent logs one.
// Loaded with the rest at start (./start.ts).
export const saveMobilityEntry = (entry: Omit<MobilityEntry, 'id'>): Promise<MobilityEntry> =>
  body(api.POST('/api/mobility', { body: entry }))
export const updateMobilityEntry = (id: string, patch: Omit<MobilityEntry, 'id'>): Promise<void> =>
  done(api.PUT('/api/mobility/{id}', { params: { path: { id } }, body: patch }))
export const deleteMobilityEntry = (id: string): Promise<void> =>
  done(api.DELETE('/api/mobility/{id}', { params: { path: { id } } }))
