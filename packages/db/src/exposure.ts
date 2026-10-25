// Sauna and cold plunge: two session tables of one shape.
import type { ExposureBout } from '@tekio/core'
import { userRows, withOrigin, deleteRow, type Db, type WriteDb } from './db'

export type ExposureTable = 'sauna_sessions' | 'cold_sessions'

const COLS = 'id, session_date, duration_minutes, temperature_c, notes'

function mapBout(r: { id: string; session_date: string; duration_minutes: number | string; temperature_c: number | string | null; notes: string | null }): ExposureBout {
  return {
    id: r.id,
    date: r.session_date,
    duration: Number(r.duration_minutes),
    tempC: r.temperature_c != null ? Number(r.temperature_c) : undefined,
    notes: r.notes ?? undefined,
  }
}

/** The columns a save and an update both write. */
const toRow = (entry: Omit<ExposureBout, 'id'>) => ({
  session_date: entry.date,
  duration_minutes: entry.duration,
  temperature_c: entry.tempC ?? null,
  notes: entry.notes ?? null,
})

export async function loadExposure(db: Db, table: ExposureTable): Promise<ExposureBout[]> {
  return exposureFromRows(await userRows(db, table, COLS, 'session_date'))
}

export const exposureFromRows = (rows: Parameters<typeof mapBout>[0][]): ExposureBout[] => rows.map(mapBout)

export async function saveExposure(db: WriteDb, table: ExposureTable, entry: Omit<ExposureBout, 'id'>): Promise<ExposureBout> {
  const { data, error } = await db.client
    .from(table)
    .insert(withOrigin(db, { user_id: db.userId, ...toRow(entry) }))
    .select(COLS)
    .single()
  if (error) throw error
  return mapBout(data)
}

export async function updateExposure(db: Db, table: ExposureTable, id: string, patch: Omit<ExposureBout, 'id'>): Promise<void> {
  const { error } = await db.client.from(table).update(toRow(patch)).eq('id', id)
  if (error) throw error
}

export const deleteExposure = (db: Db, table: ExposureTable, id: string): Promise<void> => deleteRow(db, table, id)
