// Every row the web app opens with, loaded at once (RFC 0094 step 4): the
// store's bootstrap, as one call the API can answer in one round trip. The
// profile and the menu's sections come after their rows are made sure of, so
// they load in a second step (`loadStartSettings`), beside the rest.
import type {
  Adaptation, WeightEntry, BodyweightEntry, CardioEntry, MobilityEntry, MuscleGroup, ExerciseMuscleLink,
  SportEntry, DonationEntry, SleepEntry, ExposureBout, ExerciseAlias, ReadinessInput, PlannedExercise, PlannedSession,
} from '@tekio/core'
import type { Db } from './db'
import { loadWeights } from './weights'
import { loadBodyweight } from './bodyweight'
import { loadCardio } from './cardio'
import { loadMobility } from './mobility'
import { loadMuscleGroups, loadExercises, loadExerciseMuscleLinks } from './muscles'
import { loadSports, loadSportTypes, type NewSportFlags } from './sport'
import { loadDonations } from './donations'
import { loadSleep } from './sleep'
import { loadExposure } from './exposure'
import { loadAdaptationTargets, type AdaptationTargetMap } from './adaptationTargets'
import { loadExerciseAliases } from './exercises'
import { loadReadinessInputs } from './readiness'
import { loadPlans } from './plans'
import { loadSessionPlans } from './sessionPlans'
import { exerciseAdaptationMap } from './readRows'
import { ensureProfile, findProfile, loadProfile, type UserProfile } from './profile'
import { seedSections, sectionsMissing, loadSections, type SectionConfig } from './sections'

export interface StartRows {
  weights: WeightEntry[]
  bodyweight: BodyweightEntry[]
  cardio: CardioEntry[]
  mobility: MobilityEntry[]
  muscleGroups: MuscleGroup[]
  exerciseMuscles: ExerciseMuscleLink[]
  exerciseAdaptations: Record<string, Adaptation>
  sports: SportEntry[]
  sportTypes: Array<NewSportFlags & { name: string }>
  donations: DonationEntry[]
  sleep: SleepEntry[]
  sauna: ExposureBout[]
  cold: ExposureBout[]
  adaptationTargets: AdaptationTargetMap
  exerciseAliases: ExerciseAlias[]
  readinessInputs: ReadinessInput[]
  plans: PlannedExercise[]
  sessionPlans: PlannedSession[]
}

export interface StartSettings {
  profile: UserProfile
  sections: SectionConfig[]
}

/** The profile and the sections. A first sign-in has neither, so they are
 *  written then and read again; every later opening only reads them. It can
 *  write, so the API runs it only once Auth has accepted the token. */
export async function loadStartSettings(db: Db): Promise<StartSettings> {
  const [found, sections] = await Promise.all([findProfile(db), loadSections(db)])
  if (found && !sectionsMissing(sections)) return { profile: found, sections }
  await Promise.all([found ? null : ensureProfile(db), sectionsMissing(sections) ? seedSections(db) : null])
  const [profile, seeded] = await Promise.all([loadProfile(db), loadSections(db)])
  return { profile, sections: seeded }
}

export async function loadStartRows(db: Db): Promise<StartRows> {
  const [
    weights, bodyweight, cardio, mobility, muscleGroups, exerciseMuscles, exercises, sports, sportTypes,
    donations, sleep, sauna, cold, adaptationTargets, exerciseAliases, readinessInputs, plans, sessionPlans,
  ] = await Promise.all([
    loadWeights(db), loadBodyweight(db), loadCardio(db), loadMobility(db), loadMuscleGroups(db),
    loadExerciseMuscleLinks(db), loadExercises(db), loadSports(db), loadSportTypes(db), loadDonations(db),
    loadSleep(db), loadExposure(db, 'sauna_sessions'), loadExposure(db, 'cold_sessions'),
    loadAdaptationTargets(db), loadExerciseAliases(db), loadReadinessInputs(db), loadPlans(db), loadSessionPlans(db),
  ])
  return {
    weights, bodyweight, cardio, mobility, muscleGroups, exerciseMuscles,
    exerciseAdaptations: exerciseAdaptationMap(exercises),
    sports, sportTypes, donations, sleep, sauna, cold, adaptationTargets, exerciseAliases, readinessInputs,
    plans, sessionPlans,
  }
}
