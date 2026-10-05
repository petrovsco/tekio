import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PlannedExercise, WeightEntry, ExerciseMuscleLink, MuscleGroup } from '../types'

// RFC 0098: a planned exercise never counts. Plans live in their own table and
// their own store list, and no read takes one. These tests hold both halves.

vi.mock('../lib/supabase', () => ({ supabase: {} }))
vi.mock('../lib/db/plans', () => ({
  loadPlans: vi.fn(async () => []),
  savePlan: vi.fn(async (p: { date: string; exercise: string; targets: PlannedExercise['targets'] }) =>
    ({ id: 'plan-1', plannedBy: 'user', ...p })),
  markPlanLogged: vi.fn(async () => {}),
  deletePlan: vi.fn(async () => {}),
}))
vi.mock('../lib/db/weights', () => ({
  loadWeights: vi.fn(async () => []),
  saveWeightEntry: vi.fn(),
  deleteWeightEntry: vi.fn(async () => {}),
  updateWeightEntry: vi.fn(),
}))

const { useAppStore } = await import('../store/app')
const { muscleStates } = await import('../lib/fusedRead')
const { adaptationCoverage } = await import('../lib/adaptations')

const TODAY = '2026-08-30'
const logged: WeightEntry = { id: 'se-1', date: TODAY, exercise: 'Curls', sets: [{ weight: 20, reps: 10 }] }
const links: ExerciseMuscleLink[] = [
  { exercise: 'Curls', group: 'Biceps', region: 'upper', level: 1, contribution: 'stimulus' },
  { exercise: 'Squat', group: 'Quadriceps', region: 'lower', level: 1, contribution: 'stimulus' },
]
const groups: MuscleGroup[] = [
  { id: 'biceps', name: 'Biceps', bodyRegion: 'upper' },
  { id: 'quads', name: 'Quadriceps', bodyRegion: 'lower' },
]

/** Home's and Adaptations' reads, over whatever the store holds now. */
function reads() {
  const { weights } = useAppStore.getState()
  return {
    home: muscleStates(weights, links, groups, TODAY),
    adaptations: adaptationCoverage({
      weights, cardio: [], sports: [], exerciseMuscles: links, muscleGroups: groups,
      from: '2026-08-01', date: TODAY,
    }),
  }
}

describe('planned exercises never count (RFC 0098)', () => {
  beforeEach(() => useAppStore.setState({ weights: [logged], plans: [] }))

  it('planning work leaves Home and Adaptations exactly as they were', async () => {
    const before = reads()
    await useAppStore.getState().addPlan({
      date: TODAY, exercise: 'Squat', targets: [{ weight: 100, reps: 5 }, { weight: 100, reps: 5 }],
    })
    expect(useAppStore.getState().plans).toHaveLength(1)
    expect(useAppStore.getState().weights).toEqual([logged])
    expect(reads()).toEqual(before)
    expect(reads().home.find(m => m.name === 'Quadriceps')?.sets).toBe(0)
  })

  it('a plan whose logged entry is deleted is a plan again, and still counts for nothing', async () => {
    useAppStore.setState({
      plans: [{ id: 'plan-1', date: TODAY, exercise: 'Curls', targets: [], plannedBy: 'user', loggedAs: 'se-1' }],
    })
    await useAppStore.getState().removeWeightEntry('se-1')
    expect(useAppStore.getState().plans[0].loggedAs).toBeUndefined()
    expect(reads().home.find(m => m.name === 'Biceps')?.sets).toBe(0)
  })

  it('no read type-checks with a plan in place of a logged entry', () => {
    const plan: PlannedExercise = { id: 'p', date: TODAY, exercise: 'Squat', targets: [], plannedBy: 'agent' }
    // Never run: the assertion is the compile error `npm run build` requires.
    const misuse = () => {
      // @ts-expect-error a plan is not a WeightEntry
      muscleStates([plan], links, groups, TODAY)
    }
    expect(misuse).toBeTypeOf('function')
  })
})

describe('planPreview (RFC 0098 layer)', async () => {
  const { planPreview } = await import('../lib/planPreview')
  const plan = (exercise: string, targets: PlannedExercise['targets'], extra: Partial<PlannedExercise> = {}): PlannedExercise =>
    ({ id: exercise, date: TODAY, exercise, targets, plannedBy: 'user', ...extra })
  const run = (plans: PlannedExercise[]) => planPreview({
    plans, weights: [logged], exerciseMuscles: links, aliases: [], muscleGroups: groups, date: TODAY,
  })

  it('is absent with no open plan today', () => {
    expect(run([])).toBeNull()
    expect(run([plan('Squat', [], { date: '2026-08-29' })])).toBeNull()
    expect(run([plan('Squat', [], { loggedAs: 'se-9' })])).toBeNull()
  })

  it('names the muscles the plan reaches and the gaps left after it', () => {
    const p = run([plan('Squat', Array.from({ length: 40 }, () => ({ weight: 100, reps: 5 })))])!
    expect([...p.reached]).toEqual(['Quadriceps'])
    expect(p.gapsAfter.map(g => g.name)).not.toContain('Quadriceps')
  })

  it('reaches a catalogue lift never logged, through the links a first log would write', () => {
    const p = run([plan('Back Squat', [])])!
    expect(p.reached.size).toBeGreaterThan(0)
  })

  it('a plan without targets reaches its muscles but adds no sets', () => {
    const p = run([plan('Squat', [])])!
    expect(p.reached.has('Quadriceps')).toBe(true)
    expect(p.gapsAfter.map(g => g.name)).toContain('Quadriceps')
  })
})
