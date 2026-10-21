// Exercise names resolve to rows in @tekio/db (roadmap 044, RFC 0094 step 2d):
// one resolver for the web app and the API alike. These are the app's calls.
import type { PatternKey } from '@tekio/core/catalogue'
import { getOrCreateExerciseRow as dbGetOrCreate, loadExerciseAliases as dbLoadAliases } from '@tekio/db'
import { appDb } from './_rows'

export const loadExerciseAliases = () => dbLoadAliases(appDb())

export const getOrCreateExerciseRow = (name: string, opts: { link?: boolean; pattern?: PatternKey } = {}) =>
  dbGetOrCreate(appDb(), name, opts)
