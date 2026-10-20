// Read in `@tekio/db` (RFC 0094 step 2a); the app calls it with its own client.
import * as db from '@tekio/db'
import { appDb } from './_rows'

export const loadMuscleGroups = () => db.loadMuscleGroups(appDb())
export const loadExercises = () => db.loadExercises(appDb())
export const loadExerciseMuscleLinks = () => db.loadExerciseMuscleLinks(appDb())
