// The API (RFC 0094 step 2c): one door for every client. Routes follow the
// product, not the tables, and each is declared with its schema, so the
// OpenAPI description at /api/openapi.json comes from the same definitions the
// requests are checked against.
//
// Every read takes `date`, the person's own calendar day. The server's clock
// sits in some other time zone and cannot know it, so the client always says.
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { PostgrestClient } from '@supabase/postgrest-js'
import { MUSCLE_QUALITIES, homeRead, adaptationsRead, readinessRead, type ReadRows } from '@tekio/core'
import { loadReadRows } from '@tekio/db'
import { bearer, tokenUserId, tokenAccepted } from './auth'

export interface ApiConfig {
  supabaseUrl: string
  anonKey: string
  /** Where the API's own calls go; a test passes a fake. */
  fetch?: typeof fetch
}

const DateQuery = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).openapi({
  description: "The person's own calendar day, YYYY-MM-DD.",
  example: '2026-10-20',
})

const ErrorBody = z.object({ error: z.string() }).openapi('Error')

// The reads' answers are described by their top-level fields for now; each
// field's full shape lands before a client is generated from this (RFC 0094).
const Field = z.unknown()

const HomeBody = z.object({
  date: z.string(), muscles: Field, gaps: Field, qualities: Field, coverage: Field,
  readiness: Field, donation: Field, verdict: Field,
}).openapi('HomeRead')

const AdaptationsBody = z.object({
  date: z.string(), coverage: Field, quality: z.string(), shape: Field, muscles: Field, gaps: Field,
  qualities: Field, liftingSets: Field, cardioSessions: Field, atThreshold: Field,
}).openapi('AdaptationsRead')

const ReadinessBody = z.object({
  date: z.string(), readiness: Field, donation: Field, verdict: Field, trend: Field,
}).openapi('ReadinessRead')

const json = <S extends z.ZodType>(description: string, schema: S) =>
  ({ description, content: { 'application/json': { schema } } })

const failures = {
  400: json('A parameter is missing or malformed.', ErrorBody),
  401: json('No valid access token.', ErrorBody),
}

const homeRoute = createRoute({
  method: 'get', path: '/read/home', security: [{ bearer: [] }],
  summary: 'Home: what is missing, and whether today can push.',
  request: { query: z.object({ date: DateQuery }) },
  responses: { 200: json('The Home read.', HomeBody), ...failures },
})

const adaptationsRoute = createRoute({
  method: 'get', path: '/read/adaptations', security: [{ bearer: [] }],
  summary: 'Adaptations: one muscle-linked quality, explained.',
  request: {
    query: z.object({
      date: DateQuery,
      quality: z.enum(MUSCLE_QUALITIES).openapi({ description: 'The muscle-linked quality to map.' }),
    }),
  },
  responses: { 200: json('The Adaptations read.', AdaptationsBody), ...failures },
})

const readinessRoute = createRoute({
  method: 'get', path: '/read/readiness', security: [{ bearer: [] }],
  summary: "Readiness: today's reading and the days behind it.",
  request: { query: z.object({ date: DateQuery }) },
  responses: { 200: json('The readiness read.', ReadinessBody), ...failures },
})

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

  /** The caller's rows, or null when the token is refused. The rows load while
   *  Auth checks the token, so the check costs no extra round trip. */
  async function rowsFor(authorization: string | undefined, date: string): Promise<ReadRows | null> {
    const token = bearer(authorization)
    const userId = token && tokenUserId(token)
    if (!token || !userId) return null
    const client = new PostgrestClient(`${config.supabaseUrl}/rest/v1`, {
      headers: { apikey: config.anonKey, Authorization: `Bearer ${token}` },
      fetch: fetchFn,
    })
    const rows = loadReadRows({ client, userId }, date)
    if (!(await tokenAccepted(config.supabaseUrl, config.anonKey, token, fetchFn))) {
      rows.catch(() => {})
      return null
    }
    return rows
  }

  const refused = { error: 'Sign in again: no valid access token.' }

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

  app.doc31('/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'Tekiō API', version: '0' },
  })

  // A failure inside a read says nothing about the rows behind it.
  app.onError((_err, c) => c.json({ error: 'Something went wrong.' }, 500))
  app.notFound(c => c.json({ error: 'No such route.' }, 404))

  return app
}
