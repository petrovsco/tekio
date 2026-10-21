// Exercise names resolve to rows in @tekio/db (roadmap 044, RFC 0094 step 2d):
// one resolver for the web app and the API alike. This is the app's call.
import { loadExerciseAliases as dbLoadAliases } from '@tekio/db'
import { appDb } from './_rows'

export const loadExerciseAliases = () => dbLoadAliases(appDb())
