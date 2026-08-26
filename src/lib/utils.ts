import type {
  WeightEntry, Program, ProgramDay, ProgramWeekOverride, MobilityEntry, DayOfWeek,
  Habit, HabitCompletion, HabitCadence, HabitProgress, ExerciseMuscleLink, MuscleGroup,
  MuscleContribution, WaterEntry, CardioEntry, LiftSet,
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

// ── Habits / Milestones ───────────────────────────────────────────────────────

/** Start (YYYY-MM-DD) of the period a date belongs to, given a habit's cadence. */
export function habitPeriodStart(
  cadence: HabitCadence,
  date: string = today(),
  weekStart: WeekStartDay = 'monday',
): string {
  if (cadence === 'weekly') return startOfWeek(date, weekStart)
  if (cadence === 'monthly') return `${date.slice(0, 7)}-01`
  return date
}

/** Self + immediate children muscle-group names (lowercased) for a linked group id. */
function groupAndDescendantNames(muscleGroupId: string, groups: MuscleGroup[]): Set<string> {
  const out = new Set<string>()
  const root = groups.find(g => g.id === muscleGroupId)
  if (!root) return out
  out.add(root.name.toLowerCase())
  for (const g of groups) if (g.parentId === muscleGroupId) out.add(g.name.toLowerCase())
  return out
}

/** Exercise names whose sets count toward a weight_sets habit. */
function targetExerciseNames(habit: Habit, ctx: HabitProgressContext): Set<string> {
  const names = new Set<string>()
  if (habit.exerciseId && ctx.exerciseNames?.[habit.exerciseId]) {
    names.add(ctx.exerciseNames[habit.exerciseId].toLowerCase())
    return names
  }
  if (habit.muscleGroupId) {
    const groupNames = groupAndDescendantNames(habit.muscleGroupId, ctx.muscleGroups)
    for (const l of ctx.exerciseMuscles) {
      if (l.contribution !== 'stimulus' || l.level > habit.countLevel) continue
      if (groupNames.has(l.group.toLowerCase())) names.add(l.exercise.toLowerCase())
    }
  }
  return names
}

export interface HabitProgressContext {
  weights: WeightEntry[]
  mobility: MobilityEntry[]
  water: WaterEntry[]
  cardio: CardioEntry[]
  habitCompletions: HabitCompletion[]
  exerciseMuscles: ExerciseMuscleLink[]
  muscleGroups: MuscleGroup[]
  /** exercise id → name, for exercise-linked auto habits. */
  exerciseNames?: Record<string, string>
}

/** Live progress of a habit toward its target for the current period. */
export function habitProgress(
  habit: Habit,
  ctx: HabitProgressContext,
  date: string = today(),
  weekStart: WeekStartDay = 'monday',
): HabitProgress {
  const periodStart = habitPeriodStart(habit.cadence, date, weekStart)
  const inPeriod = (d: string) => d >= periodStart && d <= date
  let current = 0

  switch (habit.autoSource) {
    case 'water':
      current = ctx.water.filter(w => inPeriod(w.date)).reduce((s, w) => s + w.amountMl, 0)
      break
    case 'weight_sets': {
      const names = targetExerciseNames(habit, ctx)
      current = ctx.weights
        .filter(w => inPeriod(w.date) && names.has(w.exercise.toLowerCase()))
        .reduce((s, w) => s + w.sets.length, 0)
      break
    }
    case 'mobility_minutes': {
      const groupNames = habit.muscleGroupId
        ? groupAndDescendantNames(habit.muscleGroupId, ctx.muscleGroups)
        : null
      const exName = habit.exerciseId ? ctx.exerciseNames?.[habit.exerciseId]?.toLowerCase() : null
      for (const m of ctx.mobility) {
        if (!inPeriod(m.date)) continue
        for (const e of m.exercises) {
          const matchesEx = exName != null && e.name.toLowerCase() === exName
          const matchesGroup =
            groupNames != null && (e.muscleGroups ?? []).some(g => groupNames.has(g.toLowerCase()))
          if (matchesEx || matchesGroup || (groupNames == null && exName == null)) current += e.duration
        }
      }
      break
    }
    case 'cardio_sessions':
      current = ctx.cardio.filter(c => inPeriod(c.date)).length
      break
    case 'none':
    default:
      current = ctx.habitCompletions
        .filter(c => c.habitId === habit.id && c.periodStart === periodStart)
        .reduce((s, c) => s + c.count, 0)
      break
  }

  const target = habit.targetCount || 1
  return { current, target, done: current >= target, periodStart }
}

// ── Muscle coverage dashboard ─────────────────────────────────────────────────

/** Impact weight per link level (1 = most direct). */
export const LEVEL_WEIGHT: Record<number, number> = { 1: 1, 2: 0.5, 3: 0.25 }

/**
 * Weighted-set quantity a single manual-habit completion contributes toward
 * training stimulus / recovery. One completion is one *bout* of the habit, so it
 * counts as a single set — its `count` is progress in the habit's own unit
 * (seconds held, reps, ml), NOT a number of sets. Without this, a "hold 60 s"
 * habit would land as 60 sets. Only habits explicitly measured in `sets` scale
 * with count.
 */
export function habitCompletionSets(habit: Habit, count: number): number {
  if (count <= 0) return 0
  return habit.unit === 'sets' ? count : 1
}

/** One muscle a habit tick credits, with its impact level & stimulus/recovery side. */
export interface HabitMuscleContribution {
  group: string
  level: 1 | 2 | 3
  contribution: MuscleContribution
}

/**
 * The muscle-group impact of ticking a manual habit once, honouring "log an
 * exercise, count its overall impact":
 * - Exercise-linked habits fold into that exercise's full muscle map, keeping
 *   each link's own level & stimulus/recovery contribution (so a dual-purpose
 *   exercise like Dead Hang credits grip stimulus *and* shoulder recovery).
 * - Muscle-linked habits credit that single group, with the direction taken
 *   from the habit's own `contribution` and impact from its `countLevel`.
 * Auto-sourced habits are intentionally excluded by the caller (their progress
 * already derives from real weight/mobility logs — folding them double-counts).
 */
export function habitMuscleContributions(
  habit: Habit,
  exerciseMuscles: ExerciseMuscleLink[],
  muscleGroups: MuscleGroup[],
  exerciseNames: Record<string, string>,
): HabitMuscleContribution[] {
  if (habit.exerciseId) {
    const name = exerciseNames[habit.exerciseId]?.toLowerCase()
    if (!name) return []
    return exerciseMuscles
      .filter(l => l.exercise.toLowerCase() === name)
      .map(l => ({ group: l.group, level: l.level, contribution: l.contribution }))
  }
  if (habit.muscleGroupId) {
    const g = muscleGroups.find(mg => mg.id === habit.muscleGroupId)
    if (!g) return []
    return [{ group: g.name, level: habit.countLevel, contribution: habit.contribution }]
  }
  return []
}

export interface MuscleCoverageRow {
  id: string
  name: string
  parentId: string | null
  /** Weighted stimulus (Σ sets × level weight) within the week. */
  stimulus: number
  /** Recovery minutes (mobility / recovery-tagged work) within the week. */
  recovery: number
}

/**
 * Direct per-muscle-group stimulus & recovery for [weekStartDate, date].
 * Values are *direct* (not rolled up); callers roll up to parents via `parentId`.
 */
export function muscleCoverage(
  weights: WeightEntry[],
  mobility: MobilityEntry[],
  exerciseMuscles: ExerciseMuscleLink[],
  muscleGroups: MuscleGroup[],
  weekStartDate: string,
  date: string = today(),
  habits: Habit[] = [],
  habitCompletions: HabitCompletion[] = [],
  exerciseNames: Record<string, string> = {},
): MuscleCoverageRow[] {
  const byExercise = new Map<string, ExerciseMuscleLink[]>()
  for (const l of exerciseMuscles) {
    const k = l.exercise.toLowerCase()
    const arr = byExercise.get(k) ?? []
    arr.push(l)
    byExercise.set(k, arr)
  }

  const stim: Record<string, number> = {}
  const rec: Record<string, number> = {}

  for (const w of weights) {
    if (w.date < weekStartDate || w.date > date) continue
    const links = byExercise.get(w.exercise.toLowerCase())
    if (!links) continue
    for (const l of links) {
      if (l.contribution !== 'stimulus') continue
      stim[l.group] = (stim[l.group] ?? 0) + w.sets.length * (LEVEL_WEIGHT[l.level] ?? 0)
    }
  }

  for (const m of mobility) {
    if (m.date < weekStartDate || m.date > date) continue
    for (const e of m.exercises) {
      const groups = new Set<string>(e.muscleGroups ?? [])
      const links = byExercise.get(e.name.toLowerCase())
      if (links) for (const l of links) if (l.contribution === 'recovery') groups.add(l.group)
      for (const g of groups) rec[g] = (rec[g] ?? 0) + e.duration
    }
  }

  // Manual habit completions. Auto-sourced habits already derive from real
  // weight/mobility logs (counted above), so only fold `none` habits here.
  const habitById = new Map(habits.map(h => [h.id, h]))
  for (const c of habitCompletions) {
    if (c.count <= 0 || c.periodStart < weekStartDate || c.periodStart > date) continue
    const h = habitById.get(c.habitId)
    if (!h || !h.active || h.autoSource !== 'none') continue
    const nSets = habitCompletionSets(h, c.count)
    if (nSets <= 0) continue
    for (const mc of habitMuscleContributions(h, exerciseMuscles, muscleGroups, exerciseNames)) {
      if (mc.contribution === 'recovery') rec[mc.group] = (rec[mc.group] ?? 0) + nSets
      else stim[mc.group] = (stim[mc.group] ?? 0) + nSets * (LEVEL_WEIGHT[mc.level] ?? 0)
    }
  }

  return muscleGroups.map(g => ({
    id: g.id,
    name: g.name,
    parentId: g.parentId ?? null,
    stimulus: +(stim[g.name] ?? 0).toFixed(2),
    recovery: +(rec[g.name] ?? 0).toFixed(2),
  }))
}

/**
 * Total manual recovery-habit bouts within [weekStartDate, date] — the input to
 * the Recovery/Readiness axis's "Habits" sub-score. A bout counts if the habit
 * credits recovery on at least one muscle group (see `habitMuscleContributions`);
 * exercise-linked habits can be dual-purpose (e.g. Dead Hang = grip stimulus +
 * shoulder recovery), so this checks the resolved contributions rather than a
 * single habit-level flag. Auto-sourced habits are excluded — their progress
 * already derives from real mobility/weight logs counted elsewhere in the
 * readiness roll-up, so folding them here would double-count.
 */
export function recoveryHabitSets(
  habits: Habit[],
  habitCompletions: HabitCompletion[],
  exerciseMuscles: ExerciseMuscleLink[],
  muscleGroups: MuscleGroup[],
  exerciseNames: Record<string, string>,
  weekStartDate: string,
  date: string = today(),
): number {
  const habitById = new Map(habits.map(h => [h.id, h]))
  let total = 0
  for (const c of habitCompletions) {
    if (c.count <= 0 || c.periodStart < weekStartDate || c.periodStart > date) continue
    const h = habitById.get(c.habitId)
    if (!h || !h.active || h.autoSource !== 'none') continue
    const contributions = habitMuscleContributions(h, exerciseMuscles, muscleGroups, exerciseNames)
    if (!contributions.some(mc => mc.contribution === 'recovery')) continue
    total += habitCompletionSets(h, c.count)
  }
  return total
}
