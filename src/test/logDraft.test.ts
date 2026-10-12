import { describe, it, expect, beforeEach } from 'vitest'
import { readDraft, writeDraft, emptyLift } from '../lib/logDraft'

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
})
