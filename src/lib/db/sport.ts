import type { SportEntry, SportTypeInfo, NewSportFlags } from '../../types'
import * as db from '@tekio/db'
import { appDb } from './_rows'

// The writes live in `@tekio/db` with the loader, so the API logs a session
// exactly as the app does (RFC 0094 step 2d).
export const loadSportTypes = (): Promise<SportTypeInfo[]> => db.loadSportTypes(appDb())
export const loadSports = (): Promise<SportEntry[]> => db.loadSports(appDb())
export const saveSportEntry = (entry: Omit<SportEntry, 'id'>, newSportFlags?: NewSportFlags): Promise<SportEntry> =>
  db.saveSportEntry(appDb(), entry, newSportFlags)
export const updateSportEntry = (id: string, patch: Omit<SportEntry, 'id'>, newSportFlags?: NewSportFlags): Promise<void> =>
  db.updateSportEntry(appDb(), id, patch, newSportFlags)
export const deleteSportEntry = (id: string): Promise<void> => db.deleteSportEntry(appDb(), id)
