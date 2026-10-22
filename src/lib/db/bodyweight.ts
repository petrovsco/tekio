import type { BodyweightEntry } from '../../types'
import * as db from '@tekio/db'
import { appDb } from './_rows'
import { api, body, done } from '../api'

// Loaded straight from the database still; written through the API (RFC 0094
// step 4), so a weigh-in is logged exactly as a phone app or the agent logs one.
export const loadBodyweight = (): Promise<BodyweightEntry[]> => db.loadBodyweight(appDb())
export const saveBodyweightEntry = (entry: Omit<BodyweightEntry, 'id'>): Promise<BodyweightEntry> =>
  body(api.POST('/api/bodyweight', { body: entry }))
export const updateBodyweightEntry = (id: string, patch: Omit<BodyweightEntry, 'id'>): Promise<void> =>
  done(api.PUT('/api/bodyweight/{id}', { params: { path: { id } }, body: patch }))
export const deleteBodyweightEntry = (id: string): Promise<void> =>
  done(api.DELETE('/api/bodyweight/{id}', { params: { path: { id } } }))
