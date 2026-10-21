// @tekio/api — the HTTP API every client uses (RFC 0094 step 2c).
import { handle } from 'hono/vercel'
import { createApi } from './app'

export { createApi }

/** The API as a Vercel function's handler, configured from the deployment's
 *  environment: the same Supabase project and public key the web app is built
 *  with, so each call reaches the database only as its caller.
 *
 *  @public — reached through the bundle scripts/build-api.mjs writes, which
 *  knip cannot follow. */
export function vercelHandler() {
  return handle(createApi({
    supabaseUrl: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    anonKey: process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '',
    origin: rowOrigin(),
  }))
}

/** The build a row is tagged with, as the web app tags it (src/lib/env.ts):
 *  the declared `VITE_ENV`, else what Vercel says it is deploying; null in
 *  production, so production rows go out untouched. */
function rowOrigin(): string | null {
  const declared = process.env.VITE_ENV
  const env = declared === 'production' || declared === 'staging' || declared === 'dev' ? declared
    : process.env.VERCEL_ENV === 'production' ? 'production' : 'staging'
  return env === 'production' ? null : env
}
