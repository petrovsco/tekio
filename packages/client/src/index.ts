// @tekio/client: the API's typed calls, generated from its OpenAPI description
// (RFC 0094). Every path, parameter, body and answer is typed from
// ./schema.ts, which `npm run api:client` writes from the routes.
import createFetchClient from 'openapi-fetch'
import type { paths, components } from './schema'

export type { paths, components }

/** Every schema the API names: `Schemas['HomeRead']`, `Schemas['CardioEntry']`, … */
export type Schemas = components['schemas']

export interface ClientOptions {
  /** Where the API is served from, e.g. `https://app.tekio.fyi`; paths carry `/api`. */
  baseUrl: string
  /** The signed-in person's Supabase access token, asked for on each call. */
  token: () => string | null | Promise<string | null>
  fetch?: typeof fetch
}

export function createTekioClient({ baseUrl, token, fetch: fetchFn }: ClientOptions) {
  const client = createFetchClient<paths>({ baseUrl, ...(fetchFn ? { fetch: fetchFn } : {}) })
  client.use({
    async onRequest({ request }) {
      const t = await token()
      if (t) request.headers.set('Authorization', `Bearer ${t}`)
      return request
    },
  })
  return client
}
