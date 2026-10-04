import type { ReadinessMethod } from '../lib/fusedRead'

// The words for each readiness method (RFC 0092), shared by Profile, the
// readiness sheet and Home so a method is called the same thing everywhere.

/** The method's name, as a label. */
export const METHOD_LABEL: Record<ReadinessMethod, string> = {
  overnight_hrv: 'Overnight HRV',
  morning_hrv: 'Morning HRV',
  check_in: 'Check-in',
}

/** The method's name inside a sentence. */
export const METHOD_NAME: Record<ReadinessMethod, string> = {
  overnight_hrv: 'overnight HRV',
  morning_hrv: 'morning HRV',
  check_in: 'check-in',
}

/** What the method asks of a person, and how certain it is — Profile's rows.
 * The order of certainty is the 0085 ranking (tekio.rfcs/grounding/0085-readiness-inputs.md). */
export const METHOD_NEEDS: Record<ReadinessMethod, string> = {
  overnight_hrv: 'A watch or ring, synced each morning. Nothing to do, the most certain.',
  morning_hrv: 'One minute on waking with a phone-camera app or chest strap, then type the number.',
  check_in: 'How you feel, five quick questions. Less certain.',
}

/** The effort, as a short tag. */
export const METHOD_COST: Record<ReadinessMethod, string> = {
  overnight_hrv: 'Synced',
  morning_hrv: '1 min',
  check_in: '5 taps',
}

/** The check-in's five items, 1–5 with 5 always the good end (McLean 2010's
 * form; tekio.rfcs/grounding/0092-readiness-method.md). The ends say what 1
 * and 5 mean, so nobody has to flip a scale in their head. */
export const CHECK_IN_ITEMS = [
  { key: 'energy', label: 'Energy', low: 'drained', high: 'fresh' },
  { key: 'soreness', label: 'Soreness', low: 'very sore', high: 'none' },
  { key: 'sleepQuality', label: 'Sleep', low: 'awful', high: 'great' },
  { key: 'stress', label: 'Stress', low: 'very high', high: 'calm' },
  { key: 'mood', label: 'Mood', low: 'low', high: 'great' },
] as const

/** Sources that can deliver overnight HRV, and whether the app reads them yet. */
export const OVERNIGHT_SOURCES = [
  { name: 'Garmin', state: 'Daily sync' },
  { name: 'Oura, WHOOP, Apple Watch, Polar', state: 'Not yet' },
] as const
