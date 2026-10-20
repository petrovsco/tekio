// @tekio/api — the HTTP API every client uses (RFC 0094 step 2c).
import { handle } from 'hono/vercel'
import { createApi } from './app'

export { createApi }

/** The API as a Vercel function's handler, configured from the deployment's
 *  environment: the same Supabase project and public key the web app is built
 *  with, so each call reaches the database only as its caller. */
export function vercelHandler() {
  return handle(createApi({
    supabaseUrl: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    anonKey: process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '',
  }))
}
