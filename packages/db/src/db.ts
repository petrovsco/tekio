// Who is reading, and through what (RFC 0094 step 2a). Every loader in this
// package takes one: the web app passes its own client and the signed-in id,
// the API a client carrying the caller's token and the id from that token. The
// policies decide what either may touch; the loaders only say which rows.
import type { PostgrestClient } from '@supabase/postgrest-js'

export interface Db {
  client: PostgrestClient
  /** The id this person's rows are filed under (RFC 0003). */
  readonly userId: string
}

/** The lift catalogue, loaded only when a write needs it: the web app keeps
 *  it off the first paint, the API has it at hand. */
type Catalogue = typeof import('@tekio/core/catalogue')

/** What a write needs beyond a read (RFC 0094 step 2d). */
export interface WriteDb extends Db {
  /** Written to `origin` on the rows a write creates: null in production, else
   *  the build that wrote it (tekio.rfcs/rfcs/done/0037-row-origin-tagging.md).
   *  It marks, it never condemns: nothing deletes rows by it. */
  readonly origin: string | null
  /** True when the token was issued to an assistant (an OAuth client) rather
   *  than to the person's own sign-in (RFC 0099): its writes say so. */
  readonly byAgent?: boolean
  catalogue(): Promise<Catalogue>
}

/** Stamp a row payload with its origin. In production the payload goes out
 *  untouched, byte for byte what it was before origins existed. Only cascade
 *  roots need it: children go with the row that owns them. */
export function withOrigin<T extends object>(db: WriteDb, row: T): T {
  return db.origin ? { ...row, origin: db.origin } : row
}

/** Mark a logged entry an assistant wrote (RFC 0099). A person's own write
 *  goes out untouched and reads 'user' from the column's default. Only the
 *  logs an assistant may write carry the column. */
export function withWriter<T extends object>(db: WriteDb, row: T): T {
  return db.byAgent ? { ...row, written_by: 'agent' } : row
}

/**
 * This user's rows from `table`, newest first.
 *
 * `cols` is generic over its own literal type on purpose. PostgREST parses the
 * select string at the *type* level to give the returned rows their column
 * names, and a parameter typed plain `string` collapses that to
 * `GenericStringError` — every `r.some_column` in the callers would stop
 * compiling. Passing the literal through a type parameter keeps the checking
 * the inline queries had, which is why `cols` must stay a literal at the call
 * site (a concatenation is just `string` again).
 *
 * `dateCol` is optional because one caller — `loadSportTypes` — reads a lookup
 * table that has no date to sort by.
 */
export async function userRows<Q extends string>(db: Db, table: string, cols: Q, dateCol?: string) {
  let q = db.client.from(table).select(cols).eq('user_id', db.userId)
  if (dateCol) q = q.order(dateCol, { ascending: false })
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

/** Delete one row by primary key, throwing on failure. */
export async function deleteRow(db: Db, table: string, id: string): Promise<void> {
  const { error } = await db.client.from(table).delete().eq('id', id)
  if (error) throw error
}

/** Whether every row of `table` in `ids` is this user's. The API asks before
 *  an edit or a delete: until the lock (RFC 0003) the open policies still
 *  allow more. */
export async function ownsRows(db: Db, table: string, ids: string[]): Promise<boolean> {
  const unique = [...new Set(ids)]
  const { data, error } = await db.client.from(table).select('id').in('id', unique).eq('user_id', db.userId)
  if (error) throw error
  return (data ?? []).length === unique.length
}

export const ownsRow = (db: Db, table: string, id: string): Promise<boolean> => ownsRows(db, table, [id])
