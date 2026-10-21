import type { SleepEntry, SaunaEntry, ColdEntry } from '../../types'
import * as db from '@tekio/db'
import { appDb } from './_rows'

// Sleep, sauna and cold: read and written in `@tekio/db`, so the API logs them
// exactly as the app does (RFC 0094 step 2d).
export const loadSleep = (): Promise<SleepEntry[]> => db.loadSleep(appDb())
export const saveSleepEntry = (entry: Omit<SleepEntry, 'id'>): Promise<SleepEntry> => db.saveSleepEntry(appDb(), entry)
export const updateSleepEntry = (id: string, patch: Omit<SleepEntry, 'id'>): Promise<void> => db.updateSleepEntry(appDb(), id, patch)
export const deleteSleepEntry = (id: string): Promise<void> => db.deleteSleepEntry(appDb(), id)

export const loadSauna = (): Promise<SaunaEntry[]> => db.loadExposure(appDb(), 'sauna_sessions')
export const saveSaunaEntry = (entry: Omit<SaunaEntry, 'id'>): Promise<SaunaEntry> => db.saveExposure(appDb(), 'sauna_sessions', entry)
export const updateSaunaEntry = (id: string, patch: Omit<SaunaEntry, 'id'>): Promise<void> => db.updateExposure(appDb(), 'sauna_sessions', id, patch)
export const deleteSaunaEntry = (id: string): Promise<void> => db.deleteExposure(appDb(), 'sauna_sessions', id)

export const loadCold = (): Promise<ColdEntry[]> => db.loadExposure(appDb(), 'cold_sessions')
export const saveColdEntry = (entry: Omit<ColdEntry, 'id'>): Promise<ColdEntry> => db.saveExposure(appDb(), 'cold_sessions', entry)
export const updateColdEntry = (id: string, patch: Omit<ColdEntry, 'id'>): Promise<void> => db.updateExposure(appDb(), 'cold_sessions', id, patch)
export const deleteColdEntry = (id: string): Promise<void> => db.deleteExposure(appDb(), 'cold_sessions', id)
