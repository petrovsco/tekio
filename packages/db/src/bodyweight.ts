import type { BodyweightEntry } from '@tekio/core'
import { userRows, withOrigin, deleteRow, type Db, type WriteDb } from './db'

export async function loadBodyweight(db: Db): Promise<BodyweightEntry[]> {
  return bodyweightFromRows(await userRows(db, 'bodyweight_logs', 'id, log_date, weight, notes', 'log_date'))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bodyweightFromRows(rows: any[]): BodyweightEntry[] {
  return rows.map(r => ({
    id: r.id,
    date: r.log_date,
    weight: Number(r.weight),
  }))
}

/** One reading a day: a second one that day replaces the first. */
export async function saveBodyweightEntry(db: WriteDb, entry: Omit<BodyweightEntry, 'id'>): Promise<BodyweightEntry> {
  const { data, error } = await db.client
    .from('bodyweight_logs')
    .upsert(
      withOrigin(db, { user_id: db.userId, log_date: entry.date, weight: entry.weight }),
      { onConflict: 'user_id,log_date' }
    )
    .select('id, log_date, weight')
    .single()
  if (error) throw error
  return { id: data.id, date: data.log_date, weight: Number(data.weight) }
}

export async function updateBodyweightEntry(db: Db, id: string, patch: Omit<BodyweightEntry, 'id'>): Promise<void> {
  const { error } = await db.client
    .from('bodyweight_logs')
    .update({ log_date: patch.date, weight: patch.weight })
    .eq('id', id)
  if (error) throw error
}

export const deleteBodyweightEntry = (db: Db, id: string): Promise<void> => deleteRow(db, 'bodyweight_logs', id)
