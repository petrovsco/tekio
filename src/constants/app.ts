import type { CardioFormat } from '../types'

/** The two values `cardio_sessions.format` takes; a form leaves it unset when
 *  the session was neither in particular. */
export const CARDIO_FORMATS: { value: CardioFormat; label: string }[] = [
  { value: 'steady', label: 'Steady' },
  { value: 'intervals', label: 'Intervals' },
]

