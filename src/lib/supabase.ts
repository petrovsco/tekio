// The database client. PostgREST only — not the full `supabase-js` (roadmap 023).
//
// `createClient` builds five clients and ships all of them on first paint: auth,
// realtime, storage, functions and PostgREST. Tekiō calls exactly one of them.
// Every query in `src/lib/db/` is `.from(...)`, which inside `supabase-js` is
// literally `this.rest.from(...)` on the PostgrestClient constructed below with
// the same URL and the same two headers — so this is that client, without the
// 177 kB of login, WebSocket and file-storage code the app never reaches.
//
// Since accounts (RFC 0003) `@supabase/auth-js` is back — but lazily, in
// `auth.ts`, rather than in the chunk that paints Home. Only the token it
// issues is needed here, and `session.ts` holds that.
import { PostgrestClient } from '@supabase/postgrest-js'
import { accessToken } from './session'

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL
export const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY

/** `https://<ref>.supabase.co/` — trailing slash, so `new URL(path, base)` keeps
 *  the host instead of resolving the path against the root. */
export const baseUrl = supabaseUrl.endsWith('/') ? supabaseUrl : supabaseUrl + '/'

/** Every request carries the signed-in person's token, read at the moment it
 *  is sent so a refreshed one is picked up; with no session, the anon key, as
 *  `supabase-js` does. The policies decide what that token may touch. */
const withToken: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers)
  headers.set('apikey', supabaseAnonKey)
  headers.set('Authorization', `Bearer ${accessToken() ?? supabaseAnonKey}`)
  return fetch(input, { ...init, headers })
}

export const supabase = new PostgrestClient(new URL('rest/v1', baseUrl).href, {
  fetch: withToken,
})
