// The product's words, shared by every client (RFC 0096): the web app, the
// phone apps and the agent print the same names and the same sentences, so a
// read can never say one thing on the web and another on a phone. Moved here
// from the web app's components when the Android app needed them.
import { GAP_CUTOFF, splitCoverage, type AdaptationSummary } from './adaptations'
import { BODY_MAP } from './bodyMap'
import type { ReadinessMethod } from './fusedRead'
import type { Adaptation } from './types'

/** A set count: whole numbers plain, halves to one decimal. A muscle's share of
 *  a set is fractional (level 2 links weigh 0.5), so "1.5 sets" is a real read. */
export const fmtSets = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1))

/** How long ago, for a recency note. `null` means it has never happened. */
export const fmtAgo = (daysSince: number | null): string =>
  daysSince === null ? 'never' : daysSince === 0 ? 'today' : `${daysSince} d ago`

/** "a", "a and b", "a, b and c". */
export const joinNames = (names: string[]): string =>
  names.length <= 1 ? names[0] ?? '' : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

/** Ramp band by share of the window target, 0 (the gap) to 3 (on target). The
 *  top band starts at GAP_CUTOFF (adaptations.ts) — the same line the callouts
 *  stop at and the "on target" counter reads (roadmap 045). */
export function rampStep(fraction: number): 0 | 1 | 2 | 3 {
  if (fraction < 0.10) return 0
  if (fraction < 0.35) return 1
  if (fraction < GAP_CUTOFF) return 2
  return 3
}

/** Editorial short labels for map callouts and the verdict sentence. */
const MUSCLE_SHORT: Record<string, string> = {
  'Rectus Abdominis': 'CORE',
  'Obliques': 'OBLIQUES',
  'Hip Flexors': 'HIP FLEX',
  'Quadriceps': 'QUADS',
  'Hamstrings': 'HAMS',
  'Glutes': 'GLUTES',
  'Calves': 'CALVES',
  'Adductors': 'ADDUCTORS',
  'Erectors': 'ERECTORS',
  'Chest': 'CHEST',
  'Biceps': 'BICEPS',
  'Triceps': 'TRICEPS',
  'Forearms': 'FOREARMS',
  'Lats': 'LATS',
  'Rhomboids': 'RHOMBOIDS',
  'Upper Back / Traps': 'TRAPS',
  'Anterior Deltoid': 'ANT DELT',
  'Lateral Deltoid': 'LAT DELT',
  'Posterior Deltoid': 'POST DELT',
  'Rotator Cuff': 'ROTATOR',
}

export function muscleShort(name: string): string {
  return MUSCLE_SHORT[name] ?? name.toUpperCase()
}

/** The muscles the body map can point a callout at. */
export const MAPPED_MUSCLES: readonly string[] = Object.keys(BODY_MAP.anchors)

/** The readiness method's name, as a label (RFC 0092). */
export const METHOD_LABEL: Record<ReadinessMethod, string> = {
  overnight_hrv: 'Overnight HRV',
  morning_hrv: 'Morning HRV',
  check_in: 'Check-in',
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
  const { untouched, short } = coverageParts(coverage)
  const parts: string[] = []
  if (untouched) parts.push(`Untouched: ${untouched}.`)
  if (short) parts.push(`Short: ${short}.`)
  return parts.length > 0 ? parts.join(' ') : `Every quality on target in the last ${windowDays} days.`
}

/**
 * The names in each half of that sentence ("power, anaerobic"), so Home can
 * weight them apart — the untouched names lead in the accent, their label
 * stays ink (roadmap 0082). An empty half is null. `coverageLine` is built from
 * these, so the two screens still print one sentence.
 */
export function coverageParts(
  coverage: Record<Adaptation, AdaptationSummary>,
): { untouched: string | null; short: string | null } {
  const { untouched, short } = splitCoverage(coverage)
  const names = (keys: Adaptation[]) => (keys.length > 0 ? keys.map(k => QUALITY_PROSE[k]).join(', ') : null)
  return { untouched: names(untouched), short: names(short) }
}
