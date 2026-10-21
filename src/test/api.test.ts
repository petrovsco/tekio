// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { createApi } from '@tekio/api'

// RFC 0094 step 2c: the API serves the three reads to whoever holds a live
// access token, loading that person's rows with their own token. Supabase is a
// fake here; every row and id is invented.

const URL_ = 'http://supabase.test'
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
const jwt = (claims: object) => `${b64({ alg: 'HS256' })}.${b64(claims)}.sig`
const LIVE = jwt({ sub: 'login-1', exp: Date.now() / 1000 + 3600, app_metadata: { user_id: 'rows-owner' } })
const DATE = '2026-10-20'

/** A Supabase that accepts `accepted` and answers every table with no rows,
 *  but a profile. Records each request's address and bearer token. */
function fakeSupabase(accepted: string | null) {
  const calls: { url: string; auth: string | null }[] = []
  const fakeFetch: typeof fetch = async (input, init) => {
    const url = String(input)
    const auth = new Headers(init?.headers).get('authorization')
    calls.push({ url, auth })
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    if (url.includes('/auth/v1/user')) {
      return auth === `Bearer ${accepted}` ? json({ id: 'login-1' }) : json({ msg: 'bad jwt' }, 401)
    }
    if (url.includes('/user_profiles')) {
      return json({ week_start_day: 'monday', hr_max_override: null, hr_max_source: null, birth_date: null, readiness_method: null })
    }
    return json([])
  }
  return { api: createApi({ supabaseUrl: URL_, anonKey: 'anon', origin: 'staging', fetch: fakeFetch }), calls }
}

const get = (api: ReturnType<typeof createApi>, path: string, token?: string) =>
  api.request(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} })

describe('the API reads', () => {
  it('serves Home for a live token, loading with that token and its adopted id', async () => {
    const { api, calls } = fakeSupabase(LIVE)
    const res = await get(api, `/api/read/home?date=${DATE}`, LIVE)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.date).toBe(DATE)
    expect(Object.keys(body)).toEqual(
      ['date', 'muscles', 'gaps', 'qualities', 'coverage', 'readiness', 'donation', 'verdict'],
    )
    const rest = calls.filter(c => c.url.includes('/rest/v1/'))
    expect(rest.length).toBeGreaterThan(0)
    expect(rest.every(c => c.auth === `Bearer ${LIVE}`)).toBe(true)
    expect(rest.some(c => c.url.includes('user_id=eq.rows-owner'))).toBe(true)
  })

  it('serves Adaptations for one quality, and readiness', async () => {
    const { api } = fakeSupabase(LIVE)
    const adapt = await get(api, `/api/read/adaptations?date=${DATE}&quality=power`, LIVE)
    expect(adapt.status).toBe(200)
    expect((await adapt.json()).quality).toBe('power')
    const ready = await get(api, `/api/read/readiness?date=${DATE}`, LIVE)
    expect(ready.status).toBe(200)
    expect(await ready.json()).toHaveProperty('verdict')
  })

  it('refuses a call with no token before touching the database', async () => {
    const { api, calls } = fakeSupabase(LIVE)
    expect((await get(api, `/api/read/home?date=${DATE}`)).status).toBe(401)
    expect(calls).toEqual([])
  })

  it('refuses a token Supabase Auth does not accept, and an expired one', async () => {
    const { api } = fakeSupabase(null)
    expect((await get(api, `/api/read/home?date=${DATE}`, LIVE)).status).toBe(401)
    const expired = jwt({ sub: 'login-1', exp: Date.now() / 1000 - 60 })
    expect((await get(fakeSupabase(expired).api, `/api/read/home?date=${DATE}`, expired)).status).toBe(401)
  })

  it('needs the caller to say which day it is, and a quality it knows', async () => {
    const { api } = fakeSupabase(LIVE)
    expect((await get(api, '/api/read/home', LIVE)).status).toBe(400)
    expect((await get(api, '/api/read/home?date=20-10-2026', LIVE)).status).toBe(400)
    expect((await get(api, `/api/read/adaptations?date=${DATE}&quality=vo2max`, LIVE)).status).toBe(400)
  })

  it('describes its routes as OpenAPI', async () => {
    const { api } = fakeSupabase(LIVE)
    const doc = await (await get(api, '/api/openapi.json')).json()
    expect(Object.keys(doc.paths)).toEqual([
      '/api/read/home', '/api/read/adaptations', '/api/read/readiness', '/api/weights', '/api/weights/{id}',
    ])
  })
})
