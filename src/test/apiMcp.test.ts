// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { createApi } from '@tekio/api'

// RFC 0099: the assistant connector. An MCP server on the API whose tools are
// the API's routes, signed in through OAuth, writing as the agent and undoable.
// Supabase is a fake that records every request; every row is invented.

const URL_ = 'http://supabase.test'
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
const jwt = (claims: object) => `${b64({ alg: 'HS256' })}.${b64(claims)}.sig`
const claims = { sub: 'login-1', exp: Date.now() / 1000 + 3600, app_metadata: { user_id: 'rows-owner' } }
/** A token Supabase's OAuth server issued to an assistant. */
const AGENT = jwt({ ...claims, client_id: 'assistant-1' })
/** The person's own sign-in. */
const PERSON = jwt(claims)
const DATE = '2026-10-23'

interface Call { method: string; table: string; url: string; body: unknown }

function fakeSupabase(lastChange: unknown = null) {
  const calls: Call[] = []
  const fakeFetch: typeof fetch = async (input, init) => {
    const url = decodeURIComponent(String(input))
    const auth = new Headers(init?.headers).get('authorization')
    const method = init?.method ?? 'GET'
    const json = (body: unknown, status = 200) =>
      new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    if (url.includes('/auth/v1/user')) return auth === `Bearer ${AGENT}` || auth === `Bearer ${PERSON}` ? json({ id: 'login-1' }) : json({}, 401)
    const table = url.split('/rest/v1/')[1].split('?')[0]
    const body = init?.body ? JSON.parse(String(init.body)) : null
    calls.push({ method, table, url, body })
    if (method === 'HEAD') return new Response(null, { status: 200, headers: { 'Content-Range': '*/0' } })
    if (method === 'GET' && table === 'agent_changes') return json(lastChange ? [lastChange] : [])
    if (method === 'GET' && table === 'user_profiles') {
      return json({ week_start_day: 'monday', hr_max_override: null, hr_max_source: null, birth_date: null, readiness_method: null })
    }
    // Own-checks before a delete: every id asked about is the caller's.
    const asked = url.match(/[?&]id=in\.\(([^)]*)\)/)?.[1]
    if (method === 'GET' && url.includes('user_id=eq.rows-owner') && asked) return json(asked.split(',').map(id => ({ id })))
    if (method === 'POST' && table === 'planned_exercises') {
      return json({ id: `p-${calls.filter(c => c.table === 'planned_exercises' && c.method === 'POST').length}`, sort_order: 0, session_exercise_id: null, ...body }, 201)
    }
    if (method === 'POST' && table === 'cardio_sessions') return json({ id: 'c-1', ...body }, 201)
    if (method === 'GET') return json([])
    return json(null, method === 'POST' ? 201 : 204)
  }
  const api = createApi({ supabaseUrl: URL_, anonKey: 'anon', origin: 'staging', fetch: fakeFetch })
  return { api, writes: () => calls.filter(c => c.method !== 'GET' && c.method !== 'HEAD') }
}

let rpcId = 0
async function rpc(api: ReturnType<typeof createApi>, method: string, params: unknown = {}, token: string | null = AGENT) {
  const res = await api.request('https://stg.example/api/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }),
  })
  return { res, body: res.status === 200 ? await res.json() : null }
}

const callTool = async (api: ReturnType<typeof createApi>, name: string, args: unknown) => {
  const { body } = await rpc(api, 'tools/call', { name, arguments: args })
  const result = body.result as { content: { text: string }[]; isError?: boolean }
  const text = result.content[0].text
  return { isError: !!result.isError, text, value: (() => { try { return JSON.parse(text) } catch { return text } })() }
}

describe('the assistant connector', () => {
  it('answers a call with no token with the challenge that starts the sign-in', async () => {
    const { api, writes } = fakeSupabase()
    const { res } = await rpc(api, 'initialize', {}, null)
    expect(res.status).toBe(401)
    expect(res.headers.get('www-authenticate'))
      .toBe('Bearer resource_metadata="https://stg.example/.well-known/oauth-protected-resource/api/mcp"')
    expect(writes()).toEqual([])
  })

  it('names Supabase Auth as where its tokens come from', async () => {
    const { api } = fakeSupabase()
    for (const path of ['/.well-known/oauth-protected-resource/api/mcp', '/.well-known/oauth-protected-resource']) {
      const res = await api.request(`https://stg.example${path}`)
      expect(await res.json()).toMatchObject({
        resource: 'https://stg.example/api/mcp',
        authorization_servers: ['http://supabase.test/auth/v1'],
      })
    }
  })

  it('starts a session and lists tools generated from the routes', async () => {
    const { api } = fakeSupabase()
    const init = await rpc(api, 'initialize', {
      protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' },
    })
    expect(init.body.result.serverInfo.name).toBe('tekio')
    const { body } = await rpc(api, 'tools/list')
    const tools = body.result.tools as { name: string; inputSchema: { properties: Record<string, { items?: { properties: Record<string, unknown>; required: string[] } }>; required?: string[] } }[]
    expect(tools.map(t => t.name)).toEqual([
      'get_whats_missing', 'get_readiness', 'get_adaptation', 'get_recent_training',
      'plan_lifts', 'plan_session', 'log_lift', 'log_cardio', 'log_sport', 'log_mobility', 'undo_last_agent_change',
    ])
    const home = tools.find(t => t.name === 'get_whats_missing')!
    expect(home.inputSchema.required).toEqual(['date'])
    // The body's schema, with its $refs written out, and nothing the API decides.
    const lift = tools.find(t => t.name === 'plan_lifts')!.inputSchema.properties.lifts.items!
    expect(Object.keys(lift.properties)).toEqual(['date', 'exercise', 'targets', 'supersetId'])
    expect(lift.required).toEqual(['date', 'exercise', 'targets'])
    expect(JSON.stringify(tools)).not.toContain('$ref')
  })

  it("repeats Home's own words", async () => {
    const { api } = fakeSupabase()
    const { value } = await callTool(api, 'get_whats_missing', { date: DATE })
    expect(value.words).toEqual({
      verdict: { text: 'Nothing logged yet.', sub: 'One session and this screen starts answering. Nothing here is guessed.' },
      missing: 'All seven qualities — no data yet.',
    })
    expect(value).not.toHaveProperty('muscles')
  })

  it('plans several lifts as the agent, and records them as one change', async () => {
    const { api, writes } = fakeSupabase()
    const { isError, value } = await callTool(api, 'plan_lifts', {
      lifts: [
        { date: DATE, exercise: 'Back squat', targets: [{ weight: 80, reps: 5 }] },
        { date: DATE, exercise: 'Nordic curl', targets: [{ weight: 0, reps: 6 }] },
      ],
    })
    expect(isError).toBe(false)
    expect(value.map((p: { plannedBy: string }) => p.plannedBy)).toEqual(['agent', 'agent'])
    const plans = writes().filter(w => w.table === 'planned_exercises')
    expect(plans.map(p => (p.body as { planned_by: string }).planned_by)).toEqual(['agent', 'agent'])
    expect(writes().find(w => w.table === 'agent_changes')!.body).toEqual({
      user_id: 'rows-owner', client_id: 'assistant-1', tool: 'plan_lifts', origin: 'staging',
      entries: [{ kind: 'planned_lift', id: 'p-1' }, { kind: 'planned_lift', id: 'p-2' }],
    })
  })

  it("marks a session an assistant logs as the agent's; the person's own stays unmarked", async () => {
    const agent = fakeSupabase()
    await callTool(agent.api, 'log_cardio', { date: DATE, type: 'Running', duration: 30 })
    expect(agent.writes().find(w => w.table === 'cardio_sessions')!.body).toMatchObject({ written_by: 'agent' })

    const person = fakeSupabase()
    await person.api.request('/api/cardio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${PERSON}` },
      body: JSON.stringify({ date: DATE, type: 'Running', duration: 30 }),
    })
    expect(person.writes().find(w => w.table === 'cardio_sessions')!.body).not.toHaveProperty('written_by')
  })

  it('undoes the last change through the delete routes, and keeps the record', async () => {
    const { api, writes } = fakeSupabase({
      id: 'change-1', tool: 'plan_lifts', created_at: '2026-10-23T08:00:00Z',
      entries: [{ kind: 'planned_lift', id: 'p-1' }, { kind: 'cardio', id: 'c-1' }],
    })
    const { value } = await callTool(api, 'undo_last_agent_change', {})
    expect(value).toEqual({ undid: 'plan_lifts', at: '2026-10-23T08:00:00Z', removed: 2, alreadyGone: 0 })
    expect(writes().map(w => `${w.method} ${w.table}`)).toEqual([
      'DELETE planned_exercises', 'DELETE cardio_sessions', 'PATCH agent_changes',
    ])
  })

  it('says so when nothing is left to undo', async () => {
    const { api, writes } = fakeSupabase()
    const { value } = await callTool(api, 'undo_last_agent_change', {})
    expect(value).toBe('Nothing an assistant wrote is left to undo.')
    expect(writes()).toEqual([])
  })
})
