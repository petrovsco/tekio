import type { MobilityEntry } from '../../types'
import * as db from '@tekio/db'
import { appDb } from './_rows'
import { api, body, done } from '../api'

// Loaded straight from the database still; written through the API (RFC 0094
// step 4), so a session is logged exactly as a phone app or the agent logs one.
export const loadMobility = (): Promise<MobilityEntry[]> => db.loadMobility(appDb())
export const saveMobilityEntry = (entry: Omit<MobilityEntry, 'id'>): Promise<MobilityEntry> =>
  body(api.POST('/api/mobility', { body: entry }))
export const updateMobilityEntry = (id: string, patch: Omit<MobilityEntry, 'id'>): Promise<void> =>
  done(api.PUT('/api/mobility/{id}', { params: { path: { id } }, body: patch }))
export const deleteMobilityEntry = (id: string): Promise<void> =>
  done(api.DELETE('/api/mobility/{id}', { params: { path: { id } } }))
