import type { BodyweightEntry } from '../../types'
import * as db from '@tekio/db'
import { appDb } from './_rows'

// The reads and writes live in `@tekio/db`, so the API logs a weigh-in exactly
// as the app does (RFC 0094 step 2d).
export const loadBodyweight = (): Promise<BodyweightEntry[]> => db.loadBodyweight(appDb())
export const saveBodyweightEntry = (entry: Omit<BodyweightEntry, 'id'>): Promise<BodyweightEntry> => db.saveBodyweightEntry(appDb(), entry)
export const updateBodyweightEntry = (id: string, patch: Omit<BodyweightEntry, 'id'>): Promise<void> => db.updateBodyweightEntry(appDb(), id, patch)
export const deleteBodyweightEntry = (id: string): Promise<void> => db.deleteBodyweightEntry(appDb(), id)
