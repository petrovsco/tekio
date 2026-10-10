import type { WeightEntry, MobilityEntry, ExerciseMuscleLink } from '../types'

/** Today's date (YYYY-MM-DD) on the device's own clock. Not `toISOString()`,
 *  which is the UTC date: east of Greenwich it still says yesterday for the
 *  first hours after midnight, and a log made then would land on the wrong day. */
export const today = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Groups `rows` by `key`, in first-seen key order; `value` maps each row into
 * its group (identity by default). The one grouping loop — it was written eight
 * times, and the copies drifted between `set(k, [...get(k), v])` (an O(n²)
 * copy) and pushing into the array in place.
 */
export function groupBy<T, V = T>(
  rows: Iterable<T>,
  key: (row: T) => string,
  value?: (row: T) => V,
): Map<string, V[]> {
  const out = new Map<string, V[]>()
  for (const row of rows) {
    const v = (value ? value(row) : row) as V
    const arr = out.get(key(row))
    if (arr) arr.push(v)
    else out.set(key(row), [v])
  }
  return out
}

/** The distinct values of `xs`, sorted. The picker lists, the type chips and
 *  every autocomplete are derived this way — nine call sites wrote it inline. */
export function uniqSorted(xs: string[]): string[] {
  return [...new Set(xs)].sort()
}

/** A set count: whole numbers plain, halves to one decimal. A muscle's share of
 *  a set is fractional (level 2 links weigh 0.5), so "1.5 sets" is a real read. */
export const fmtSets = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1))

/** How long ago, for a recency note. `null` means it has never happened. */
export const fmtAgo = (daysSince: number | null): string =>
  daysSince === null ? 'never' : daysSince === 0 ? 'today' : `${daysSince} d ago`

// ─── Dates on screen ─────────────────────────────────────────────────────────
// Dates are stored as YYYY-MM-DD and printed only through `fmtDate`, in one
// fixed shape whatever the browser's language: day first, month as a word —
// "8 Sept", "Wed 8 Oct", "3 Mar 2025". A numeric 08/10 reads as August to half
// the world and October to the other half; a word cannot be misread.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** How a date carries its year: `auto` only when it is not this year
 *  (3 Mar 2025), `short` always and abbreviated (8 Oct '26), `never` — for a
 *  chart axis inside one year. */
export type DateYear = 'auto' | 'short' | 'never'

const RELATIVE: Record<number, string> = { [-1]: 'Yesterday', 0: 'Today', 1: 'Tomorrow' }

/** A stored date (YYYY-MM-DD, or YYYY-MM for a month bucket) as the app prints
 *  it: "8 Oct", "Wed 8 Oct", "Oct '26" — and "Today", "Yesterday" or
 *  "Tomorrow" when it is one of those, unless `relative` is off (a chart axis,
 *  where a word among dates breaks the run). `midSentence` lowercases the word
 *  for a date inside a sentence: "prefilled from yesterday". */
export function fmtDate(
  date: string,
  { weekday = false, year = 'auto', relative = true, midSentence = false }:
    { weekday?: boolean; year?: DateYear; relative?: boolean; midSentence?: boolean } = {},
): string {
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m) return date
  if (relative && d) {
    const word = RELATIVE[daysBetween(today(), date)]
    if (word) return midSentence ? word.toLowerCase() : word
  }
  const yearPart = year === 'short' ? ` '${String(y).slice(2)}`
    : year === 'auto' && String(y) !== today().slice(0, 4) ? ` ${y}`
    : ''
  if (!d) return `${MONTHS[m - 1]}${yearPart}`
  // A calendar day, so the weekday comes from UTC: `new Date('2026-10-08')`
  // is UTC midnight, and local time would call it the 7th west of Greenwich.
  const day = weekday ? `${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ` : ''
  return `${day}${d} ${MONTHS[m - 1]}${yearPart}`
}

const DAY_MS = 86400000

/** Whole days from `from` to `to` (both YYYY-MM-DD; positive when to > from).
 *  Both parse as UTC midnight, so the quotient is exact — floor and round agree. */
export function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / DAY_MS)
}

export type WeekStartDay = 'sunday' | 'monday'

/** Returns the date (YYYY-MM-DD) of the start of the week containing `s`. */
export const startOfWeek = (s: string, weekStart: WeekStartDay = 'monday'): string => {
  // Day arithmetic in UTC throughout: `new Date(s)` is UTC midnight, and a
  // local getDay() would read the day before west of Greenwich.
  const d = new Date(`${s}T00:00:00Z`)
  const day = d.getUTCDay() // 0 = Sunday … 6 = Saturday
  const offset = weekStart === 'monday' ? (day + 6) % 7 : day
  d.setUTCDate(d.getUTCDate() - offset)
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

/**
 * The most recent session logged for an exercise — what the log form prefills
 * from. Matching is case-insensitive and trims the name, so a half-typed
 * exercise in the log form still finds its history.
 */
export function lastPerformance(weights: WeightEntry[], exercise: string): WeightEntry | undefined {
  const name = exercise.trim().toLowerCase()
  if (!name) return undefined
  let best: WeightEntry | undefined
  for (const d of weights) {
    if (d.exercise.toLowerCase() !== name) continue
    if (!best || d.date.localeCompare(best.date) > 0) best = d
  }
  return best
}

export function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const m = new Map(existing.map((e) => [e.id, e]))
  incoming.forEach((e) => m.set(e.id, e))
  return [...m.values()]
}

// ── One-rep-max estimation ────────────────────────────────────────────────────

/**
 * The highest rep count an estimate is offered from. Deliberately conservative:
 * the published windows are 4–6 (Dohoney 2002), 4–10 (Roberts 2025) and "under
 * 10" (Mayhew 2008, LeSuer 1997), so nothing in the literature objects to 5 and
 * nothing puts the honest ceiling below it. Set on 2026-09-09 under a standing
 * rule that the window may be narrowed by evidence, never widened.
 * Below this, a 1-rep set is a *measured* max and is never estimated.
 * See tekio.rfcs/rfcs/done/0067-ground-1rm-estimator.md#grounding
 */
const ONE_RM_REP_MAX = 5

/**
 * Brzycki M, JOPERD 1993;64(1):88–90 — a strength coach's article rather than a
 * validation study, but independently validated since (LeSuer 1997, Reynolds
 * 2006, Mayhew 2008), with a small bias that varies by exercise. Chosen over
 * Epley on 2026-09-09 because it is the conservative of the two inside the
 * window: below 10 reps it never claims a higher max, and at exactly 10 the two
 * are algebraically identical. Averaging them — which Tekiō did until then — is
 * an estimator nobody has published or tested.
 * Valid only for a set taken to failure; the caller enforces that.
 * See tekio.rfcs/rfcs/done/0067-ground-1rm-estimator.md#grounding
 */
function brzycki1RM(weight: number, reps: number): number {
  return (weight * 36) / (37 - reps)
}

/**
 * Plates come in 2.5 kg pairs, and a *tested* 1RM moves ~3 % from day to day in
 * a trained lifter (Grgic 2020) — larger than the gap between rep-max formulas.
 * An estimate printed to the kilogram would claim a precision the measurement
 * itself does not have. See tekio.rfcs/rfcs/done/0067-ground-1rm-estimator.md#grounding
 */
const toPlate = (kg: number): number => Math.round(kg / 2.5) * 2.5

/** A one-rep max the app is willing to state, and how it knows it. */
export type OneRM =
  | { kind: 'measured'; kg: number }
  | { kind: 'estimated'; kg: number; fromReps: number }

/**
 * The 1RM a single set supports, or `null` when it supports none. A single rep
 * is the max itself and is reported as measured; 2 to `ONE_RM_REP_MAX` reps are
 * estimated; anything heavier on reps returns nothing rather than a number the
 * formula cannot stand behind.
 */
export function oneRM(weight: number, reps: number): OneRM | null {
  if (!(weight > 0) || !(reps >= 1)) return null
  if (reps === 1) return { kind: 'measured', kg: weight }
  if (reps > ONE_RM_REP_MAX) return null
  return { kind: 'estimated', kg: toPlate(brzycki1RM(weight, reps)), fromReps: reps }
}

/**
 * The best 1RM a group of sets supports. Ties go to the measured one: a set
 * actually lifted for a single rep outranks an estimate of the same size.
 */
export function bestOneRM(sets: { weight: number; reps: number }[]): OneRM | null {
  let best: OneRM | null = null
  for (const s of sets) {
    const c = oneRM(s.weight, s.reps)
    if (!c) continue
    if (!best || c.kg > best.kg || (c.kg === best.kg && c.kind === 'measured')) best = c
  }
  return best
}

/**
 * Is this set a personal best for the exercise? Measured, never estimated: a
 * set is a best when nothing already logged both matched its reps and matched
 * its load. Repeating a previous set is not a best; beating it at the same reps
 * is, and so is holding the load for more reps.
 */
export function isSetPR(set: { weight: number; reps: number }, history: { weight: number; reps: number }[]): boolean {
  if (!(set.weight > 0) || !(set.reps >= 1)) return false
  return !history.some(h => h.reps >= set.reps && h.weight >= set.weight)
}

// ── Cardio duration helpers ───────────────────────────────────────────────────

/** Parses "H:MM:SS", "MM:SS" or plain minutes string → decimal minutes */
export function parseDurationMins(raw: string): number {
  const s = raw.trim()
  if (s.includes(':')) {
    const parts = s.split(':').map(p => parseInt(p, 10) || 0)
    const [h, m, sec] = parts.length >= 3 ? parts : [0, parts[0], parts[1]]
    return h * 60 + m + Math.min(sec, 59) / 60
  }
  return parseFloat(s) || 0
}

/** Formats decimal minutes → "H:MM:SS", or "M:SS" under an hour. Rounds to
 *  the whole second first, so 59.999 min reads 1:00:00, never 59:60. */
export function formatDurationMins(mins: number): string {
  const total = Math.round(mins * 60)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

/** Returns pace string "M:SS/km" or empty string if data missing */
export function calcPace(mins: number, distKm: number): string {
  if (!distKm || !mins) return ''
  const paceMin = mins / distKm
  const m = Math.floor(paceMin)
  const s = Math.round((paceMin - m) * 60)
  return `${m}:${String(s).padStart(2, '0')}/km`
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
 *  See tekio.rfcs/grounding/039-adaptations-read.md#grounding and
 *  tekio.rfcs/rfcs/done/0042-level-3-link-audit.md */
export const LEVEL_WEIGHT: Record<number, number> = { 1: 1, 2: 0.5, 3: 0 }

// ── Weights picker ─────────────────────────────────────────────────────────────

/**
 * Names the Weights exercise picker offers: every exercise logged before, plus
 * every catalogue exercise that trains a muscle (has a stimulus link). Recovery-
 * only rows (stretches, foam rolling) and unmapped habit-era rows stay out, so a
 * scout-named lift is selectable before its first set without the picker filling
 * up with "Sauna". See tekio.rfcs/rfcs/done/0043-scout-named-exercises-catalogue.md.
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
 *  no session in the bucket carried a distance, `avgHr` when none carried a
 *  heart rate and a duration; an empty bucket has `sessions: 0` and
 *  `duration: 0`. A per-session point built by the caller may leave
 *  `duration` out: a hand-logged sport session need not state one. */
export interface CardioBucket {
  key: string
  sessions: number
  duration?: number
  distance?: number
  pace?: number
  avgHr?: number
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
 *  20 km run. Average heart rate is weighted the same way by minutes, across
 *  the sessions that carry both, so a 10-minute warm-up does not count as much
 *  as a 90-minute match. Weeks key by `weekKey`, so they match the sport
 *  card's. Sport sessions go through here too (roadmap 076), which is why a
 *  duration may be absent: it counts the session and adds no minutes. */
export function rollupCardio(
  sessions: { date: string; duration?: number; distance?: number; avgHr?: number }[],
  grain: 'week' | 'month',
  weekStart: WeekStartDay = 'monday',
): CardioBucket[] {
  if (sessions.length === 0) return []
  const keyOf = (date: string) => grain === 'month' ? date.slice(0, 7) : weekKey(date, weekStart)
  const sums = new Map<string, { sessions: number; duration: number; distance: number; distDuration: number; hrMinutes: number; hrDuration: number }>()
  for (const s of sessions) {
    const k = keyOf(s.date)
    const b = sums.get(k) ?? { sessions: 0, duration: 0, distance: 0, distDuration: 0, hrMinutes: 0, hrDuration: 0 }
    const duration = s.duration ?? 0
    b.sessions += 1
    b.duration += duration
    if (s.distance) {
      b.distance += s.distance
      b.distDuration += duration
    }
    if (s.avgHr && duration > 0) {
      b.hrMinutes += s.avgHr * duration
      b.hrDuration += duration
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
      ...(b.hrDuration > 0 ? { avgHr: Math.round(b.hrMinutes / b.hrDuration) } : {}),
    })
  }
  return out
}

/** A second-series bucket (pace, or average heart rate) with no neighbour
 *  carrying the same series has no segment: Recharts joins adjacent non-null
 *  points only, and the rollup keeps empty buckets as holes on purpose (P2).
 *  Such a point is drawn as a dot or it is invisible — the one exception to
 *  §9's "no resting dots" (roadmap 056). */
export const hasLonePoint = (buckets: CardioBucket[], i: number, field: 'pace' | 'avgHr'): boolean =>
  buckets[i]?.[field] != null && buckets[i - 1]?.[field] == null && buckets[i + 1]?.[field] == null
