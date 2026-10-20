// The three reads as whole answers (RFC 0094 step 2b): Home here, Adaptations
// and readiness in their own modules, so the lazy tabs' compositions stay out
// of the chunk that paints Home. Home, Adaptations and
// the readiness sheet each compose several calls from this package; these are
// those compositions, written once, so a screen and the API that serves the
// same read to a phone are the same call over the same rows.
//
// `date` is always passed in, never read off a clock here: it is the person's
// own calendar day, which only their device knows. On a server, `today()` is
// the server's day.
import type {
  Adaptation, CardioEntry, DonationEntry, ExerciseMuscleLink, MuscleGroup, ReadinessInput,
  SleepEntry, SportEntry, WeightEntry,
} from './types'
import type { HrMaxSource } from './hrMax'
import { resolveHrMax } from './hrMax'
import {
  adaptationCoverage, GAP_CUTOFF, type AdaptationSummary, type TargetOverrides,
} from './adaptations'
import {
  muscleStates, muscleWindow, rankMuscleGaps, qualityStates, systemicReadiness, donationStatus, fusedVerdict,
  type MuscleState, type QualityState, type SystemicReadiness, type DonationStatus, type FusedVerdict,
  type ReadinessMethod,
} from './fusedRead'
import { MUSCLE_WINDOW_DAYS } from './constants/reads'

/** Everything a read is computed from: one person's logged rows, the shared
 *  muscle catalogue, and the settings that change the arithmetic. */
export interface ReadRows {
  weights: WeightEntry[]
  cardio: CardioEntry[]
  sports: SportEntry[]
  sleep: SleepEntry[]
  donations: DonationEntry[]
  readinessInputs: ReadinessInput[]
  muscleGroups: MuscleGroup[]
  exerciseMuscles: ExerciseMuscleLink[]
  /** Lower-cased exercise name → the adaptation it is tagged with. */
  exerciseAdaptations: Record<string, Adaptation>
  adaptationTargets: TargetOverrides
  /** The HRmax the cardio classifier divides by ({@link profileHrMax}). */
  hrMax: number | null
  /** The method picked in Profile; null = automatic (RFC 0092). */
  readinessMethod: ReadinessMethod | null
}

/** The HRmax a profile resolves to: the number the user set, when it says
 *  where it came from, else the age estimate (roadmap 060). */
export function profileHrMax(
  p: { hrMaxStored: number | null; hrMaxSource: HrMaxSource | null; birthDate: string | null },
  date: string,
): number | null {
  return resolveHrMax(p.hrMaxSource != null ? p.hrMaxStored : null, p.birthDate, date)
}

/** The seven-quality coverage over the muscle window ending on `date` — the
 *  one call Home and Adaptations share (roadmap 062). */
export function coverageOn(rows: ReadRows, date: string): Record<Adaptation, AdaptationSummary> {
  return adaptationCoverage({
    weights: rows.weights, cardio: rows.cardio, sports: rows.sports,
    exerciseMuscles: rows.exerciseMuscles, muscleGroups: rows.muscleGroups,
    from: muscleWindow(date).from, date, windowDays: MUSCLE_WINDOW_DAYS,
    overrides: rows.exerciseAdaptations, targets: rows.adaptationTargets, hrMax: rows.hrMax,
  })
}

export interface HomeRead {
  date: string
  /** Every muscle group's fill, recency and recovery over the window. */
  muscles: MuscleState[]
  /** The muscles short of the map's top band, largest gap first. */
  gaps: MuscleState[]
  /** The whole-body qualities' staleness. */
  qualities: QualityState[]
  coverage: Record<Adaptation, AdaptationSummary>
  readiness: SystemicReadiness
  donation: DonationStatus
  /** Push, steady or hold: readiness and an acute donation together. */
  verdict: FusedVerdict
}

/** Home: which muscles are short, which qualities untouched, and whether
 *  today can push (doctrine §6). */
export function homeRead(rows: ReadRows, date: string): HomeRead {
  const muscles = muscleStates(rows.weights, rows.exerciseMuscles, rows.muscleGroups, date)
  const readiness = systemicReadiness(rows.sleep, date, rows.readinessInputs, rows.readinessMethod)
  const donation = donationStatus(rows.donations, date)
  return {
    date,
    muscles,
    gaps: rankMuscleGaps(muscles).filter(m => m.fillFraction < GAP_CUTOFF),
    qualities: qualityStates(rows.cardio, rows.sports, date, rows.hrMax),
    coverage: coverageOn(rows, date),
    readiness,
    donation,
    verdict: fusedVerdict(readiness.band, donation),
  }
}
