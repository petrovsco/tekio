import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { WriteDb } from '@tekio/db'

// src/lib/env.ts resolves the environment once at module load, so every case
// here re-imports it with a fresh module registry.
async function loadEnv(opts: { hostname?: string; viteEnv?: string }) {
  vi.resetModules()
  if (opts.viteEnv === undefined) vi.stubEnv('VITE_ENV', '')
  else vi.stubEnv('VITE_ENV', opts.viteEnv)
  if (opts.hostname) {
    Object.defineProperty(window, 'location', {
      value: { hostname: opts.hostname },
      writable: true,
      configurable: true,
    })
  }
  return await import('../lib/env')
}

describe('environment resolution (roadmap 037)', () => {
  beforeEach(() => vi.resetModules())
  afterEach(() => vi.unstubAllEnvs())

  it('reads VITE_ENV when it is set', async () => {
    const { APP_ENV } = await loadEnv({ viteEnv: 'staging', hostname: 'example.com' })
    expect(APP_ENV).toBe('staging')
  })

  // The env var is set by hand in the Vercel dashboard. If it is ever missing,
  // staging still has to identify itself — that is what the fallback is for.
  it('falls back to the hostname: stg. subdomain is staging', async () => {
    const { APP_ENV } = await loadEnv({ hostname: 'stg.tekio.fyi' })
    expect(APP_ENV).toBe('staging')
  })

  it('falls back to the hostname: the old stg- host is still staging', async () => {
    const { APP_ENV } = await loadEnv({ hostname: 'stg-tekio.shamatoff.com' })
    expect(APP_ENV).toBe('staging')
  })

  it('falls back to the hostname: localhost is dev', async () => {
    const { APP_ENV } = await loadEnv({ hostname: 'localhost' })
    expect(APP_ENV).toBe('dev')
  })

  it('anything else is production', async () => {
    const { APP_ENV, IS_PRODUCTION } = await loadEnv({ hostname: 'tekio.fyi' })
    expect(APP_ENV).toBe('production')
    expect(IS_PRODUCTION).toBe(true)
  })
})

describe('withOrigin', () => {
  afterEach(() => vi.unstubAllEnvs())

  // The app's writes stamp ROW_ORIGIN through `withOrigin` in @tekio/db.
  const stamp = async (hostname: string, row: object) => {
    const { ROW_ORIGIN } = await loadEnv({ hostname })
    const { withOrigin } = await import('@tekio/db')
    return { ROW_ORIGIN, stamped: withOrigin({ origin: ROW_ORIGIN } as WriteDb, row) }
  }

  // The load-bearing guarantee: a production build must send byte-identical
  // payloads to the ones it sent before 037, so the tagging cannot break
  // production. That means no `origin` key at all — not `origin: null`.
  it('is the identity function in production', async () => {
    const row = { user_id: 'u', session_date: '2026-09-01' }
    const { ROW_ORIGIN, stamped } = await stamp('tekio.fyi', row)
    expect(ROW_ORIGIN).toBeNull()
    expect(stamped).toEqual(row)
    expect('origin' in stamped).toBe(false)
  })

  it('stamps the environment on staging', async () => {
    expect((await stamp('stg.tekio.fyi', { user_id: 'u' })).stamped).toEqual({ user_id: 'u', origin: 'staging' })
  })

  it('stamps dev too, so localhost verification is identifiable', async () => {
    expect((await stamp('localhost', { user_id: 'u' })).stamped).toEqual({ user_id: 'u', origin: 'dev' })
  })
})
