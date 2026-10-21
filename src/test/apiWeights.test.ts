// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { createApi } from '@tekio/api'

// RFC 0094 step 2d: logging a lift through the API writes what the web app
// writes, as the caller, and touches only the caller's own entries. Supabase is
// a fake that records every request; every row and id is invented.

const URL_ = 'http://supabase.test'
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
const jwt = (claims: object) => `${b64({ alg: 'HS256' })}.${b64(claims)}.sig`
const LIVE = jwt({ sub: 'login-1', exp: Date.now() / 1000 + 3600, app_metadata: { user_id: 'rows-owner' } })
const DATE = '2026-10-21'

interface Call { method: string; table: string; url: string; body: unknown; auth: string | null }

/** A Supabase holding one lift of the caller's, `se-own`, with one set. */
function fakeSupabase(accepted: string | null = LIVE) {
  const calls: Call[] = []
  const fakeFetch: typeof fetch = async (input, init) => {
    const url = decodeURIComponent(String(input))
    const headers = new Headers(init?.headers)
    const auth = headers.get('authorization')
    const method = init?.method ?? 'GET'
    const one = (headers.get('accept') ?? '').includes('vnd.pgrst.object')
    const json = (body: unknown, status = 200) =>
      new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    if (url.includes('/auth/v1/user')) {
      return auth === `Bearer ${accepted}` ? json({ id: 'login-1' }) : json({ msg: 'bad jwt' }, 401)
    }
    const table = url.split('/rest/v1/')[1].split('?')[0]
    calls.push({ method, table, url, body: init?.body ? JSON.parse(String(init.body)) : null, auth })
    if (method === 'GET' && table === 'session_exercises' && url.includes('training_sessions.user_id=eq.rows-owner')) {
      return json(url.includes('id=eq.se-own')
        ? [{ id: 'se-own', training_sessions: { user_id: 'rows-owner' }, session_sets: [{ set_number: 1, weight: 60, reps: 8, duration_s: null }] }]
        : [])
    }
    if (method === 'GET' && table === 'session_exercises' && url.includes('select=session_id')) {
      return json(one ? { session_id: 'sess-1' } : [{ session_id: 'sess-1' }])
    }
    if (method === 'GET' && table === 'exercises' && url.includes('name=eq.')) return json({ id: 'ex-1' })
    if (method === 'GET' && table === 'muscle_groups') return json([{ id: 'mg-1', name: 'Chest' }])
    if (method === 'POST' && table === 'training_sessions') return json({ id: 'sess-1' }, 201)
    if (method === 'POST' && table === 'session_exercises') return json({ id: 'se-new' }, 201)
    if (method === 'GET') return json(one ? null : [])
    return json(null, method === 'POST' ? 201 : 204)
  }
  const api = createApi({ supabaseUrl: URL_, anonKey: 'anon', origin: 'staging', fetch: fakeFetch })
  return { api, calls, writes: () => calls.filter(c => c.method !== 'GET') }
}

const send = (api: ReturnType<typeof createApi>, method: string, path: string, body?: unknown, token: string | null = LIVE) =>
  api.request(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

describe('logging a lift through the API', () => {
  it('files a catalogue spelling under its lift, as the caller, tagged with the build', async () => {
    const { api, calls, writes } = fakeSupabase()
    const res = await send(api, 'POST', '/api/weights', {
      date: DATE, exercise: 'flat bench press', sets: [{ weight: 60, reps: 8 }, { weight: 60, reps: 7 }],
    })
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({
      entry: { id: 'se-new', date: DATE, exercise: 'Bench Press', sets: [{ weight: 60, reps: 8 }, { weight: 60, reps: 7 }] },
      linked: true,
    })
    expect(calls.every(c => c.auth === `Bearer ${LIVE}`)).toBe(true)
    const session = writes().find(c => c.table === 'training_sessions')
    expect(session?.body).toEqual({ user_id: 'rows-owner', session_date: DATE, origin: 'staging' })
    expect(writes().find(c => c.table === 'session_sets')?.body).toEqual([
      { session_exercise_id: 'se-new', set_number: 1, weight: 60, reps: 8 },
      { session_exercise_id: 'se-new', set_number: 2, weight: 60, reps: 7 },
    ])
  })

  it('refuses a set the app would refuse, with its reason, before writing anything', async () => {
    const { api, writes } = fakeSupabase()
    const res = await send(api, 'POST', '/api/weights', { date: DATE, exercise: 'Bench Press', sets: [{ weight: 60, reps: 7.5 }] })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/whole number/)
    expect((await send(api, 'POST', '/api/weights', { date: DATE, exercise: 'Bench Press', sets: [] })).status).toBe(400)
    expect(writes()).toEqual([])
  })

  it('writes nothing for a missing or refused token', async () => {
    const body = { date: DATE, exercise: 'Bench Press', sets: [{ weight: 60, reps: 8 }] }
    const none = fakeSupabase()
    expect((await send(none.api, 'POST', '/api/weights', body, null)).status).toBe(401)
    const refused = fakeSupabase(null)
    expect((await send(refused.api, 'POST', '/api/weights', body)).status).toBe(401)
    expect([...none.calls, ...refused.calls]).toEqual([])
  })
})

describe('changing a logged lift through the API', () => {
  it('adds one set to the caller\'s own lift with a single write', async () => {
    const { api, writes } = fakeSupabase()
    const res = await send(api, 'PATCH', '/api/weights/se-own', { sets: [{ weight: 60, reps: 8 }, { weight: 60, reps: 6 }] })
    expect(res.status).toBe(204)
    expect(writes()).toEqual([expect.objectContaining({
      method: 'POST', table: 'session_sets', body: [{ session_exercise_id: 'se-own', set_number: 2, weight: 60, reps: 6 }],
    })])
  })

  it('deletes the caller\'s own lift', async () => {
    const { api, writes } = fakeSupabase()
    expect((await send(api, 'DELETE', '/api/weights/se-own')).status).toBe(204)
    expect(writes().some(c => c.method === 'DELETE' && c.table === 'session_exercises' && c.url.includes('id=eq.se-own'))).toBe(true)
  })

  it('touches no lift that is not the caller\'s', async () => {
    const { api, writes } = fakeSupabase()
    expect((await send(api, 'PATCH', '/api/weights/se-other', { sets: [{ weight: 60, reps: 8 }] })).status).toBe(404)
    expect((await send(api, 'DELETE', '/api/weights/se-other')).status).toBe(404)
    expect(writes()).toEqual([])
  })
})
