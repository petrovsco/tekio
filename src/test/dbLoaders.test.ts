import { describe, it, expect } from 'vitest'
import type { PostgrestClient } from '@supabase/postgrest-js'
import { loadCardio, loadSleep, loadProfile, type Db } from '@tekio/db'

// RFC 0094 step 2a: the loaders read whoever the `Db` names, so the API can
// pass the id from the caller's token and get that person's rows, mapped the
// same way the app maps them.

/** A client that records each filter and answers with `rows`. */
function fakeDb(userId: string, rows: unknown[]): { db: Db; calls: string[] } {
  const calls: string[] = []
  const query = {
    select: (c: string) => { calls.push(`select ${c.split(',')[0]}`); return query },
    eq: (col: string, v: string) => { calls.push(`eq ${col}=${v}`); return query },
    order: (col: string) => { calls.push(`order ${col}`); return query },
    single: () => Promise.resolve({ data: rows[0], error: null }),
    then: (ok: (r: unknown) => unknown) => Promise.resolve({ data: rows, error: null }).then(ok),
  }
  const client = { from: (t: string) => { calls.push(`from ${t}`); return query } } as unknown as PostgrestClient
  return { db: { client, userId }, calls }
}

describe('the shared loaders read the user the Db names', () => {
  it('filters by that id and maps a row as the app does', async () => {
    const { db, calls } = fakeDb('user-b', [{
      id: 'c1', session_date: '2026-10-01', activity_type: 'rowing', duration_minutes: '30',
      avg_heart_rate: 150, zone_distribution: ['60', '120'], source: null,
    }])
    const [entry] = await loadCardio(db)
    expect(calls).toContain('eq user_id=user-b')
    expect(entry).toMatchObject({
      id: 'c1', type: 'Indoor Rowing', duration: 30, avgHr: 150, zoneDistribution: [60, 120], source: 'manual',
    })
  })

  it('reads the profile row by the same id', async () => {
    const { db, calls } = fakeDb('user-b', [{
      week_start_day: 'sunday', hr_max_override: null, hr_max_source: 'typed', birth_date: null, readiness_method: 'bogus',
    }])
    expect(await loadProfile(db)).toEqual({
      weekStartDay: 'sunday', hrMaxStored: null, hrMaxSource: null, birthDate: null, readinessMethod: null,
    })
    expect(calls).toContain('eq id=user-b')
  })

  it('orders nights newest first', async () => {
    const { db, calls } = fakeDb('user-b', [])
    expect(await loadSleep(db)).toEqual([])
    expect(calls).toContain('order log_date')
  })
})
