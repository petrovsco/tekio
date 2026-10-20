// The Adaptations tab's read (RFC 0094 step 2b); `reads.ts` says why the
// three live apart and why `date` is always passed in.
import type { Adaptation } from './types'
import {
  targetShape, weightSetsIn, thresholdEnduranceCount, GAP_CUTOFF,
  type AdaptationSummary, type MuscleQuality, type TargetShape,
} from './adaptations'
import { muscleQualityStates, muscleWindow, rankMuscleGaps, qualityStates, type MuscleState, type QualityState } from './fusedRead'
import { coverageOn, type ReadRows } from './reads'

export interface AdaptationsRead {
  date: string
  coverage: Record<Adaptation, AdaptationSummary>
  /** The muscle-linked quality the body map is drawn for. */
  quality: MuscleQuality
  shape: TargetShape
  muscles: MuscleState[]
  gaps: MuscleState[]
  qualities: QualityState[]
  /** Every logged set in the window, each once (039 §6.0). */
  liftingSets: number
  /** Cardio and sport sessions in the window, each once (031 §7 decision 6). */
  cardioSessions: number
  /** Sessions at threshold, a count inside the endurance band (roadmap 057). */
  atThreshold: number
}

/** Adaptations: the per-quality map for `quality`, and the coverage behind
 *  the line Home prints. */
export function adaptationsRead(rows: ReadRows, quality: MuscleQuality, date: string): AdaptationsRead {
  const { from } = muscleWindow(date)
  const shape = targetShape(quality, rows.adaptationTargets)
  const muscles = muscleQualityStates(
    rows.weights, rows.exerciseMuscles, rows.muscleGroups, quality, shape, rows.exerciseAdaptations, date,
  )
  const inWindow = (d: string) => d >= from && d <= date
  return {
    date,
    coverage: coverageOn(rows, date),
    quality,
    shape,
    muscles,
    gaps: rankMuscleGaps(muscles).filter(m => m.fillFraction < GAP_CUTOFF),
    // No HRmax here, as the tab has always read it: the whole-body spectrum
    // shows staleness by Garmin's word and the logged type alone.
    qualities: qualityStates(rows.cardio, rows.sports, date),
    liftingSets: weightSetsIn(rows.weights, from, date),
    cardioSessions: rows.cardio.filter(c => inWindow(c.date)).length + rows.sports.filter(s => inWindow(s.date)).length,
    atThreshold: thresholdEnduranceCount(rows.cardio, rows.sports, from, date, rows.hrMax),
  }
}
