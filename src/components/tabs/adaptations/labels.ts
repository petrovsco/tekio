import type { Adaptation } from '../../../types'
import type { MuscleQuality } from '../../../lib/fusedRead'

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

/** Lowercase names for running prose ("Untouched: power, anaerobic."). */
export const QUALITY_PROSE: Record<Adaptation, string> = {
  power: 'power',
  strength: 'strength',
  hypertrophy: 'hypertrophy',
  muscular_endurance: 'muscular endurance',
  anaerobic_capacity: 'anaerobic',
  vo2max: 'VO₂max',
  endurance: 'endurance',
}

/** The segmented control's order — the force–velocity continuum, fastest first
 *  (031 §7 decision 3), not MUSCLE_QUALITIES' declaration order. */
export const MAP_QUALITIES: MuscleQuality[] = ['power', 'strength', 'hypertrophy', 'muscular_endurance']

/** The spectrum's order — effort duration left→right: seconds, minutes, hours. */
export const SPECTRUM_QUALITIES = ['anaerobic_capacity', 'vo2max', 'endurance'] as const

export const fmtSets = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1))

export const fmtAgo = (daysSince: number | null): string =>
  daysSince === null ? 'never' : daysSince === 0 ? 'today' : `${daysSince} d ago`
