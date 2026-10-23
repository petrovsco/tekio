import type { CardioEntry } from '../../types'
import { api, body, done } from '../api'

// Written through the API (RFC 0094 step 4), so a session is logged exactly as
// a phone app or the agent logs one; loaded with the rest at start (./start.ts).
// The body is the whole entry: what the watch added to a synced session is not
// the API's to take, and is left as it was.
export const saveCardioEntry = (entry: Omit<CardioEntry, 'id'>): Promise<CardioEntry> =>
  body(api.POST('/api/cardio', { body: entry }))
export const updateCardioEntry = (id: string, patch: Omit<CardioEntry, 'id'>): Promise<void> =>
  done(api.PUT('/api/cardio/{id}', { params: { path: { id } }, body: patch }))
export const deleteCardioEntry = (id: string): Promise<void> =>
  done(api.DELETE('/api/cardio/{id}', { params: { path: { id } } }))
