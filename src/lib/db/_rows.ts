// The two query shapes every domain file in this folder repeats. Two functions,
// not a repository layer — CLAUDE.md's "no ORM, no repository abstraction" still
// holds: each domain keeps its own columns, its own row ↔ entry mapping and its
// own writes. Only the plumbing that was identical in ten files lives here.
import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'

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
export async function userRows<Q extends string>(table: string, cols: Q, dateCol?: string) {
  let q = supabase.from(table).select(cols).eq('user_id', USER_ID)
  if (dateCol) q = q.order(dateCol, { ascending: false })
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

/** Delete one row by primary key, throwing on failure. */
export async function deleteRow(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}
