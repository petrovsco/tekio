// The database client. PostgREST only — not the full `supabase-js` (roadmap 023).
//
// `createClient` builds five clients and ships all of them on first paint: auth,
// realtime, storage, functions and PostgREST. Tekiō calls exactly one of them.
// Every query in `src/lib/db/` is `.from(...)`, which inside `supabase-js` is
// literally `this.rest.from(...)` on the PostgrestClient constructed below with
// the same URL and the same two headers — so this is that client, without the
// 177 kB of login, WebSocket and file-storage code the app never reaches.
//
// The one edge-function call left is a plain `fetch` in `assistant/client.ts`.
//
// When auth lands (roadmap 003) `@supabase/auth-js` comes back — but lazily, on
// the sign-in path, rather than in the chunk that paints Home.
import { PostgrestClient } from '@supabase/postgrest-js'

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY

/** `https://<ref>.supabase.co/` — trailing slash, so `new URL(path, base)` keeps
 *  the host instead of resolving the path against the root. */
const baseUrl = supabaseUrl.endsWith('/') ? supabaseUrl : supabaseUrl + '/'

/** Sent on every request. With no session, `supabase-js` sends the anon key as
 *  the bearer token too; RLS is wide open, so this is what it already did. */
export const supabaseHeaders: Record<string, string> = {
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
}

export const supabase = new PostgrestClient(new URL('rest/v1', baseUrl).href, {
  headers: supabaseHeaders,
})

export const functionsUrl = new URL('functions/v1/', baseUrl).href
