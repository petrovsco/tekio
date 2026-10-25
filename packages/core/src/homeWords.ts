// Home's words (RFC 0099): the sentences Home prints, made from the read
// itself, so every client that shows the read says the same thing. The web app
// prints them on Home and Adaptations; the API sends them with the Home read,
// so an assistant connected to it repeats the app's answer rather than
// composing its own. Moved here from HomeTab, GapMap and the Adaptations
// labels; the wording did not change.
import type { Adaptation } from './types'
import type { AdaptationSummary } from './adaptations'
import { splitCoverage } from './adaptations'
import type { MuscleState, SystemicReadiness, DonationStatus, FusedVerdict } from './fusedRead'
import { RECOVER_DAYS, DONATION_SUPPRESSION, MUSCLE_WINDOW_DAYS } from './constants/reads'

/** A set count: whole numbers plain, halves to one decimal. A muscle's share of
 *  a set is fractional (level 2 links weigh 0.5), so "1.5 sets" is a real read. */
export const fmtSets = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1))

/** How long ago, for a recency note. `null` means it has never happened. */
export const fmtAgo = (daysSince: number | null): string =>
  daysSince === null ? 'never' : daysSince === 0 ? 'today' : `${daysSince} d ago`

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


const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

export const joinNames = (names: string[]): string =>
  names.length <= 1 ? names[0] ?? '' : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

/** A muscle's short name in running prose: "quads", "post delt". */
export const shortLower = (name: string): string => muscleShort(name).toLowerCase()

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

/** What a moderate band changes: the effort, not the gaps. Partially supported:
 * in both trialled three-tier rules the middle tier was the planned session,
 * lighter, never rest — reps and load cut (DeBlauw 2021), or volume cut and the
 * intervals dropped (Nuuttila 2022). No percentage: each trial's 25% was its
 * chosen step, not a tested dose.
 * See tekio.rfcs/rfcs/done/0085-push-gate-own-baseline.md#grounding */
const STEADY_NOTE = 'Lighter today: no intervals or max efforts.'

/** The gated instruction plus the top gap as its reason — all editorial text
 *  for the verdict block lives here, the numbers come from the fused read. */
export function verdictCopy(args: {
  zeroData: boolean
  verdict: FusedVerdict
  sys: SystemicReadiness
  don: DonationStatus
  gaps: MuscleState[]
  states: MuscleState[]
}): { text: string; sub: string } {
  const { zeroData, verdict, sys, don, gaps, states } = args

  if (zeroData) {
    return {
      text: 'Nothing logged yet.',
      sub: 'One session and this screen starts answering. Nothing here is guessed.',
    }
  }

  if (verdict.mode === 'hold') {
    const text = 'Hold. Walk or mobility only.'
    if (verdict.cause === 'donation') {
      const when = fmtAgo(don.daysSince)
      return { text, sub: `Full blood donation ${when} — the 48 h acute window gates the day.` }
    }
    const sub = sys.method === 'check_in'
      ? "Today's check-in sits well under your usual."
      : `${sys.method === 'morning_hrv' ? 'Morning HRV' : 'HRV'} this week sits well under your own normal.`
    return { text, sub }
  }

  const recoveringShorts = states.filter(s => s.leaf && s.recovering).map(s => shortLower(s.name))
  const minDaysSince = states.reduce<number | null>(
    (min, s) => (s.daysSince !== null && (min === null || s.daysSince < min) ? s.daysSince : min),
    null,
  )
  const names = gaps.slice(0, 2).map(m => shortLower(m.name))
  const list = joinNames(names)
  const lead = verdict.mode === 'steady' ? 'Steady' : 'Push'
  const text = list
    ? `${lead}. ${cap(list)} ${names.length > 1 ? 'are' : 'is'} the gap.`
    : `${lead}. No gap in the last ${MUSCLE_WINDOW_DAYS} days.`
  const facts = gaps.slice(0, 2).map(m =>
    m.daysSince === null
      ? `${cap(shortLower(m.name))}: never trained.`
      : `${cap(shortLower(m.name))}: ${fmtSets(m.sets)} sets in ${MUSCLE_WINDOW_DAYS} days.`)
  if (recoveringShorts.length > 0) {
    const who = recoveringShorts.length > 3 ? `${recoveringShorts.length} muscles` : joinNames(recoveringShorts)
    facts.push(`${cap(who)} still recovering (${RECOVER_DAYS} days).`)
  } else if (minDaysSince !== null) {
    facts.push(`Nothing is sore — last stimulus ${fmtAgo(minDaysSince)}.`)
  }
  if (don.aerobicSuppressed && !don.acuteHold) {
    facts.push(`Blood: full donation ${fmtAgo(don.daysSince)} — aerobic work is suppressed (~${DONATION_SUPPRESSION.aerobicTailDays} d).`)
  }
  if (verdict.mode === 'steady') facts.unshift(STEADY_NOTE)
  return { text, sub: facts.join(' ') }
}

/** Home's answer in words: the verdict block and the seven qualities' line. */
export interface HomeWords {
  verdict: { text: string; sub: string }
  missing: string
}

export function homeWords(args: Parameters<typeof verdictCopy>[0] & {
  coverage: Record<Adaptation, AdaptationSummary>
}): HomeWords {
  return {
    verdict: verdictCopy(args),
    missing: args.zeroData ? 'All seven qualities — no data yet.' : coverageLine(args.coverage, MUSCLE_WINDOW_DAYS),
  }
}
