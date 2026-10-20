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
