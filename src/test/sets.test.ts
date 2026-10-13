import { describe, it, expect, vi } from 'vitest'
import { setsProblem, liftSetProblem, parseSets } from '../lib/sets'

describe('a set that cannot be stored blocks the save', () => {
  it('names a fractional rep count and its set', () => {
    expect(setsProblem([{ weight: '50', reps: '10' }, { weight: '7.5', reps: '12.5' }], 2))
      .toBe('Set 2: Reps must be a whole number.')
  })

  it('passes whole reps, and ignores rows not yet filled or not revealed', () => {
    expect(setsProblem([{ weight: '7.5', reps: '12' }, { weight: '', reps: '' }], 2)).toBeNull()
    expect(setsProblem([{ weight: '7.5', reps: '12' }, { weight: '5', reps: '1.5' }], 1)).toBeNull()
  })

  it('refuses zero reps and a negative load', () => {
    expect(liftSetProblem({ weight: 10, reps: 0 })).toMatch(/Reps/)
    expect(liftSetProblem({ weight: -5, reps: 8 })).toMatch(/Weight/)
    expect(liftSetProblem({ weight: 0, reps: 8 })).toBeNull()
  })

  it('stores reps exactly as typed, never rounded', () => {
    expect(parseSets([{ weight: '7.5', reps: '12' }], 1)).toEqual([{ weight: 7.5, reps: 12 }])
  })
})

const from = vi.fn()
vi.mock('../lib/supabase', () => ({ supabase: { from: (t: string) => from(t) } }))
vi.mock('../lib/db/exercises', () => ({ getOrCreateExerciseRow: vi.fn() }))

describe('no entry is written without savable sets', () => {
  it('refuses before touching the database', async () => {
    const { saveWeightEntry, updateWeightEntry } = await import('../lib/db/weights')
    await expect(saveWeightEntry({ date: '2026-10-08', exercise: 'Cable Woodchop', sets: [] })).rejects.toThrow(/at least one set/)
    await expect(saveWeightEntry({ date: '2026-10-08', exercise: 'Cable Woodchop', sets: [{ weight: 7.5, reps: 12.5 }] })).rejects.toThrow(/whole number/)
    await expect(updateWeightEntry('x', { sets: [{ weight: 7.5, reps: 12.5 }] })).rejects.toThrow(/whole number/)
    expect(from).not.toHaveBeenCalled()
  })
})

describe('ticking the next set writes only that set', () => {
  const calls: string[] = []
  const chain = (table: string) => {
    const q = {
      insert: (rows: unknown) => { calls.push(`${table}.insert ${JSON.stringify(rows)}`); return Promise.resolve({ error: null }) },
      delete: () => { calls.push(`${table}.delete`); return q },
      eq: (c: string, v: unknown) => { calls.push(`eq ${c}=${String(v)}`); return q },
      gt: (c: string, v: unknown) => { calls.push(`gt ${c}>${String(v)}`); return Promise.resolve({ error: null }) },
      then: (r: (v: { error: null }) => void) => r({ error: null }),
    }
    return q
  }

  it('appends one row when a set is ticked on', async () => {
    calls.length = 0
    from.mockImplementation(chain)
    const { updateWeightEntry } = await import('../lib/db/weights')
    await updateWeightEntry('se1', { sets: [{ weight: 60, reps: 8 }, { weight: 60, reps: 7 }] }, [{ weight: 60, reps: 8 }])
    expect(calls).toEqual(['session_sets.insert [{"session_exercise_id":"se1","set_number":2,"weight":60,"reps":7}]'])
  })

  it('removes only the last row when it is ticked off', async () => {
    calls.length = 0
    from.mockImplementation(chain)
    const { updateWeightEntry } = await import('../lib/db/weights')
    await updateWeightEntry('se1', { sets: [{ weight: 60, reps: 8 }] }, [{ weight: 60, reps: 8 }, { weight: 60, reps: 7 }])
    expect(calls).toEqual(['session_sets.delete', 'eq session_exercise_id=se1', 'gt set_number>1'])
  })

  it('rewrites every set when an earlier one changed', async () => {
    calls.length = 0
    from.mockImplementation(chain)
    const { updateWeightEntry } = await import('../lib/db/weights')
    await updateWeightEntry('se1', { sets: [{ weight: 60, reps: 7 }] }, [{ weight: 60, reps: 8 }, { weight: 60, reps: 7 }])
    expect(calls[0]).toBe('session_sets.delete')
    expect(calls).toContain('session_sets.insert [{"session_exercise_id":"se1","set_number":1,"weight":60,"reps":7}]')
  })
})
