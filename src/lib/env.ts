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
  if (host.startsWith('stg-')) return 'staging'
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
 * production, so production rows stay unmarked and the release cleanup can
 * only ever delete what it positively identifies as *not* production.
 */
export const ROW_ORIGIN: AppEnv | null = IS_PRODUCTION ? null : APP_ENV

/**
 * Stamp a row payload with its origin.
 *
 * In production `ROW_ORIGIN` is null and this is the identity function, so a
 * production build sends byte-identical payloads to the ones it sent before
 * roadmap 037 — that is the guarantee that the tagging cannot break production.
 * It is also why this returns the row untouched instead of writing an explicit
 * `origin: null`.
 *
 * Only *cascade roots* need this: children (`session_exercises`,
 * `session_sets`, …) are deleted along with the row that owns them.
 */
export function withOrigin<T extends object>(row: T): T {
  return ROW_ORIGIN ? { ...row, origin: ROW_ORIGIN } : row
}
