// The API (RFC 0094 step 2c): one door for every client. Routes follow the
// product, not the tables, and each is declared with its schema, so the
// OpenAPI description at /api/openapi.json comes from the same definitions the
// requests are checked against.
import { OpenAPIHono } from '@hono/zod-openapi'
import { PostgrestClient } from '@supabase/postgrest-js'
import { KnownError, homeRead, adaptationsRead, readinessRead, type ReadRows } from '@tekio/core'
import {
  loadReadRows, saveWeightEntry, updateWeightEntry, deleteWeightEntry, loadOwnWeightSets, type WriteDb,
} from '@tekio/db'
import { bearer, tokenUserId, tokenAccepted } from './auth'
import { homeRoute, adaptationsRoute, readinessRoute } from './reads'
import { logWeightRoute, editWeightRoute, deleteWeightRoute } from './weights'

export interface ApiConfig {
  supabaseUrl: string
  anonKey: string
  /** Written to `origin` on the rows a write creates: null in production,
   *  else the build that wrote them (tekio.rfcs/rfcs/done/0037-row-origin-tagging.md). */
  origin: string | null
  /** Where the API's own calls go; a test passes a fake. */
  fetch?: typeof fetch
}

export function createApi(config: ApiConfig) {
  const fetchFn = config.fetch ?? fetch
  const app = new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) return c.json({ error: 'Invalid request.' }, 400)
    },
  }).basePath('/api')

  app.openAPIRegistry.registerComponent('securitySchemes', 'bearer', {
    type: 'http', scheme: 'bearer', description: 'The Supabase access token of a signed-in session.',
  })

  /** The caller as the database sees them: a client sending their own token,
   *  and the id their rows are filed under. Null for a missing or malformed
   *  token; `accepted` is Supabase Auth's word on a well-formed one. */
  function caller(authorization: string | undefined): { db: WriteDb; accepted: Promise<boolean> } | null {
    const token = bearer(authorization)
    const userId = token && tokenUserId(token)
    if (!token || !userId) return null
    const client = new PostgrestClient(`${config.supabaseUrl}/rest/v1`, {
      headers: { apikey: config.anonKey, Authorization: `Bearer ${token}` },
      fetch: fetchFn,
    })
    return {
      db: { client, userId, origin: config.origin, catalogue: () => import('@tekio/core/catalogue') },
      accepted: tokenAccepted(config.supabaseUrl, config.anonKey, token, fetchFn),
    }
  }

  /** The caller's rows, or null when the token is refused. The rows load while
   *  Auth checks the token, so the check costs no extra round trip. */
  async function rowsFor(authorization: string | undefined, date: string): Promise<ReadRows | null> {
    const who = caller(authorization)
    if (!who) return null
    const rows = loadReadRows(who.db, date)
    if (!(await who.accepted)) {
      rows.catch(() => {})
      return null
    }
    return rows
  }

  /** The caller, for a write: nothing is written before Auth accepts the token. */
  async function writerFor(authorization: string | undefined): Promise<WriteDb | null> {
    const who = caller(authorization)
    return who && (await who.accepted) ? who.db : null
  }

  const refused = { error: 'Sign in again: no valid access token.' }
  const missing = { error: 'No such lift of yours.' }

  app.openapi(homeRoute, async c => {
    const { date } = c.req.valid('query')
    const rows = await rowsFor(c.req.header('authorization'), date)
    return rows ? c.json(homeRead(rows, date), 200) : c.json(refused, 401)
  })

  app.openapi(adaptationsRoute, async c => {
    const { date, quality } = c.req.valid('query')
    const rows = await rowsFor(c.req.header('authorization'), date)
    return rows ? c.json(adaptationsRead(rows, quality, date), 200) : c.json(refused, 401)
  })

  app.openapi(readinessRoute, async c => {
    const { date } = c.req.valid('query')
    const rows = await rowsFor(c.req.header('authorization'), date)
    return rows ? c.json(readinessRead(rows, date), 200) : c.json(refused, 401)
  })

  app.openapi(logWeightRoute, async c => {
    const db = await writerFor(c.req.header('authorization'))
    if (!db) return c.json(refused, 401)
    const { pattern, ...entry } = c.req.valid('json')
    return c.json(await saveWeightEntry(db, entry, pattern), 201)
  })

  // An edit or a delete first checks the lift is the caller's own: the
  // policies still allow more than that until the lock (RFC 0003), and the
  // check costs the edit nothing, because it reads the sets the edit compares.
  app.openapi(editWeightRoute, async c => {
    const db = await writerFor(c.req.header('authorization'))
    if (!db) return c.json(refused, 401)
    const { id } = c.req.valid('param')
    const prev = await loadOwnWeightSets(db, id)
    if (!prev) return c.json(missing, 404)
    await updateWeightEntry(db, id, c.req.valid('json'), prev)
    return c.body(null, 204)
  })

  app.openapi(deleteWeightRoute, async c => {
    const db = await writerFor(c.req.header('authorization'))
    if (!db) return c.json(refused, 401)
    const { id } = c.req.valid('param')
    if (!(await loadOwnWeightSets(db, id))) return c.json(missing, 404)
    await deleteWeightEntry(db, id)
    return c.body(null, 204)
  })

  app.doc31('/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'Tekiō API', version: '0' },
  })

  // An entry refused for what it holds says why, as the app's own screens do.
  // Any other failure says nothing about the rows behind it.
  app.onError((err, c) => err instanceof KnownError
    ? c.json({ error: err.message }, 400)
    : c.json({ error: 'Something went wrong.' }, 500))
  app.notFound(c => c.json({ error: 'No such route.' }, 404))

  return app
}
