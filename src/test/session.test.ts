import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AUTH_STORAGE_KEY, setAccessToken, accessToken, userId, signedInEmail, startSession } from '../lib/session'

// RFC 0003. The app and the database must agree on who is asking, so the id is
// read from the same token claims `app.current_user_id()` reads.

vi.mock('../lib/auth', () => ({
  keepFresh: vi.fn(),
  restore: vi.fn(async () => ({ signedIn: false })),
}))

// Error report #43: while a stale-chunk reload is under way, Vite resolves a
// failed import to undefined, and `.restore()` on it threw. `reloading` stands
// in for that state, which only a real failed chunk load produces.
const stale = vi.hoisted(() => ({ reloading: false }))
vi.mock('../lib/staleChunk', () => ({
  whileReloading: <T,>(mod: T) => (stale.reloading ? new Promise<T>(() => {}) : Promise.resolve(mod)),
}))

/** An unsigned token with these claims — the app never verifies the signature;
 *  the database does. */
function jwt(claims: Record<string, unknown>): string {
  // UTF-8 first, as a real token is.
  const b64 = (o: object) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${b64({ alg: 'HS256' })}.${b64(claims)}.sig`
}

const inAnHour = () => Math.floor(Date.now() / 1000) + 3600
const NEW_LOGIN = '11111111-1111-1111-1111-111111111111'
const ADOPTED = 'a0000000-0000-0000-0000-000000000001'

beforeEach(() => {
  stale.reloading = false
  setAccessToken(null)
  localStorage.clear()
  history.replaceState(null, '', '/')
})

describe('userId', () => {
  it('is the login’s own id for a new account', () => {
    setAccessToken(jwt({ sub: NEW_LOGIN, exp: inAnHour() }))
    expect(userId()).toBe(NEW_LOGIN)
  })

  it('is the adopted id when app_metadata carries one', () => {
    setAccessToken(jwt({ sub: NEW_LOGIN, exp: inAnHour(), app_metadata: { user_id: ADOPTED } }))
    expect(userId()).toBe(ADOPTED)
  })

  it('throws when nobody is signed in', () => {
    expect(() => userId()).toThrow('Not signed in')
  })

  it('reads a non-ASCII email out of the token', () => {
    setAccessToken(jwt({ sub: NEW_LOGIN, exp: inAnHour(), email: 'zoë@example.com' }))
    expect(signedInEmail()).toBe('zoë@example.com')
  })

  it('refuses a token it cannot read, and sends the anon key instead', () => {
    setAccessToken('not-a-token')
    expect(accessToken()).toBeNull()
  })
})

describe('startSession', () => {
  it('starts at once from a stored token with time left', async () => {
    const token = jwt({ sub: NEW_LOGIN, exp: inAnHour() })
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ access_token: token }))
    expect(await startSession()).toEqual({ signedIn: true })
    expect(accessToken()).toBe(token)
  })

  it('hands a token about to run out to the login library', async () => {
    const soon = Math.floor(Date.now() / 1000) + 30
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ access_token: jwt({ sub: NEW_LOGIN, exp: soon }) }))
    const auth = await import('../lib/auth')
    expect(await startSession()).toEqual({ signedIn: false })
    expect(auth.restore).toHaveBeenCalled()
  })

  it('lets the library read a sign-in link even with a stored token', async () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ access_token: jwt({ sub: NEW_LOGIN, exp: inAnHour() }) }))
    history.replaceState(null, '', '/#access_token=x&refresh_token=y&type=magiclink')
    const auth = await import('../lib/auth')
    vi.mocked(auth.restore).mockClear()
    await startSession()
    expect(auth.restore).toHaveBeenCalledOnce()
  })

  it('waits for the reload instead of throwing when the login library failed to load', async () => {
    stale.reloading = true
    const auth = await import('../lib/auth')
    vi.mocked(auth.restore).mockClear()
    const settled = vi.fn()
    startSession().then(settled, settled)
    await new Promise(r => setTimeout(r, 0))
    expect(settled).not.toHaveBeenCalled()
    expect(auth.restore).not.toHaveBeenCalled()
  })
})
