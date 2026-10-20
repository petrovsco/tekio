// Every row a read is computed from, loaded at once (RFC 0094 step 2c). The
// API calls this per request; the app's bootstrap loads the same tables into
// its store, and `exerciseAdaptationMap` is the one mapping both apply.
import { profileHrMax, type Adaptation, type ReadRows } from '@tekio/core'
import type { Db } from './db'
import { loadWeights } from './weights'
import { loadCardio } from './cardio'
import { loadSports } from './sport'
import { loadSleep } from './sleep'
import { loadDonations } from './donations'
import { loadReadinessInputs } from './readiness'
import { loadMuscleGroups, loadExercises, loadExerciseMuscleLinks } from './muscles'
import { loadAdaptationTargets } from './adaptationTargets'
import { loadProfile } from './profile'

/** Lower-cased exercise name → the adaptation the catalogue tags it with. */
export function exerciseAdaptationMap(exercises: { name: string; adaptation: Adaptation | null }[]): Record<string, Adaptation> {
  const out: Record<string, Adaptation> = {}
  for (const e of exercises) if (e.adaptation) out[e.name.toLowerCase()] = e.adaptation
  return out
}

/** The rows behind the three reads. `date` is the person's own day, which the
 *  age estimate of HRmax counts from. */
export async function loadReadRows(db: Db, date: string): Promise<ReadRows> {
  const [
    weights, cardio, sports, sleep, donations, readinessInputs,
    muscleGroups, exercises, exerciseMuscles, adaptationTargets, profile,
  ] = await Promise.all([
    loadWeights(db), loadCardio(db), loadSports(db), loadSleep(db), loadDonations(db),
    loadReadinessInputs(db), loadMuscleGroups(db), loadExercises(db), loadExerciseMuscleLinks(db),
    loadAdaptationTargets(db), loadProfile(db),
  ])
  return {
    weights, cardio, sports, sleep, donations, readinessInputs, muscleGroups, exerciseMuscles,
    exerciseAdaptations: exerciseAdaptationMap(exercises),
    adaptationTargets,
    hrMax: profileHrMax(profile, date),
    readinessMethod: profile.readinessMethod,
  }
}
