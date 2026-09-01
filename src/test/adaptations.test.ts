import { describe, it, expect } from 'vitest'
import {
  classifyWeightSet,
  classifyCardio,
  classifyCardioAdaptations,
  resolveExerciseAdaptation,
  adaptationCoverage,
  buildMuscleStatusTree,
} from '../lib/adaptations'
import type { CardioEntry, ExerciseMuscleLink, Habit, HabitCompletion, MuscleGroup, WeightEntry } from '../types'

// ── classifyWeightSet ─────────────────────────────────────────────────────────

describe('classifyWeightSet', () => {
  it('maps rep ranges to strength / hypertrophy / muscular endurance', () => {
    expect(classifyWeightSet(1)).toBe('strength')
    expect(classifyWeightSet(5)).toBe('strength')
    expect(classifyWeightSet(6)).toBe('hypertrophy')
    expect(classifyWeightSet(15)).toBe('hypertrophy')
    expect(classifyWeightSet(16)).toBe('muscular_endurance')
    expect(classifyWeightSet(30)).toBe('muscular_endurance')
  })

  it('lets an exercise override win over reps', () => {
    expect(classifyWeightSet(3, 'power')).toBe('power')
    expect(classifyWeightSet(20, 'power')).toBe('power')
  })
})

// ── classifyCardio ────────────────────────────────────────────────────────────

describe('classifyCardio', () => {
  const c = (duration: number): CardioEntry => ({ id: 'x', date: '2025-01-01', type: 'Running', duration })
  it('splits by duration proxy when no Training Effect data', () => {
    expect(classifyCardio(c(45))).toBe('endurance')
    expect(classifyCardio(c(25))).toBe('endurance')
    expect(classifyCardio(c(12))).toBe('vo2max')
    expect(classifyCardio(c(4))).toBe('anaerobic_capacity')
  })
})

// ── classifyCardioAdaptations (Garmin-informed) ───────────────────────────────

describe('classifyCardioAdaptations', () => {
  const base = { id: 'x', date: '2025-01-01', type: 'Cycling' as const, duration: 60 }

  it('falls back to the duration bucket without Training Effect', () => {
    expect(classifyCardioAdaptations({ ...base, duration: 60 })).toEqual(['endurance'])
    expect(classifyCardioAdaptations({ ...base, duration: 12 })).toEqual(['vo2max'])
  })

  it('maps an easy aerobic ride to endurance only', () => {
    // Long zone-2 ride: strong aerobic TE, negligible anaerobic.
    const out = classifyCardioAdaptations({ ...base, aerobicTe: 3.2, anaerobicTe: 0.4, trainingEffectLabel: 'BASE' })
    expect(out).toEqual(['endurance'])
  })

  it('counts a hard interval ride as BOTH vo2max and anaerobic (each TE ≥ 2.0)', () => {
    const out = classifyCardioAdaptations({ ...base, aerobicTe: 3.5, anaerobicTe: 2.4, trainingEffectLabel: 'VO2MAX' })
    expect(out).toContain('vo2max')
    expect(out).toContain('anaerobic_capacity')
    expect(out).not.toContain('endurance')
  })

  it('still counts the dominant system when nothing clears the threshold', () => {
    // Short easy spin: dominant aerobic but below the 2.0 stimulus threshold.
    const out = classifyCardioAdaptations({ ...base, aerobicTe: 1.4, anaerobicTe: 0.3, trainingEffectLabel: 'RECOVERY' })
    expect(out).toEqual(['endurance'])
  })

  it('uses HR zone distribution to split aerobic when unlabelled', () => {
    // More time in Z4–Z5 than Z1–Z2 → the aerobic stimulus is VO₂max, not base.
    const hard = classifyCardioAdaptations({ ...base, aerobicTe: 3.0, anaerobicTe: 0.5, zoneDistribution: [60, 120, 200, 600, 400] })
    expect(hard).toEqual(['vo2max'])
    const easy = classifyCardioAdaptations({ ...base, aerobicTe: 3.0, anaerobicTe: 0.5, zoneDistribution: [600, 900, 200, 60, 0] })
    expect(easy).toEqual(['endurance'])
  })
})

// ── resolveExerciseAdaptation ─────────────────────────────────────────────────

describe('resolveExerciseAdaptation', () => {
  it('uses built-in keyword defaults', () => {
    expect(resolveExerciseAdaptation('Box Jump')).toBe('power')
    expect(resolveExerciseAdaptation('Power Clean')).toBe('power')
    // Sprint / reactive keywords tagged the retired `speed` adaptation until
    // 2026-08-29; they now tag power (roadmap 019).
    expect(resolveExerciseAdaptation('40m Sprint')).toBe('power')
    expect(resolveExerciseAdaptation('Pogo Hops')).toBe('power')
  })

  it('returns null for ordinary lifts (fall back to reps)', () => {
    expect(resolveExerciseAdaptation('Back Squat')).toBeNull()
    expect(resolveExerciseAdaptation('Bench Press')).toBeNull()
  })

  it('lets user overrides win over keyword defaults', () => {
    expect(resolveExerciseAdaptation('Box Jump', { 'box jump': 'strength' })).toBe('strength')
  })
})

// ── buildMuscleStatusTree ─────────────────────────────────────────────────────

const groups: MuscleGroup[] = [
  { id: 'chest', name: 'Chest', bodyRegion: 'upper', parentId: null },
  { id: 'shoulders', name: 'Shoulders', bodyRegion: 'upper', parentId: null },
  { id: 'front-delt', name: 'Front Delt', bodyRegion: 'upper', parentId: 'shoulders' },
]

describe('buildMuscleStatusTree', () => {
  it('rolls children into parents and assigns status by target', () => {
    const tree = buildMuscleStatusTree({ Chest: 12, 'Front Delt': 4 }, groups, 10)
    const chest = tree.find(r => r.id === 'chest')!
    const shoulders = tree.find(r => r.id === 'shoulders')!
    expect(chest.status).toBe('on_track') // 12 >= 10
    expect(shoulders.aggSets).toBe(4)      // rolled up from child
    expect(shoulders.status).toBe('needs_work')
    expect(shoulders.children[0].name).toBe('Front Delt')
  })

  it('marks untouched groups', () => {
    const tree = buildMuscleStatusTree({}, groups, 10)
    expect(tree.every(r => r.status === 'untouched')).toBe(true)
  })
})

// ── adaptationCoverage ────────────────────────────────────────────────────────

const links: ExerciseMuscleLink[] = [
  { exercise: 'Bench Press', group: 'Chest', region: 'upper', level: 1, contribution: 'stimulus' },
  { exercise: 'Box Jump', group: 'Front Delt', region: 'upper', level: 1, contribution: 'stimulus' },
]

function w(id: string, date: string, exercise: string, reps: number, nSets: number): WeightEntry {
  return { id, date, exercise, sets: Array.from({ length: nSets }, () => ({ weight: 60, reps })) }
}

describe('adaptationCoverage', () => {
  it('classifies sets into adaptations and accumulates muscle stimulus', () => {
    const cov = adaptationCoverage({
      weights: [
        w('a', '2025-01-02', 'Bench Press', 4, 3),  // strength ×3, Chest lvl1 → 3
        w('b', '2025-01-03', 'Bench Press', 10, 4), // hypertrophy ×4, Chest → 4
        w('c', '2025-01-03', 'Box Jump', 5, 5),     // power ×5 (keyword), Front Delt → 5
      ],
      cardio: [{ id: 'r', date: '2025-01-04', type: 'Running', duration: 45 }],
      // 20-min Tennis session → classified as cardio by duration (VO₂max).
      sports: [{ id: 's', date: '2025-01-04', sport: 'Tennis', withTrainer: false, quality: 3, notes: '', duration: 20 }],
      exerciseMuscles: links,
      muscleGroups: groups,
      weekStart: '2025-01-01',
      date: '2025-01-07',
    })

    expect(cov.strength.volume).toBe(3)
    expect(cov.hypertrophy.volume).toBe(4)
    expect(cov.power.volume).toBe(5)
    expect(cov.endurance.volume).toBe(1)      // Running 45 min
    expect(cov.vo2max.volume).toBe(1)         // Tennis 20 min → cardio, not a skill count

    const chestStrength = cov.strength.muscles.find(m => m.id === 'chest')!
    expect(chestStrength.aggSets).toBe(3)
    const chestHyp = cov.hypertrophy.muscles.find(m => m.id === 'chest')!
    expect(chestHyp.aggSets).toBe(4)
    // Box Jump power routed to Front Delt (child of Shoulders)
    const shouldersPower = cov.power.muscles.find(m => m.id === 'shoulders')!
    expect(shouldersPower.aggSets).toBe(5)
  })

  it('counts a Garmin ride toward every stimulated adaptation', () => {
    const cov = adaptationCoverage({
      weights: [],
      // Hard interval ride: aerobic TE 3.5 (VO₂max) + anaerobic TE 2.4 → both count.
      cardio: [{
        id: 'g', date: '2025-01-04', type: 'Cycling', duration: 55,
        aerobicTe: 3.5, anaerobicTe: 2.4, trainingEffectLabel: 'VO2MAX', source: 'garmin',
      }],
      sports: [],
      exerciseMuscles: links,
      muscleGroups: groups,
      weekStart: '2025-01-01',
      date: '2025-01-07',
    })
    expect(cov.vo2max.volume).toBe(1)
    expect(cov.anaerobic_capacity.volume).toBe(1)
    expect(cov.endurance.volume).toBe(0)
  })

  it('ignores entries outside the week window', () => {
    const cov = adaptationCoverage({
      weights: [w('a', '2024-12-30', 'Bench Press', 4, 3)],
      cardio: [],
      sports: [],
      exerciseMuscles: links,
      muscleGroups: groups,
      weekStart: '2025-01-01',
      date: '2025-01-07',
    })
    expect(cov.strength.volume).toBe(0)
  })

  it('folds manual exercise-linked habit ticks into the exercise\'s adaptation', () => {
    const boxJumpHabit: Habit = {
      id: 'hb', name: 'Box Jumps', cadence: 'daily', targetCount: 1, autoSource: 'none',
      countLevel: 1, contribution: 'stimulus', singleTick: true, active: true, sortOrder: 0, exerciseId: 'bj',
    }
    const comps: HabitCompletion[] = [
      { id: 'c1', habitId: 'hb', periodStart: '2025-01-02', count: 1 },
      { id: 'c3', habitId: 'hb', periodStart: '2025-01-04', count: 1 },
      { id: 'c2', habitId: 'hb', periodStart: '2024-12-30', count: 5 }, // outside window → excluded
    ]
    const cov = adaptationCoverage({
      weights: [], cardio: [], sports: [],
      exerciseMuscles: links, muscleGroups: groups,
      weekStart: '2025-01-01', date: '2025-01-07',
      habits: [boxJumpHabit], habitCompletions: comps, exerciseNames: { bj: 'Box Jump' },
    })
    expect(cov.power.volume).toBe(2) // Box Jump → power (keyword), 2 in-week completions
    const shoulders = cov.power.muscles.find(m => m.id === 'shoulders')!
    expect(shoulders.aggSets).toBe(2) // Front Delt L1 × 2, rolled up to Shoulders
  })

  it('counts a timed-hold habit completion as one set, not its duration', () => {
    // A "hold 60 s" habit stores count = 60 (seconds). It must land as a single
    // set of stimulus, not 60 — regression guard for the duration-as-sets bug.
    const holdHabit: Habit = {
      id: 'dh', name: 'Dead Hang', cadence: 'daily', targetCount: 60, unit: 'sec', autoSource: 'none',
      countLevel: 1, contribution: 'recovery', singleTick: true, active: true, sortOrder: 0, exerciseId: 'bj',
    }
    const cov = adaptationCoverage({
      weights: [], cardio: [], sports: [],
      exerciseMuscles: links, muscleGroups: groups,
      weekStart: '2025-01-01', date: '2025-01-07',
      habits: [holdHabit],
      habitCompletions: [{ id: 'c1', habitId: 'dh', periodStart: '2025-01-02', count: 60 }],
      exerciseNames: { bj: 'Box Jump' },
    })
    expect(cov.power.volume).toBe(1) // one completion → one set (was 60)
    const shoulders = cov.power.muscles.find(m => m.id === 'shoulders')!
    expect(shoulders.aggSets).toBe(1)
  })
})
