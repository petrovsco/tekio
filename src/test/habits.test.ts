import { describe, it, expect } from 'vitest'
import { habitPeriodStart, habitProgress } from '../lib/utils'
import type { HabitProgressContext } from '../lib/utils'
import type {
  Habit, ExerciseMuscleLink, MuscleGroup, WeightEntry, } from '../types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const muscleGroups: MuscleGroup[] = [
  { id: 'chest', name: 'Chest', bodyRegion: 'upper', parentId: null },
  { id: 'shoulders', name: 'Shoulders', bodyRegion: 'upper', parentId: null },
  { id: 'adelt', name: 'Anterior Deltoid', bodyRegion: 'upper', parentId: 'shoulders' },
  { id: 'ldelt', name: 'Lateral Deltoid', bodyRegion: 'upper', parentId: 'shoulders' },
  { id: 'triceps', name: 'Triceps', bodyRegion: 'upper', parentId: null },
]

const exerciseMuscles: ExerciseMuscleLink[] = [
  { exercise: 'Bench Press', group: 'Chest', region: 'upper', level: 1, contribution: 'stimulus' },
  { exercise: 'Bench Press', group: 'Triceps', region: 'upper', level: 2, contribution: 'stimulus' },
  { exercise: 'Bench Press', group: 'Anterior Deltoid', region: 'upper', level: 2, contribution: 'stimulus' },
  { exercise: 'Push-ups', group: 'Chest', region: 'upper', level: 1, contribution: 'stimulus' },
  { exercise: 'Lat Raises', group: 'Lateral Deltoid', region: 'upper', level: 1, contribution: 'stimulus' },
  { exercise: 'Pec Stretch', group: 'Chest', region: 'upper', level: 1, contribution: 'recovery' },
]

function weight(date: string, exercise: string, nSets: number): WeightEntry {
  return { id: `${date}-${exercise}`, date, exercise, sets: Array.from({ length: nSets }, () => ({ weight: 50, reps: 8 })) }
}

function baseCtx(over: Partial<HabitProgressContext> = {}): HabitProgressContext {
  return {
    weights: [], mobility: [], water: [], cardio: [],
    habitCompletions: [], exerciseMuscles, muscleGroups, exerciseNames: {},
    ...over,
  }
}

const habit = (over: Partial<Habit>): Habit => ({
  id: 'h1', name: 'Test', cadence: 'weekly', targetCount: 15, unit: 'sets',
  autoSource: 'none', countLevel: 1, contribution: 'stimulus', singleTick: true, active: true, sortOrder: 0,
  ...over,
})

// ── habitPeriodStart ──────────────────────────────────────────────────────────

describe('habitPeriodStart', () => {
  it('daily → the date itself', () => {
    expect(habitPeriodStart('daily', '2026-06-24')).toBe('2026-06-24')
  })
  it('weekly → Monday of that week', () => {
    expect(habitPeriodStart('weekly', '2026-06-24', 'monday')).toBe('2026-06-22') // Wed → Mon
  })
  it('monthly → first of the month', () => {
    expect(habitPeriodStart('monthly', '2026-06-24')).toBe('2026-06-01')
  })
})

// ── habitProgress ─────────────────────────────────────────────────────────────

describe('habitProgress', () => {
  it('weight_sets: counts sets of exercises hitting the linked muscle at level ≤ countLevel', () => {
    const ctx = baseCtx({
      weights: [
        weight('2026-06-22', 'Bench Press', 4),
        weight('2026-06-23', 'Push-ups', 3),
        weight('2026-06-23', 'Lat Raises', 5), // not chest → excluded
      ],
    })
    const h = habit({ autoSource: 'weight_sets', muscleGroupId: 'chest', countLevel: 1, targetCount: 15 })
    const p = habitProgress(h, ctx, '2026-06-24', 'monday')
    expect(p.current).toBe(7) // 4 + 3 chest sets
    expect(p.done).toBe(false)
  })

  it('weight_sets: parent muscle (Shoulders) includes its child deltoids', () => {
    const ctx = baseCtx({
      weights: [weight('2026-06-22', 'Lat Raises', 4), weight('2026-06-22', 'Bench Press', 2)],
    })
    // Lat Raises → Lateral Deltoid L1 (counts); Bench → Anterior Deltoid L2 (excluded at countLevel 1)
    const h = habit({ autoSource: 'weight_sets', muscleGroupId: 'shoulders', countLevel: 1 })
    expect(habitProgress(h, ctx, '2026-06-24').current).toBe(4)
    // raising countLevel to 2 pulls in the Bench anterior-delt sets too
    const h2 = habit({ autoSource: 'weight_sets', muscleGroupId: 'shoulders', countLevel: 2 })
    expect(habitProgress(h2, ctx, '2026-06-24').current).toBe(6)
  })

  it('water: sums ml in the period and marks done at goal', () => {
    const ctx = baseCtx({ water: [
      { id: 'w1', date: '2026-06-24', amountMl: 1500 },
      { id: 'w2', date: '2026-06-24', amountMl: 1200 },
      { id: 'w3', date: '2026-06-23', amountMl: 999 }, // different day, excluded for daily
    ] })
    const h = habit({ cadence: 'daily', autoSource: 'water', targetCount: 2500, unit: 'ml' })
    const p = habitProgress(h, ctx, '2026-06-24')
    expect(p.current).toBe(2700)
    expect(p.done).toBe(true)
  })

  it('none (manual): sums this period\'s completions', () => {
    const ctx = baseCtx({ habitCompletions: [
      { id: 'c1', habitId: 'h1', periodStart: '2026-06-24', count: 1 },
      { id: 'c2', habitId: 'h1', periodStart: '2026-06-23', count: 1 }, // other period
    ] })
    const h = habit({ id: 'h1', cadence: 'daily', autoSource: 'none', targetCount: 1 })
    const p = habitProgress(h, ctx, '2026-06-24')
    expect(p.current).toBe(1)
    expect(p.done).toBe(true)
  })

  it('cardio_sessions: counts sessions in the period', () => {
    const ctx = baseCtx({ cardio: [
      { id: 'a', date: '2026-06-22', type: 'Running', duration: 30 },
      { id: 'b', date: '2026-06-24', type: 'Cycling', duration: 40 },
    ] })
    const h = habit({ autoSource: 'cardio_sessions', targetCount: 3, unit: 'sessions' })
    expect(habitProgress(h, ctx, '2026-06-24').current).toBe(2)
  })
})
