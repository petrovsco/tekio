// What Home prints (RFC 0096): every sentence, label and state on the screen,
// from the Home read. The web app draws it and the API serves it to the phone
// apps, so the verdict, the readiness card and the adaptations line read the
// same on every client. Colour stays with each client: the view names states
// (a ramp step, an accent edge), and the design system turns them into ink.
// Moved out of the web app's HomeTab, sentence for sentence.
import { coverageState } from './adaptations'
import {
  checkInTotal, type DonationStatus, type FusedVerdict, type Gauge, type MuscleState, type ReadinessBand, type SystemicReadiness,
} from './fusedRead'
import { RECOVER_DAYS, DONATION_SUPPRESSION, MUSCLE_WINDOW_DAYS } from './constants/reads'
import type { HomeRead, ReadRows } from './reads'
import type { BodyweightEntry } from './types'
import { daysBetween } from './utils'
import { coverageLine, coverageParts, fmtAgo, fmtSets, joinNames, MAPPED_MUSCLES, METHOD_LABEL, muscleShort, rampStep } from './words'

/** One column of the readiness card. */
export interface GateColumn {
  label: string
  value: string
  /** How the bar reads: an amount out of 100 as a fill (the sleep score), or
   *  a reading as a dot on the person's own normal. */
  bar: 'fill' | 'gauge'
  /** The fill's amount, out of 100. */
  pct?: number
  /** The gauge's reading; null keeps the empty track until there is one. */
  gauge?: Gauge | null
  /** The fill's tone; a held day inverts each one. */
  tone: 'ink' | 'mid' | 'accent' | 'off'
  /** A typed reading still to give today: the value reads as a prompt. */
  ask?: boolean
  /** One line under the bar: the normal it is read against, or how far that
   *  normal still has to build. */
  note?: string
}

/** A ranked gap pointed at on the body map. */
export interface MapCallout {
  muscle: string
  /** 1–4, or null for the lighter unnumbered fifth. */
  rank: number | null
  /** "1 · QUADS". */
  label: string
  /** "3 sets / 5 d", or "never trained". */
  sub: string
}

/** A whole-body quality's square: a ramp step, or white (null). */
export interface QualityTile {
  key: 'vo2max' | 'anaerobic_capacity' | 'endurance'
  name: string
  note: string
  /** 0–3 on the stimulus ramp; null = white. */
  step: 0 | 1 | 2 | 3 | null
  /** The edge: none yet (no data), the accent (untouched), the ramp's light
   *  edge, or ink at the top band. */
  edge: 'blank' | 'accent' | 'ramp' | 'ink'
}

/** A fold stat under the map: weight or blood. */
export interface FoldTile {
  kind: 'weight' | 'blood'
  label: string
  value: string
  note: string
  accent: boolean
}

export interface HomeView {
  date: string
  /** Nothing logged yet: the map sits at no-data and the line says so. */
  zeroData: boolean
  /** "readiness", or "no readiness data", beside TODAY. */
  readinessLabel: string
  /** The verdict in the serif, and the facts under it. */
  verdict: { text: string; sub: string }
  readiness: {
    /** Held: the card inverts to ink. */
    gated: boolean
    /** The method's label beside the title, when it is not overnight HRV. */
    method: string | null
    /** LOW, MODERATE, OK, or —. */
    band: string
    columns: GateColumn[]
    /** One note line, only on the days a note fires. */
    note: string | null
    /** Under the card, on a check-in day. */
    hint: string | null
  }
  /** The held day's banner. */
  banner: string | null
  map: {
    muscles: MuscleState[]
    callouts: MapCallout[]
  }
  /** The seven qualities by name: the untouched half (in the accent), the
   *  short half, or the one line when neither applies. */
  qualities: { untouched: string | null; short: string | null; line: string | null }
  wholeBody: QualityTile[]
  folds: FoldTile[]
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

const shortLower = (name: string): string => muscleShort(name).toLowerCase()

/** The readiness card's band, beside its number (0085). */
const BAND_LABEL: Record<ReadinessBand, string> = { low: 'LOW', moderate: 'MODERATE', ok: 'OK' }

/** What a moderate band changes: the effort, not the gaps. Partially supported:
 * in both trialled three-tier rules the middle tier was the planned session,
 * lighter, never rest — reps and load cut (DeBlauw 2021), or volume cut and the
 * intervals dropped (Nuuttila 2022). No percentage: each trial's 25% was its
 * chosen step, not a tested dose.
 * See tekio.rfcs/rfcs/done/0085-push-gate-own-baseline.md#grounding */
const STEADY_NOTE = 'Lighter today: no intervals or max efforts.'

/** The gated instruction plus the top gap as its reason. */
function verdictCopy(args: {
  zeroData: boolean
  verdict: FusedVerdict
  sys: SystemicReadiness
  don: DonationStatus
  gaps: MuscleState[]
  recoveringShorts: string[]
  minDaysSince: number | null
}): { text: string; sub: string } {
  const { zeroData, verdict, sys, don, gaps, recoveringShorts, minDaysSince } = args

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

/** Ranked gaps → the callouts the map points at: top 4 numbered, a 5th shown
 *  lighter and unnumbered when it is still clearly under-trained. Where each
 *  one sits is the client's geometry. */
export function mapCallouts(gaps: MuscleState[], unit = 'sets'): MapCallout[] {
  const mapped = gaps.filter(m => MAPPED_MUSCLES.includes(m.name))
  const picked = mapped.slice(0, 4).map((m, i) => ({ m, rank: i + 1 as number | null }))
  const fifth = mapped[4]
  if (fifth && fifth.fillFraction < 0.35) picked.push({ m: fifth, rank: null })
  return picked.map(({ m, rank }) => ({
    muscle: m.name,
    rank,
    label: rank === null ? muscleShort(m.name) : `${rank} · ${muscleShort(m.name)}`,
    sub: m.daysSince === null ? 'never trained' : `${fmtSets(m.sets)} ${unit} / ${m.daysSince} d`,
  }))
}

/**
 * Everything Home prints for the read's day, from the read and the rows it
 * came from. `lastNight` is the wake date the person's own clock calls last
 * night (it turns over at 04:00, `lastNightDate`), which a server cannot know;
 * `bodyweight` is the latest weigh-in, or null.
 */
export function homeView(read: HomeRead, rows: ReadRows, lastNight: string, bodyweight: BodyweightEntry | null): HomeView {
  const { date, muscles: states, gaps, qualities, readiness: sys, donation: don, coverage, verdict } = read
  const gated = verdict.mode === 'hold'
  const zeroData = rows.weights.length === 0 && rows.cardio.length === 0 && rows.sports.length === 0

  const recoveringShorts = states.filter(s => s.leaf && s.recovering).map(s => shortLower(s.name))
  const minDaysSince = states.reduce<number | null>(
    (min, s) => (s.daysSince !== null && (min === null || s.daysSince < min) ? s.daysSince : min),
    null,
  )

  // The card's two columns follow the method the verdict reads from (0092).
  // A typed method still waiting for today's answer asks for it, in the
  // accent: action lives there (design-system §1).
  // The score keeps one day of grace for a late sync, so say when it is the
  // night before's: a sync that ran before Garmin had last night is not news.
  const sleepCol: GateColumn = sys.sleepScore != null
    ? { label: 'SLEEP', bar: 'fill', value: String(sys.sleepScore), pct: sys.sleepScore, tone: 'ink', note: (sys.sleepScoreDate ?? '') < lastNight ? 'last night not in yet' : undefined }
    : { label: 'SLEEP', bar: 'fill', value: '—', pct: 0, tone: 'off' }
  // Today's typed answer for the method being read, shown even before the
  // baseline can turn it into a band.
  const typedToday = rows.readinessInputs.find(e => e.date === date)
  const colMethod = sys.method ?? sys.chosen
  // The reading prints what the verdict reads, placed on the person's own
  // normal: the 7-night mean for HRV (one night is too noisy to act on), the
  // day's total for the check-in. Each method against its own normal (0092).
  const building = sys.progress && sys.progress.have > 0 && sys.progress.have < sys.progress.need
    ? `building your ${colMethod === 'check_in' ? 'usual' : 'normal'} · ${sys.progress.have} of ${sys.progress.need}`
    : undefined
  const readingCol: GateColumn =
    sys.awaitingInput
      ? { label: sys.chosen === 'check_in' ? 'CHECK-IN' : 'MORNING HRV', bar: 'gauge', value: sys.chosen === 'check_in' ? 'Answer ›' : 'Type it ›', gauge: null, tone: 'off', ask: true }
      : sys.method && sys.gauge && sys.recent != null && sys.normal
        ? sys.method === 'check_in'
          ? { label: 'CHECK-IN', bar: 'gauge', value: `${sys.recent} of 25`, gauge: sys.gauge, tone: 'ink', note: `your usual ${sys.normal.low}–${sys.normal.high}` }
          : {
              label: sys.method === 'morning_hrv' ? 'MORNING HRV · 7 DAYS' : 'HRV · 7 NIGHTS', bar: 'gauge',
              value: `${sys.recent} ms`, gauge: sys.gauge, tone: 'ink',
              note: `your normal ${sys.normal.low}–${sys.normal.high} ms`,
            }
        : colMethod === 'check_in'
          ? { label: 'CHECK-IN', bar: 'gauge', value: typedToday?.checkIn ? `${checkInTotal(typedToday.checkIn)} of 25` : '—', gauge: null, tone: 'off', note: building }
          : colMethod === 'morning_hrv'
            ? { label: 'MORNING HRV', bar: 'gauge', value: typedToday?.morningHrv != null ? `${typedToday.morningHrv} ms` : '—', gauge: null, tone: 'off', note: building }
            : sys.hrv != null
              ? { label: sys.hrvDate != null && sys.hrvDate >= lastNight ? 'HRV · LAST NIGHT' : 'HRV · NIGHT BEFORE', bar: 'gauge', value: `${sys.hrv} ms`, gauge: null, tone: 'off', note: building }
              : { label: 'HRV', bar: 'gauge', value: '—', gauge: null, tone: 'off' }
  const columns = colMethod === 'overnight_hrv' || colMethod === null
    ? [sleepCol, readingCol]
    : [readingCol, sleepCol]
  // One note line inside the card, only on the days a note fires; it never
  // moves the band (0092).
  const notes = [
    sys.notes.restingHrAbove !== null ? `Resting HR +${sys.notes.restingHrAbove} bpm` : null,
    sys.notes.shortNight !== null ? `short night, ${sys.notes.shortNight.toFixed(1)} h` : null,
  ].filter(Boolean).join(' · ')

  const banner = gated
    ? verdict.cause === 'donation'
      ? `Full blood donation ${fmtAgo(don.daysSince)} — the 48 h acute window holds today. The gaps below stay open.`
      : `${sys.method === 'check_in' ? "Today's check-in is well under your usual" : sys.method === 'morning_hrv' ? 'Morning HRV is well under your own normal this week' : 'HRV is well under your own normal this week'}. The gaps below stay open — today just isn't the day to close them.`
    : null

  // The square reads coverage, the note reads recency (roadmap 063): the fill
  // comes from the same `coverage` call the line makes — sessions ÷ the
  // window's target, on the map's ramp — so the two cannot disagree. The word
  // comes from `coverageState`, so the ink band means exactly what the line
  // means by "on target": a muscle reaches that at GAP_CUTOFF, a cardio quality
  // only at its whole session target.
  const wholeBody = ([
    { key: 'vo2max', name: 'VO₂MAX' },
    { key: 'anaerobic_capacity', name: 'ANAEROBIC' },
    { key: 'endurance', name: 'ENDURANCE' },
  ] as const).map((meta): QualityTile => {
    const q = qualities.find(s => s.key === meta.key)
    if (zeroData || !q) return { ...meta, note: '—', step: null, edge: 'blank' }
    const c = coverage[meta.key]
    const note = fmtAgo(q.daysSince)
    const state = coverageState(c)
    if (state === 'untouched') return { ...meta, note, step: null, edge: 'accent' }
    const step = state === 'on_target'
      ? 3
      : Math.min(rampStep(c.target > 0 ? c.volume / c.target : 1), 2) as 0 | 1 | 2
    return { ...meta, note, step, edge: step === 3 ? 'ink' : 'ramp' }
  })

  // The two folds as stat tiles: bodyweight and blood donation, never a
  // destination (P3). Blood sits here rather than on the readiness card: it is
  // logged a few times a year, sleep and HRV every day.
  const bwDays = bodyweight ? daysBetween(bodyweight.date, date) : null
  const folds: FoldTile[] = [
    bodyweight
      ? { kind: 'weight', label: 'WEIGHT', value: `${bodyweight.weight.toFixed(1)} kg`, note: bwDays === 0 ? 'today' : bwDays === 1 ? 'yesterday' : `${bwDays} d ago`, accent: false }
      : { kind: 'weight', label: 'WEIGHT', value: '—', note: 'tap to log', accent: false },
    don.acuteHold
      ? { kind: 'blood', label: 'BLOOD', value: don.daysSince === 0 ? 'today' : `${don.daysSince} d`, note: '48 h hold', accent: true }
      : don.aerobicSuppressed
        ? { kind: 'blood', label: 'BLOOD', value: `${don.daysSince} d`, note: 'aerobic tail', accent: true }
        : don.daysSince !== null
          ? { kind: 'blood', label: 'BLOOD', value: `${don.daysSince} d`, note: don.eligibleInDays > 0 ? `eligible in ${don.eligibleInDays} d` : 'eligible', accent: false }
          : { kind: 'blood', label: 'BLOOD', value: '—', note: 'tap to log', accent: false },
  ]

  const missing = coverageParts(coverage)
  return {
    date,
    zeroData,
    readinessLabel: sys.readiness === null ? 'no readiness data' : 'readiness',
    verdict: verdictCopy({ zeroData, verdict, sys, don, gaps, recoveringShorts, minDaysSince }),
    readiness: {
      gated,
      method: sys.method && sys.method !== 'overnight_hrv' ? METHOD_LABEL[sys.method].toUpperCase() : null,
      band: sys.band ? BAND_LABEL[sys.band] : '—',
      columns,
      note: notes ? `${notes}. A note; the verdict is unchanged.` : null,
      hint: sys.method === 'check_in'
        ? 'Less certain than HRV. A 1-minute morning HRV reading would read your body directly.'
        : null,
    },
    banner,
    map: { muscles: states, callouts: zeroData ? [] : mapCallouts(gaps) },
    qualities: zeroData
      ? { untouched: null, short: null, line: 'All seven qualities — no data yet.' }
      : missing.untouched || missing.short
        ? { ...missing, line: null }
        : { untouched: null, short: null, line: coverageLine(coverage, MUSCLE_WINDOW_DAYS) },
    wholeBody,
    folds,
  }
}
