// The readiness sheet's read (RFC 0094 step 2b); `reads.ts` says why the
// three live apart and why `date` is always passed in.
import {
  systemicReadiness, donationStatus, fusedVerdict, readinessTrend,
  type SystemicReadiness, type DonationStatus, type FusedVerdict, type ReadinessTrend,
} from './fusedRead'
import type { ReadRows } from './reads'

export interface ReadinessRead {
  date: string
  readiness: SystemicReadiness
  donation: DonationStatus
  verdict: FusedVerdict
  /** The window behind today's reading, for the method read (or the one
   *  chosen while it builds its baseline); null with no method at all. */
  trend: ReadinessTrend | null
}

/** The readiness sheet: today's reading, the verdict it gives, and the days
 *  behind it. */
export function readinessRead(rows: ReadRows, date: string): ReadinessRead {
  const readiness = systemicReadiness(rows.sleep, date, rows.readinessInputs, rows.readinessMethod)
  const donation = donationStatus(rows.donations, date)
  const method = readiness.method ?? readiness.chosen
  return {
    date,
    readiness,
    donation,
    verdict: fusedVerdict(readiness.band, donation),
    trend: method ? readinessTrend(method, rows.sleep, rows.readinessInputs, date) : null,
  }
}
