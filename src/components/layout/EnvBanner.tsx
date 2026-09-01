import { APP_ENV, IS_PRODUCTION } from '../../lib/env'

const LABEL: Record<string, string> = {
  staging: 'Staging',
  dev: 'Local dev',
}

/**
 * Says out loud when this build is not production (roadmap 037).
 *
 * Staging, local dev and production share one Supabase project, so the risk
 * worth naming is not "you are on staging" — it is that anything logged here
 * lands in the real training log. The banner says that, not the environment
 * name alone.
 *
 * Ink ground rather than a warning colour: design-system §1 gives the accent
 * one meaning (action / urgency) and forbids inventing a second, so this uses
 * the established inversion from §2 instead.
 */
export function EnvBanner() {
  if (IS_PRODUCTION) return null
  return (
    <div
      role="status"
      className="sticky top-0 z-[60] h-6 flex items-center justify-center
                 bg-ink text-paper px-4
                 text-[10px] font-bold uppercase tracking-[0.14em]"
    >
      {LABEL[APP_ENV] ?? APP_ENV} · writes to the live database
    </div>
  )
}
