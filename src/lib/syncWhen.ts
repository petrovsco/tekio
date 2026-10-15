import { daysBetween, fmtDate } from './utils'

// The time on Home's "Garmin · 08:02" line (RFC 0110), on the phone's clock.

/** A day after the last sync the line turns to the accent: the morning sync
 *  runs daily, so anything older means a morning was missed. */
const SYNC_STALE_MS = 24 * 60 * 60 * 1000

const pad = (n: number) => String(n).padStart(2, '0')
const dayOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** "just now", "08:02", "yesterday 08:01" or "8 Oct". */
export function syncWhen(finishedAt: string, now: Date = new Date()): string {
  const at = new Date(finishedAt)
  if (now.getTime() - at.getTime() < 60_000) return 'just now'
  const clock = `${pad(at.getHours())}:${pad(at.getMinutes())}`
  const days = daysBetween(dayOf(at), dayOf(now))
  if (days === 0) return clock
  if (days === 1) return `yesterday ${clock}`
  return fmtDate(dayOf(at), { relative: false })
}

export function syncStale(finishedAt: string, now: Date = new Date()): boolean {
  return now.getTime() - new Date(finishedAt).getTime() > SYNC_STALE_MS
}
