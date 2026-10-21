// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { createApi } from '@tekio/api'

// RFC 0094 step 2d: the one-entry logs (cardio, sport, sleep, sauna, cold, body
// weight, donations, mobility) and the morning's readiness inputs written through the API land as the app writes them, as
// the caller, and only on the caller's own rows. Supabase is a fake that records
// every request; every row, id and reading is invented.

const URL_ = 'http://supabase.test'
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
const jwt = (claims: object) => `${b64({ alg: 'HS256' })}.${b64(claims)}.sig`
const LIVE = jwt({ sub: 'login-1', exp: Date.now() / 1000 + 3600, app_metadata: { user_id: 'rows-owner' } })
const DATE = '2026-10-21'

interface Call { method: string; table: string; url: string; body: unknown; auth: string | null }

/** A Supabase where every table holds one row of the caller's, `own-1`. */
function fakeSupabase() {
  const calls: Call[] = []
  const fakeFetch: typeof fetch = async (input, init) => {
    const url = decodeURIComponent(String(input))
    const headers = new Headers(init?.headers)
    const auth = headers.get('authorization')
    const method = init?.method ?? 'GET'
    const one = (headers.get('accept') ?? '').includes('vnd.pgrst.object')
    const json = (body: unknown, status = 200) =>
      new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    if (url.includes('/auth/v1/user')) return auth === `Bearer ${LIVE}` ? json({ id: 'login-1' }) : json({ msg: 'bad jwt' }, 401)
    const table = url.split('/rest/v1/')[1].split('?')[0]
    const body = init?.body ? JSON.parse(String(init.body)) : null
    calls.push({ method, table, url, body, auth })
    if (method === 'GET' && url.includes('select=id&id=in.') && url.includes('user_id=eq.rows-owner')) {
      return json(url.includes('id=in.(own-1)') ? [{ id: 'own-1' }] : [])
    }
    if (method === 'GET' && table === 'sport_types') return json(null)
    if (method === 'POST' && table === 'sport_types') return json({ id: 'st-new' }, 201)
    if (method === 'POST' && table === 'cardio_sessions') return json({ id: 'c-new', ...body, source: 'manual' }, 201)
    if (method === 'POST' && table === 'sport_sessions') return json({ id: 's-new', ...body, sport_types: { name: 'Squash' } }, 201)
    if (method === 'POST' && table === 'mobility_sessions') return json({ id: 'm-new' }, 201)
    if (method === 'GET' && table === 'exercises' && url.includes('name=eq.')) return json({ id: 'ex-new' })
    if (method === 'POST' && table === 'readiness_inputs') {
      return json({ id: 'ri-1', log_date: body.log_date, morning_hrv: null, ...body }, 201)
    }
    if (method === 'POST' && table === 'bodyweight_logs') return json({ id: 'bw-1', ...body }, 201)
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

describe('the one-entry logs through the API', () => {
  it('logs a cardio session as the app does, as the caller, tagged with the build', async () => {
    const { api, calls, writes } = fakeSupabase()
    const res = await send(api, 'POST', '/api/cardio', {
      date: DATE, type: 'Indoor Rowing', duration: 30, format: 'intervals', boutSeconds: 240,
    })
    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ id: 'c-new', date: DATE, type: 'Indoor Rowing', duration: 30, format: 'intervals', boutSeconds: 240 })
    expect(calls.every(c => c.auth === `Bearer ${LIVE}`)).toBe(true)
    expect(writes()[0].body).toEqual({
      user_id: 'rows-owner', session_date: DATE, activity_type: 'rowing', duration_minutes: 30, distance_km: null,
      avg_heart_rate: null, notes: null, format: 'intervals', bout_seconds: 240, origin: 'staging',
    })
  })

  it('creates a sport typed for the first time, with the flags sent beside it', async () => {
    const { api, writes } = fakeSupabase()
    const res = await send(api, 'POST', '/api/sport', {
      date: DATE, sport: 'Squash', duration: 60, newSport: { hasCompetitor: true, hasTeammate: false },
    })
    expect(res.status).toBe(201)
    expect(writes().map(c => [c.table, c.body])).toEqual([
      ['sport_types', { user_id: 'rows-owner', name: 'Squash', is_system: false, has_competitor: true, has_teammate: false, origin: 'staging' }],
      ['sport_sessions', expect.objectContaining({ sport_type_id: 'st-new', quality: null, notes: null, duration_minutes: 60 })],
    ])
  })

  it('keeps one weigh-in a day', async () => {
    const { api, writes } = fakeSupabase()
    expect((await send(api, 'POST', '/api/bodyweight', { date: DATE, weight: 80.5 })).status).toBe(201)
    expect(writes()[0].url).toContain('on_conflict=user_id,log_date')
  })

  it("replaces and deletes the caller's own row, and nobody else's", async () => {
    const { api, writes } = fakeSupabase()
    const night = { date: DATE, hours: 7.5, quality: 4 }
    expect((await send(api, 'PUT', '/api/sleep/own-1', night)).status).toBe(204)
    expect((await send(api, 'DELETE', '/api/sauna/own-1')).status).toBe(204)
    expect((await send(api, 'PUT', '/api/sleep/theirs', night)).status).toBe(404)
    expect((await send(api, 'DELETE', '/api/cold/theirs')).status).toBe(404)
    expect(writes().map(c => [c.method, c.table, c.body])).toEqual([
      ['PATCH', 'sleep_logs', { log_date: DATE, duration_hours: 7.5, quality: 4, notes: null }],
      ['DELETE', 'sauna_sessions', null],
    ])
  })

  it('logs a mobility session with its stretches, counting its minutes', async () => {
    const { api, writes } = fakeSupabase()
    const res = await send(api, 'POST', '/api/mobility', {
      date: DATE, exercises: [{ name: 'Couch stretch', duration: 4 }, { name: 'Pigeon', duration: 3, notes: 'left tight' }],
    })
    expect(res.status).toBe(201)
    expect((await res.json()).duration).toBe(7)
    const w = writes()
    expect(w[0]).toMatchObject({ table: 'mobility_sessions', body: { user_id: 'rows-owner', session_date: DATE, total_duration: 7, origin: 'staging' } })
    expect(w.find(c => c.table === 'mobility_exercises')?.body).toEqual([
      { session_id: 'm-new', exercise_name: 'Couch stretch', duration_minutes: 4, notes: null, exercise_id: 'ex-new' },
      { session_id: 'm-new', exercise_name: 'Pigeon', duration_minutes: 3, notes: 'left tight', exercise_id: 'ex-new' },
    ])
  })

  it("saves the day's check-in without touching its morning HRV", async () => {
    const { api, writes } = fakeSupabase()
    const res = await send(api, 'PUT', `/api/readiness/${DATE}/check-in`, { energy: 4, soreness: 2, sleepQuality: 3, stress: 2, mood: 4 })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ date: DATE, checkIn: { energy: 4, soreness: 2, sleepQuality: 3, stress: 2, mood: 4 } })
    expect(writes()[0].body).toEqual({
      user_id: 'rows-owner', log_date: DATE, energy: 4, soreness: 2, sleep_quality: 3, stress: 2, mood: 4, origin: 'staging',
    })
    expect((await send(api, 'PUT', `/api/readiness/${DATE}/morning-hrv`, { ms: 900 })).status).toBe(400)
  })

  it('refuses a malformed entry or a missing token before writing anything', async () => {
    const { api, writes } = fakeSupabase()
    expect((await send(api, 'POST', '/api/cardio', { date: DATE, type: 'Rowing', duration: 30 })).status).toBe(400)
    expect((await send(api, 'POST', '/api/donations', { date: DATE, type: 'Full Blood' }, null)).status).toBe(401)
    expect((await send(api, 'POST', '/api/sleep', { date: DATE, hours: 30 })).status).toBe(400)
    expect(writes()).toEqual([])
  })
})
