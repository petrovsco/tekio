import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PlannedExercise } from '../types'
import { groupRuns, groupName } from '../lib/supersets'

// RFC 0106: planned lifts grouped into supersets and circuits.

vi.mock('../lib/supabase', () => ({ supabase: {} }))
vi.mock('../lib/db/plans', () => ({
  loadPlans: vi.fn(async () => []),
  savePlan: vi.fn(async (p: Pick<PlannedExercise, 'date' | 'exercise' | 'targets' | 'supersetId'>) =>
    ({ id: 'new', plannedBy: 'user', ...p })),
  updatePlan: vi.fn(async () => {}),
  patchPlans: vi.fn(async () => {}),
  markPlanLogged: vi.fn(async () => {}),
  deletePlan: vi.fn(async () => {}),
}))

const { useAppStore } = await import('../store/app')
const { patchPlans } = await import('../lib/db/plans')

const DAY = '2026-10-12'
const plan = (id: string, extra: Partial<PlannedExercise> = {}): PlannedExercise =>
  ({ id, date: DAY, exercise: id, targets: [], plannedBy: 'user', ...extra })

describe('groupRuns', () => {
  it('gathers a group where its first member stands, in order', () => {
    const items = [{ id: 'a' }, { id: 'b', g: 'x' }, { id: 'c' }, { id: 'd', g: 'x' }, { id: 'e', g: 'x' }]
    expect(groupRuns(items, i => i.g).map(r => r.map(i => i.id))).toEqual([['a'], ['b', 'd', 'e'], ['c']])
  })

  it('reads a group left with one member as a plain lift', () => {
    expect(groupRuns([{ g: 'x' }, { g: undefined }], i => i.g).map(r => r.length)).toEqual([1, 1])
  })

  it('names two lifts a superset and three or more a circuit', () => {
    expect(groupName(2)).toBe('Superset')
    expect(groupName(3)).toBe('Circuit')
  })
})

describe('planning a superset', () => {
  beforeEach(() => vi.mocked(patchPlans).mockClear())

  it('a new plan paired with a lone plan starts a group of the two', async () => {
    useAppStore.setState({ plans: [plan('RDL')] })
    await useAppStore.getState().addPlan({ date: DAY, exercise: 'Leg curl', targets: [] }, 'RDL')
    const [rdl, curl] = useAppStore.getState().plans
    expect(rdl.supersetId).toBeTruthy()
    expect(curl.supersetId).toBe(rdl.supersetId)
  })

  it('a plan paired with a grouped plan joins its group, making a circuit', async () => {
    useAppStore.setState({ plans: [plan('A', { supersetId: 'g' }), plan('B', { supersetId: 'g' }), plan('C')] })
    await useAppStore.getState().editPlan('C', { date: DAY, exercise: 'C', targets: [] }, 'A')
    expect(useAppStore.getState().plans.filter(p => p.supersetId === 'g')).toHaveLength(3)
    expect(patchPlans).not.toHaveBeenCalledWith(['A'], expect.anything())
  })

  it('None takes a plan out of its group', async () => {
    useAppStore.setState({ plans: [plan('A', { supersetId: 'g' }), plan('B', { supersetId: 'g' })] })
    await useAppStore.getState().editPlan('B', { date: DAY, exercise: 'B', targets: [] }, null)
    expect(useAppStore.getState().plans.find(p => p.id === 'B')?.supersetId).toBeUndefined()
  })

  it('rescheduling a grouped plan moves its open group, not its logged lifts', async () => {
    useAppStore.setState({
      plans: [
        plan('A', { supersetId: 'g', date: '2026-10-10' }),
        plan('B', { supersetId: 'g', date: '2026-10-10' }),
        plan('C', { supersetId: 'g', date: '2026-10-10', loggedAs: 'se-1' }),
      ],
    })
    await useAppStore.getState().editPlan('A', { date: DAY, exercise: 'A', targets: [] })
    const byId = Object.fromEntries(useAppStore.getState().plans.map(p => [p.id, p.date]))
    expect(byId).toEqual({ A: DAY, B: DAY, C: '2026-10-10' })
    expect(patchPlans).toHaveBeenCalledWith(['B'], { date: DAY })
  })
})
