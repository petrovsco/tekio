// Display name ↔ column value for the two enumerations the tables store in
// their own spelling. A mapping between the domain and a table belongs with the
// tables, not with the reads.
import type { CARDIO_TYPES, DONATION_TYPES } from '@tekio/core'

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

export const DONATION_TYPE_MAP: Record<typeof DONATION_TYPES[number], string> = {
  'Full Blood': 'full_blood',
  Plasma: 'plasma',
}
export const DONATION_TYPE_REVERSE = invert(DONATION_TYPE_MAP)
