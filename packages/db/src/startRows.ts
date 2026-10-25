// Every row the web app opens with, loaded at once (RFC 0094 step 4): the
// store's bootstrap, as one call the API answers with one database call. The
// profile and the menu's sections come after their rows are made sure of, so
// they load in a second step (`loadStartSettings`), beside the rest.
import type {
  Adaptation, WeightEntry, BodyweightEntry, CardioEntry, MobilityEntry, MuscleGroup, ExerciseMuscleLink,
  SportEntry, DonationEntry, SleepEntry, ExposureBout, ExerciseAlias, ReadinessInput, PlannedExercise, PlannedSession,
} from '@tekio/core'
import type { Db } from './db'
import { weightsFromRows } from './weights'
import { bodyweightFromRows } from './bodyweight'
import { cardioFromRows } from './cardio'
import { mobilityFromRows, exerciseMuscleMap } from './mobility'
import { muscleGroupsFromRows, exercisesFromRows, exerciseMuscleLinksFromRows } from './muscles'
import { sportsFromRows, sportTypesFromRows, type NewSportFlags } from './sport'
import { donationsFromRows } from './donations'
import { sleepFromRows } from './sleep'
import { exposureFromRows } from './exposure'
import { adaptationTargetsFromRows, type AdaptationTargetMap } from './adaptationTargets'
import { aliasesFromRows } from './exercises'
import { readinessFromRows } from './readiness'
import { plansFromRows } from './plans'
import { sessionPlansFromRows } from './sessionPlans'
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

/** Every start-up row in one database call, the function `start_rows`
 *  (supabase/migrations): after a few idle minutes each separate request paid
 *  the database's cold cost on its own, some twenty at once. It returns each
 *  table's rows as the loaders' own selects do, so the same mappers read them. */
export async function loadStartRows(db: Db): Promise<StartRows> {
  const { data, error } = await db.client.rpc('start_rows', undefined, { get: true })
  if (error) throw error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (data ?? {}) as Record<string, any[]>
  const rows = (table: string) => t[table] ?? []
  return {
    weights: weightsFromRows(rows('training_sessions')),
    bodyweight: bodyweightFromRows(rows('bodyweight_logs')),
    cardio: cardioFromRows(rows('cardio_sessions')),
    mobility: mobilityFromRows(rows('mobility_sessions'), exerciseMuscleMap(rows('exercise_muscle_groups'))),
    muscleGroups: muscleGroupsFromRows(rows('muscle_groups')),
    exerciseMuscles: exerciseMuscleLinksFromRows(rows('exercise_muscle_groups')),
    exerciseAdaptations: exerciseAdaptationMap(exercisesFromRows(rows('exercises'))),
    sports: sportsFromRows(rows('sport_sessions')),
    sportTypes: sportTypesFromRows(rows('sport_types')),
    donations: donationsFromRows(rows('blood_donations')),
    sleep: sleepFromRows(rows('sleep_logs')),
    sauna: exposureFromRows(rows('sauna_sessions')),
    cold: exposureFromRows(rows('cold_sessions')),
    adaptationTargets: adaptationTargetsFromRows(rows('adaptation_targets')),
    exerciseAliases: aliasesFromRows(rows('exercise_aliases')),
    readinessInputs: readinessFromRows(rows('readiness_inputs')),
    plans: plansFromRows(rows('planned_exercises')),
    sessionPlans: sessionPlansFromRows(rows('planned_sessions')),
  }
}
