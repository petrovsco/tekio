// The assistant connector (RFC 0099): a remote MCP server at /api/mcp. An
// assistant adds it by its address and signs the person in through Supabase's
// OAuth 2.1 server, whose consent page is the app's /oauth/consent; the token
// it gets back is the person's own, marked with the assistant's client id, so
// the database policies decide what it may touch exactly as they do for the
// app. Each tool is one of this API's routes (tools.ts), called in-process with
// that token; nothing here reads or writes the database except the record of
// what an assistant wrote, which undo replays backwards.
//
// Stateless: every request builds its own server and transport, so any
// function instance answers any call. There are no sessions to keep.
import type { Hono } from 'hono'
import type { OpenAPIHono } from '@hono/zod-openapi'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { CallToolRequestSchema, ListToolsRequestSchema, type CallToolResult, type Tool } from '@modelcontextprotocol/sdk/types.js'
import { recordAgentChange, lastAgentChange, markAgentChangeUndone, agentChangesSince, type AgentEntry, type WriteDb } from '@tekio/db'
import { bearer, tokenClientId } from '../auth'
import { toolInput, type InputPlan } from './schema'
import { ROUTE_TOOLS, UNDO_PATH, UNDO_DESCRIPTION, INSTRUCTIONS, type RouteTool } from './tools'
import { mayAgentWrite, AGENT_CHANGES_PER_HOUR } from './entitlements'

const MCP_PATH = '/api/mcp'
const METADATA_PATH = '/.well-known/oauth-protected-resource'

interface McpConfig {
  supabaseUrl: string
  /** The caller as a writer, once Auth has accepted the token; null otherwise. */
  writerFor(authorization: string | undefined): Promise<WriteDb | null>
}

/** The site's own address, as the assistant reached it. */
function siteOrigin(url: string): string {
  const u = new URL(url)
  const local = u.hostname === 'localhost' || u.hostname === '127.0.0.1'
  return `${local ? u.protocol : 'https:'}//${u.host}`
}

export function mountMcp(root: Hono, api: OpenAPIHono, config: McpConfig) {
  // RFC 9728: where this resource's tokens come from. Served at the root, and
  // at the root plus the resource's path, which is where a client looks first.
  const metadata = (url: string) => ({
    resource: siteOrigin(url) + MCP_PATH,
    authorization_servers: [`${config.supabaseUrl}/auth/v1`],
    bearer_methods_supported: ['header'],
    resource_name: 'Tekiō',
    resource_documentation: 'https://tekio.fyi',
  })
  const cors = { 'Access-Control-Allow-Origin': '*' }
  for (const path of [METADATA_PATH, METADATA_PATH + MCP_PATH]) {
    root.get(path, c => c.json(metadata(c.req.url), 200, cors))
  }

  const tools = generatedTools(api)

  root.options(MCP_PATH, c => c.body(null, 204, {
    ...cors,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-ID',
    'Access-Control-Expose-Headers': 'WWW-Authenticate, Mcp-Session-Id',
  }))

  root.all(MCP_PATH, async c => {
    const authorization = c.req.header('authorization')
    const db = await config.writerFor(authorization)
    if (!db) {
      // The challenge that starts the sign-in: it names the metadata above.
      return c.json({ error: 'Sign in to Tekiō to connect this assistant.' }, 401, {
        ...cors,
        'Access-Control-Expose-Headers': 'WWW-Authenticate',
        'WWW-Authenticate': `Bearer resource_metadata="${siteOrigin(c.req.url)}${METADATA_PATH}${MCP_PATH}"`,
      })
    }
    const token = bearer(authorization)!
    const server = buildServer(api, tools, db, { authorization: authorization!, clientId: tokenClientId(token) })
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
    await server.connect(transport)
    const res = await transport.handleRequest(c.req.raw)
    res.headers.set('Access-Control-Allow-Origin', '*')
    return res
  })
}

interface GeneratedTool { spec: RouteTool; tool: Tool; plan: InputPlan }

/** Every route tool with its input read off the API's own description. */
function generatedTools(api: OpenAPIHono): GeneratedTool[] {
  const doc = api.getOpenAPI31Document({ openapi: '3.1.0', info: { title: 'Tekiō API', version: '0' } }) as unknown as Record<string, unknown>
  return ROUTE_TOOLS.map(spec => {
    const { schema, plan } = toolInput(doc, spec.method, spec.path, spec.omit)
    const inputSchema = spec.many
      ? { type: 'object' as const, properties: { [spec.many]: { type: 'array', minItems: 1, items: schema } }, required: [spec.many] }
      : schema
    const tool: Tool = {
      name: spec.name,
      description: spec.description,
      inputSchema,
      annotations: spec.writes
        ? { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
        : { readOnlyHint: true, openWorldHint: false },
    }
    return { spec, tool, plan }
  })
}

const UNDO_TOOL: Tool = {
  name: 'undo_last_agent_change',
  description: UNDO_DESCRIPTION,
  inputSchema: { type: 'object', properties: {} },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
}

const text = (body: unknown, isError = false): CallToolResult =>
  ({ content: [{ type: 'text', text: typeof body === 'string' ? body : JSON.stringify(body) }], ...(isError ? { isError } : {}) })

function buildServer(
  api: OpenAPIHono,
  tools: GeneratedTool[],
  db: WriteDb,
  who: { authorization: string; clientId: string | null },
): Server {
  const server = new Server({ name: 'tekio', title: 'Tekiō', version: '1.0.0' }, {
    capabilities: { tools: {} },
    instructions: INSTRUCTIONS,
  })

  /** One call to one route, as the app would make it, with the caller's token. */
  async function call(method: string, path: string, args: Record<string, unknown>, plan: InputPlan) {
    let url = path
    for (const name of plan.path) url = url.replace(`{${name}}`, encodeURIComponent(String(args[name] ?? '')))
    const query = new URLSearchParams()
    for (const name of plan.query) if (args[name] !== undefined) query.set(name, String(args[name]))
    const body = Object.fromEntries(plan.body.filter(n => args[n] !== undefined).map(n => [n, args[n]]))
    const res = await api.request(query.size ? `${url}?${query}` : url, {
      method: method.toUpperCase(),
      headers: { authorization: who.authorization, ...(method === 'get' ? {} : { 'content-type': 'application/json' }) },
      ...(method === 'get' ? {} : { body: JSON.stringify(body) }),
    })
    const answer = res.status === 204 ? null : await res.json().catch(() => null)
    return { ok: res.ok, status: res.status, answer }
  }

  async function mayWrite(): Promise<string | null> {
    if (!(await mayAgentWrite(db))) return 'Writing plans and logs through an assistant needs a paid plan.'
    const since = new Date(Date.now() - 3600_000).toISOString()
    if ((await agentChangesSince(db, since)) >= AGENT_CHANGES_PER_HOUR) {
      return `Too many changes in the last hour (${AGENT_CHANGES_PER_HOUR}). Try again later.`
    }
    return null
  }

  async function runRouteTool(g: GeneratedTool, args: Record<string, unknown>): Promise<CallToolResult> {
    const { spec, plan } = g
    if (!spec.writes) {
      const r = await call(spec.method, spec.path, args, plan)
      if (!r.ok) return text(r.answer ?? `Failed (${r.status}).`, true)
      return text(spec.answer ? spec.answer(r.answer as never) : r.answer)
    }
    const refused = await mayWrite()
    if (refused) return text(refused, true)
    const items = spec.many ? (args[spec.many] as Record<string, unknown>[] | undefined) ?? [] : [args]
    const written: unknown[] = []
    const entries: AgentEntry[] = []
    let failure: unknown = null
    // One at a time, in order: a plan's place in the day follows its order.
    for (const item of items) {
      const r = await call(spec.method, spec.path, item, plan)
      if (!r.ok) { failure = r.answer ?? `Failed (${r.status}).`; break }
      written.push(r.answer)
      const id = (r.answer as { id?: unknown } | null)?.id
      if (typeof id === 'string') entries.push({ kind: spec.writes, id })
    }
    if (entries.length) await recordAgentChange(db, { clientId: who.clientId, tool: spec.name, entries })
    if (failure) {
      const kept = written.length ? ` The ${written.length} written before it stay, and undo takes them out.` : ''
      return text({ error: failure, written, note: `Stopped at item ${written.length + 1}.${kept}` }, true)
    }
    return text(spec.many ? written : written[0])
  }

  async function undo(): Promise<CallToolResult> {
    const change = await lastAgentChange(db)
    if (!change) return text('Nothing an assistant wrote is left to undo.')
    let removed = 0
    for (const e of change.entries) {
      const r = await call('delete', `${UNDO_PATH[e.kind]}/{id}`, { id: e.id }, { path: ['id'], query: [], body: [] })
      // Gone already: the person took it out themselves.
      if (r.ok) removed++
      else if (r.status !== 404) return text(r.answer ?? `Undo failed (${r.status}).`, true)
    }
    await markAgentChangeUndone(db, change.id)
    return text({ undid: change.tool, at: change.createdAt, removed, alreadyGone: change.entries.length - removed })
  }

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [...tools.map(t => t.tool), UNDO_TOOL] }))
  server.setRequestHandler(CallToolRequestSchema, async req => {
    const args = (req.params.arguments ?? {}) as Record<string, unknown>
    if (req.params.name === UNDO_TOOL.name) return undo()
    const g = tools.find(t => t.tool.name === req.params.name)
    return g ? runRouteTool(g, args) : text(`No tool named ${req.params.name}.`, true)
  })
  return server
}
