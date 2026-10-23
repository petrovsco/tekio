// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createApi } from '@tekio/api'

// The Vercel function answers only the methods api/index.ts exports; any other
// is a 405 from Vercel before the API sees it. Exporting GET alone once turned
// every write the web app sends into a failed save.

describe('the Vercel function', () => {
  it('exports every method a route uses', async () => {
    const source = readFileSync(new URL('../../api/index.ts', import.meta.url), 'utf8')
    const exported = new Set([...source.matchAll(/^export const (\w+)/gm)].map(m => m[1]))
    const api = createApi({ supabaseUrl: 'http://supabase.test', anonKey: 'anon', origin: null })
    const doc = await (await api.request('/api/openapi.json')).json()
    const used = new Set(Object.values(doc.paths as Record<string, object>).flatMap(p => Object.keys(p).map(m => m.toUpperCase())))
    expect([...used].filter(m => !exported.has(m))).toEqual([])
    // The assistant connector's preflight (RFC 0099), outside the description.
    expect(exported.has('OPTIONS')).toBe(true)
  })
})
