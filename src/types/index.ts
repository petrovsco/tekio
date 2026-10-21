// The domain types the reads take live in the core package (RFC 0094); the app
// reaches every type through this one module.
import type {
  LiftSet, WeightEntry, CardioType, CardioFormat, CardioEntry,
  Adaptation, MuscleGroup, ExerciseMuscleLink, QualityRating, MatchResult,
  SportEntry, SleepQuality, SleepEntry, DonationEntry, CheckInAnswers, ReadinessInput,
  BodyweightEntry, ExposureBout,
} from '@tekio/core'

export type {
  LiftSet, WeightEntry, CardioType, CardioFormat, CardioEntry,
  Adaptation, MuscleGroup, ExerciseMuscleLink, QualityRating, MatchResult,
  SportEntry, SleepQuality, SleepEntry, DonationEntry, CheckInAnswers, ReadinessInput,
  BodyweightEntry,
}
export type { ExerciseAlias } from '@tekio/core'

/**
 * Another spelling of an exercise name (roadmap 044). It points at a canonical
 * *name*, not at an exercise row, so the shipped list works for a user who has
 * not created a single exercise yet.
 */

export interface MobilityExercise {
  name: string
  duration: number
  notes: string
  /** Muscle groups this stretch targets (names); drives weekly per-group volume. */
  muscleGroups?: string[]
}

export interface MobilityEntry {
  id: string
  date: string
  exercises: MobilityExercise[]
  duration: number
}

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

/** A planned exercise (planned_exercises, RFC 0098): work written ahead of time
 *  that has not happened yet. Never a `WeightEntry`, and never passed to a read,
 *  so it cannot count as done. */
export interface PlannedExercise {
  id: string
  date: string
  exercise: string
  /** Targets to aim at, not results. Named `targets`, not `sets`, so a plan
   *  is not structurally a `WeightEntry` and no read will type-check with one. */
  targets: LiftSet[]
  plannedBy: 'user' | 'agent'
  /** The logged entry this plan became; absent while it is still a plan. */
  loggedAs?: string
  /** Shared by the lifts of one superset or circuit (RFC 0106), and carried
   *  unchanged onto the entries they are logged as. */
  supersetId?: string
}

/** What a planned session is for (RFC 0104). Lifts are `PlannedExercise`. */
export type PlannedKind = 'cardio' | 'sport' | 'mobility'

/** A planned stretch: a name and the minutes to give it. */
export interface PlannedStretch {
  name: string
  duration: number
}

/**
 * A cardio, sport or mobility session written ahead of time (RFC 0104). Like a
 * `PlannedExercise`, it counts for nothing until it is logged, and its fields
 * are targets: logging may use other numbers.
 */
export interface PlannedSession {
  id: string
  date: string
  kind: PlannedKind
  /** The cardio type or the sport; empty for mobility. */
  name: string
  /** Target minutes (cardio, sport). */
  duration?: number
  /** Target km (cardio). */
  distance?: number
  format?: CardioFormat
  boutSeconds?: number
  /** The stretches (mobility). Named apart from `MobilityEntry.exercises` so a
   *  plan is not structurally an entry and no read will type-check with one. */
  stretches?: PlannedStretch[]
  notes?: string
  plannedBy: 'user' | 'agent'
  /** The logged entry this plan became; absent while it is still a plan. */
  loggedAs?: string
}

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
