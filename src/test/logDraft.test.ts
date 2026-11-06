import { describe, it, expect, beforeEach } from 'vitest'
import { readDraft, writeDraft, emptyLift, addLift } from '../lib/logDraft'

// RFC 0106: the Weights log form is kept on the device until it is saved.

describe('log draft', () => {
  beforeEach(() => localStorage.clear())

  it('keeps typed sets across a reload', () => {
    const lift = { ...emptyLift(), ex: 'Romanian Deadlift', sets: [{ weight: '60', reps: '8' }] }
    writeDraft({ date: '2026-10-12', lifts: [lift, emptyLift()], active: 1 })
    const d = readDraft('2026-10-13')
    expect(d.date).toBe('2026-10-12')
    expect(d.lifts[0].sets).toEqual([{ weight: '60', reps: '8' }])
    expect(d.active).toBe(1)
  })

  it('stores nothing for an untouched form, and starts empty without a draft', () => {
    writeDraft({ date: '2026-10-12', lifts: [emptyLift()], active: 0 })
    expect(localStorage.getItem('tekio.weightsDraft')).toBeNull()
    const d = readDraft('2026-10-13')
    expect(d.date).toBe('2026-10-13')
    expect(d.lifts).toHaveLength(1)
  })

  it('starts empty on an unreadable draft', () => {
    localStorage.setItem('tekio.weightsDraft', '{oops')
    expect(readDraft('2026-10-13').lifts[0].ex).toBe('')
  })

  it('brings back unticked a tick whose first write never landed', () => {
    const lift = { ...emptyLift(), ex: 'Back Squat', sets: [{ weight: '60', reps: '5' }], saved: [true] }
    const kept = { ...lift, id: 'kept', entryId: 'se1' }
    writeDraft({ date: '2026-10-12', lifts: [lift, kept], active: 0 })
    const d = readDraft('2026-10-13')
    expect(d.lifts[0].saved).toBeUndefined()
    expect(d.lifts[1].saved).toEqual([true])
  })

  it('adds an exercise outside the plan beside the lifts on the form', () => {
    const planned = { ...emptyLift(), ex: 'Back Squat', planId: 'p1', sets: [{ weight: '80', reps: '5' }] }
    const d = addLift({ date: '2026-11-06', lifts: [planned], active: 0 })
    expect(d.lifts).toHaveLength(2)
    expect(d.lifts[0]).toBe(planned)
    expect(d.lifts[1].ex).toBe('')
    expect(d.lifts[1].planId).toBeUndefined()
    expect(d.active).toBe(1)
    // A second tap shows the empty one again rather than adding another.
    const again = addLift({ ...d, active: 0 })
    expect(again.lifts).toHaveLength(2)
    expect(again.active).toBe(1)
  })
})
