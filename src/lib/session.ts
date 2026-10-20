// Who is signed in (RFC 0003). Small on purpose, and in the first-paint chunk:
// the login library is not. A returning visitor's token is read straight out of
// storage so Home's queries start at once, and `@supabase/auth-js` arrives
// afterwards, lazily, to keep the token fresh — or first, on the rare start
// that has no usable token (signed out, a sign-in link just opened, a token
// that ran out while the app was closed).
//
// The token is the one fact both ends share: the database's
// `app.current_user_id()` reads who is asking out of it, and `userId()` below
// reads the same two claims, so the app filters by exactly the id its policies
// allow. A login that adopted the rows written before accounts carries that id
// in `app_metadata.user_id`; every other login files under its own id.

/** Where `auth.ts` keeps the session. Named here, not left to the library's
 *  default, because the fast path below reads it without the library. */
export const AUTH_STORAGE_KEY = 'tekio-auth'

interface Claims { sub: string; email?: string; exp: number; app_metadata?: { user_id?: string } }

let token: string | null = null
let claims: Claims | null = null

function decode(jwt: string): Claims | null {
  try {
    const part = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      [...atob(part)].map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
    )
    const c = JSON.parse(json) as Claims
    return typeof c.sub === 'string' && typeof c.exp === 'number' ? c : null
  } catch {
    return null
  }
}

/** Sets the token every request carries; null signs the requests out. */
export function setAccessToken(jwt: string | null) {
  const c = jwt ? decode(jwt) : null
  token = c ? jwt : null
  claims = c
}

/** The bearer token for the next request, or null to fall back to the anon key. */
export function accessToken(): string | null {
  return token
}

/** The user id this person's rows are filed under. Only ever called after
 *  `startSession()` has said yes, so a missing one is a bug, not a state. */
export function userId(): string {
  if (!claims) throw new Error('Not signed in')
  return claims.app_metadata?.user_id || claims.sub
}

/** The address the person signed in with, for Profile. */
export function signedInEmail(): string | null {
  return claims?.email ?? null
}

/** A stored token with at least a minute left, or null. A minute, so a query
 *  started now is not refused half way through Home's first read. */
function storedToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    const jwt = raw ? (JSON.parse(raw) as { access_token?: string }).access_token : undefined
    const c = jwt ? decode(jwt) : null
    return c && c.exp * 1000 - Date.now() > 60_000 ? jwt! : null
  } catch {
    return null
  }
}

/** True when the address carries something only the login library can read:
 *  a sign-in link's tokens, or the error it came back with. */
function linkInUrl(): boolean {
  return /(^|[#&?])(access_token|error_description)=/.test(location.hash + location.search)
}

/** Resolves true when someone is signed in, with the token in place. On false
 *  the sign-in screen shows, with `linkError` when a link was refused. */
export async function startSession(): Promise<{ signedIn: boolean; linkError?: string }> {
  const stored = linkInUrl() ? null : storedToken()
  if (stored) {
    setAccessToken(stored)
    // Not awaited: the library only has to be there before the token runs out.
    void import('./auth').then(a => a.keepFresh())
    return { signedIn: true }
  }
  const auth = await import('./auth')
  return auth.restore()
}

const signOutListeners = new Set<() => void>()

/** Called when the session ends: signed out here, in another tab, or a refresh
 *  the server refused. */
export function onSignedOut(fn: () => void): () => void {
  signOutListeners.add(fn)
  return () => signOutListeners.delete(fn)
}

export function notifySignedOut() {
  setAccessToken(null)
  signOutListeners.forEach(fn => fn())
}
