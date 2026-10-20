// The two query shapes every domain file in this folder repeats. Two functions,
// not a repository layer — CLAUDE.md's "no ORM, no repository abstraction" still
// holds: each domain keeps its own columns, its own row ↔ entry mapping and its
// own writes. Only the plumbing that was identical in ten files lives here.
import { userRows as dbUserRows, type Db } from '@tekio/db'
import { supabase } from '../supabase'
import { userId } from '../session'

/** The app's own reader: its client, and the signed-in id, read when a query
 *  runs rather than when this is called, as `userId()` always was. */
export const appDb = (): Db => ({ client: supabase, get userId() { return userId() } })

/** This user's rows from `table`, newest first — `userRows` in `@tekio/db`,
 *  which says why `cols` must stay a literal at the call site. */
export const userRows = <Q extends string>(table: string, cols: Q, dateCol?: string) =>
  dbUserRows(appDb(), table, cols, dateCol)

/** Delete one row by primary key, throwing on failure. */
export async function deleteRow(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}
