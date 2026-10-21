// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createApi } from '@tekio/api'
import { createTekioClient } from '@tekio/client'

// RFC 0094: the typed client is generated from the routes, and stays so. The
// committed description must be what the API serves now — when this fails,
// run `npm run api:client` and commit what it writes. Every row is invented.

const DATE = '2026-10-21'
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
const LIVE = `${b64({ alg: 'HS256' })}.${b64({ sub: 'login-1', exp: Date.now() / 1000 + 3600 })}.sig`

/** The API, over a Supabase that accepts LIVE and stores one weigh-in. */
function api() {
  const supabase: typeof fetch = async (input, init) => {
    const url = String(input)
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    if (url.includes('/auth/v1/user')) return new Headers(init?.headers).get('authorization') === `Bearer ${LIVE}` ? json({ id: 'login-1' }) : json({}, 401)
    if (url.includes('/bodyweight_logs')) return json({ id: 'bw-1', log_date: DATE, weight: 80.5 }, 201)
    if (url.includes('/user_profiles')) return json({ readiness_method: null })
    return json([])
  }
  return createApi({ supabaseUrl: 'http://supabase.test', anonKey: 'anon', origin: null, fetch: supabase })
}

describe('the typed client', () => {
  it('is generated from the routes as they are now', async () => {
    const served = await (await api().request('/api/openapi.json')).json()
    const committed = JSON.parse(readFileSync('packages/client/openapi.json', 'utf8'))
    expect(committed).toEqual(served)
  })

  it('calls the API with the token, typed end to end', async () => {
    const app = api()
    const client = createTekioClient({
      baseUrl: 'http://tekio.test',
      token: () => LIVE,
      fetch: (input: RequestInfo | URL) => Promise.resolve(app.fetch(input as Request)),
    })
    const logged = await client.POST('/api/bodyweight', { body: { date: DATE, weight: 80.5 } })
    expect(logged.response.status).toBe(201)
    expect(logged.data?.weight).toBe(80.5)
    const home = await client.GET('/api/read/home', { params: { query: { date: DATE } } })
    expect(home.data?.verdict.mode).toBe('push')

    const anonymous = createTekioClient({ baseUrl: 'http://tekio.test', token: () => null, fetch: (i: RequestInfo | URL) => Promise.resolve(app.fetch(i as Request)) })
    expect((await anonymous.GET('/api/read/home', { params: { query: { date: DATE } } })).error?.error).toMatch(/Sign in/)
  })
})
