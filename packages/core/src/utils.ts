// The calendar and grouping helpers the reads call, and the one weight every
// muscle read is denominated in (RFC 0094 step 1). The app's other helpers are
// in src/lib/utils.ts.

/** Today's date (YYYY-MM-DD) on the device's own clock. Not `toISOString()`,
 *  which is the UTC date: east of Greenwich it still says yesterday for the
 *  first hours after midnight, and a log made then would land on the wrong day. */
export const today = (): string => localDay(new Date())

/** The calendar day `n` days before today, on the device's clock. */
export const daysAgo = (n: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return localDay(d)
}

/** The hour a night ends for "last night": before it, someone still up is in
 *  the night that wakes today, so the last finished night woke yesterday. */
const NIGHT_ENDS_HOUR = 4

/** The wake date of "last night", on the device's clock: today from 04:00,
 *  yesterday before that, so a night owl at 01:00 is not told last night is
 *  missing when it has not happened yet. */
export const lastNightDate = (now: Date = new Date()): string => {
  const d = new Date(now)
  if (d.getHours() < NIGHT_ENDS_HOUR) d.setDate(d.getDate() - 1)
  return localDay(d)
}

const localDay = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * Groups `rows` by `key`, in first-seen key order; `value` maps each row into
 * its group (identity by default). The one grouping loop — it was written eight
 * times, and the copies drifted between `set(k, [...get(k), v])` (an O(n²)
 * copy) and pushing into the array in place.
 */
export function groupBy<T, V = T>(
  rows: Iterable<T>,
  key: (row: T) => string,
  value?: (row: T) => V,
): Map<string, V[]> {
  const out = new Map<string, V[]>()
  for (const row of rows) {
    const v = (value ? value(row) : row) as V
    const arr = out.get(key(row))
    if (arr) arr.push(v)
    else out.set(key(row), [v])
  }
  return out
}

const DAY_MS = 86400000

/** Whole days from `from` to `to` (both YYYY-MM-DD; positive when to > from).
 *  Both parse as UTC midnight, so the quotient is exact — floor and round agree. */
export function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / DAY_MS)
}

/** Impact weight per link level (1 = most direct). Level 2 (synergist) = 0.5:
 *  the best-fit "fractional" set counting in the largest dose-response model
 *  (Pelland 2026) and synergist growth of ~0.4–1.0 × direct in trials
 *  (Mannarino 2021, Gentil 2015, Brandão 2020). Level 3 = 0 — grounded, not a
 *  convention: no study measures a quarter-set stimulus and the measured minor
 *  contributors did not grow (hamstrings in squats — Kubo 2019, Plotkin 2023;
 *  medial deltoid in bench — Lanza 2024). Zeroed 2026-09-03 after the link
 *  audit in roadmap 042 moved every real synergist to level 2, so level 3 now
 *  holds stabilisers and bystanders only. The key stays so an unknown level
 *  reads as an explicit 0; every consumer skips zero-weight links, so such a
 *  link adds no sets, no recency and no source. Every muscle read is
 *  denominated in this (inventory row 7.1, decision D13).
 *  See tekio.rfcs/grounding/039-adaptations-read.md#grounding and
 *  tekio.rfcs/rfcs/done/0042-level-3-link-audit.md */
export const LEVEL_WEIGHT: Record<number, number> = { 1: 1, 2: 0.5, 3: 0 }
