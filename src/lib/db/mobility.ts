import type { MobilityEntry } from '../../types'
import * as db from '@tekio/db'
import { appDb } from './_rows'

// The reads and writes live in `@tekio/db`, so the API logs a session exactly
// as the app does (RFC 0094 step 2d).
export const loadMobility = (): Promise<MobilityEntry[]> => db.loadMobility(appDb())
export const saveMobilityEntry = (entry: Omit<MobilityEntry, 'id'>): Promise<MobilityEntry> => db.saveMobilityEntry(appDb(), entry)
export const updateMobilityEntry = (id: string, patch: Omit<MobilityEntry, 'id'>): Promise<void> => db.updateMobilityEntry(appDb(), id, patch)
export const deleteMobilityEntry = (id: string): Promise<void> => db.deleteMobilityEntry(appDb(), id)
