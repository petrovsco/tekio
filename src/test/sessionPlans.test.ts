import { describe, it, expect } from 'vitest'

// RFC 0104: cardio, sport and mobility plans read back from their table the
// way an agent writes them, and a plan's link column follows its kind.

import { loadSessionPlans as dbLoad, type Db } from '@tekio/db'
import { planChips, planTitle } from '../components/tabs/plans/planText'

// A client that answers every select with `rows.value`.
const rows = { value: [] as unknown[] }
const chain = { select: () => chain, eq: () => chain, order: async () => ({ data: rows.value, error: null }) }
const db = { client: { from: () => chain }, userId: 'u' } as unknown as Db
const loadSessionPlans = () => dbLoad(db)

const base = {
  notes: null, sort_order: 0, planned_by: 'agent',
  cardio_session_id: null, sport_session_id: null, mobility_session_id: null,
}

describe('planned sessions (RFC 0104)', () => {
  it('reads each kind, numbers written as strings included', async () => {
    rows.value = [
      { ...base, id: 'c', plan_date: '2026-10-12', kind: 'cardio', name: 'Running',
        target: { duration: '40', distance: 6, format: 'intervals', boutSeconds: 240 } },
      { ...base, id: 's', plan_date: '2026-10-11', kind: 'sport', name: 'Volleyball',
        target: { duration: 90 }, notes: '16:00 game', sport_session_id: 'sp-1' },
      { ...base, id: 'm', plan_date: '2026-10-11', kind: 'mobility', name: '', sort_order: 1,
        target: { exercises: [{ name: 'Hip flexor stretch', duration: 3 }, { name: 'T-spine rotation' }, { name: ' ' }] } },
    ]
    const [cardio, sport, mobility] = await loadSessionPlans()
    expect(cardio).toMatchObject({ kind: 'cardio', name: 'Running', duration: 40, distance: 6, format: 'intervals', boutSeconds: 240 })
    expect(cardio.loggedAs).toBeUndefined()
    expect(sport).toMatchObject({ kind: 'sport', duration: 90, notes: '16:00 game', loggedAs: 'sp-1' })
    expect(mobility.stretches).toEqual([
      { name: 'Hip flexor stretch', duration: 3 },
      { name: 'T-spine rotation', duration: 0 },
    ])
    expect(planChips(cardio)).toEqual(['40 min', '6 km', 'Intervals, 4:00 bouts'])
    expect(planChips(mobility)).toEqual(['Hip flexor stretch 3 min', 'T-spine rotation'])
    expect(planTitle(mobility)).toBe('Mobility')
  })

  it('takes a link only from the column for its own kind', async () => {
    rows.value = [{ ...base, id: 'c', plan_date: '2026-10-11', kind: 'cardio', name: 'Cycling', target: {}, mobility_session_id: 'mob-1' }]
    const [plan] = await loadSessionPlans()
    expect(plan.loggedAs).toBeUndefined()
  })
})
