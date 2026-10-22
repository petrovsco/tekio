// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { createApi } from '@tekio/api'

// RFC 0094 step 2d: planned lifts and sessions written through the API land as
// the app writes them, say who planned them, and touch only the caller's own
// plans. Supabase is a fake that records every request; every row is invented.

const URL_ = 'http://supabase.test'
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
const jwt = (claims: object) => `${b64({ alg: 'HS256' })}.${b64(claims)}.sig`
const LIVE = jwt({ sub: 'login-1', exp: Date.now() / 1000 + 3600, app_metadata: { user_id: 'rows-owner' } })
const DATE = '2026-10-22'
const GROUP = '7c0a9a52-3f0e-4c5e-9d43-1f2a3b4c5d6e'

interface Call { method: string; table: string; url: string; body: unknown }

/** The caller owns plans `p-1` and `p-2` and the cardio plan `s-1`. */
function fakeSupabase() {
  const calls: Call[] = []
  const own = ['p-1', 'p-2', 's-1']
  const fakeFetch: typeof fetch = async (input, init) => {
    const url = decodeURIComponent(String(input))
    const headers = new Headers(init?.headers)
    const method = init?.method ?? 'GET'
    const json = (body: unknown, status = 200) =>
      new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    if (url.includes('/auth/v1/user')) return headers.get('authorization') === `Bearer ${LIVE}` ? json({ id: 'login-1' }) : json({}, 401)
    const table = url.split('/rest/v1/')[1].split('?')[0]
    const body = init?.body ? JSON.parse(String(init.body)) : null
    calls.push({ method, table, url, body })
    if (method === 'HEAD') return new Response(null, { status: 200, headers: { 'Content-Range': '0-1/2' } })
    if (method === 'GET' && url.includes('user_id=eq.rows-owner') && (url.includes('id=in.(') || url.includes('&id=eq.'))) {
      const ids = url.match(/id=in\.\(([^)]*)\)/)?.[1].split(',') ?? [url.match(/[?&]id=eq\.([^&]*)/)![1]]
      const mine = ids.filter(id => own.includes(id))
      if (url.includes('select=kind')) return json(mine.length ? { kind: 'cardio' } : null)
      return json(mine.map(id => ({ id })))
    }
    if (method === 'POST' && table === 'planned_exercises') return json({ id: 'p-new', sort_order: 2, session_exercise_id: null, ...body }, 201)
    if (method === 'POST' && table === 'planned_sessions') {
      return json({ id: 's-new', sort_order: 0, cardio_session_id: null, sport_session_id: null, mobility_session_id: null, ...body }, 201)
    }
    return json(null, method === 'POST' ? 201 : 204)
  }
  const api = createApi({ supabaseUrl: URL_, anonKey: 'anon', origin: 'staging', fetch: fakeFetch })
  return { api, writes: () => calls.filter(c => c.method !== 'GET' && c.method !== 'HEAD') }
}

const send = (api: ReturnType<typeof createApi>, method: string, path: string, body?: unknown) =>
  api.request(path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LIVE}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

describe('plans through the API', () => {
  it('plans a lift after the day’s others, saying an agent planned it', async () => {
    const { api, writes } = fakeSupabase()
    const res = await send(api, 'POST', '/api/plans/lifts', {
      date: DATE, exercise: 'Back squat', targets: [{ weight: 90, reps: 5 }, { weight: 0, reps: 1, seconds: 45 }], plannedBy: 'agent',
    })
    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ id: 'p-new', date: DATE, exercise: 'Back squat', plannedBy: 'agent' })
    expect(writes()[0].body).toEqual({
      user_id: 'rows-owner', plan_date: DATE, exercise: 'Back squat',
      target_sets: [{ weight: 90, reps: 5 }, { weight: 0, reps: 1, seconds: 45 }],
      sort_order: 2, planned_by: 'agent', superset_group_id: null, origin: 'staging',
    })
  })

  it('plans a cardio session as the user by default', async () => {
    const { api, writes } = fakeSupabase()
    const res = await send(api, 'POST', '/api/plans/sessions', {
      date: DATE, kind: 'cardio', name: 'Indoor Rowing', duration: 30, format: 'intervals', boutSeconds: 240,
    })
    expect(res.status).toBe(201)
    expect(writes()[0].body).toMatchObject({
      plan_date: DATE, kind: 'cardio', name: 'Indoor Rowing', planned_by: 'user',
      target: { duration: 30, format: 'intervals', boutSeconds: 240 },
    })
  })

  it('groups the caller’s own lifts into a superset, and refuses one that is not theirs', async () => {
    const { api, writes } = fakeSupabase()
    expect((await send(api, 'PATCH', '/api/plans/lifts', { ids: ['p-1', 'p-2'], supersetId: GROUP })).status).toBe(204)
    expect((await send(api, 'PATCH', '/api/plans/lifts', { ids: ['p-1', 'theirs'], supersetId: GROUP })).status).toBe(404)
    expect(writes().map(c => [c.method, c.body])).toEqual([['PATCH', { superset_group_id: GROUP }]])
  })

  it('points a plan at the entry it became, in the column for its kind', async () => {
    const { api, writes } = fakeSupabase()
    expect((await send(api, 'PUT', '/api/plans/sessions/s-1/logged', { entryId: 'c-9' })).status).toBe(204)
    expect((await send(api, 'PUT', '/api/plans/lifts/p-1/logged', { entryId: 'se-9' })).status).toBe(204)
    expect((await send(api, 'PUT', '/api/plans/sessions/theirs/logged', { entryId: 'c-9' })).status).toBe(404)
    expect(writes().map(c => [c.table, c.body])).toEqual([
      ['planned_sessions', { cardio_session_id: 'c-9' }],
      ['planned_exercises', { session_exercise_id: 'se-9' }],
    ])
  })

  it('replaces and deletes only the caller’s own plans', async () => {
    const { api, writes } = fakeSupabase()
    const plan = { date: DATE, exercise: 'Back squat', targets: [{ weight: 95, reps: 5 }], supersetId: null }
    expect((await send(api, 'PUT', '/api/plans/lifts/p-1', plan)).status).toBe(204)
    expect((await send(api, 'PUT', '/api/plans/lifts/theirs', plan)).status).toBe(404)
    expect((await send(api, 'DELETE', '/api/plans/sessions/theirs')).status).toBe(404)
    expect(writes().map(c => [c.method, c.body])).toEqual([
      ['PATCH', { plan_date: DATE, exercise: 'Back squat', target_sets: [{ weight: 95, reps: 5 }], superset_group_id: null }],
    ])
  })

  it('deletes the caller’s missed plans of both kinds, only those never logged', async () => {
    const { api, writes } = fakeSupabase()
    expect((await api.request('/api/plans/missed?before=2026-10-15', { method: 'DELETE' })).status).toBe(401)
    expect((await send(api, 'DELETE', '/api/plans/missed?before=2026-10-15')).status).toBe(204)
    expect(writes().map(c => c.url.split('/rest/v1/')[1]).sort()).toEqual([
      'planned_exercises?user_id=eq.rows-owner&plan_date=lt.2026-10-15&session_exercise_id=is.null',
      'planned_sessions?user_id=eq.rows-owner&plan_date=lt.2026-10-15&cardio_session_id=is.null&sport_session_id=is.null&mobility_session_id=is.null',
    ])
  })
})
