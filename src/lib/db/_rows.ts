// The app's reader and writer for @tekio/db, which holds each domain's columns,
// its row ↔ entry mapping and its writes (RFC 0094 step 2d).
import type { WriteDb } from '@tekio/db'
import { supabase } from '../supabase'
import { userId } from '../session'
import { ROW_ORIGIN } from '../env'
import { whileReloading } from '../staleChunk'

/** The app's own reader and writer: its client, and the signed-in id, read
 *  when a query runs rather than when this is called, as `userId()` always
 *  was. The catalogue arrives with the first write that needs it: 270 lifts
 *  are no part of the first paint. */
export const appDb = (): WriteDb => ({
  client: supabase,
  get userId() { return userId() },
  origin: ROW_ORIGIN,
  catalogue: () => import('@tekio/core/catalogue').then(whileReloading),
})
