import type {
  WeightEntry, Program, ProgramDay, ProgramWeekOverride, MobilityEntry, DayOfWeek,
  ExerciseMuscleLink, LiftSet, CardioEntry,
} from '../types'
import { CYCLE, DELOAD_WEEK, DELOAD_REP_FACTOR } from '../constants/app'

export type GroupedExercise =
  | { type: 'single'; exercises: [string] }
  | { type: 'superset'; exercises: [string, string] }

export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2)

export const today = (): string =>
  new Date().toISOString().slice(0, 10)

export type WeekStartDay = 'sunday' | 'monday'

/** Returns the date (YYYY-MM-DD) of the start of the week containing `s`. */
export const startOfWeek = (s: string, weekStart: WeekStartDay = 'monday'): string => {
  const d = new Date(s)
  const day = d.getDay() // 0 = Sunday … 6 = Saturday
  const offset = weekStart === 'monday' ? (day + 6) % 7 : day
  d.setDate(d.getDate() - offset)
  return d.toISOString().slice(0, 10)
}

/** Groups a date into its containing week, keyed by that week's start date. */
export const weekKey = (s: string, weekStart: WeekStartDay = 'monday'): string =>
  startOfWeek(s, weekStart)

/** The frames the Cardio tab's charts and the sport record share (roadmap 054).
 *  These are chart windows, not reads: Home and Adaptations keep their own
 *  grounded windows and never pick from this list. */
export const TIME_FRAMES = ['All time', 'Last 30 days', 'Last 90 days', 'This year'] as const
export type TimeFrame = typeof TIME_FRAMES[number]

/** Whether a YYYY-MM-DD date falls inside `frame`, counted back from `ref`
 *  (today by default). Pure string arithmetic on ISO dates, so the boundary
 *  does not wobble with the browser's timezone. */
export function withinTimeFrame(date: string, frame: TimeFrame, ref: string = today()): boolean {
  if (frame === 'All time') return true
  if (frame === 'This year') return date.slice(0, 4) === ref.slice(0, 4)
  const days = frame === 'Last 30 days' ? 30 : 90
  const cutoff = new Date(`${ref}T00:00:00Z`)
  cutoff.setUTCDate(cutoff.getUTCDate() - days)
  return date >= cutoff.toISOString().slice(0, 10)
}

export const r05 = (v: number): number => Math.round(v * 2) / 2

export interface CycleInfo {
  week: number
  isDeload: boolean
  isComplete: boolean
}

export function cycleInfo(p: Program | null | undefined): CycleInfo {
  if (!p?.startDate) return { week: 1, isDeload: false, isComplete: false }
  const days = Math.max(
    0,
    Math.floor((new Date(today()).getTime() - new Date(p.startDate).getTime()) / 86400000),
  )
  const weekCount = Math.floor(days / 7) // 0-based completed-week count
  // Once all CYCLE weeks (including deload) have elapsed, the program is done
  if (weekCount >= CYCLE) return { week: CYCLE, isDeload: false, isComplete: true }
  const wc = weekCount + 1 // 1-based current week number (1 … CYCLE)
  return { week: wc, isDeload: wc === DELOAD_WEEK, isComplete: false }
}

export function isDeloadDate(startDate: string | null | undefined, d: string): boolean {
  if (!startDate) return false
  const days = Math.max(
    0,
    Math.floor((new Date(d).getTime() - new Date(startDate).getTime()) / 86400000),
  )
  const wc = (Math.floor(days / 7) % (CYCLE + 1)) + 1
  return wc === DELOAD_WEEK
}

/**
 * A deload session's prescribed sets: reps scaled by {@link DELOAD_REP_FACTOR}
 * (min 1), load unchanged. The single deload model — the plan preview and the
 * "Deload ↓" button must not disagree. See docs/grounding-inventory.md §5.
 */
export function deloadSets(lastSets: LiftSet[]): LiftSet[] {
  return lastSets.map(s => ({
    weight: r05(s.weight),
    reps: Math.max(1, Math.round(s.reps * DELOAD_REP_FACTOR)),
  }))
}

export function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const m = new Map(existing.map((e) => [e.id, e]))
  incoming.forEach((e) => m.set(e.id, e))
  return [...m.values()]
}

export function getGrouped(day: ProgramDay | null | undefined): GroupedExercise[] {
  if (!day) return []
  const ss = day.supersets ?? []
  const used = new Set<string>()
  const groups: GroupedExercise[] = []
  for (const ex of day.exercises ?? []) {
    if (used.has(ex)) continue
    const pair = ss.find(p => p.includes(ex))
    if (pair) {
      const partner = pair.find(e => e !== ex)
      if (partner && day.exercises.includes(partner) && !used.has(partner)) {
        groups.push({ type: 'superset', exercises: [ex, partner] })
        used.add(ex); used.add(partner); continue
      }
    }
    groups.push({ type: 'single', exercises: [ex] })
    used.add(ex)
  }
  return groups
}

export function sessionDates(weights: WeightEntry[], exArr: string[]): string[] {
  const m: Record<string, Set<string>> = {}
  weights.forEach(w => {
    if (!m[w.date]) m[w.date] = new Set()
    m[w.date].add(w.exercise.toLowerCase())
  })
  return Object.entries(m)
    .filter(([, s]) => exArr.some(e => s.has(e.toLowerCase())))
    .map(([d]) => d)
    .sort((a, b) => b.localeCompare(a))
}

export function defaultProgram(): Program {
  return {
    name: '5-Day High Efficiency Split',
    startDate: today(),
    currentDayIndex: 0,
    lastAdvancedDate: today(),
    days: [
      { name: 'Day 1 — Squat + Bench + Curls', exercises: ['Back Squat', 'Bench Press', 'Bicep Curls'], supersets: [['Bench Press', 'Bicep Curls']] },
      { name: 'Day 2 — Deadlift + Rows + Calves', exercises: ['Deadlift', 'Rows', 'Calf Raises', 'Reverse Fly'], supersets: [['Calf Raises', 'Reverse Fly']] },
      { name: 'Day 3 — OHP + Pull-ups + Triceps', exercises: ['Overhead Press', 'Pull-ups', 'Tricep Extensions'], supersets: [] },
      { name: 'Day 4 — Squat + Bench + Curls', exercises: ['Back Squat', 'Bench Press', 'Bicep Curls'], supersets: [['Bench Press', 'Bicep Curls']] },
      { name: 'Day 5 — Rows + Deadlift + Triceps', exercises: ['Rows', 'Deadlift', 'Tricep Extensions', 'Calf Raises'], supersets: [['Tricep Extensions', 'Calf Raises']] },
    ],
  }
}

// ── One-rep-max estimation ────────────────────────────────────────────────────

/** Epley estimated 1RM: weight × (1 + reps/30). */
export function epley1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30)
}

/** Brzycki estimated 1RM: weight × 36/(37 − reps). Undefined (→0) at ≥37 reps. */
export function brzycki1RM(weight: number, reps: number): number {
  if (reps >= 37) return 0
  return (weight * 36) / (37 - reps)
}

/**
 * Estimated 1RM for a single set, blending the Epley and Brzycki formulas
 * (they diverge at the extremes). A single rep is already a true max; very high
 * reps fall back to Epley since Brzycki breaks down.
 */
export function estimate1RM(weight: number, reps: number): number {
  if (!weight || reps < 1) return 0
  if (reps === 1) return weight
  const e = epley1RM(weight, reps)
  const b = brzycki1RM(weight, reps)
  return b > 0 ? (e + b) / 2 : e
}

/** Best estimated 1RM across a group of sets (0 if none). */
export function best1RM(sets: { weight: number; reps: number }[]): number {
  return sets.reduce((m, s) => Math.max(m, estimate1RM(s.weight, s.reps)), 0)
}

// ── Cardio duration helpers ───────────────────────────────────────────────────

/** Parses "MM:SS" or plain minutes string → decimal minutes */
export function parseDurationMins(raw: string): number {
  const s = raw.trim()
  if (s.includes(':')) {
    const [mStr, sStr] = s.split(':')
    const m = parseInt(mStr, 10) || 0
    const sec = Math.min(parseInt(sStr, 10) || 0, 59)
    return m + sec / 60
  }
  return parseFloat(s) || 0
}

/** Formats decimal minutes → "MM:SS" */
export function formatDurationMins(mins: number): string {
  const m = Math.floor(mins)
  const s = Math.round((mins - m) * 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Returns pace string "M:SS/km" or empty string if data missing */
export function calcPace(mins: number, distKm: number): string {
  if (!distKm || !mins) return ''
  const paceMin = mins / distKm
  const m = Math.floor(paceMin)
  const s = Math.round((paceMin - m) * 60)
  return `${m}:${String(s).padStart(2, '0')}/km`
}

/** Counts consecutive days of activity ending today (or yesterday, if today has none yet). */
export function currentStreak(activeDates: Set<string>): number {
  const d = new Date(today())
  if (!activeDates.has(d.toISOString().slice(0, 10))) {
    d.setDate(d.getDate() - 1)
  }
  let streak = 0
  while (activeDates.has(d.toISOString().slice(0, 10))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export interface MetricSeries {
  series: { x: string; y: number }[]
  first: number
  last: number
  peak: number
  delta: number
}

export interface ExerciseProgress {
  exercise: string
  maxWeight: MetricSeries
  volume: MetricSeries
}

function toMetricSeries(points: { x: string; y: number }[]): MetricSeries {
  return {
    series: points,
    first: points[0]?.y ?? 0,
    last: points[points.length - 1]?.y ?? 0,
    peak: points.length > 0 ? Math.max(...points.map(p => p.y)) : 0,
    delta: (points[points.length - 1]?.y ?? 0) - (points[0]?.y ?? 0),
  }
}

export function cycleExerciseProgress(
  weights: WeightEntry[],
  cycle: { startDate: string; endDate: string | null; days: ProgramDay[] }
): ExerciseProgress[] {
  const exerciseNames = [...new Set(cycle.days.flatMap(d => d.exercises))]
  const end = cycle.endDate ?? today()

  return exerciseNames
    .map(exercise => {
      const entries = weights
        .filter(w =>
          w.exercise.toLowerCase() === exercise.toLowerCase() &&
          w.date >= cycle.startDate &&
          w.date <= end
        )
        .sort((a, b) => a.date.localeCompare(b.date))

      const maxWeight = toMetricSeries(entries.map(w => ({ x: w.date, y: Math.max(...w.sets.map(s => s.weight)) })))
      const volume = toMetricSeries(entries.map(w => ({ x: w.date, y: w.sets.reduce((a, s) => a + s.weight * s.reps, 0) })))

      return { exercise, maxWeight, volume }
    })
    .filter(p => p.maxWeight.series.length > 0)
}

export function isTodayDone(
  weights: WeightEntry[],
  day: ProgramDay | null | undefined,
): boolean {
  return (day?.exercises ?? []).every((ex) =>
    weights.some((w) => w.date === today() && w.exercise === ex),
  )
}

// ── Day resolution (block-aware programs) ─────────────────────────────────────

export const WEEKDAYS: DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]

/** Weekday name for a date string (defaults to today). */
export function weekdayOf(s: string = today()): DayOfWeek {
  const jsDay = new Date(s).getDay() // 0 = Sunday … 6 = Saturday
  return WEEKDAYS[(jsDay + 6) % 7]
}

export type ProgramMode = 'weekday' | 'flexible' | 'index'

/**
 * How "today's day" is chosen for a program:
 * - `weekday`  — at least one day is pinned to a day-of-week → pick by calendar.
 * - `flexible` — a phased program with no pinned days (Adjustment) → weekly checklist.
 * - `index`    — legacy flat program → sequential `currentDayIndex`.
 */
export function programMode(program: Program): ProgramMode {
  const days = program.days ?? []
  if (days.some(d => d.dayOfWeek)) return 'weekday'
  if (program.phases && program.phases.length > 0) return 'flexible'
  return 'index'
}

/**
 * Resolves the single day to show today for `weekday`/`index` modes (null = rest).
 * In weekday mode, `variantWeekdays` selects the variant day instead of the base
 * for any weekday the user has toggled on for the current week.
 */
export function resolveTodayDay(
  program: Program,
  date: string = today(),
  variantWeekdays?: Set<DayOfWeek>,
): ProgramDay | null {
  const days = program.days ?? []
  if (days.length === 0) return null
  const mode = programMode(program)
  if (mode === 'index') {
    return days[program.currentDayIndex % days.length] ?? null
  }
  if (mode === 'weekday') {
    const wd = weekdayOf(date)
    const matches = days.filter(d => d.dayOfWeek === wd)
    if (matches.length === 0) return null
    if (variantWeekdays?.has(wd)) {
      return matches.find(d => d.isVariant) ?? matches.find(d => !d.isVariant) ?? matches[0]
    }
    return matches.find(d => !d.isVariant) ?? matches[0]
  }
  return null // flexible mode is handled by the weekly checklist
}

/** Weekdays whose variant is toggled on for a program (overrides are current-week). */
export function activeVariantWeekdays(
  overrides: ProgramWeekOverride[],
  userProgramId: string,
): Set<DayOfWeek> {
  return new Set(
    overrides
      .filter(o => o.userProgramId === userProgramId && o.variantActive)
      .map(o => o.dayOfWeek),
  )
}

export interface VariantGroup {
  weekday: DayOfWeek
  base: ProgramDay | null
  variant: ProgramDay
}

/** Weekdays that have a stored variant day, paired with their base day (if any). */
export function variantGroups(program: Program): VariantGroup[] {
  const days = program.days ?? []
  return days
    .filter(d => d.isVariant && d.dayOfWeek)
    .map(v => ({
      weekday: v.dayOfWeek as DayOfWeek,
      base: days.find(d => !d.isVariant && d.dayOfWeek === v.dayOfWeek) ?? null,
      variant: v,
    }))
}

export const WEEKLY_STRETCH_TARGET_MIN = 5

/** Sums mobility minutes per muscle group within [weekStartDate, date]. */
export function weeklyMuscleVolume(
  mobility: MobilityEntry[],
  weekStartDate: string,
  date: string = today(),
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const m of mobility) {
    if (m.date < weekStartDate || m.date > date) continue
    for (const e of m.exercises) {
      for (const g of e.muscleGroups ?? []) {
        out[g] = (out[g] ?? 0) + e.duration
      }
    }
  }
  return out
}

/** True when every weight exercise of `day` was logged within [weekStartDate, today]. */
export function isDayDoneInWeek(
  weights: WeightEntry[],
  day: ProgramDay,
  weekStartDate: string,
  date: string = today(),
): boolean {
  if (day.exercises.length === 0) return false
  return day.exercises.every(ex =>
    weights.some(w => w.exercise === ex && w.date >= weekStartDate && w.date <= date),
  )
}

// ── Muscle stimulus accounting ────────────────────────────────────────────────

/** Impact weight per link level (1 = most direct). Level 2 (synergist) = 0.5:
 *  the best-fit "fractional" set counting in the largest dose-response model
 *  (Pelland 2026) and synergist growth of ~0.4–1.0 × direct in trials
 *  (Mannarino 2021, Gentil 2015, Brandão 2020). Level 3 = 0 — grounded, not a
 *  convention: no study measures a quarter-set stimulus and the measured minor
 *  contributors did not grow (hamstrings in squats — Kubo 2019, Plotkin 2023;
 *  medial deltoid in bench — Lanza 2024). Zeroed 2026-09-03 after the link
 *  audit in roadmap 042 moved every real synergist to level 2, so level 3 now
 *  holds stabilisers and bystanders only. The key stays so an unknown level
 *  reads as an explicit 0; every consumer skips zero-weight links, so such a
 *  link adds no sets, no recency and no source. Every muscle read is
 *  denominated in this (inventory row 7.1, decision D13).
 *  See docs/grounding/039-adaptations-read.md#grounding and
 *  docs/roadmap/done/042-level-3-link-audit.md */
export const LEVEL_WEIGHT: Record<number, number> = { 1: 1, 2: 0.5, 3: 0 }

// ── Weights picker ─────────────────────────────────────────────────────────────

/**
 * Names the Weights exercise picker offers: every exercise logged before, plus
 * every catalogue exercise that trains a muscle (has a stimulus link). Recovery-
 * only rows (stretches, foam rolling) and unmapped habit-era rows stay out, so a
 * scout-named lift is selectable before its first set without the picker filling
 * up with "Sauna". See docs/roadmap/done/043-scout-named-exercises-catalogue.md.
 */
export function weightsPickerNames(weights: WeightEntry[], links: ExerciseMuscleLink[]): string[] {
  const names = new Set(weights.map(w => w.exercise))
  for (const l of links) if (l.contribution === 'stimulus') names.add(l.exercise)
  return [...names].sort()
}

// ── Cardio Progress chart rollup ──────────────────────────────────────────────
// Companion to TIME_FRAMES / withinTimeFrame above (roadmap 055). Lives at the
// end of the file so the grounding inventory's line anchors above stay put.

/** What one point on the Cardio Progress chart is. */
export type CardioGrain = 'session' | 'week' | 'month'

/** The grain follows the frame, not the point count: a point-count threshold
 *  would change what a point means the day one more session is logged, and
 *  nothing on the card would say so. */
export const grainForFrame = (frame: TimeFrame): CardioGrain =>
  frame === 'All time' ? 'month' : frame === 'This year' ? 'week' : 'session'

/** One week or month of cardio, summed. `key` is the week's start date
 *  (YYYY-MM-DD) or the month (YYYY-MM). `distance` and `pace` are absent when
 *  no session in the bucket carried a distance; an empty bucket has
 *  `sessions: 0` and `duration: 0`. */
export interface CardioBucket {
  key: string
  sessions: number
  duration: number
  distance?: number
  pace?: number
}

const nextBucketKey = (key: string, grain: 'week' | 'month'): string => {
  if (grain === 'month') {
    const [y, m] = key.split('-').map(Number)
    return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
  }
  const d = new Date(`${key}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 7)
  return d.toISOString().slice(0, 10)
}

/** Rolls cardio sessions up into consecutive week or month buckets. Every
 *  bucket between the first and last session is returned, empty ones included,
 *  so a gap in training draws as a gap rather than a trend that never happened
 *  (P2). Pace is summed minutes over summed km across the sessions that have a
 *  distance — distance-weighted, so a 3 km jog does not count as much as a
 *  20 km run. Weeks key by `weekKey`, so they match the sport card's. */
export function rollupCardio(
  sessions: Pick<CardioEntry, 'date' | 'duration' | 'distance'>[],
  grain: 'week' | 'month',
  weekStart: WeekStartDay = 'monday',
): CardioBucket[] {
  if (sessions.length === 0) return []
  const keyOf = (date: string) => grain === 'month' ? date.slice(0, 7) : weekKey(date, weekStart)
  const sums = new Map<string, { sessions: number; duration: number; distance: number; distDuration: number }>()
  for (const s of sessions) {
    const k = keyOf(s.date)
    const b = sums.get(k) ?? { sessions: 0, duration: 0, distance: 0, distDuration: 0 }
    b.sessions += 1
    b.duration += s.duration
    if (s.distance) {
      b.distance += s.distance
      b.distDuration += s.duration
    }
    sums.set(k, b)
  }
  const keys = [...sums.keys()].sort()
  const last = keys[keys.length - 1]
  const out: CardioBucket[] = []
  for (let k = keys[0]; k <= last; k = nextBucketKey(k, grain)) {
    const b = sums.get(k)
    if (!b) {
      out.push({ key: k, sessions: 0, duration: 0 })
      continue
    }
    out.push({
      key: k,
      sessions: b.sessions,
      duration: +b.duration.toFixed(2),
      ...(b.distance > 0
        ? { distance: +b.distance.toFixed(2), pace: +(b.distDuration / b.distance).toFixed(2) }
        : {}),
    })
  }
  return out
}

/** A pace bucket with no paced neighbour has no segment: Recharts joins
 *  adjacent non-null points only, and the rollup keeps empty buckets as holes
 *  on purpose (P2). Such a point is drawn as a dot or it is invisible — the
 *  one exception to §9's "no resting dots" (roadmap 056). */
export const hasLonePace = (buckets: CardioBucket[], i: number): boolean =>
  buckets[i]?.pace != null && buckets[i - 1]?.pace == null && buckets[i + 1]?.pace == null
