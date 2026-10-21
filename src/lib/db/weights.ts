// The weights reads and writes live in @tekio/db (RFC 0094 step 2d), so the
// web app and the API log a lift the same way; these are the app's calls.
import type { WeightEntry, LiftSet } from '../../types'
import type { PatternKey } from '@tekio/core/catalogue'
import { appDb } from './_rows'
import {
  loadWeights as dbLoadWeights, saveWeightEntry as dbSave, updateWeightEntry as dbUpdate,
  deleteWeightEntry as dbDelete,
} from '@tekio/db'

export const loadWeights = () => dbLoadWeights(appDb())

/** `linked` is true when this save created the exercise and wrote its muscle
 *  links (RFC 0074), so the caller knows the muscle read must be reloaded. */
export const saveWeightEntry = (entry: Omit<WeightEntry, 'id'> & { id?: string }, pattern?: PatternKey) =>
  dbSave(appDb(), entry, pattern)

export const deleteWeightEntry = (id: string) => dbDelete(appDb(), id)

/** `prev` is what the entry holds now, when the caller knows it. */
export const updateWeightEntry = (id: string, patch: { sets: LiftSet[]; date?: string }, prev?: LiftSet[]) =>
  dbUpdate(appDb(), id, patch, prev)
