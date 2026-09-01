export interface LiftSet {
  weight: number
  reps: number
}

export interface WeightEntry {
  id: string
  date: string
  exercise: string
  sets: LiftSet[]
  supersetId?: string
}

export interface BodyweightEntry {
  id: string
  date: string
  weight: number
}

export type CardioType = 'Running' | 'Cycling' | 'Swimming' | 'Indoor Rowing'

export interface CardioEntry {
  id: string
  date: string
  type: CardioType
  duration: number
  distance?: number
  /** Average heart rate (bpm) for the session. */
  avgHr?: number
  notes?: string
  /** Where the row came from. `'garmin'` rows carry the Training-Effect fields below. */
  source?: 'manual' | 'garmin'
  /** Garmin activity id — the idempotent-sync dedupe key (absent on manual rows). */
  garminActivityId?: number
  /** Peak heart rate (bpm). */
  maxHr?: number
  /** Elevation gain / denivelation in metres. */
  elevationGain?: number
  /** Garmin Aerobic Training Effect (0–5). */
  aerobicTe?: number
  /** Garmin Anaerobic Training Effect (0–5). */
  anaerobicTe?: number
  /** Garmin's own primary-benefit label, e.g. `VO2MAX`, `TEMPO`, `RECOVERY`. */
  trainingEffectLabel?: string
  /** Garmin per-activity training load (EPOC-based). */
  trainingLoad?: number
  /** Seconds spent in HR zones 1–5 (Garmin `hrTimeInZone_1..5`). */
  zoneDistribution?: number[]
}

/**
 * The seven trainable physical adaptations (Huberman × Galpin framework,
 * simplified 2026-08-29 — see docs/roadmap/done/019-adaptation-model-simplification.md).
 * Four are muscle-linked and read per muscle; three are whole-body cardio
 * qualities read per session.
 */
export type Adaptation =
  | 'power'
  | 'strength'
  | 'hypertrophy'
  | 'muscular_endurance'
  | 'anaerobic_capacity'
  | 'vo2max'
  | 'endurance'

export type BodyRegion = 'upper' | 'lower' | 'core' | 'full_body'

export interface MuscleGroup {
  id: string
  name: string
  bodyRegion: BodyRegion
  /** Parent muscle group id (e.g. Lateral Deltoid → Shoulders); null/undefined = top-level group. */
  parentId?: string | null
}

export type MuscleContribution = 'stimulus' | 'recovery'

/** A link between an exercise and a muscle group, weighted by impact level (1 = most direct). */
export interface ExerciseMuscleLink {
  exercise: string
  group: string
  region: BodyRegion
  level: 1 | 2 | 3
  contribution: MuscleContribution
}

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

export type SportType = 'Tennis' | 'Swimming' | 'Volleyball'
export type QualityRating = 1 | 2 | 3 | 4 | 5
export type MatchResult = 'win' | 'loss' | 'tie'

export interface SportEntry {
  id: string
  date: string
  sport: SportType
  withTrainer: boolean
  quality: QualityRating
  notes: string
  /** Session length in minutes. Drives the cardio-adaptation classification. */
  duration?: number
  /** Average heart rate (bpm) for the session. */
  avgHr?: number
  competitorNames?: string[]
  result?: MatchResult
  teammateNames?: string[]
}

export interface SportTypeInfo {
  name: string
  hasCompetitor: boolean
  hasTeammate: boolean
}

export interface NewSportFlags {
  hasCompetitor: boolean
  hasTeammate: boolean
}

export interface WaterEntry {
  id: string
  date: string
  amountMl: number
}

// ── Recovery / Readiness axis ───────────────────────────────────────────────
// Modalities that sit *parallel* to the seven Galpin adaptations (recovery is
// deliberately not an eighth adaptation). Each is a simple user-scoped log.

export type SleepQuality = 1 | 2 | 3 | 4 | 5

/** One night's sleep. `date` is the wake-up (log) date. */
export interface SleepEntry {
  id: string
  date: string
  /** Total sleep duration in hours. */
  hours: number
  /** Subjective sleep quality 1–5, or undefined if not rated. */
  quality?: SleepQuality
  /** Garmin's objective Sleep Score (0–100), or undefined for manual-only nights. */
  score?: number
  /** Garmin's categorical label (EXCELLENT / GOOD / FAIR / POOR). */
  scoreQualifier?: string
  /** Overnight average heart-rate variability in ms (Garmin nights only). */
  hrv?: number
  /** Overnight resting heart rate in bpm (Garmin nights only). */
  restingHr?: number
  /** Row provenance: hand-logged vs. pulled from the Garmin daily sync. */
  source?: 'manual' | 'garmin'
  notes?: string
}

/** A single sauna bout. */
export interface SaunaEntry {
  id: string
  date: string
  duration: number
  /** Temperature in °C, if tracked. */
  tempC?: number
  notes?: string
}

/** A single cold-exposure / plunge bout. */
export interface ColdEntry {
  id: string
  date: string
  duration: number
  /** Temperature in °C, if tracked. */
  tempC?: number
  notes?: string
}

export type DonationType = 'Full Blood' | 'Plasma'

export interface DonationEntry {
  id: string
  date: string
  type: DonationType
  notes: string
}

export type BlockType = 'warmup' | 'weight' | 'mobility' | 'sport' | 'conditioning' | 'recovery'

export type TrainingTag =
  | 'STRENGTH' | 'POWER' | 'PREHAB' | 'CORE' | 'CONDITIONING'
  | 'MOBILITY' | 'WARMUP' | 'RECOVERY' | 'SKILL'

export type DayOfWeek =
  | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

export interface ProgramDayExercisePrescription {
  id?: string
  exercise: string
  trainingTag: TrainingTag
  sortOrder: number
  notes?: string
  durationText?: string
  tempo?: string
  setsText?: string
  repsText?: string
  weightText?: string
}

export interface ProgramDayBlock {
  id?: string
  blockType: BlockType
  name: string
  scheduledTime?: string
  durationMinutes?: number
  notes?: string
  sortOrder: number
  exercises: ProgramDayExercisePrescription[]
  supersets: [string, string][]
}

export interface ProgramDay {
  id?: string
  name: string
  exercises: string[]
  supersets: [string, string][]
  /** null = not pinned to a weekday (Adjustment-phase days, ordered by queueOrder instead) */
  dayOfWeek?: DayOfWeek | null
  queueOrder?: number | null
  isVariant?: boolean
  variantGroupKey?: string | null
  /** Block breakdown of this day; `exercises`/`supersets` above are derived from the weight-type block(s) for backward compatibility */
  blocks?: ProgramDayBlock[]
}

export interface ProgramPhase {
  id?: string
  name: string
  sortOrder: number
  durationWeeks: number | null
  goal: string
  days: ProgramDay[]
}

export interface Program {
  name: string
  startDate: string
  currentDayIndex: number
  lastAdvancedDate: string
  days: ProgramDay[]
  /** Richer phase/block structure backing `days` above; absent for not-yet-migrated programs */
  phases?: ProgramPhase[]
  weeklyPrinciples?: Record<string, string | number>
}

export interface ActiveProgram extends Program {
  programId: string
  userProgramId: string
  currentPhaseId?: string | null
  /** Deload is a user-committed state, not automatically derived from elapsed time */
  deloadCommittedDate?: string | null
}

export interface ProgramCycle {
  id: string
  userProgramId: string
  programId: string
  programName: string
  cycleNumber: number
  startDate: string
  endDate: string | null
  status: 'active' | 'paused' | 'completed' | 'abandoned'
  days: ProgramDay[]
}

export interface ProgramWeekOverride {
  userProgramId: string
  weekStartDate: string
  dayOfWeek: DayOfWeek
  variantActive: boolean
}

// ── Habits / Milestones ───────────────────────────────────────────────────────

export type HabitCadence = 'daily' | 'weekly' | 'monthly'

/** Where a habit's progress is auto-derived from. `none` = manual check-off. */
export type HabitAutoSource =
  | 'none'
  | 'weight_sets'
  | 'mobility_minutes'
  | 'water'
  | 'cardio_sessions'

export interface Habit {
  id: string
  name: string
  /** Emoji shown in lists/cards. */
  icon?: string | null
  cadence: HabitCadence
  /** Goal for the period, e.g. 15 (sets), 2500 (ml), 1 (a simple check-off). */
  targetCount: number
  /** Display unit: 'sets' | 'minutes' | 'ml' | 'sessions' | null. */
  unit?: string | null
  /** Linked muscle group (drives weight_sets / mobility_minutes auto-count + dashboard). */
  muscleGroupId?: string | null
  /** Linked exercise (alternative to a muscle group). */
  exerciseId?: string | null
  autoSource: HabitAutoSource
  /** For muscle auto-count: include exercise links whose level ≤ this. */
  countLevel: 1 | 2 | 3
  contribution: MuscleContribution
  /** Manual (autoSource='none') habits only: true = one-tap check-off, false = +1 counter. */
  singleTick: boolean
  active: boolean
  sortOrder: number
  notes?: string | null
}

export interface HabitCompletion {
  id: string
  habitId: string
  /** Start of the day/week/month bucket (YYYY-MM-DD). */
  periodStart: string
  count: number
  notes?: string | null
}

/** Computed live (not persisted) progress of a habit for its current period. */
export interface HabitProgress {
  current: number
  target: number
  done: boolean
  periodStart: string
}

export interface AppState {
  weights: WeightEntry[]
  bodyweight: BodyweightEntry[]
  cardio: CardioEntry[]
  mobility: MobilityEntry[]
  sports: SportEntry[]
  sportTypes: SportTypeInfo[]
  donations: DonationEntry[]
  water: WaterEntry[]
  sleep: SleepEntry[]
  sauna: SaunaEntry[]
  cold: ColdEntry[]
  programs: ActiveProgram[]
  programHistory: ProgramCycle[]
  weekOverrides: ProgramWeekOverride[]
  muscleGroups: MuscleGroup[]
  exerciseMuscles: ExerciseMuscleLink[]
  habits: Habit[]
  habitCompletions: HabitCompletion[]
}

export type EditModalTarget =
  | { type: 'weight'; record: WeightEntry }
  | { type: 'weight-superset'; records: [WeightEntry, WeightEntry] }
  | { type: 'bodyweight'; record: BodyweightEntry }
  | { type: 'cardio'; record: CardioEntry }
  | { type: 'mobility'; record: MobilityEntry }
  | { type: 'sport'; record: SportEntry }
  | { type: 'donation'; record: DonationEntry }
  | { type: 'water'; record: WaterEntry }
  | { type: 'sleep'; record: SleepEntry }
  | { type: 'sauna'; record: SaunaEntry }
  | { type: 'cold'; record: ColdEntry }
  | { type: 'habit'; record: Habit }
