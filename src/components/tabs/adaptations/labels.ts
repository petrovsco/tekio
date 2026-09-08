import type { Adaptation } from '../../../types'
import type { MuscleQuality } from '../../../lib/fusedRead'
import { splitCoverage, type AdaptationSummary } from '../../../lib/adaptations'

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
const QUALITY_PROSE: Record<Adaptation, string> = {
  power: 'power',
  strength: 'strength',
  hypertrophy: 'hypertrophy',
  muscular_endurance: 'muscular endurance',
  anaerobic_capacity: 'anaerobic',
  vo2max: 'VO₂max',
  endurance: 'endurance',
}

/**
 * The window in one sentence — "Untouched: power, anaerobic. Short: strength."
 * — or the all-clear. Home's "what is missing" card and the Adaptations header
 * print this same string, so the two screens can never disagree about which
 * quality is missing (roadmap 062). Callers handle the zero-data case first.
 */
export function coverageLine(coverage: Record<Adaptation, AdaptationSummary>, windowDays: number): string {
  const { untouched, short } = splitCoverage(coverage)
  const parts: string[] = []
  if (untouched.length > 0) parts.push(`Untouched: ${untouched.map(k => QUALITY_PROSE[k]).join(', ')}.`)
  if (short.length > 0) parts.push(`Short: ${short.map(k => QUALITY_PROSE[k]).join(', ')}.`)
  return parts.length > 0 ? parts.join(' ') : `Every quality on target in the last ${windowDays} days.`
}

/** The segmented control's order — the force–velocity continuum, fastest first
 *  (031 §7 decision 3), not MUSCLE_QUALITIES' declaration order. */
export const MAP_QUALITIES: MuscleQuality[] = ['power', 'strength', 'hypertrophy', 'muscular_endurance']

/** The spectrum's order — effort duration left→right: seconds, minutes, hours. */
export const SPECTRUM_QUALITIES = ['anaerobic_capacity', 'vo2max', 'endurance'] as const

// `fmtSets` and `fmtAgo` moved to `lib/utils.ts`: Home wrote its own copies of
// both rather than import them from here, and this file is about the seven
// qualities, not about formatting.
