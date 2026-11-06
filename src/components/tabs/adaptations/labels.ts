import type { Adaptation } from '../../../types'
import type { TargetUnit, MuscleQuality } from '@tekio/core'

// Editorial short names for the Adaptations drill-down (roadmap 031). Home's
// whole-body tiles already say VO₂MAX / ANAEROBIC / ENDURANCE and its muscle
// sheet says MUSC. END — these are the same words so the two reads rhyme.

/** Uppercase labels for controls, band headings and sheet titles. */
export const QUALITY_SHORT: Record<Adaptation, string> = {
  power: 'POWER',
  strength: 'STRENGTH',
  hypertrophy: 'HYPERTROPHY',
  muscular_endurance: 'MUSC. END',
  anaerobic_capacity: 'ANAEROBIC',
  vo2max: 'VO₂MAX',
  endurance: 'ENDURANCE',
}

/** A target's unit as the reads print it — "sets", "sessions", "min" (roadmap
 *  0012: the word follows the target in use, never the modality). */
export const UNIT_LABEL: Record<TargetUnit, string> = {
  sets: 'sets',
  sessions: 'sessions',
  minutes: 'min',
}

/** The segmented control's order — the force–velocity continuum, fastest first
 *  (031 §7 decision 3), not MUSCLE_QUALITIES' declaration order. */
export const MAP_QUALITIES: MuscleQuality[] = ['power', 'strength', 'hypertrophy', 'muscular_endurance']

/** The spectrum's order — effort duration left→right: seconds, minutes, hours. */
export const SPECTRUM_QUALITIES = ['anaerobic_capacity', 'vo2max', 'endurance'] as const

// `fmtSets` and `fmtAgo` moved to `lib/utils.ts`: Home wrote its own copies of
// both rather than import them from here, and this file is about the seven
// qualities, not about formatting.
