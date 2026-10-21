/**
 * Which environment is this build running in? (roadmap 037)
 *
 * Staging, local dev and production all talk to the *same* Supabase project, so
 * a row written while trying something out lands in the user's real training
 * log. This is how the app knows to mark those rows, and how the shell knows to
 * say so on screen.
 */
export type AppEnv = 'production' | 'staging' | 'dev'

function inferFromHostname(): AppEnv {
  if (typeof window === 'undefined') return 'production'
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return 'dev'
  // stg.tekio.fyi, and the old stg-tekio.shamatoff.com while it still redirects
  if (host.startsWith('stg.') || host.startsWith('stg-')) return 'staging'
  return 'production'
}

function resolve(): AppEnv {
  const declared = import.meta.env.VITE_ENV
  if (declared === 'staging' || declared === 'dev' || declared === 'production') return declared
  // The env var is set by hand in the Vercel dashboard, which nobody re-reads.
  // If it is ever missing, staging must still identify itself.
  return inferFromHostname()
}

export const APP_ENV: AppEnv = resolve()

export const IS_PRODUCTION = APP_ENV === 'production'

/**
 * The value written to `origin` on rows this build creates — null in
 * production, so a row says which build wrote it. It marks, it never condemns:
 * a staging row is real data and nothing deletes rows by this tag
 * (supabase/README.md, the migration policy). `withOrigin` in @tekio/db
 * stamps it on a write; in production it sends the row untouched.
 */
export const ROW_ORIGIN: AppEnv | null = IS_PRODUCTION ? null : APP_ENV
