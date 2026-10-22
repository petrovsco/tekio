import type { SleepEntry, SaunaEntry, ColdEntry } from '../../types'
import * as db from '@tekio/db'
import { appDb } from './_rows'
import { api, body, done } from '../api'

// Sleep, sauna and cold: loaded straight from the database still; written
// through the API (RFC 0094 step 4), so they are logged exactly as a phone app
// or the agent logs them.
export const loadSleep = (): Promise<SleepEntry[]> => db.loadSleep(appDb())
export const saveSleepEntry = async (entry: Omit<SleepEntry, 'id'>): Promise<SleepEntry> =>
  (await body(api.POST('/api/sleep', { body: entry }))) as SleepEntry
export const updateSleepEntry = (id: string, patch: Omit<SleepEntry, 'id'>): Promise<void> =>
  done(api.PUT('/api/sleep/{id}', { params: { path: { id } }, body: patch }))
export const deleteSleepEntry = (id: string): Promise<void> =>
  done(api.DELETE('/api/sleep/{id}', { params: { path: { id } } }))

export const loadSauna = (): Promise<SaunaEntry[]> => db.loadExposure(appDb(), 'sauna_sessions')
export const saveSaunaEntry = (entry: Omit<SaunaEntry, 'id'>): Promise<SaunaEntry> =>
  body(api.POST('/api/sauna', { body: entry }))
export const updateSaunaEntry = (id: string, patch: Omit<SaunaEntry, 'id'>): Promise<void> =>
  done(api.PUT('/api/sauna/{id}', { params: { path: { id } }, body: patch }))
export const deleteSaunaEntry = (id: string): Promise<void> =>
  done(api.DELETE('/api/sauna/{id}', { params: { path: { id } } }))

export const loadCold = (): Promise<ColdEntry[]> => db.loadExposure(appDb(), 'cold_sessions')
export const saveColdEntry = (entry: Omit<ColdEntry, 'id'>): Promise<ColdEntry> =>
  body(api.POST('/api/cold', { body: entry }))
export const updateColdEntry = (id: string, patch: Omit<ColdEntry, 'id'>): Promise<void> =>
  done(api.PUT('/api/cold/{id}', { params: { path: { id } }, body: patch }))
export const deleteColdEntry = (id: string): Promise<void> =>
  done(api.DELETE('/api/cold/{id}', { params: { path: { id } } }))
