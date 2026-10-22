// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { createApi } from '@tekio/api'

// RFC 0094 step 4: the settings, the Garmin sync and error reports through the
// API land as the app wrote them. Supabase is a fake that records every
// request; every row is invented.

const URL_ = 'http://supabase.test'
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
const jwt = (claims: object) => `${b64({ alg: 'HS256' })}.${b64(claims)}.sig`
const LIVE = jwt({ sub: 'login-1', exp: Date.now() / 1000 + 3600, app_metadata: { user_id: 'rows-owner' } })

interface Call { method: string; path: string; url: string; auth: string | null; body: unknown }

const RUN = { id: 7, status: 'ok', requested_at: '2026-10-22T05:00:00Z', finished_at: '2026-10-22T05:02:00Z' }

function fakeSupabase({ runs = [RUN], limitReached = false } = {}) {
  const calls: Call[] = []
  const fakeFetch: typeof fetch = async (input, init) => {
    const url = decodeURIComponent(String(input))
    const headers = new Headers(init?.headers)
    const method = init?.method ?? 'GET'
    const json = (body: unknown, status = 200) =>
      new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    if (url.includes('/auth/v1/user')) return headers.get('authorization') === `Bearer ${LIVE}` ? json({ id: 'login-1' }) : json({}, 401)
    const path = url.split('/rest/v1/')[1].split('?')[0]
    calls.push({ method, path, url, auth: headers.get('authorization'), body: init?.body ? JSON.parse(String(init.body)) : null })
    if (path === 'rpc/request_garmin_sync') {
      return limitReached ? json({ code: 'P0001', message: 'One sync an hour.' }, 400) : json({ ...RUN, status: 'requested', finished_at: null })
    }
    if (path === 'sync_runs') {
      const id = url.match(/[?&]id=eq\.(\d+)/)?.[1]
      const found = runs.filter(r => !id || String(r.id) === id)
      return id ? json(found[0] ?? null) : json(found)
    }
    return json(null, 204)
  }
  const api = createApi({ supabaseUrl: URL_, anonKey: 'anon', origin: 'staging', fetch: fakeFetch })
  return { api, calls }
}

const send = (api: ReturnType<typeof createApi>, method: string, path: string, body?: unknown, token: string | null = LIVE) =>
  api.request(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

describe('settings through the API', () => {
  it('writes only the profile settings sent, an HRmax with its source', async () => {
    const { api, calls } = fakeSupabase()
    expect((await send(api, 'PATCH', '/api/profile', { hrMax: { value: 188, source: 'tracker' }, weekStartDay: 'sunday' })).status).toBe(204)
    const write = calls.find(c => c.method === 'PATCH')!
    expect(write.path).toBe('user_profiles')
    expect(write.url).toContain('id=eq.rows-owner')
    expect(write.body).toEqual({ week_start_day: 'sunday', hr_max_override: 188, hr_max_source: 'tracker' })
  })

  it('clears an HRmax and its source together', async () => {
    const { api, calls } = fakeSupabase()
    await send(api, 'PATCH', '/api/profile', { hrMax: { value: null, source: 'typed' } })
    expect(calls.find(c => c.method === 'PATCH')!.body).toEqual({ hr_max_override: null, hr_max_source: null })
  })

  it('saves the section order and shows or hides one section', async () => {
    const { api, calls } = fakeSupabase()
    const order = [{ sectionKey: 'Cardio', showInMenu: true, sortOrder: 0 }, { sectionKey: 'Weights', showInMenu: false, sortOrder: 1 }]
    expect((await send(api, 'PUT', '/api/sections', order)).status).toBe(204)
    expect((await send(api, 'PATCH', '/api/sections/Mobility', { showInMenu: false })).status).toBe(204)
    const [upsert, patch] = calls.filter(c => c.method !== 'GET')
    expect(upsert.url).toContain('on_conflict=user_id,section_key')
    expect(upsert.body).toEqual([
      { user_id: 'rows-owner', section_key: 'Cardio', show_in_menu: true, sort_order: 0 },
      { user_id: 'rows-owner', section_key: 'Weights', show_in_menu: false, sort_order: 1 },
    ])
    expect(patch.url).toContain('user_id=eq.rows-owner')
    expect(patch.url).toContain('section_key=eq.Mobility')
    expect(patch.body).toEqual({ show_in_menu: false })
  })

  it('refuses a setting without a live token, writing nothing', async () => {
    const { api, calls } = fakeSupabase()
    expect((await send(api, 'PATCH', '/api/profile', { weekStartDay: 'sunday' }, null)).status).toBe(401)
    expect(calls).toEqual([])
  })
})

describe('the Garmin sync through the API', () => {
  it('reads the last sync, or null when there has been none', async () => {
    const last = await send(fakeSupabase().api, 'GET', '/api/sync/garmin')
    expect(await last.json()).toEqual({ id: 7, status: 'ok', requestedAt: RUN.requested_at, finishedAt: RUN.finished_at })
    const never = await send(fakeSupabase({ runs: [] }).api, 'GET', '/api/sync/garmin')
    expect(never.status).toBe(200)
    expect(await never.json()).toBeNull()
  })

  it('asks for a run, and says the daily limit in words', async () => {
    const asked = await send(fakeSupabase().api, 'POST', '/api/sync/garmin')
    expect((await asked.json()).status).toBe('requested')
    const refused = await send(fakeSupabase({ limitReached: true }).api, 'POST', '/api/sync/garmin')
    expect(refused.status).toBe(400)
    expect(await refused.json()).toEqual({ error: 'One sync an hour.' })
  })

  it('follows one of the caller’s runs, and no one else’s', async () => {
    const { api, calls } = fakeSupabase()
    expect((await send(api, 'GET', '/api/sync/runs/7')).status).toBe(200)
    expect(calls[calls.length - 1].url).toContain('user_id=eq.rows-owner')
    expect((await send(api, 'GET', '/api/sync/runs/8')).status).toBe(404)
  })
})

describe('error reports through the API', () => {
  const payload = {
    version: '2.2.59', build: 'staging', screen: 'Home', source: 'window', name: 'TypeError', message: 'x is undefined',
    userAgent: 'test', trail: ['bootstrap'], at: '2026-10-22T05:00:00Z',
  }

  it('takes a report with no sign-in, through the database function, keeping only the whitelisted fields', async () => {
    const { api, calls } = fakeSupabase()
    const res = await send(api, 'POST', '/api/error-reports', { signature: 'abc', payload: { ...payload, state: { weight: 80 } } }, null)
    expect(res.status).toBe(204)
    expect(calls).toHaveLength(1)
    expect(calls[0].path).toBe('rpc/report_error')
    expect(calls[0].auth).toBe('Bearer anon')
    expect(calls[0].body).toEqual({ p_signature: 'abc', p_payload: payload })
  })

  it('sends a signed-in report with the caller’s token', async () => {
    const { api, calls } = fakeSupabase()
    await send(api, 'POST', '/api/error-reports', { signature: 'abc', payload })
    expect(calls[0].auth).toBe(`Bearer ${LIVE}`)
  })
})
