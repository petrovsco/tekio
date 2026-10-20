// Type-only: the two lists themselves live with the reads, in the core package.
import type { CARDIO_TYPES, DONATION_TYPES } from '@tekio/core'
import type { CardioFormat } from '../types'

/** Flips a display→column map. Derived rather than written out a second time:
 *  two hand-kept copies of one mapping are a pair that can drift, and adding a
 *  type meant remembering to edit both. Typed `Record<string, string>` on the
 *  way back because the columns are wider than the app's own list — the
 *  `activity_type` check constraint permits ten values against the five below
 *  (walking, hiking, elliptical, jump_rope, other), so a reader still needs its
 *  `?? r.activity_type` fallback for a row the app did not write. */
const invert = (map: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]))

export const CARDIO_TYPE_MAP: Record<typeof CARDIO_TYPES[number], string> = {
  Running: 'running',
  Cycling: 'cycling',
  Swimming: 'swimming',
  'Indoor Rowing': 'rowing',
  Custom: 'custom',
}
export const CARDIO_TYPE_REVERSE = invert(CARDIO_TYPE_MAP)

/** The two values `cardio_sessions.format` takes; a form leaves it unset when
 *  the session was neither in particular. */
export const CARDIO_FORMATS: { value: CardioFormat; label: string }[] = [
  { value: 'steady', label: 'Steady' },
  { value: 'intervals', label: 'Intervals' },
]

export const DONATION_TYPE_MAP: Record<typeof DONATION_TYPES[number], string> = {
  'Full Blood': 'full_blood',
  Plasma: 'plasma',
}
export const DONATION_TYPE_REVERSE = invert(DONATION_TYPE_MAP)

/** How many days a missed plan stays on its Planned card, to be rescheduled or
 *  removed, before it is deleted (RFC 0104). A plan never counts toward a read,
 *  whatever its age. */
export const MISSED_PLAN_KEPT_DAYS = 7
