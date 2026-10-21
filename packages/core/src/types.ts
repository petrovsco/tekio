// The domain types the reads take (RFC 0094 step 1). Plain data: nothing here
// knows about React, the database or the device, so a server can feed the reads
// the same rows the web app does. The app's own types are in src/types/index.ts,
// which re-exports these.
//
// `import type` of two value bindings, used only under `typeof`. It is erased at
// build, so this does not close a runtime cycle with `constants/reads.ts`.
import type { CARDIO_TYPES, DONATION_TYPES } from './constants/reads'

export interface LiftSet {
  weight: number
  reps: number
  /** A hold (RFC 0107): the seconds it lasted. Stored as one rep, so `reps`
   *  is 1 whenever this is set. */
  seconds?: number
}

export interface WeightEntry {
  id: string
  date: string
  exercise: string
  sets: LiftSet[]
  supersetId?: string
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

type MuscleContribution = 'stimulus' | 'recovery'

/** A link between an exercise and a muscle group, weighted by impact level (1 = most direct). */
export interface ExerciseMuscleLink {
  exercise: string
  group: string
  region: BodyRegion
  level: 1 | 2 | 3
  contribution: MuscleContribution
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

/** Derived from the list the pickers render, so the two cannot drift apart. */
type DonationType = typeof DONATION_TYPES[number]

export interface DonationEntry {
  id: string
  date: string
  type: DonationType
  notes: string
}

/** The five check-in answers, each 1–5 with 5 always the good end (RFC 0092). */
export interface CheckInAnswers {
  energy: number
  soreness: number
  sleepQuality: number
  stress: number
  mood: number
}

/** One morning's typed readiness inputs (readiness_inputs, RFC 0092). Morning
 *  HRV and the check-in are separate methods with separate baselines. */
export interface ReadinessInput {
  id: string
  date: string
  /** rMSSD in ms from a phone-camera app or chest strap, on waking. */
  morningHrv?: number
  checkIn?: CheckInAnswers
}

/** The day a calendar week starts on, the user's choice in Profile. */
export type WeekStartDay = 'sunday' | 'monday'

export interface ExerciseAlias {
  alias: string
  canonicalName: string
  /** False for the list shipped with the app, true for this user's own rows. */
  isOwn: boolean
}
