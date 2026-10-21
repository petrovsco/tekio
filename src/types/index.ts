// The domain types the reads take live in the core package (RFC 0094); the app
// reaches every type through this one module.
import type {
  LiftSet, WeightEntry, CardioType, CardioFormat, CardioEntry,
  Adaptation, MuscleGroup, ExerciseMuscleLink, QualityRating, MatchResult,
  SportEntry, SleepQuality, SleepEntry, DonationEntry, CheckInAnswers, ReadinessInput,
  BodyweightEntry, ExposureBout, MobilityExercise, MobilityEntry,
  PlannedExercise, PlannedKind, PlannedSession,
} from '@tekio/core'

export type {
  LiftSet, WeightEntry, CardioType, CardioFormat, CardioEntry,
  Adaptation, MuscleGroup, ExerciseMuscleLink, QualityRating, MatchResult,
  SportEntry, SleepQuality, SleepEntry, DonationEntry, CheckInAnswers, ReadinessInput,
  BodyweightEntry, MobilityExercise, MobilityEntry,
  PlannedExercise, PlannedKind, PlannedSession,
}
export type { ExerciseAlias } from '@tekio/core'

/**
 * Another spelling of an exercise name (roadmap 044). It points at a canonical
 * *name*, not at an exercise row, so the shipped list works for a user who has
 * not created a single exercise yet.
 */

export interface SportTypeInfo {
  name: string
  hasCompetitor: boolean
  hasTeammate: boolean
}

/** What a brand-new sport needs beyond its name — the rest of {@link SportTypeInfo}. */
export type NewSportFlags = Omit<SportTypeInfo, 'name'>

/** A single sauna bout; the table a row came from is what tells the two apart,
 *  and these names are what the store, the edit modal and the db layer read. */
export type SaunaEntry = ExposureBout

/** A single cold-exposure / plunge bout. */
export type ColdEntry = ExposureBout

export interface AppState {
  weights: WeightEntry[]
  bodyweight: BodyweightEntry[]
  cardio: CardioEntry[]
  mobility: MobilityEntry[]
  sports: SportEntry[]
  sportTypes: SportTypeInfo[]
  donations: DonationEntry[]
  sleep: SleepEntry[]
  sauna: SaunaEntry[]
  cold: ColdEntry[]
  muscleGroups: MuscleGroup[]
  exerciseMuscles: ExerciseMuscleLink[]
}

export type EditModalTarget =
  | { type: 'weight'; record: WeightEntry }
  | { type: 'weight-superset'; record: WeightEntry[] }
  | { type: 'bodyweight'; record: BodyweightEntry }
  | { type: 'cardio'; record: CardioEntry }
  | { type: 'mobility'; record: MobilityEntry }
  | { type: 'sport'; record: SportEntry }
  | { type: 'donation'; record: DonationEntry }
  | { type: 'sleep'; record: SleepEntry }
  | { type: 'sauna'; record: SaunaEntry }
  | { type: 'cold'; record: ColdEntry }
