import type { BodyweightEntry } from '../../types'
import { api, body, done } from '../api'

// Written through the API (RFC 0094 step 4), so a weigh-in is logged exactly as a phone app or the agent logs one.
// Loaded with the rest at start (./start.ts).
export const saveBodyweightEntry = (entry: Omit<BodyweightEntry, 'id'>): Promise<BodyweightEntry> =>
  body(api.POST('/api/bodyweight', { body: entry }))
export const updateBodyweightEntry = (id: string, patch: Omit<BodyweightEntry, 'id'>): Promise<void> =>
  done(api.PUT('/api/bodyweight/{id}', { params: { path: { id } }, body: patch }))
export const deleteBodyweightEntry = (id: string): Promise<void> =>
  done(api.DELETE('/api/bodyweight/{id}', { params: { path: { id } } }))
