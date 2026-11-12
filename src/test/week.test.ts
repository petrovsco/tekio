import { describe, it, expect } from 'vitest'

// RFC 0114: the week of plans, every kind of seven days, read from the same
// plans the cards list.

import { weekItems, weekDays, weekRange, moveTargets, openLiftsAhead, sessionPlanLogged, dayMark } from '../lib/week'
import type { CardioEntry, PlannedExercise, PlannedSession } from '../types'

const lift = (id: string, date: string, extra: Partial<PlannedExercise> = {}): PlannedExercise => ({
  id, date, exercise: 'Back Squat', targets: [{ weight: 85, reps: 5 }, { weight: 85, reps: 5 }, { weight: 85, reps: 5 }],
  plannedBy: 'agent', ...extra,
})
const run: PlannedSession = { id: 'r', date: '2026-11-10', kind: 'cardio', name: 'Running', duration: 40, plannedBy: 'user' }
const none = { cardio: [] as CardioEntry[], sports: [], mobility: [] }

describe('the week (RFC 0114)', () => {
  it('lists seven days from the week start, across a month end', () => {
    expect(weekDays('2026-11-30')).toEqual(['2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05', '2026-12-06'])
    expect(weekRange('2026-11-09')).toBe('9–15 Nov')
    expect(weekRange('2026-11-30')).toBe('30 Nov – 6 Dec')
  })

  it('reads lifts and sessions alike, the same targets folded into one', () => {
    const items = weekItems([lift('a', '2026-11-09'), lift('b', '2026-11-09', { targets: [{ weight: 60, reps: 8 }, { weight: 70, reps: 6 }], loggedAs: 'e' })], [run], none)
    expect(items.map(i => [i.kind, i.summary, i.logged])).toEqual([
      ['lifts', 'Back Squat 3×85kg×5', false],
      ['lifts', 'Back Squat 60kg×8, 70kg×6', true],
      ['cardio', 'Running · 40 min', false],
    ])
  })

  it('folds a mobility block to its count of stretches', () => {
    const mob: PlannedSession = { id: 'm', date: '2026-11-12', kind: 'mobility', name: '', stretches: [{ name: 'Couch stretch', duration: 5 }, { name: 'Thoracic rotation', duration: 5 }], plannedBy: 'user' }
    expect(weekItems([], [mob], none)[0].brief).toBe('Mobility · 2 stretches · 10 min')
  })

  it('counts a cardio plan logged when that type lands on its day, by any route', () => {
    const synced = { id: 'g', date: '2026-11-10', type: 'Running' } as CardioEntry
    expect(sessionPlanLogged(run, { ...none, cardio: [synced] })).toBe(true)
    expect(sessionPlanLogged(run, { ...none, cardio: [{ ...synced, date: '2026-11-11' }] })).toBe(false)
  })

  it('moves a plan only to today or later, never onto its own day', () => {
    const days = weekDays('2026-11-09')
    expect(moveTargets(days, '2026-11-12', '2026-11-11')).toEqual(['2026-11-11', '2026-11-13', '2026-11-14', '2026-11-15'])
  })

  it('previews the open lifts still ahead in the week, dated today', () => {
    const days = weekDays('2026-11-09')
    const plans = [lift('past', '2026-11-09'), lift('done', '2026-11-12', { loggedAs: 'e' }), lift('ahead', '2026-11-13'), lift('next', '2026-11-16')]
    expect(openLiftsAhead(plans, days, '2026-11-11').map(p => [p.id, p.date])).toEqual([['ahead', '2026-11-11']])
  })

  it('marks a day by this tab first: planned, logged, missed, or another tab', () => {
    const items = weekItems(
      [lift('a', '2026-11-09', { loggedAs: 'e' }), lift('b', '2026-11-11'), lift('c', '2026-11-13')],
      [{ ...run, date: '2026-11-14' }], none,
    )
    const t = '2026-11-12'
    expect(['2026-11-09', '2026-11-11', '2026-11-13', '2026-11-14', '2026-11-15'].map(d => dayMark(items, d, ['lifts'], t)))
      .toEqual(['logged', 'missed', 'planned', 'other', 'none'])
  })
})
