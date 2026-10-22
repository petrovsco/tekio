import type { SportEntry, SportTypeInfo, NewSportFlags } from '../../types'
import * as db from '@tekio/db'
import { appDb } from './_rows'
import { api, body, done } from '../api'

// Loaded straight from the database still; written through the API (RFC 0094
// step 4). A synced session not rated yet holds quality 0 in the app, which
// the API spells as no rating.
const sent = ({ quality, ...entry }: Omit<SportEntry, 'id'>, newSport?: NewSportFlags) =>
  ({ ...entry, quality: quality || undefined, newSport })

export const loadSportTypes = (): Promise<SportTypeInfo[]> => db.loadSportTypes(appDb())
export const loadSports = (): Promise<SportEntry[]> => db.loadSports(appDb())
export const saveSportEntry = async (entry: Omit<SportEntry, 'id'>, newSportFlags?: NewSportFlags): Promise<SportEntry> =>
  (await body(api.POST('/api/sport', { body: sent(entry, newSportFlags) }))) as SportEntry
export const updateSportEntry = (id: string, patch: Omit<SportEntry, 'id'>, newSportFlags?: NewSportFlags): Promise<void> =>
  done(api.PUT('/api/sport/{id}', { params: { path: { id } }, body: sent(patch, newSportFlags) }))
export const deleteSportEntry = (id: string): Promise<void> =>
  done(api.DELETE('/api/sport/{id}', { params: { path: { id } } }))
