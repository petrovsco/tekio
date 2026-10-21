import type { CardioEntry } from '../../types'
import * as db from '@tekio/db'
import { appDb } from './_rows'

// The writes live in `@tekio/db` with the loader, so the API logs a session
// exactly as the app does (RFC 0094 step 2d).
export const loadCardio = (): Promise<CardioEntry[]> => db.loadCardio(appDb())
export const saveCardioEntry = (entry: Omit<CardioEntry, 'id'>): Promise<CardioEntry> => db.saveCardioEntry(appDb(), entry)
export const updateCardioEntry = (id: string, patch: Omit<CardioEntry, 'id'>): Promise<void> => db.updateCardioEntry(appDb(), id, patch)
export const deleteCardioEntry = (id: string): Promise<void> => db.deleteCardioEntry(appDb(), id)
