import type {
  Adaptation, WeightEntry, CardioEntry, SportEntry, ExerciseMuscleLink, MuscleGroup,
} from '../types'
import { ADAPTATIONS, ADAPTATION_MAP, defaultAdaptationForExercise } from '../constants/adaptations'
import { LEVEL_WEIGHT, today } from './utils'

// ── Classification ─────────────────────────────────────────────────────────────

/**
 * Adaptation an exercise is *always* trained for, regardless of reps.
 * Precedence: user override map → built-in keyword defaults → null (use reps).
 */
export function resolveExerciseAdaptation(
  exercise: string,
  overrides?: Record<string, Adaptation>,
): Adaptation | null {
  const key = exercise.toLowerCase()
  if (overrides && overrides[key]) return overrides[key]
  return defaultAdaptationForExercise(exercise)
}

/**
 * Rep-derived adaptations, ordered by their range's lower bound. Derived from
 * `repRange` so the boundaries have exactly one home — see
 * docs/grounding-inventory.md §2.
 */
const REP_DERIVED = ADAPTATIONS
  .filter(a => a.repRange !== null)
  .sort((a, b) => a.repRange![0] - b.repRange![0])

/**
 * Every adaptation a single logged resistance set trains. An exercise
 * `override` wins outright (one quality, whatever the reps); otherwise every
 * rep-derived adaptation whose `repRange` covers the set is returned, in
 * continuum order. Bands may overlap, and a set inside an overlap counts in
 * full toward each — the model cardio already uses (roadmap 039 §6.0). A set
 * outside every band snaps to the nearest one.
 */
export function classifyWeightSet(reps: number, override?: Adaptation | null): Adaptation[] {
  if (override) return [override]
  const hits = REP_DERIVED.filter(a => reps >= a.repRange![0] && reps <= a.repRange![1])
  if (hits.length > 0) return hits.map(a => a.key)
  const edge = reps < REP_DERIVED[0].repRange![0] ? REP_DERIVED[0] : REP_DERIVED[REP_DERIVED.length - 1]
  return [edge.key]
}

/**
 * Classify a session by duration. Without HR/intensity we use duration as a
 * proxy: long steady state = endurance; medium = VO₂max intervals; short =
 * anaerobic. Shared by cardio and sport sessions, and the fallback for Garmin
 * rides that lack Training-Effect data.
 */
export function classifyCardioByDuration(minutes: number): Adaptation {
  if (minutes >= 25) return 'endurance'
  if (minutes >= 8) return 'vo2max'
  return 'anaerobic_capacity'
}

/** Training Effect at/above this counts as a real stimulus for that system. */
export const TE_STIMULUS_THRESHOLD = 2.0

/**
 * Whether a session's *aerobic* work was high-intensity (VO₂max) rather than
 * base/endurance. Garmin reports a single aerobic Training Effect, so the
 * endurance-vs-VO₂max split comes from its primary-benefit label, then the HR
 * zone distribution; unlabelled aerobic work defaults to base/endurance.
 */
function aerobicIsHighIntensity(entry: CardioEntry): boolean {
  const label = entry.trainingEffectLabel?.toUpperCase() ?? ''
  if (/RECOVERY|BASE/.test(label)) return false
  if (/TEMPO|THRESHOLD|VO2|VO₂|ANAEROBIC|SPRINT|SPEED/.test(label)) return true
  const z = entry.zoneDistribution
  if (z && z.length >= 5) {
    const easy = (z[0] ?? 0) + (z[1] ?? 0) // Z1–Z2
    const hard = (z[3] ?? 0) + (z[4] ?? 0) // Z4–Z5
    return hard > easy
  }
  return false
}

/**
 * The cardio adaptations a session counts toward.
 *
 * With Garmin Training Effect present: award the dominant system, plus any
 * system whose TE ≥ {@link TE_STIMULUS_THRESHOLD} — so a hard ride counts as a
 * full session for *both* VO₂max and anaerobic capacity. The single aerobic TE
 * maps to endurance or VO₂max by intensity (label / HR zones). Without TE data,
 * falls back to the duration heuristic (a single adaptation).
 */
export function classifyCardioAdaptations(entry: CardioEntry): Adaptation[] {
  if (entry.aerobicTe == null && entry.anaerobicTe == null) {
    return [classifyCardioByDuration(entry.duration)]
  }
  const aerobic = entry.aerobicTe ?? 0
  const anaerobic = entry.anaerobicTe ?? 0
  const aerobicBucket: Adaptation = aerobicIsHighIntensity(entry) ? 'vo2max' : 'endurance'

  const result = new Set<Adaptation>()
  // A session always trains *something*: the dominant system counts even below
  // threshold.
  result.add(anaerobic > aerobic ? 'anaerobic_capacity' : aerobicBucket)
  // Plus any system that cleared the stimulus threshold.
  if (aerobic >= TE_STIMULUS_THRESHOLD) result.add(aerobicBucket)
  if (anaerobic >= TE_STIMULUS_THRESHOLD) result.add('anaerobic_capacity')
  return [...result]
}

/** Dominant single adaptation for a session (first of {@link classifyCardioAdaptations}). */
export function classifyCardio(entry: CardioEntry): Adaptation {
  return classifyCardioAdaptations(entry)[0]
}

// ── Muscle stimulus — the one accounting (roadmap 039 §6) ──────────────────────

/** The four muscle-linked qualities (doctrine P2 — they read per muscle). */
export const MUSCLE_QUALITIES = ['strength', 'hypertrophy', 'muscular_endurance', 'power'] as const
export type MuscleQuality = typeof MUSCLE_QUALITIES[number]

const isMuscleQuality = (a: Adaptation): a is MuscleQuality =>
  (MUSCLE_QUALITIES as readonly string[]).includes(a)

const perQuality = <T>(make: () => T): Record<MuscleQuality, T> =>
  Object.fromEntries(MUSCLE_QUALITIES.map(q => [q, make()])) as Record<MuscleQuality, T>

export interface MuscleStimulus {
  /** Level-weighted *hard* sets per muscle group, each set counted once — a set
   *  is one set of work for the muscle however many qualities it trains. Power
   *  sets are not hard sets (never near failure) and are left out: the floor
   *  this is measured against was grounded on hard sets (039 S3). */
  total: Record<string, number>
  /** Level-weighted sets per muscle group per quality. A set counts in full for
   *  every quality whose rep band covers it, so over the three hard qualities
   *  (strength, hypertrophy, muscular endurance) each muscle satisfies
   *  max_q byQuality[q] ≤ total ≤ Σ_q byQuality[q]; `power` sits outside. */
  byQuality: Record<MuscleQuality, Record<string, number>>
  /** Plain set counts per quality (no muscle weighting), same multi-membership. */
  sets: Record<MuscleQuality, number>
}

/**
 * Level-weighted resistance stimulus per muscle group inside the inclusive date
 * window [from, to]. Home's map (the 42-day cycle window) and the Adaptations
 * tab (week-to-date) both read this — one accounting; the window is the only
 * thing that differs, and each surface names its window on screen. Only
 * `stimulus` links count; recovery links never add sets. A power set (override
 * or keyword) counts in `byQuality.power` only, never in `total` — see
 * docs/grounding/039-adaptations-read.md#grounding (S3). An override
 * naming a cardio quality still counts in `total` (the muscle did the work) and
 * in no `byQuality` bucket. See the same brief, §6.
 */
export function muscleStimulus(
  weights: WeightEntry[],
  exerciseMuscles: ExerciseMuscleLink[],
  window: { from: string; to: string },
  overrides?: Record<string, Adaptation>,
): MuscleStimulus {
  const linksByExercise = new Map<string, ExerciseMuscleLink[]>()
  for (const l of exerciseMuscles) {
    if (l.contribution !== 'stimulus') continue
    const k = l.exercise.toLowerCase()
    const arr = linksByExercise.get(k) ?? []
    arr.push(l)
    linksByExercise.set(k, arr)
  }

  const total: Record<string, number> = {}
  const byQuality = perQuality<Record<string, number>>(() => ({}))
  const sets = perQuality(() => 0)
  for (const w of weights) {
    if (w.date < window.from || w.date > window.to) continue
    const override = resolveExerciseAdaptation(w.exercise, overrides)
    const links = linksByExercise.get(w.exercise.toLowerCase()) ?? []
    for (const set of w.sets) {
      const qualities = classifyWeightSet(set.reps, override).filter(isMuscleQuality)
      const hard = !qualities.includes('power')
      for (const q of qualities) sets[q] += 1
      for (const l of links) {
        const lw = LEVEL_WEIGHT[l.level] ?? 0
        if (!lw) continue // zero-weight tier (level 3, roadmap 042): no sets, no key
        if (hard) total[l.group] = (total[l.group] ?? 0) + lw
        for (const q of qualities) byQuality[q][l.group] = (byQuality[q][l.group] ?? 0) + lw
      }
    }
  }
  const round = (r: Record<string, number>) => { for (const k in r) r[k] = +r[k].toFixed(2) }
  round(total)
  for (const q of MUSCLE_QUALITIES) round(byQuality[q])
  return { total, byQuality, sets }
}

/** Resistance sets logged inside [from, to], each counted once — the honest
 *  "lifting sets" figure. Summing per-adaptation volumes double counts under
 *  overlap. */
export function weightSetsIn(weights: WeightEntry[], from: string, to: string): number {
  let n = 0
  for (const w of weights) if (inRange(w.date, from, to)) n += w.sets.length
  return n
}

// ── Coverage ────────────────────────────────────────────────────────────────────

export type MuscleStatus = 'on_track' | 'needs_work' | 'untouched'

export interface MuscleStatusRow {
  id: string
  name: string
  parentId: string | null
  /** Weighted sets toward this adaptation this week (self only). */
  sets: number
  /** Weighted sets including immediate children. */
  aggSets: number
  target: number
  status: MuscleStatus
  /** aggSets / target, uncapped — the same ramp input Home's map uses (039 §6.1). */
  fillFraction: number
  children: MuscleStatusRow[]
}

export interface AdaptationSummary {
  key: Adaptation
  /** Primary weekly volume: set count (resistance) or session count (cardio). */
  volume: number
  unit: 'sets' | 'sessions'
  /** Top-level muscle rows with rolled-up children (resistance adaptations only). */
  muscles: MuscleStatusRow[]
  /** On-track / worked / total counts over the *tracked* muscle subset (resistance only). */
  onTrack: number
  worked: number
  totalMuscles: number
  /** Weekly session target for the cardio adaptations (0 for resistance). */
  sessionTarget: number
  /**
   * Whether the adaptation's weekly target is fully met — every tracked muscle
   * on track (resistance), or the session target reached (cardio). Drives the
   * "adaptations trained" counter.
   */
  met: boolean
}

// statusFor — three states are a label of a continuous fill (sets ÷ floor), not three physiological
// bands: stimulus is graded from the first set (Schoenfeld 2017, Pelland 2026, Krieger 2010; trained
// men at ~3 sets/wk still grow, Schoenfeld 2019). Only 0 (untouched) and ≥ floor carry meaning.
// See docs/grounding/039-adaptations-read.md#grounding
function statusFor(aggSets: number, target: number): MuscleStatus {
  if (aggSets <= 0) return 'untouched'
  if (aggSets >= target) return 'on_track'
  return 'needs_work'
}

const inRange = (d: string, start: string, end: string) => d >= start && d <= end

/**
 * Per-adaptation weekly coverage across all modalities for [weekStart, date].
 * Resistance adaptations get a rolled-up muscle-group breakdown with status;
 * cardio adaptations report session counts. Resistance sets come from
 * {@link muscleStimulus}, so a set inside a rep-band overlap counts toward every
 * quality it trains — the four muscle-linked volumes may add up to more than
 * the sets logged (roadmap 039 §6.0). The muscle read counts logged sets only;
 * habits never feed it (doctrine §5).
 */
export function adaptationCoverage(
  args: {
    weights: WeightEntry[]
    cardio: CardioEntry[]
    sports: SportEntry[]
    exerciseMuscles: ExerciseMuscleLink[]
    muscleGroups: MuscleGroup[]
    weekStart: string
    date?: string
    /** Optional exercise-name → adaptation overrides (lowercased keys). */
    overrides?: Record<string, Adaptation>
    /**
     * Top-level muscle-group ids the user tracks toward completion. Empty/omitted
     * counts every muscle group.
     */
    trackedMuscleIds?: string[]
    /**
     * Per-adaptation weekly target overrides (from the DB). Missing keys fall back
     * to the built-in defaults on each adaptation's metadata.
     */
    targets?: Partial<Record<Adaptation, { weeklyMuscleTarget: number; weeklySessionTarget: number }>>
  },
): Record<Adaptation, AdaptationSummary> {
  const { weights, cardio, sports, exerciseMuscles, muscleGroups, weekStart, overrides, targets } = args
  const date = args.date ?? today()
  const trackedSet = args.trackedMuscleIds && args.trackedMuscleIds.length > 0
    ? new Set(args.trackedMuscleIds)
    : null

  const stimulus = muscleStimulus(weights, exerciseMuscles, { from: weekStart, to: date }, overrides)

  const volume = {} as Record<Adaptation, number>
  for (const a of ADAPTATIONS) volume[a.key] = 0
  for (const q of MUSCLE_QUALITIES) volume[q] = stimulus.sets[q]

  // Cardio sessions. A Garmin ride can count toward multiple adaptations (e.g.
  // VO₂max + anaerobic) when several systems each got a real Training Effect.
  for (const c of cardio) {
    if (!inRange(c.date, weekStart, date)) continue
    for (const a of classifyCardioAdaptations(c)) volume[a] += 1
  }

  // Sport sessions count as cardio work, classified by duration like a cardio
  // session. Sessions without a logged duration default to VO₂max — the typical
  // intermittent-sport stimulus.
  for (const s of sports) {
    if (!inRange(s.date, weekStart, date)) continue
    const a = s.duration ? classifyCardioByDuration(s.duration) : 'vo2max'
    volume[a] += 1
  }

  const out = {} as Record<Adaptation, AdaptationSummary>
  for (const meta of ADAPTATIONS) {
    const muscleTarget = targets?.[meta.key]?.weeklyMuscleTarget ?? meta.weeklyMuscleTarget
    const sessionTarget = targets?.[meta.key]?.weeklySessionTarget ?? meta.weeklySessionTarget
    const isResistance = meta.modality === 'resistance' && muscleTarget > 0
    const muscles = isResistance && isMuscleQuality(meta.key)
      ? buildMuscleStatusTree(stimulus.byQuality[meta.key], muscleGroups, muscleTarget)
      : []
    // Judge completion against the tracked subset (or all muscles if none set).
    const relevant = trackedSet ? muscles.filter(m => trackedSet.has(m.id)) : muscles
    const onTrack = relevant.filter(m => m.status === 'on_track').length
    const met = isResistance
      ? relevant.length > 0 && onTrack === relevant.length
      : volume[meta.key] >= sessionTarget && sessionTarget > 0
    out[meta.key] = {
      key: meta.key,
      volume: volume[meta.key],
      unit: meta.modality === 'resistance' ? 'sets' : 'sessions',
      muscles,
      onTrack,
      worked: relevant.filter(m => m.status !== 'untouched').length,
      totalMuscles: relevant.length,
      sessionTarget,
      met,
    }
  }
  return out
}

/**
 * Rolls direct per-group weighted sets up into a top-level tree (parent +
 * immediate children), assigning each a status against `target`.
 */
export function buildMuscleStatusTree(
  byGroupName: Record<string, number>,
  groups: MuscleGroup[],
  target: number,
): MuscleStatusRow[] {
  const direct = (name: string) => +(byGroupName[name] ?? 0).toFixed(2)
  const fill = (n: number) => (target > 0 ? +(n / target).toFixed(3) : 0)

  const tops = groups.filter(g => !g.parentId)
  return tops
    .map(top => {
      const children = groups
        .filter(g => g.parentId === top.id)
        .map<MuscleStatusRow>(c => {
          const sets = direct(c.name)
          return {
            id: c.id, name: c.name, parentId: c.parentId ?? null,
            sets, aggSets: sets, target,
            status: statusFor(sets, target), fillFraction: fill(sets), children: [],
          }
        })
      const selfSets = direct(top.name)
      const aggSets = +(selfSets + children.reduce((s, c) => s + c.sets, 0)).toFixed(2)
      return {
        id: top.id, name: top.name, parentId: null,
        sets: selfSets, aggSets, target,
        status: statusFor(aggSets, target),
        fillFraction: fill(aggSets),
        children: children.sort((a, b) => b.sets - a.sets || a.name.localeCompare(b.name)),
      }
    })
    .sort((a, b) => b.aggSets - a.aggSets || a.name.localeCompare(b.name))
}

/** Convenience: > 0 iff anything counted this week. Not a set count — under
 *  overlap one set appears in several adaptations. */
export function totalAdaptationVolume(cov: Record<Adaptation, AdaptationSummary>): number {
  return ADAPTATIONS.reduce((s, a) => s + cov[a.key].volume, 0)
}

export { ADAPTATIONS, ADAPTATION_MAP }
