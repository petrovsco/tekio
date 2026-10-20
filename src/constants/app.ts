import type { CardioFormat } from '../types'

/** The two values `cardio_sessions.format` takes; a form leaves it unset when
 *  the session was neither in particular. */
export const CARDIO_FORMATS: { value: CardioFormat; label: string }[] = [
  { value: 'steady', label: 'Steady' },
  { value: 'intervals', label: 'Intervals' },
]

/** How many days a missed plan stays on its Planned card, to be rescheduled or
 *  removed, before it is deleted (RFC 0104). A plan never counts toward a read,
 *  whatever its age. */
export const MISSED_PLAN_KEPT_DAYS = 7
