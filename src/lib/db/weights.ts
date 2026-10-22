// A lift is logged, edited and taken out through the API (RFC 0094 step 4), so
// the app writes it exactly as a phone app or the agent does; the lifts load
// with the rest at start (./start.ts).
import type { WeightEntry, LiftSet } from '../../types'
import type { PatternKey } from '@tekio/core/catalogue'
import { api, body, done } from '../api'

/** `linked` is true when this save created the exercise and wrote its muscle
 *  links (RFC 0074), so the caller knows the muscle read must be reloaded. */
export const saveWeightEntry = (
  { date, exercise, sets, supersetId }: Omit<WeightEntry, 'id'> & { id?: string },
  pattern?: PatternKey,
): Promise<{ entry: WeightEntry; linked: boolean }> =>
  body(api.POST('/api/weights', { body: { date, exercise, sets, supersetId, pattern } }))

export const deleteWeightEntry = (id: string): Promise<void> =>
  done(api.DELETE('/api/weights/{id}', { params: { path: { id } } }))

/** The API reads what the entry holds now itself: that read is also how it
 *  knows the lift is the caller's. */
export const updateWeightEntry = (id: string, patch: { sets: LiftSet[]; date?: string }): Promise<void> =>
  done(api.PATCH('/api/weights/{id}', { params: { path: { id } }, body: patch }))
