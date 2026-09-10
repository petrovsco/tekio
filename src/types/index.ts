// `import type` of two value bindings, used only under `typeof`. It is erased at
// build, so this does not close a runtime cycle with `constants/app.ts`, which
// type-imports `CardioFormat` and `DayOfWeek` back from here.
import type { CARDIO_TYPES, DONATION_TYPES } from '../constants/app'

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

/** The modality. `Custom` is conditioning with no modality among the four
 *  (EMOM, slam/jump circuits); its notes say what it was (roadmap 054).
 *  Derived from the list the pickers render, so the two cannot drift apart. */
export type CardioType = typeof CARDIO_TYPES[number]

/** How the session was run. Any modality can be done as intervals, so this is
 *  a second column, never a fifth type (roadmap 054). Absent = not stated. */
export type CardioFormat = 'steady' | 'intervals'

/**
 * The Garmin numbers a synced session carries — the one shape the cardio and
 * sport classifiers both read (roadmap 058). Absent on a hand-logged row.
 */
export interface GarminIntensity {
  /** Peak heart rate (bpm). */
  maxHr?: number
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

export interface CardioEntry extends GarminIntensity {
  id: string
  date: string
  type: CardioType
  format?: CardioFormat
  /** Work-bout length in seconds on an `intervals` row — the 60 in "4×60 s",
   *  the 240 in a 4×4. Absent = not stated. Decides anaerobic capacity (≤ 120 s)
   *  vs VO₂max (roadmap 005); ignored unless `format` is `'intervals'`. */
  boutSeconds?: number
  duration: number
  distance?: number
  /** Average heart rate (bpm) for the session. */
  avgHr?: number
  notes?: string
  /** Where the row came from. `'garmin'` rows carry the {@link GarminIntensity} fields. */
  source?: 'manual' | 'garmin'
  /** Garmin activity id — the idempotent-sync dedupe key (absent on manual rows). */
  garminActivityId?: number
  /** Elevation gain / denivelation in metres. */
  elevationGain?: number
}

/**
 * The seven trainable physical adaptations (Huberman × Galpin framework,
 * simplified 2026-08-29 — see tekio.rfcs/rfcs/done/0019-adaptation-model-simplification.md).
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

/**
 * Another spelling of an exercise name (roadmap 044). It points at a canonical
 * *name*, not at an exercise row, so the shipped list works for a user who has
 * not created a single exercise yet.
 */
export interface ExerciseAlias {
  alias: string
  canonicalName: string
  /** False for the list shipped with the app, true for this user's own rows. */
  isOwn: boolean
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

export type QualityRating = 1 | 2 | 3 | 4 | 5
export type MatchResult = 'win' | 'loss' | 'tie'

export interface SportEntry extends GarminIntensity {
  id: string
  date: string
  /** Free text: sports are rows in `sport_types`, added by typing a new name. */
  sport: string
  withTrainer: boolean
  quality: QualityRating
  notes: string
  /** Session length in minutes. */
  duration?: number
  /** Average heart rate (bpm) for the session. */
  avgHr?: number
  competitorNames?: string[]
  result?: MatchResult
  teammateNames?: string[]
  /** Where the row came from. A `'garmin'` row arrived with duration, avg HR and the {@link GarminIntensity} fields (roadmap 058) — never typed — and no rating yet. */
  source?: 'manual' | 'garmin'
  /** Garmin activity id — the idempotent-sync dedupe key (absent on manual rows). */
  garminActivityId?: number
}

export interface SportTypeInfo {
  name: string
  hasCompetitor: boolean
  hasTeammate: boolean
}

/** What a brand-new sport needs beyond its name — the rest of {@link SportTypeInfo}. */
export type NewSportFlags = Omit<SportTypeInfo, 'name'>

export interface WaterEntry {
  id: string
  date: string
  amountMl: number
}

// ── Recovery / Readiness axis ───────────────────────────────────────────────
// Modalities that sit *parallel* to the seven Galpin adaptations (recovery is
// deliberately not an eighth adaptation). Each is a simple user-scoped log.

export type SleepQuality = QualityRating

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

/** One timed heat- or cold-exposure bout. Sauna and cold plunge are the same
 *  shape; the table a row came from is what tells them apart, and the two names
 *  below are what the store, the edit modal and the db layer read. */
interface ExposureBout {
  id: string
  date: string
  duration: number
  /** Temperature in °C, if tracked. */
  tempC?: number
  notes?: string
}

/** A single sauna bout. */
export type SaunaEntry = ExposureBout

/** A single cold-exposure / plunge bout. */
export type ColdEntry = ExposureBout

/** Derived from the list the pickers render, so the two cannot drift apart. */
type DonationType = typeof DONATION_TYPES[number]

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
}

export type EditModalTarget =
  | { type: 'weight'; record: WeightEntry }
  | { type: 'weight-superset'; record: [WeightEntry, WeightEntry] }
  | { type: 'bodyweight'; record: BodyweightEntry }
  | { type: 'cardio'; record: CardioEntry }
  | { type: 'mobility'; record: MobilityEntry }
  | { type: 'sport'; record: SportEntry }
  | { type: 'donation'; record: DonationEntry }
  | { type: 'water'; record: WaterEntry }
  | { type: 'sleep'; record: SleepEntry }
  | { type: 'sauna'; record: SaunaEntry }
  | { type: 'cold'; record: ColdEntry }
