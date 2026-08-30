import type {
  WeightEntry, CardioEntry, SportEntry, DonationEntry, WaterEntry, SleepEntry,
  ExerciseMuscleLink, MuscleGroup,
} from '../types'
import {
  CYCLE, RECOVER_DAYS, PUSH_THRESHOLD, QUALITY_STALENESS_DAYS,
  CYCLE_SET_TARGET, DONATION_SUPPRESSION, DONATION_ELIGIBILITY_DAYS,
} from '../constants/app'
import { LEVEL_WEIGHT, today } from './utils'
import { classifyCardioAdaptations, classifyCardioByDuration } from './adaptations'

// The pure functions behind the fused Home read (roadmap 010/018): per-muscle
// state, whole-body quality state, systemic readiness, and the Push/Hold
// verdict. Everything takes plain arrays + an explicit date, so it is
// unit-testable without the store.

/** The local (per-muscle) read's window: one full cycle, in days. */
export const CYCLE_WINDOW_DAYS = CYCLE * 7

const DAY_MS = 86400000

/** Whole days from `from` to `to` (both YYYY-MM-DD; positive when to > from). */
export function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / DAY_MS)
}

const avg = (vals: number[]): number => vals.reduce((s, v) => s + v, 0) / vals.length

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

// ── Local: per-muscle state ─────────────────────────────────────────────────

export interface MuscleState {
  id: string
  name: string
  parentId: string | null
  /** No other group names this one as parent (Chest is top-level AND a leaf). */
  leaf: boolean
  /** Fractional (level-weighted) sets within the cycle window. */
  sets: number
  /** Days since the last stimulus over all history; null = never trained. */
  daysSince: number | null
  /** Inside the post-session recovery window right now. */
  recovering: boolean
  /** sets / CYCLE_SET_TARGET, uncapped — drives the map's stimulus ramp. */
  fillFraction: number
}

/**
 * Per-muscle fused state: level-weighted set volume over the last
 * {@link CYCLE_WINDOW_DAYS} days plus recency. Values are *direct* per group
 * (same shape as `muscleCoverage`); parents are not rolled up here.
 */
export function muscleStates(
  weights: WeightEntry[],
  exerciseMuscles: ExerciseMuscleLink[],
  muscleGroups: MuscleGroup[],
  date: string = today(),
): MuscleState[] {
  const byExercise = new Map<string, ExerciseMuscleLink[]>()
  for (const l of exerciseMuscles) {
    if (l.contribution !== 'stimulus') continue
    const k = l.exercise.toLowerCase()
    const arr = byExercise.get(k) ?? []
    arr.push(l)
    byExercise.set(k, arr)
  }

  const sets: Record<string, number> = {}
  const lastDate: Record<string, string> = {}
  for (const w of weights) {
    if (w.date > date) continue
    const links = byExercise.get(w.exercise.toLowerCase())
    if (!links) continue
    const inWindow = daysBetween(w.date, date) < CYCLE_WINDOW_DAYS
    for (const l of links) {
      if (inWindow) sets[l.group] = (sets[l.group] ?? 0) + w.sets.length * (LEVEL_WEIGHT[l.level] ?? 0)
      if (!lastDate[l.group] || w.date > lastDate[l.group]) lastDate[l.group] = w.date
    }
  }

  const parentIds = new Set(muscleGroups.map(g => g.parentId).filter(Boolean))
  return muscleGroups.map(g => {
    const s = +(sets[g.name] ?? 0).toFixed(2)
    const last = lastDate[g.name]
    const daysSince = last ? daysBetween(last, date) : null
    return {
      id: g.id,
      name: g.name,
      parentId: g.parentId ?? null,
      leaf: !parentIds.has(g.id),
      sets: s,
      daysSince,
      recovering: daysSince !== null && daysSince < RECOVER_DAYS,
      fillFraction: +(s / CYCLE_SET_TARGET).toFixed(3),
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
 * judged against its grounded staleness window. Cardio classifies via Training
 * Effect (multi-quality); a sport session counts by duration, defaulting to
 * VO₂max — the typical intermittent-sport stimulus.
 */
export function qualityStates(
  cardio: CardioEntry[],
  sports: SportEntry[],
  date: string = today(),
): QualityState[] {
  const last: Partial<Record<string, string>> = {}
  const feed = (q: string, d: string) => {
    if (!(q in QUALITY_STALENESS_DAYS)) return
    const cur = last[q]
    if (!cur || d > cur) last[q] = d
  }
  for (const c of cardio) {
    if (c.date > date) continue
    for (const a of classifyCardioAdaptations(c)) feed(a, c.date)
  }
  for (const s of sports) {
    if (s.date > date) continue
    feed(s.duration ? classifyCardioByDuration(s.duration) : 'vo2max', s.date)
  }
  return (Object.keys(QUALITY_STALENESS_DAYS) as WholeBodyQuality[]).map(key => {
    const windowDays = QUALITY_STALENESS_DAYS[key]
    const d = last[key]
    const daysSince = d ? daysBetween(d, date) : null
    return { key, daysSince, windowDays, stale: daysSince === null || daysSince > windowDays }
  })
}

// ── Systemic: readiness + verdict ───────────────────────────────────────────

/** Baseline-relative HRV scoring (the grounded method — Vesterinen 2016,
 * Buchheit 2014): the 7-day rolling mean is placed against a 60-day baseline
 * in SD units. 50 = at baseline; a rolling mean 1 SD below scores 0. Single
 * bad nights barely move it — the literature calls them too noisy to act on.
 * The 0–100 shape and the 50/50 blend with sleep are convention, see
 * docs/roadmap/010-home-fused-reads.md#grounding */
const HRV_ROLLING_DAYS = 7
const HRV_BASELINE_DAYS = 60
const MIN_HRV_BASELINE_SAMPLES = 7
/** SD floor as a fraction of the baseline mean — guards a near-zero SD while
 * the Garmin history is still short. */
const HRV_SD_FLOOR = 0.05

export interface SystemicReadiness {
  /** 0–100 composite; null when nothing fresh enough to score. */
  readiness: number | null
  basis: 'sleep+hrv' | 'sleep' | 'hrv' | 'none'
  /** Last night's Garmin sleep score, if fresh (≤ 1 day old). */
  sleepScore: number | null
  /** Last night's overnight HRV in ms, if fresh. */
  hrv: number | null
  /** Baseline-relative HRV sub-score 0–100; null without a fresh value + baseline. */
  hrvScore: number | null
}

/**
 * The systemic gate's number: last night's sleep score blended 50/50 with the
 * baseline-relative HRV sub-score. Degrades honestly — sleep-only without an
 * HRV baseline, null without a fresh night at all. Advisory input to
 * {@link fusedVerdict}; never splits per adaptation (doctrine P5).
 */
export function systemicReadiness(sleep: SleepEntry[], date: string = today()): SystemicReadiness {
  // "Last night" with one day of sync grace (log_date is the wake date).
  const fresh = sleep
    .filter(e => e.date <= date && daysBetween(e.date, date) <= 1)
    .sort((a, b) => b.date.localeCompare(a.date))
  const sleepScore = fresh.find(e => e.score != null)?.score ?? null
  const hrv = fresh.find(e => e.hrv != null)?.hrv ?? null

  let hrvScore: number | null = null
  if (hrv !== null) {
    const series = sleep.filter(e =>
      e.hrv != null && e.date <= date && daysBetween(e.date, date) < HRV_BASELINE_DAYS)
    if (series.length >= MIN_HRV_BASELINE_SAMPLES) {
      const vals = series.map(e => e.hrv as number)
      const mean = avg(vals)
      const sd = Math.max(
        Math.sqrt(avg(vals.map(v => (v - mean) ** 2))),
        HRV_SD_FLOOR * mean,
      )
      const rolling = series
        .filter(e => daysBetween(e.date, date) < HRV_ROLLING_DAYS)
        .map(e => e.hrv as number)
      if (rolling.length > 0) {
        hrvScore = clamp(Math.round(50 + 50 * ((avg(rolling) - mean) / sd)), 0, 100)
      }
    }
  }

  const basis =
    sleepScore !== null && hrvScore !== null ? 'sleep+hrv'
    : sleepScore !== null ? 'sleep'
    : hrvScore !== null ? 'hrv'
    : 'none'
  const readiness =
    basis === 'sleep+hrv' ? Math.round(((sleepScore as number) + (hrvScore as number)) / 2)
    : basis === 'sleep' ? sleepScore
    : basis === 'hrv' ? hrvScore
    : null
  return { readiness, basis, sleepScore, hrv, hrvScore }
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

export interface WaterStatus {
  /** Most recent day with a log; null = never. */
  lastDate: string | null
  daysSince: number | null
  /** Total ml logged on that day. */
  lastDayMl: number
}

export function waterStatus(water: WaterEntry[], date: string = today()): WaterStatus {
  let lastDate: string | null = null
  for (const w of water) {
    if (w.date > date) continue
    if (!lastDate || w.date > lastDate) lastDate = w.date
  }
  const lastDayMl = lastDate
    ? water.filter(w => w.date === lastDate).reduce((s, w) => s + w.amountMl, 0)
    : 0
  return { lastDate, daysSince: lastDate ? daysBetween(lastDate, date) : null, lastDayMl }
}

export interface FusedVerdict {
  mode: 'push' | 'hold'
  /** What flipped it to hold; null on a push day. */
  cause: 'readiness' | 'donation' | null
}

/**
 * The gated instruction. Advisory only — it changes the instruction, never the
 * facts, and capture never locks. Missing readiness data cannot gate.
 */
export function fusedVerdict(readiness: number | null, donation?: DonationStatus): FusedVerdict {
  if (donation?.acuteHold) return { mode: 'hold', cause: 'donation' }
  if (readiness !== null && readiness < PUSH_THRESHOLD) return { mode: 'hold', cause: 'readiness' }
  return { mode: 'push', cause: null }
}
