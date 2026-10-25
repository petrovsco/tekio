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
 *  but a profile, and the menu's sections when `sections` holds them. Records
 *  each request's address and bearer token. */
function fakeSupabase(accepted: string | null, sections: string[] = []) {
  const calls: { url: string; auth: string | null; method: string }[] = []
  const fakeFetch: typeof fetch = async (input, init) => {
    const url = String(input)
    const auth = new Headers(init?.headers).get('authorization')
    calls.push({ url, auth, method: init?.method ?? 'GET' })
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    if (url.includes('/auth/v1/user')) {
      return auth === `Bearer ${accepted}` ? json({ id: 'login-1' }) : json({ msg: 'bad jwt' }, 401)
    }
    if (url.includes('/user_profiles')) {
      return json({ week_start_day: 'monday', hr_max_override: null, hr_max_source: null, birth_date: null, readiness_method: null })
    }
    if (url.includes('/user_section_config')) {
      return json(sections.map((key, i) => ({ section_key: key, show_in_menu: true, sort_order: i })))
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

  it('serves every row the app opens with in one answer, with the caller\'s token', async () => {
    const { api, calls } = fakeSupabase(LIVE)
    const res = await get(api, '/api/start', LIVE)
    expect(res.status).toBe(200)
    expect(Object.keys(await res.json())).toEqual([
      'weights', 'bodyweight', 'cardio', 'mobility', 'muscleGroups', 'exerciseMuscles', 'exerciseAdaptations',
      'sports', 'sportTypes', 'donations', 'sleep', 'sauna', 'cold', 'adaptationTargets', 'exerciseAliases',
      'readinessInputs', 'plans', 'sessionPlans', 'profile', 'sections',
    ])
    const rest = calls.filter(c => c.url.includes('/rest/v1/'))
    expect(rest.every(c => c.auth === `Bearer ${LIVE}`)).toBe(true)
    // A profile with no sections yet gets the default sections, and nothing else.
    expect(calls.filter(c => c.method === 'POST').map(c => c.url.split('/rest/v1/')[1].split('?')[0]))
      .toEqual(['user_section_config'])
    expect((await get(fakeSupabase(null).api, '/api/start', LIVE)).status).toBe(401)
  })

  it('writes nothing on an opening that finds the profile and the sections', async () => {
    const { api, calls } = fakeSupabase(LIVE, ['Weights', 'Cardio', 'Mobility'])
    const res = await get(api, '/api/start', LIVE)
    expect(res.status).toBe(200)
    expect((await res.json()).sections).toHaveLength(3)
    expect(calls.filter(c => c.method === 'POST')).toEqual([])
  })

  it('writes no profile or sections for a token Auth refuses', async () => {
    const { api, calls } = fakeSupabase(null)
    expect((await get(api, '/api/start', LIVE)).status).toBe(401)
    expect(calls.filter(c => c.method !== 'GET')).toEqual([])
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
      '/api/read/home', '/api/view/home', '/api/read/adaptations', '/api/read/readiness', '/api/start', '/api/weights', '/api/weights/{id}',
      ...['cardio', 'sleep', 'bodyweight', 'donations', 'sauna', 'cold', 'sport', 'mobility'].flatMap(p => [`/api/${p}`, `/api/${p}/{id}`]),
      '/api/readiness/{date}/morning-hrv', '/api/readiness/{date}/check-in',
      '/api/plans/lifts', '/api/plans/lifts/{id}', '/api/plans/sessions', '/api/plans/sessions/{id}',
      '/api/plans/lifts/{id}/logged', '/api/plans/sessions/{id}/logged', '/api/plans/missed',
      '/api/profile', '/api/sections', '/api/sections/{key}', '/api/sync/garmin', '/api/sync/runs/{id}',
      '/api/sign-in/link', '/api/sign-in/session', '/api/sign-in/refresh', '/api/error-reports',
    ])
  })

  it('names every operation once, so a generated client calls it by name', async () => {
    const { api } = fakeSupabase(LIVE)
    const doc = await (await get(api, '/api/openapi.json')).json()
    const ids = Object.values(doc.paths as Record<string, Record<string, { operationId?: string }>>)
      .flatMap(ops => Object.values(ops).map(o => o.operationId))
    expect(ids.every(id => typeof id === 'string' && /^[a-z][A-Za-z]+$/.test(id))).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('Home as it is printed (RFC 0096)', () => {
  it('serves the view for a live token, on the caller\'s own last night', async () => {
    const { api, calls } = fakeSupabase(LIVE)
    const res = await get(api, `/api/view/home?date=${DATE}&lastNight=2026-10-19`, LIVE)
    expect(res.status).toBe(200)
    const view = await res.json()
    expect(view.date).toBe(DATE)
    expect(view.verdict.text).toBe('Nothing logged yet.')
    expect(view.folds.map((f: { kind: string }) => f.kind)).toEqual(['weight', 'blood'])
    expect(calls.some(c => c.url.includes('/bodyweight_logs'))).toBe(true)
    expect((await get(api, `/api/view/home?date=${DATE}`, LIVE)).status).toBe(400)
    expect((await get(fakeSupabase(null).api, `/api/view/home?date=${DATE}&lastNight=2026-10-19`, LIVE)).status).toBe(401)
  })
})

describe('signing in from a phone app (RFC 0096)', () => {
  const CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
  const VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
  /** Supabase Auth, answering each call with `answer`; records what was sent. */
  function fakeAuth(answer: (path: string) => Response) {
    const sent: { path: string; body: Record<string, unknown>; apikey: string | null }[] = []
    const fakeFetch: typeof fetch = async (input, init) => {
      const url = new URL(String(input))
      sent.push({ path: url.pathname + url.search, body: JSON.parse(String(init?.body ?? '{}')), apikey: new Headers(init?.headers).get('apikey') })
      return answer(url.pathname + url.search)
    }
    return { api: createApi({ supabaseUrl: URL_, anonKey: 'anon', origin: 'staging', fetch: fakeFetch }), sent }
  }
  const post = (api: ReturnType<typeof createApi>, path: string, body: object) =>
    api.request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const ok = (body: object) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })

  it('asks Auth for a link in the PKCE flow, with the public key the app does not carry', async () => {
    const { api, sent } = fakeAuth(() => ok({}))
    const res = await post(api, '/api/sign-in/link', { email: 'someone@example.com', redirectTo: 'fyi.tekio.app://sign-in', codeChallenge: CHALLENGE })
    expect(res.status).toBe(204)
    expect(sent[0].path).toBe(`/auth/v1/otp?redirect_to=${encodeURIComponent('fyi.tekio.app://sign-in')}`)
    expect(sent[0].body).toEqual({ email: 'someone@example.com', create_user: true, code_challenge: CHALLENGE, code_challenge_method: 's256' })
    expect(sent[0].apikey).toBe('anon')
  })

  it('passes on why a link was not sent', async () => {
    const { api } = fakeAuth(() => new Response(JSON.stringify({ msg: 'Too many links in a row.' }), { status: 429 }))
    const res = await post(api, '/api/sign-in/link', { email: 'someone@example.com', redirectTo: 'fyi.tekio.app://sign-in', codeChallenge: CHALLENGE })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Too many links in a row.' })
    expect((await post(api, '/api/sign-in/link', { email: 'not an address', redirectTo: 'x', codeChallenge: 'short' })).status).toBe(400)
  })

  it('turns the link\'s code into a session, and refreshes it', async () => {
    const answer = { access_token: 'a1', refresh_token: 'r1', expires_at: 1_900_000_000, user: { email: 'someone@example.com' } }
    const { api, sent } = fakeAuth(() => ok(answer))
    const res = await post(api, '/api/sign-in/session', { code: 'code-1', codeVerifier: VERIFIER })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ accessToken: 'a1', refreshToken: 'r1', expiresAt: 1_900_000_000, email: 'someone@example.com' })
    expect(sent[0].path).toBe('/auth/v1/token?grant_type=pkce')
    expect(sent[0].body).toEqual({ auth_code: 'code-1', code_verifier: VERIFIER })
    expect((await post(api, '/api/sign-in/refresh', { refreshToken: 'r1' })).status).toBe(200)
    expect(sent[1]).toMatchObject({ path: '/auth/v1/token?grant_type=refresh_token', body: { refresh_token: 'r1' } })
  })

  it('refuses a used code with Auth\'s reason', async () => {
    const { api } = fakeAuth(() => new Response(JSON.stringify({ error_description: 'Invalid flow state.' }), { status: 400 }))
    const res = await post(api, '/api/sign-in/session', { code: 'code-1', codeVerifier: VERIFIER })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid flow state.' })
  })
})
