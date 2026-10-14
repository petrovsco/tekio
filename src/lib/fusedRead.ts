import type {
  Adaptation, WeightEntry, CardioEntry, SportEntry, DonationEntry,
  SleepEntry, ExerciseMuscleLink, MuscleGroup, LiftSet, ReadinessInput, CheckInAnswers,
} from '../types'
import {
  RECOVER_DAYS, RECOVER_MIN_SETS, HRV_BAND_Z, CHECK_IN_BAND, RESTING_HR_NOTE, SHORT_NIGHT_HOURS,
  QUALITY_STALENESS_DAYS, MUSCLE_WINDOW_DAYS,
  MUSCLE_SET_TARGET, DONATION_SUPPRESSION, DONATION_ELIGIBILITY_DAYS,
} from '../constants/app'
import { LEVEL_WEIGHT, today, daysBetween, groupBy } from './utils'
import {
  classifyCardioAdaptations, classifySportAdaptations,
  classifyWeightSet, resolveExerciseAdaptation, muscleStimulus, perMuscleVolume,
  MUSCLE_QUALITIES, type MuscleQuality, type TargetShape, type TargetUnit,
} from './adaptations'

export { MUSCLE_QUALITIES }
export type { MuscleQuality }

// The pure functions behind the fused Home read (roadmap 010/018): per-muscle
// state, whole-body quality state, systemic readiness, and the Push/Hold
// verdict. Everything takes plain arrays + an explicit date, so it is
// unit-testable without the store.

/** Weekly bars the muscle sheet draws: history, not a claim. The fill itself
 *  is judged over MUSCLE_WINDOW_DAYS (roadmap 039 §6.6). */
export const HISTORY_WEEKS = 6

/** YYYY-MM-DD `n` days after `date` (negative = before). */
function shiftDate(date: string, n: number): string {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** The inclusive muscle window ending on `date`: the last MUSCLE_WINDOW_DAYS days (039 S12). */
export const muscleWindow = (date: string) => ({ from: shiftDate(date, 1 - MUSCLE_WINDOW_DAYS), to: date })

const avg = (vals: number[]): number => vals.reduce((s, v) => s + v, 0) / vals.length

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

// ── Local: per-muscle state ─────────────────────────────────────────────────

export interface MuscleState {
  id: string
  name: string
  parentId: string | null
  /** No other group names this one as parent (Chest is top-level AND a leaf). */
  leaf: boolean
  /** Fractional (level-weighted) hard sets within the last MUSCLE_WINDOW_DAYS; power
   *  sets count on the power map only (039 S3). */
  sets: number
  /** Days since the last stimulus over all history; null = never trained. */
  daysSince: number | null
  /** Inside the post-session recovery window right now: a day within
   *  RECOVER_DAYS gave this muscle at least RECOVER_MIN_SETS weighted sets. */
  recovering: boolean
  /** sets ÷ the window target (MUSCLE_SET_TARGET on Home; the quality's weekly
   *  rate × window / 7 on the drill-down), uncapped — drives the map's ramp. */
  fillFraction: number
}

/**
 * Per-muscle fused state: level-weighted set volume over the last
 * {@link MUSCLE_WINDOW_DAYS} days plus recency. Volume comes from
 * {@link muscleStimulus} — one accounting with the Adaptations tab (roadmap
 * 039 §6), each hard set counted once and power sets left out (039 S3).
 * Values are *direct* per group; parents are not rolled up here.
 */
export function muscleStates(
  weights: WeightEntry[],
  exerciseMuscles: ExerciseMuscleLink[],
  muscleGroups: MuscleGroup[],
  date: string = today(),
): MuscleState[] {
  const { total } = muscleStimulus(weights, exerciseMuscles, muscleWindow(date))
  const last = lastStimulusDates(weights, exerciseMuscles, date)
  const dosed = lastDosedDates(weights, exerciseMuscles, date)
  return buildMuscleStates(muscleGroups, total, last, dosed, MUSCLE_SET_TARGET, date)
}

/**
 * Per-muscle state for one muscle-linked quality — the Adaptations drill-down's
 * map (roadmap 031 §7). Same window and accounting as {@link muscleStates}, but
 * `sets` counts only the sets whose rep band (or override) puts them in
 * `quality`, and `daysSince` is the last date such a set fed the muscle. A
 * 10-rep set therefore shows on the hypertrophy map and not the strength map,
 * and a power set shows on the power map only (039 S3). `recovering` stays
 * muscle-level — a muscle recovers from the day's dose, not from a quality.
 * `shape` is the quality's weekly target ({@link targetShape}); its rate is
 * scaled to the window here exactly as MUSCLE_SET_TARGET is (/ground
 * exemption 2 — a shape change), and its unit picks what `sets` counts: power
 * reads sessions per muscle, the other three weighted sets (roadmap 0012).
 */
/**
 * A weekly per-muscle set rate scaled to the muscle window — the same
 * construction MUSCLE_SET_TARGET uses (roadmap 039 §6.6). One scaler, so the
 * Adaptations map and Home's muscle sheet cannot draw the same muscle against
 * two different targets (roadmap 063's rule, applied by 064).
 * `/ground` exemption 2: a shape change, no new claim.
 */
export const windowMuscleTarget = (weeklyRate: number): number =>
  weeklyRate * MUSCLE_WINDOW_DAYS / 7

export function muscleQualityStates(
  weights: WeightEntry[],
  exerciseMuscles: ExerciseMuscleLink[],
  muscleGroups: MuscleGroup[],
  quality: MuscleQuality,
  shape: TargetShape,
  overrides?: Record<string, Adaptation>,
  date: string = today(),
): MuscleState[] {
  const stimulus = muscleStimulus(weights, exerciseMuscles, muscleWindow(date), overrides)
  const feedsQuality = (w: WeightEntry) => {
    const override = resolveExerciseAdaptation(w.exercise, overrides)
    return w.sets.some(s => classifyWeightSet(s, override).includes(quality))
  }
  const dosed = lastDosedDates(weights, exerciseMuscles, date)
  const lastOfQuality = lastStimulusDates(weights, exerciseMuscles, date, feedsQuality)
  const target = windowMuscleTarget(shape.weekly)
  return buildMuscleStates(muscleGroups, perMuscleVolume(stimulus, quality, shape.unit), lastOfQuality, dosed, target, date)
}

/**
 * Latest date on or before `date` that a logged entry fed each muscle group, over
 * all history — a muscle idle for months still has a last date. `keep` narrows
 * which entries count (e.g. those with a set in one quality). A zero-weight link
 * (level 3, roadmap 042) is no stimulus, so it sets no last date either;
 * otherwise a muscle reads "2 d ago" beside 0 sets.
 */
function lastStimulusDates(
  weights: WeightEntry[],
  exerciseMuscles: ExerciseMuscleLink[],
  date: string,
  keep: (w: WeightEntry) => boolean = () => true,
): Record<string, string> {
  const groupsByExercise = groupBy(
    exerciseMuscles.filter(l => l.contribution === 'stimulus' && (LEVEL_WEIGHT[l.level] ?? 0) > 0),
    l => l.exercise.toLowerCase(),
    l => l.group,
  )
  const lastDate: Record<string, string> = {}
  for (const w of weights) {
    if (w.date > date || !keep(w)) continue
    for (const g of groupsByExercise.get(w.exercise.toLowerCase()) ?? []) {
      if (!lastDate[g] || w.date > lastDate[g]) lastDate[g] = w.date
    }
  }
  return lastDate
}

/**
 * Latest date within the last RECOVER_DAYS on which a muscle got at least
 * RECOVER_MIN_SETS level-weighted sets, summed over the day's entries (RFC
 * 0108). Every set counts, whatever its quality — a muscle recovers from the
 * work, not from a rep band — and a zero-weight link adds nothing.
 */
function lastDosedDates(
  weights: WeightEntry[],
  exerciseMuscles: ExerciseMuscleLink[],
  date: string,
): Record<string, string> {
  const from = shiftDate(date, 1 - RECOVER_DAYS)
  const linksByExercise = groupBy(
    exerciseMuscles.filter(l => l.contribution === 'stimulus' && (LEVEL_WEIGHT[l.level] ?? 0) > 0),
    l => l.exercise.toLowerCase(),
  )
  const perDay = new Map<string, number>() // `${group}|${date}` → weighted sets
  for (const w of weights) {
    if (w.date > date || w.date < from) continue
    for (const l of linksByExercise.get(w.exercise.toLowerCase()) ?? []) {
      const key = `${l.group}|${w.date}`
      perDay.set(key, (perDay.get(key) ?? 0) + w.sets.length * LEVEL_WEIGHT[l.level])
    }
  }
  const dosed: Record<string, string> = {}
  for (const [key, sets] of perDay) {
    if (sets < RECOVER_MIN_SETS) continue
    const [group, day] = key.split('|')
    if (!dosed[group] || day > dosed[group]) dosed[group] = day
  }
  return dosed
}

/** Shape per-group volume + recency into {@link MuscleState}s; `dosed` drives
 *  `recovering`, `lastDate` drives `daysSince` (the two differ per quality). */
function buildMuscleStates(
  muscleGroups: MuscleGroup[],
  sets: Record<string, number>,
  lastDate: Record<string, string>,
  dosed: Record<string, string>,
  target: number,
  date: string,
): MuscleState[] {
  const parentIds = new Set(muscleGroups.map(g => g.parentId).filter(Boolean))
  return muscleGroups.map(g => {
    const s = sets[g.name] ?? 0
    const last = lastDate[g.name]
    const hit = dosed[g.name]
    const sinceDose = hit ? daysBetween(hit, date) : null
    return {
      id: g.id,
      name: g.name,
      parentId: g.parentId ?? null,
      leaf: !parentIds.has(g.id),
      sets: s,
      daysSince: last ? daysBetween(last, date) : null,
      recovering: sinceDose !== null && sinceDose < RECOVER_DAYS,
      fillFraction: target > 0 ? +(s / target).toFixed(3) : 0,
    }
  })
}

/**
 * Leaf muscles ranked worst-first for the map callouts: never trained, then
 * fewest sets, then longest since stimulated. Ranking is mechanical; the
 * callout label text is editorial and lives with the surface.
 */
export function rankMuscleGaps(states: MuscleState[]): MuscleState[] {
  return states
    .filter(m => m.leaf)
    .slice()
    .sort((a, b) => {
      if ((a.daysSince === null) !== (b.daysSince === null)) return a.daysSince === null ? -1 : 1
      if (a.sets !== b.sets) return a.sets - b.sets
      return (b.daysSince ?? 0) - (a.daysSince ?? 0) || a.name.localeCompare(b.name)
    })
}

// ── Whole-body qualities ────────────────────────────────────────────────────

export type WholeBodyQuality = keyof typeof QUALITY_STALENESS_DAYS

export interface QualityState {
  key: WholeBodyQuality
  /** Days since the last qualifying session over all history; null = never. */
  daysSince: number | null
  windowDays: number
  /** Past the detraining window (or never trained) — reads as missing. */
  stale: boolean
}

/**
 * One state per whole-body quality (vo2max / endurance / anaerobic_capacity),
 * judged against its grounded staleness window. A session credits what its
 * Garmin data says it trained; a manual cardio row falls to the typed-HR path
 * against `hrMax` (roadmap 059) and then to the duration floor; a hand-logged
 * match is endurance by convention (roadmap 005).
 */
export function qualityStates(
  cardio: CardioEntry[],
  sports: SportEntry[],
  date: string = today(),
  hrMax?: number | null,
): QualityState[] {
  const last: Partial<Record<string, string>> = {}
  const feed = (q: string, d: string) => {
    if (!(q in QUALITY_STALENESS_DAYS)) return
    const cur = last[q]
    if (!cur || d > cur) last[q] = d
  }
  for (const c of cardio) {
    if (c.date > date) continue
    for (const a of classifyCardioAdaptations(c, hrMax)) feed(a, c.date)
  }
  for (const s of sports) {
    if (s.date > date) continue
    for (const a of classifySportAdaptations(s)) feed(a, s.date)
  }
  return (Object.keys(QUALITY_STALENESS_DAYS) as WholeBodyQuality[]).map(key => {
    const windowDays = QUALITY_STALENESS_DAYS[key]
    const d = last[key]
    const daysSince = d ? daysBetween(d, date) : null
    return { key, daysSince, windowDays, stale: daysSince === null || daysSince > windowDays }
  })
}

// ── Local: one muscle's drill-in (T2) ───────────────────────────────────────

/** Total stimulus level-weight linking each exercise (lowercased) to `muscle`. */
function stimulusWeightsFor(
  exerciseMuscles: ExerciseMuscleLink[],
  muscle: string,
): Map<string, number> {
  const target = muscle.toLowerCase()
  const map = new Map<string, number>()
  for (const l of exerciseMuscles) {
    if (l.contribution !== 'stimulus' || l.group.toLowerCase() !== target) continue
    const lw = LEVEL_WEIGHT[l.level] ?? 0
    if (!lw) continue // zero-weight tier never lists as a source (roadmap 042)
    const k = l.exercise.toLowerCase()
    map.set(k, (map.get(k) ?? 0) + lw)
  }
  return map
}

/**
 * Level-weighted sets attributed to one muscle per week of the last
 * {@link HISTORY_WEEKS} weeks, oldest week first — the last index is the last
 * 7 days. History for the sheet's bars; the fill's window is shorter.
 */
export function muscleWeeklySets(
  weights: WeightEntry[],
  exerciseMuscles: ExerciseMuscleLink[],
  muscle: string,
  date: string = today(),
): number[] {
  const linkWeight = stimulusWeightsFor(exerciseMuscles, muscle)
  const weeks: number[] = new Array(HISTORY_WEEKS).fill(0)
  for (const w of weights) {
    if (w.date > date) continue
    const daysAgo = daysBetween(w.date, date)
    if (daysAgo >= HISTORY_WEEKS * 7) continue
    const lw = linkWeight.get(w.exercise.toLowerCase())
    if (!lw) continue
    weeks[HISTORY_WEEKS - 1 - Math.floor(daysAgo / 7)] += w.sets.length * lw
  }
  return weeks.map(n => +n.toFixed(2))
}

export interface MuscleSource {
  /** Exercise name as most recently logged. */
  exercise: string
  /** Level-weighted sets this exercise gave the muscle within the window. */
  windowSets: number
  /** Most recent logged date over all history. */
  lastDate: string
  /** That entry's sets — the scheme "repeat last" prefills. */
  lastSets: LiftSet[]
}

/**
 * Every logged exercise that feeds `muscle`, most recent first: the drill-in's
 * "what fed it" list and the repeat-last-scheme ranking of its log flow. All
 * history is scanned (a muscle idle for months still has a scheme to repeat);
 * `windowSets` counts the last MUSCLE_WINDOW_DAYS only.
 */
export function muscleSources(
  weights: WeightEntry[],
  exerciseMuscles: ExerciseMuscleLink[],
  muscle: string,
  date: string = today(),
): MuscleSource[] {
  const linkWeight = stimulusWeightsFor(exerciseMuscles, muscle)
  const byExercise = new Map<string, MuscleSource>()
  for (const w of weights) {
    if (w.date > date) continue
    const key = w.exercise.toLowerCase()
    const lw = linkWeight.get(key)
    if (!lw) continue
    const windowSets = daysBetween(w.date, date) < MUSCLE_WINDOW_DAYS ? w.sets.length * lw : 0
    const cur = byExercise.get(key)
    if (!cur) {
      byExercise.set(key, { exercise: w.exercise, windowSets, lastDate: w.date, lastSets: w.sets })
    } else {
      cur.windowSets += windowSets
      if (w.date >= cur.lastDate) {
        cur.exercise = w.exercise
        cur.lastDate = w.date
        cur.lastSets = w.sets
      }
    }
  }
  return [...byExercise.values()]
    .map(s => ({ ...s, windowSets: +s.windowSets.toFixed(2) }))
    .sort((a, b) =>
      b.lastDate.localeCompare(a.lastDate)
      || b.windowSets - a.windowSets
      || a.exercise.localeCompare(b.exercise))
}

/**
 * One muscle's quality mix over the muscle window: level-weighted volume per
 * muscle-linked quality from {@link muscleStimulus}, each in its target's unit
 * (`units`; sets when omitted). A set counts toward every quality whose rep
 * band covers it, so the four can add up to more than the muscle's windowed
 * total (roadmap 039 §6.0).
 */
export function muscleQualityMix(
  weights: WeightEntry[],
  exerciseMuscles: ExerciseMuscleLink[],
  muscle: string,
  overrides?: Record<string, Adaptation>,
  date: string = today(),
  units?: Partial<Record<MuscleQuality, TargetUnit>>,
): Record<MuscleQuality, number> {
  const stimulus = muscleStimulus(weights, exerciseMuscles, muscleWindow(date), overrides)
  return Object.fromEntries(
    MUSCLE_QUALITIES.map(q => [q, perMuscleVolume(stimulus, q, units?.[q] ?? 'sets')[muscle] ?? 0]),
  ) as Record<MuscleQuality, number>
}

// ── Systemic: readiness + verdict ───────────────────────────────────────────

/** Systemic readiness in three bands: low holds, moderate steadies, ok pushes. */
export type ReadinessBand = 'low' | 'moderate' | 'ok'

/** How a readiness band was measured, best first: one calculator per method
 * (0085), the ladder RFC 0092 lets a person choose from in Profile. */
export const READINESS_METHODS = ['overnight_hrv', 'morning_hrv', 'check_in'] as const
export type ReadinessMethod = typeof READINESS_METHODS[number]

/** Which side of the person's normal a reading falls on. Under it the band
 * drops (moderate or low); inside it or above it reads ok. */
export type NormalSide = 'below' | 'inside' | 'above'

/** The readiness gauge's track, on Home's card and in the readiness sheet: the
 * normal fills its middle 40 %, so a reading can sit visibly under or over it,
 * and anything further out is pinned to the ends. One geometry for every
 * method. */
export const GAUGE_NORMAL = { from: 0.3, to: 0.7 } as const

/** Where a reading sits against the person's normal, for the gauge. */
export interface Gauge {
  side: NormalSide
  /** The dot's place along the track, 0–1. */
  at: number
}

/** What every readiness calculator returns, whatever it measured: the band,
 * plus a 0–100 score (50 = the person's own normal). */
export interface ReadinessReading {
  method: ReadinessMethod
  band: ReadinessBand
  score: number
  /** Distance from the person's own baseline, in their own SD units. */
  z: number
  /** The recent value and the person's normal range, in the method's own
   * unit (ms for HRV, points of 25 for the check-in): what the screen prints
   * instead of z, as whole numbers that agree with the band
   * ({@link wholeNumbers}). Below the range reads moderate or low; inside it
   * or above it, ok. */
  recent: number
  normal: { low: number; high: number }
  gauge: Gauge
}

/** The band a baseline distance falls in (HRV_BAND_Z: the trialled tiers). */
export function bandForZ(z: number): ReadinessBand {
  if (z < HRV_BAND_Z.low) return 'low'
  if (z < HRV_BAND_Z.moderate) return 'moderate'
  return 'ok'
}

/** The dot's place on the gauge, from unrounded values in one linear unit (ln
 * ms for HRV, points for the check-in). It keeps to its own side of the
 * band's edge, so a reading a hair under the normal never draws inside it. */
function gaugeAt(x: number, low: number, high: number, side: NormalSide): number {
  const at = GAUGE_NORMAL.from + (GAUGE_NORMAL.to - GAUGE_NORMAL.from) * (x - low) / (high - low)
  const gap = 0.02
  if (side === 'below') return clamp(Math.min(at, GAUGE_NORMAL.from - gap), 0, 1)
  if (side === 'above') return clamp(Math.max(at, GAUGE_NORMAL.to + gap), 0, 1)
  return clamp(at, GAUGE_NORMAL.from, GAUGE_NORMAL.to)
}

/** The numbers the screen prints, agreeing with the band: the normal is the
 * whole values that read inside it, and the recent value is rounded to the
 * nearest whole value on its own side of the edge. Rounding each to the
 * nearest whole value printed "62 ms · your normal 62–71 ms" for a week that
 * read under it (invented figures: 61.6 ms against an edge at 62.07). `low`
 * and `high` are the normal's exact edges in the printed unit; `inside` is the
 * band's own test for a whole value. */
export function wholeNumbers(
  recent: number, low: number, high: number, side: NormalSide, inside: (v: number) => boolean,
): { recent: number; normal: { low: number; high: number } } {
  const normal = wholeRange(low, high, inside)
  const r = Math.round(recent)
  return {
    recent: side === 'below' ? Math.min(r, normal.low - 1)
      : side === 'above' ? Math.max(r, normal.high + 1)
        : clamp(r, normal.low, normal.high),
    normal,
  }
}

/** The whole values inside a normal whose exact edges are `low` and `high`.
 * A normal narrower than one unit holds none: its middle is printed instead. */
function wholeRange(low: number, high: number, inside: (v: number) => boolean): { low: number; high: number } {
  const whole: number[] = []
  for (let v = Math.floor(low); v <= Math.ceil(high); v++) if (inside(v)) whole.push(v)
  const mid = Math.round((low + high) / 2)
  return whole.length > 0 ? { low: whole[0], high: whole[whole.length - 1] } : { low: mid, high: mid }
}

/** Baseline-relative HRV (the grounded method — Vesterinen 2016, Buchheit
 * 2014, DeBlauw 2021): the 7-day rolling mean of ln HRV is placed against the
 * 60 days before that week, in SD units. Log, because every trial read
 * LnRMSSD; the current week stays out of the baseline so a bad week does not
 * lower its own bar; 14 baseline readings before any verdict. Single bad
 * readings barely move it — the literature calls them too noisy to act on.
 * The 0–100 score is 50 + 50 × z, clamped: 50 = at baseline, 0 = a rolling
 * mean 1 SD or more below. The same math reads overnight and morning HRV, each
 * on its own readings: the two routes are different numbers and never mix
 * (0092). See tekio.rfcs/rfcs/done/0085-push-gate-own-baseline.md#grounding */
const HRV_ROLLING_DAYS = 7
export const HRV_BASELINE_DAYS = 60
const MIN_HRV_BASELINE_NIGHTS = 14
/** SD floor in ln units (≈ 5 % of the raw value) — guards a near-zero SD on a
 * very flat history. */
const HRV_LN_SD_FLOOR = 0.05

/** How many readings a method has in its baseline window today, and how many
 * it needs before a verdict — what "building your baseline" prints. */
interface BaselineProgress { have: number; need: number }

interface Dated { date: string; value: number }

function hrvBaseline(points: Dated[], date: string): number[] {
  return points
    .filter(p => {
      const d = daysBetween(p.date, date)
      return d >= HRV_ROLLING_DAYS && d < HRV_ROLLING_DAYS + HRV_BASELINE_DAYS
    })
    .map(p => Math.log(p.value))
}

/** An ln-HRV baseline's mean and SD (floored), and the normal's exact edges in
 * ln ms: the moderate line either side of the mean. Shared by the reading and
 * the sheet's history, so the two cannot draw different normals. */
function hrvNormal(baseline: number[]) {
  const mean = avg(baseline)
  const sd = Math.max(Math.sqrt(avg(baseline.map(v => (v - mean) ** 2))), HRV_LN_SD_FLOOR)
  return { mean, sd, low: mean + HRV_BAND_Z.moderate * sd, high: mean - HRV_BAND_Z.moderate * sd }
}

/** Whether a whole number of ms reads inside the normal. */
const hrvInside = (n: { low: number; high: number }) => (v: number): boolean =>
  v > 0 && Math.log(v) >= n.low && Math.log(v) <= n.high

/** One HRV route's reading: null without a fresh reading (within `freshDays`)
 * or without 14 baseline readings. */
function hrvReading(points: Dated[], method: ReadinessMethod, freshDays: number, date: string): ReadinessReading | null {
  const xs = points.filter(p => p.value > 0 && p.date <= date)
  if (!xs.some(p => daysBetween(p.date, date) <= freshDays)) return null
  const rolling = xs.filter(p => daysBetween(p.date, date) < HRV_ROLLING_DAYS).map(p => Math.log(p.value))
  const baseline = hrvBaseline(xs, date)
  if (rolling.length === 0 || baseline.length < MIN_HRV_BASELINE_NIGHTS) return null
  const n = hrvNormal(baseline)
  const x = avg(rolling)
  const z = (x - n.mean) / n.sd
  const band = bandForZ(z)
  const side: NormalSide = band !== 'ok' ? 'below' : x > n.high ? 'above' : 'inside'
  return {
    method, band, score: clamp(Math.round(50 + 50 * z), 0, 100), z,
    ...wholeNumbers(Math.exp(x), Math.exp(n.low), Math.exp(n.high), side, hrvInside(n)),
    gauge: { side, at: gaugeAt(x, n.low, n.high, side) },
  }
}

const overnightPoints = (sleep: SleepEntry[]): Dated[] =>
  sleep.filter(e => e.hrv != null && e.hrv > 0).map(e => ({ date: e.date, value: e.hrv as number }))
const morningPoints = (inputs: ReadinessInput[]): Dated[] =>
  inputs.filter(e => e.morningHrv != null && e.morningHrv > 0).map(e => ({ date: e.date, value: e.morningHrv as number }))

/** The overnight HRV calculator: a reading, or null without last night's HRV
 * (one day of sync grace — log_date is the wake date) or without 14 baseline
 * nights. */
export function overnightHrvReading(sleep: SleepEntry[], date: string = today()): ReadinessReading | null {
  return hrvReading(overnightPoints(sleep), 'overnight_hrv', 1, date)
}

/** The typed morning HRV calculator (0092): the overnight math on its own
 * readings. Null until this morning's reading is typed, or before 14 baseline
 * readings. */
export function morningHrvReading(inputs: ReadinessInput[], date: string = today()): ReadinessReading | null {
  return hrvReading(morningPoints(inputs), 'morning_hrv', 0, date)
}

/** The check-in total, 5–25: higher is more ready (5 is the good end of every item). */
export const checkInTotal = (a: CheckInAnswers): number =>
  a.energy + a.soreness + a.sleepQuality + a.stress + a.mood

/** SD floor in points — one point of 25 — so a flat run of identical answers
 * still has a scale. */
const CHECK_IN_SD_FLOOR = 1

function checkInBaseline(inputs: ReadinessInput[], date: string): number[] {
  return inputs
    .filter(e => e.checkIn && e.date < date && daysBetween(e.date, date) <= CHECK_IN_BAND.baselineDays)
    .map(e => checkInTotal(e.checkIn as CheckInAnswers))
}

/** A check-in baseline's mean and SD (floored), and the normal's exact edges
 * in points. The edge under which a total reads moderate: both tests must
 * fail, so the wider of the two distances. */
function checkInNormal(baseline: number[]) {
  const mean = avg(baseline)
  const sd = Math.max(Math.sqrt(avg(baseline.map(v => (v - mean) ** 2))), CHECK_IN_SD_FLOOR)
  const edge = Math.max(-CHECK_IN_BAND.moderate.z * sd, CHECK_IN_BAND.moderate.points)
  return { mean, sd, low: mean - edge, high: mean + edge }
}

/** A total's band against its baseline: both the SD line and the point floor
 * must be crossed to drop a band. */
function checkInBand(total: number, { mean, sd }: { mean: number; sd: number }): ReadinessBand {
  const z = (total - mean) / sd
  const below = mean - total
  return z < CHECK_IN_BAND.low.z && below >= CHECK_IN_BAND.low.points ? 'low'
    : z < CHECK_IN_BAND.moderate.z && below >= CHECK_IN_BAND.moderate.points ? 'moderate'
      : 'ok'
}

/** Whether a total reads inside the usual: within the scale, not over its top
 * edge, and not low enough to drop the band. */
const checkInInside = (n: { mean: number; sd: number; high: number }) => (v: number): boolean =>
  v >= 5 && v <= 25 && v <= n.high && checkInBand(v, n) === 'ok'

/** The check-in calculator (0092): today's total against the person's own
 * usual total over the 28 days before it, in SD units with point floors
 * (CHECK_IN_BAND, convention). Null until today's check-in is answered, or
 * before 14 earlier check-ins. A total above the usual never lowers the band. */
export function checkInReading(inputs: ReadinessInput[], date: string = today()): ReadinessReading | null {
  const todays = inputs.find(e => e.date === date && e.checkIn)
  if (!todays?.checkIn) return null
  const baseline = checkInBaseline(inputs, date)
  if (baseline.length < CHECK_IN_BAND.minEntries) return null
  const n = checkInNormal(baseline)
  const total = checkInTotal(todays.checkIn)
  const z = (total - n.mean) / n.sd
  const band = checkInBand(total, n)
  const side: NormalSide = band !== 'ok' ? 'below' : total > n.high ? 'above' : 'inside'
  return {
    method: 'check_in', band, score: clamp(Math.round(50 + 50 * z), 0, 100), z,
    ...wholeNumbers(total, n.low, n.high, side, checkInInside(n)),
    gauge: { side, at: gaugeAt(total, n.low, n.high, side) },
  }
}

// ── The sheet's history: a method over the last months ──────────────────────

/** One day of a method's history, for the readiness sheet's chart. Values are
 * exact, in the method's own unit; null where there was nothing to read. */
export interface TrendDay {
  date: string
  /** That day's own reading: the night's or the morning's HRV, or the day's
   * check-in total. */
  single: number | null
  /** What the verdict read that day: the 7-day mean for HRV, geometric as the
   * reading takes it, and the day's own total for the check-in. */
  read: number | null
  /** The person's normal as it stood that day; null until its baseline had
   * enough readings. */
  low: number | null
  high: number | null
  /** The day as the screen prints it, in whole numbers that agree with that
   * day's band ({@link wholeNumbers}); null without a normal. */
  printed: { read: number | null; low: number; high: number } | null
}

/** A history day's printed numbers: the read on its own side of the normal. */
function printedDay(
  read: number | null, low: number, high: number, side: NormalSide | null, inside: (v: number) => boolean,
): NonNullable<TrendDay['printed']> {
  if (read === null || side === null) return { read: null, ...wholeRange(low, high, inside) }
  const w = wholeNumbers(read, low, high, side, inside)
  return { read: w.recent, ...w.normal }
}

/** How far back the readiness sheet's history reaches: about six months. */
export const TREND_DAYS = 182

const DAY_MS = 86_400_000
const dayIndex = (date: string): number => Math.round(Date.parse(date) / DAY_MS)
const dayDate = (index: number): string => new Date(index * DAY_MS).toISOString().slice(0, 10)

/**
 * A method's last `days` days, each with the value the verdict read and the
 * normal it was read against that day — the same math as the reading, run
 * day by day, so the chart's last day is today's reading. Starts at the first
 * day with anything to draw; empty without any readings.
 */
export function readinessTrend(
  method: ReadinessMethod,
  sleep: SleepEntry[],
  inputs: ReadinessInput[],
  date: string = today(),
  days: number = TREND_DAYS,
): TrendDay[] {
  const end = dayIndex(date)
  const byDay = new Map<number, number>()
  if (method === 'check_in') {
    for (const e of inputs) if (e.checkIn && e.date <= date) byDay.set(dayIndex(e.date), checkInTotal(e.checkIn))
  } else {
    const points = method === 'overnight_hrv' ? overnightPoints(sleep) : morningPoints(inputs)
    for (const p of points) if (p.date <= date) byDay.set(dayIndex(p.date), p.value)
  }
  const span = (from: number, to: number): number[] => {
    const xs: number[] = []
    for (let d = from; d <= to; d++) {
      const v = byDay.get(d)
      if (v != null) xs.push(v)
    }
    return xs
  }

  const out: TrendDay[] = []
  for (let d = end - days + 1; d <= end; d++) {
    const single = byDay.get(d) ?? null
    let read: number | null = null
    let low: number | null = null
    let high: number | null = null
    let printed: TrendDay['printed'] = null
    if (method === 'check_in') {
      read = single
      const base = span(d - CHECK_IN_BAND.baselineDays, d - 1)
      if (base.length >= CHECK_IN_BAND.minEntries) {
        const n = checkInNormal(base)
        low = Math.max(5, n.low)
        high = Math.min(25, n.high)
        const side: NormalSide | null = read === null ? null
          : checkInBand(read, n) !== 'ok' ? 'below' : read > n.high ? 'above' : 'inside'
        printed = printedDay(read, n.low, n.high, side, checkInInside(n))
      }
    } else {
      const week = span(d - HRV_ROLLING_DAYS + 1, d).map(Math.log)
      const x = week.length > 0 ? avg(week) : null
      if (x !== null) read = Math.exp(x)
      const base = span(d - HRV_ROLLING_DAYS - HRV_BASELINE_DAYS + 1, d - HRV_ROLLING_DAYS).map(Math.log)
      if (base.length >= MIN_HRV_BASELINE_NIGHTS) {
        const n = hrvNormal(base)
        low = Math.exp(n.low)
        high = Math.exp(n.high)
        const side: NormalSide | null = x === null ? null : x < n.low ? 'below' : x > n.high ? 'above' : 'inside'
        printed = printedDay(read, low, high, side, hrvInside(n))
      }
    }
    if (out.length === 0 && single === null && read === null && low === null) continue
    out.push({ date: dayDate(d), single, read, low, high, printed })
  }
  return out
}

/** Readings each method has toward its first verdict. */
function baselineProgress(
  method: ReadinessMethod, sleep: SleepEntry[], inputs: ReadinessInput[], date: string = today(),
): BaselineProgress {
  if (method === 'check_in') {
    return { have: checkInBaseline(inputs, date).length, need: CHECK_IN_BAND.minEntries }
  }
  // The latest week stays out of the baseline, so a daily reader needs about
  // three weeks: 14 baseline readings plus the week being read.
  const points = method === 'overnight_hrv' ? overnightPoints(sleep) : morningPoints(inputs)
  const have = points.filter(p => p.date <= date && daysBetween(p.date, date) < HRV_ROLLING_DAYS + HRV_BASELINE_DAYS).length
  return { have, need: MIN_HRV_BASELINE_NIGHTS + HRV_ROLLING_DAYS }
}

/** A watch or ring counts as connected when it delivered a night of HRV in
 * the last 3 days (0092, Peter 2026-10-04). Garmin is the only source today. */
const CONNECTED_WITHIN_DAYS = 3
export function overnightConnected(sleep: SleepEntry[], date: string = today()): boolean {
  return sleep.some(e => e.hrv != null && e.hrv > 0 && e.date <= date && daysBetween(e.date, date) < CONNECTED_WITHIN_DAYS)
}

/** The method a person reads from when they have not picked one: the highest
 * rung they supply (0092). Overnight when a device is connected; else a typed
 * route with a reading in its baseline window; else none. */
export function autoReadinessMethod(sleep: SleepEntry[], inputs: ReadinessInput[], date: string = today()): ReadinessMethod | null {
  if (overnightConnected(sleep, date)) return 'overnight_hrv'
  const recent = inputs.filter(e => e.date <= date && daysBetween(e.date, date) < HRV_ROLLING_DAYS + HRV_BASELINE_DAYS)
  if (recent.some(e => e.morningHrv != null)) return 'morning_hrv'
  if (recent.some(e => e.checkIn)) return 'check_in'
  return null
}

/** Notes beside the verdict (0092): each has its own small calculation and
 * none ever changes the band. */
export interface ReadinessNotes {
  /** bpm last night's resting HR sat above the person's own norm, when that
   * is notable (RESTING_HR_NOTE); null otherwise. */
  restingHrAbove: number | null
  /** Hours of device-measured sleep last night, when under SHORT_NIGHT_HOURS. */
  shortNight: number | null
}

export function readinessNotes(sleep: SleepEntry[], date: string = today()): ReadinessNotes {
  const fresh = sleep
    .filter(e => e.date <= date && daysBetween(e.date, date) <= 1)
    .sort((a, b) => b.date.localeCompare(a.date))
  let restingHrAbove: number | null = null
  const last = fresh.find(e => e.restingHr != null && e.restingHr > 0)
  if (last) {
    const base = sleep
      .filter(e => e.restingHr != null && e.restingHr > 0 && e.date < last.date
        && daysBetween(e.date, last.date) <= RESTING_HR_NOTE.baselineDays)
      .map(e => e.restingHr as number)
    if (base.length >= RESTING_HR_NOTE.minNights) {
      const mean = avg(base)
      const sd = Math.sqrt(avg(base.map(v => (v - mean) ** 2)))
      const above = (last.restingHr as number) - mean
      if (above >= RESTING_HR_NOTE.bpm && above >= RESTING_HR_NOTE.sd * sd) restingHrAbove = Math.round(above)
    }
  }
  // Device duration only: a typed night overestimates (Lauderdale 2008).
  const night = fresh.find(e => e.source === 'garmin' && e.hours > 0)
  const shortNight = night && night.hours < SHORT_NIGHT_HOURS ? night.hours : null
  return { restingHrAbove, shortNight }
}

export interface SystemicReadiness {
  /** 0–100 score of the reading; null when nothing can be read. */
  readiness: number | null
  band: ReadinessBand | null
  /** The method the verdict came from — the chosen one, or a lower rung with
   * its own baseline when the chosen one has no reading today. */
  method: ReadinessMethod | null
  /** The method the person reads from: picked in Profile, else automatic. */
  chosen: ReadinessMethod | null
  /** Whether `chosen` came from Profile (false = the automatic pick). */
  picked: boolean
  /** A watch or ring delivered HRV in the last 3 days. */
  connected: boolean
  /** Today's typed reading for the chosen method is still missing. */
  awaitingInput: boolean
  /** The chosen method's readings toward its first verdict, while it has none. */
  progress: BaselineProgress | null
  /** The reading's distance from the person's own baseline, in their SD units. */
  z: number | null
  /** The reading's recent value and the person's normal range, in its own unit. */
  recent: number | null
  normal: { low: number; high: number } | null
  /** Where the reading sits against that normal, for the gauge. */
  gauge: Gauge | null
  notes: ReadinessNotes
  /** Last night's device sleep score, if fresh — shown, never part of readiness (0085). */
  sleepScore: number | null
  /** Last night's overnight HRV in ms, if fresh. */
  hrv: number | null
}

function readingFor(method: ReadinessMethod, sleep: SleepEntry[], inputs: ReadinessInput[], date: string) {
  if (method === 'overnight_hrv') return overnightHrvReading(sleep, date)
  if (method === 'morning_hrv') return morningHrvReading(inputs, date)
  return checkInReading(inputs, date)
}

/**
 * The systemic gate: the method the person reads from (picked in Profile, or
 * the best they supply). When it has no reading today, a lower rung gives the
 * verdict only if it has a reading of its own; otherwise there is no verdict
 * (0092). Methods never mix within a day. Advisory input to
 * {@link fusedVerdict}; never splits per adaptation (doctrine P5).
 */
export function systemicReadiness(
  sleep: SleepEntry[],
  date: string = today(),
  inputs: ReadinessInput[] = [],
  picked: ReadinessMethod | null = null,
): SystemicReadiness {
  // "Last night" with one day of sync grace (log_date is the wake date).
  const fresh = sleep
    .filter(e => e.date <= date && daysBetween(e.date, date) <= 1)
    .sort((a, b) => b.date.localeCompare(a.date))
  const sleepScore = fresh.find(e => e.score != null)?.score ?? null
  const hrv = fresh.find(e => e.hrv != null)?.hrv ?? null
  const chosen = picked ?? autoReadinessMethod(sleep, inputs, date)
  let reading: ReadinessReading | null = null
  if (chosen) {
    for (const m of READINESS_METHODS.slice(READINESS_METHODS.indexOf(chosen))) {
      reading = readingFor(m, sleep, inputs, date)
      if (reading) break
    }
  }
  const todays = inputs.find(e => e.date === date)
  const awaitingInput =
    (chosen === 'morning_hrv' && todays?.morningHrv == null)
    || (chosen === 'check_in' && !todays?.checkIn)
  const chosenReading = chosen && reading?.method === chosen ? reading : null
  return {
    readiness: reading?.score ?? null,
    band: reading?.band ?? null,
    method: reading?.method ?? null,
    chosen,
    picked: picked != null,
    connected: overnightConnected(sleep, date),
    awaitingInput,
    progress: chosen && !chosenReading ? baselineProgress(chosen, sleep, inputs, date) : null,
    z: reading?.z ?? null,
    recent: reading?.recent ?? null,
    normal: reading?.normal ?? null,
    gauge: reading?.gauge ?? null,
    notes: readinessNotes(sleep, date),
    sleepScore,
    hrv,
  }
}

export interface DonationStatus {
  /** Days since the last full-blood donation; null = none on record. */
  daysSince: number | null
  /** Inside the 48 h acute window — flips the verdict to Hold. */
  acuteHold: boolean
  /** Inside the 21 d aerobic tail — a note scoped to aerobic qualities only. */
  aerobicSuppressed: boolean
  /** Days until service eligibility across donations of any type (0 = eligible).
   * A calendar fact, never a readiness input. */
  eligibleInDays: number
}

export function donationStatus(donations: DonationEntry[], date: string = today()): DonationStatus {
  let lastFull: string | null = null
  let eligibleInDays = 0
  for (const d of donations) {
    if (d.date > date) continue
    if (d.type === 'Full Blood' && (!lastFull || d.date > lastFull)) lastFull = d.date
    const wait = DONATION_ELIGIBILITY_DAYS[d.type] ?? 0
    eligibleInDays = Math.max(eligibleInDays, wait - daysBetween(d.date, date))
  }
  const daysSince = lastFull ? daysBetween(lastFull, date) : null
  return {
    daysSince,
    acuteHold: daysSince !== null && daysSince * 24 < DONATION_SUPPRESSION.acuteHours,
    aerobicSuppressed: daysSince !== null && daysSince <= DONATION_SUPPRESSION.aerobicTailDays,
    eligibleInDays,
  }
}

export interface FusedVerdict {
  /** hold on a low band (or an acute donation), steady on a moderate one, push otherwise. */
  mode: 'push' | 'steady' | 'hold'
  /** What held or steadied the day; null on a push day. */
  cause: 'readiness' | 'donation' | null
}

/**
 * The day's instruction. Readiness and an acute donation gate it; they never
 * erase facts, and capture never locks. Missing readiness data cannot gate.
 */
export function fusedVerdict(band: ReadinessBand | null, donation?: DonationStatus): FusedVerdict {
  if (donation?.acuteHold) return { mode: 'hold', cause: 'donation' }
  if (band === 'low') return { mode: 'hold', cause: 'readiness' }
  if (band === 'moderate') return { mode: 'steady', cause: 'readiness' }
  return { mode: 'push', cause: null }
}
