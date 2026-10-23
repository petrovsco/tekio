// Where the Supabase project is, for sign-in (./auth.ts). The app no longer
// queries the database itself: every read and write goes through the API
// (RFC 0094 step 4), which holds the PostgREST client.
const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL
export const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY

/** `https://<ref>.supabase.co/` — trailing slash, so `new URL(path, base)` keeps
 *  the host instead of resolving the path against the root. */
export const baseUrl = supabaseUrl.endsWith('/') ? supabaseUrl : supabaseUrl + '/'
