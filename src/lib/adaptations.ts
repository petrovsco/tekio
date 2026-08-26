import type {
  Adaptation, WeightEntry, CardioEntry, SportEntry, ExerciseMuscleLink, MuscleGroup,
  Habit, HabitCompletion,
} from '../types'
import { ADAPTATIONS, ADAPTATION_MAP, defaultAdaptationForExercise } from '../constants/adaptations'
import { LEVEL_WEIGHT, habitCompletionSets, today } from './utils'

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

/** Classify a single logged resistance set. An exercise `override` wins over reps. */
export function classifyWeightSet(reps: number, override?: Adaptation | null): Adaptation {
  if (override) return override
  for (const a of REP_DERIVED) {
    if (reps <= a.repRange![1]) return a.key
  }
  // Above every range's ceiling — the highest-rep adaptation still applies.
  return REP_DERIVED[REP_DERIVED.length - 1].key
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
  children: MuscleStatusRow[]
}

export interface AdaptationSummary {
  key: Adaptation
  /** Primary weekly volume: set count (resistance) or session count (cardio/skill). */
  volume: number
  unit: 'sets' | 'sessions'
  /** Top-level muscle rows with rolled-up children (resistance adaptations only). */
  muscles: MuscleStatusRow[]
  /** On-track / worked / total counts over the *tracked* muscle subset (resistance only). */
  onTrack: number
  worked: number
  totalMuscles: number
  /** Weekly session target for cardio/skill adaptations (0 for resistance). */
  sessionTarget: number
  /**
   * Whether the adaptation's weekly target is fully met — every tracked muscle
   * on track (resistance), or the session target reached (cardio/skill). Drives
   * the "adaptations trained" counter.
   */
  met: boolean
}

function statusFor(aggSets: number, target: number): MuscleStatus {
  if (aggSets <= 0) return 'untouched'
  if (aggSets >= target) return 'on_track'
  return 'needs_work'
}

const inRange = (d: string, start: string, end: string) => d >= start && d <= end

/**
 * Per-adaptation weekly coverage across all modalities for [weekStart, date].
 * Resistance adaptations get a rolled-up muscle-group breakdown with status;
 * cardio/skill adaptations report session counts.
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
    /** Manual habits + their completions, folded into resistance adaptations. */
    habits?: Habit[]
    habitCompletions?: HabitCompletion[]
    /** exercise id → name, for resolving exercise-linked habits. */
    exerciseNames?: Record<string, string>
  },
): Record<Adaptation, AdaptationSummary> {
  const { weights, cardio, sports, exerciseMuscles, muscleGroups, weekStart, overrides, targets } = args
  const date = args.date ?? today()
  const trackedSet = args.trackedMuscleIds && args.trackedMuscleIds.length > 0
    ? new Set(args.trackedMuscleIds)
    : null

  // exercise (lower) → stimulus links
  const linksByExercise = new Map<string, ExerciseMuscleLink[]>()
  for (const l of exerciseMuscles) {
    if (l.contribution !== 'stimulus') continue
    const k = l.exercise.toLowerCase()
    const arr = linksByExercise.get(k) ?? []
    arr.push(l)
    linksByExercise.set(k, arr)
  }

  const volume = {} as Record<Adaptation, number>
  // adaptation → groupName → weighted sets
  const muscle = {} as Record<Adaptation, Record<string, number>>
  for (const a of ADAPTATIONS) {
    volume[a.key] = 0
    muscle[a.key] = {}
  }

  // Resistance work, classified per set.
  for (const w of weights) {
    if (!inRange(w.date, weekStart, date)) continue
    const override = resolveExerciseAdaptation(w.exercise, overrides)
    const links = linksByExercise.get(w.exercise.toLowerCase())
    for (const set of w.sets) {
      const a = classifyWeightSet(set.reps, override)
      volume[a] += 1
      if (links) {
        for (const l of links) {
          muscle[a][l.group] = (muscle[a][l.group] ?? 0) + (LEVEL_WEIGHT[l.level] ?? 0)
        }
      }
    }
  }

  // Cardio sessions. A Garmin ride can count toward multiple adaptations (e.g.
  // VO₂max + anaerobic) when several systems each got a real Training Effect.
  for (const c of cardio) {
    if (!inRange(c.date, weekStart, date)) continue
    for (const a of classifyCardioAdaptations(c)) volume[a] += 1
  }

  // Sport sessions count as cardio work, classified by duration like a cardio
  // session. Sessions without a logged duration default to VO₂max — the typical
  // intermittent-sport stimulus. They no longer feed the `skill` adaptation.
  for (const s of sports) {
    if (!inRange(s.date, weekStart, date)) continue
    const a = s.duration ? classifyCardioByDuration(s.duration) : 'vo2max'
    volume[a] += 1
  }

  // Manual habit completions that produce a stimulus. Recovery contributions
  // aren't one of the nine adaptations, so they're ignored here (they surface on
  // the Muscle Coverage recovery axis instead). A repless habit can only be
  // classified via its exercise's adaptation tag, so muscle-linked stimulus
  // habits — which have no exercise, hence no adaptation — are skipped.
  const habitById = new Map((args.habits ?? []).map(h => [h.id, h]))
  const exerciseNames = args.exerciseNames ?? {}
  for (const c of args.habitCompletions ?? []) {
    if (c.count <= 0 || !inRange(c.periodStart, weekStart, date)) continue
    const h = habitById.get(c.habitId)
    if (!h || !h.active || h.autoSource !== 'none' || !h.exerciseId) continue
    const name = exerciseNames[h.exerciseId]?.toLowerCase()
    if (!name) continue
    const a = resolveExerciseAdaptation(name, overrides)
    if (!a) continue
    const stimLinks = (linksByExercise.get(name) ?? [])
    if (stimLinks.length === 0) continue
    // One completion = one bout = one set; `count` is progress in the habit's own
    // unit (e.g. seconds held), so it must not be summed as a set count.
    const nSets = habitCompletionSets(h, c.count)
    if (nSets <= 0) continue
    volume[a] += nSets
    for (const l of stimLinks) {
      muscle[a][l.group] = (muscle[a][l.group] ?? 0) + nSets * (LEVEL_WEIGHT[l.level] ?? 0)
    }
  }

  const out = {} as Record<Adaptation, AdaptationSummary>
  for (const meta of ADAPTATIONS) {
    const muscleTarget = targets?.[meta.key]?.weeklyMuscleTarget ?? meta.weeklyMuscleTarget
    const sessionTarget = targets?.[meta.key]?.weeklySessionTarget ?? meta.weeklySessionTarget
    const isResistance = meta.modality === 'resistance' && muscleTarget > 0
    const byGroup = muscle[meta.key]
    const muscles = isResistance
      ? buildMuscleStatusTree(byGroup, muscleGroups, muscleTarget)
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
            status: statusFor(sets, target), children: [],
          }
        })
      const selfSets = direct(top.name)
      const aggSets = +(selfSets + children.reduce((s, c) => s + c.sets, 0)).toFixed(2)
      return {
        id: top.id, name: top.name, parentId: null,
        sets: selfSets, aggSets, target,
        status: statusFor(aggSets, target),
        children: children.sort((a, b) => b.sets - a.sets || a.name.localeCompare(b.name)),
      }
    })
    .sort((a, b) => b.aggSets - a.aggSets || a.name.localeCompare(b.name))
}

/** Convenience: total tracked volume across all adaptations this week. */
export function totalAdaptationVolume(cov: Record<Adaptation, AdaptationSummary>): number {
  return ADAPTATIONS.reduce((s, a) => s + cov[a.key].volume, 0)
}

export { ADAPTATIONS, ADAPTATION_MAP }
