// The login library (RFC 0003), in its own chunk: `session.ts` imports it
// lazily, so the code that sends sign-in links and refreshes tokens never
// weighs on the first paint of a returning visitor.
import { AuthClient, type Session } from '@supabase/auth-js'
import { baseUrl, supabaseAnonKey } from './supabase'
import { AUTH_STORAGE_KEY, notifySignedOut, setAccessToken } from './session'

const client = new AuthClient({
  url: new URL('auth/v1', baseUrl).href,
  headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
  storageKey: AUTH_STORAGE_KEY,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  // Implicit, not PKCE: a link asked for on a laptop can be opened on a phone.
  // PKCE needs the verifier the asking browser stored.
  flowType: 'implicit',
})

let watching = false

/** Follows the session from now on: a refreshed token replaces the old one,
 *  and an ended session sends the app back to the sign-in screen. */
export function keepFresh() {
  if (watching) return
  watching = true
  client.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') notifySignedOut()
    else if (session) setAccessToken(session.access_token)
  })
}

/** The start with no usable stored token: reads a sign-in link out of the
 *  address if there is one, or refreshes a token that ran out while the app
 *  was closed. */
export async function restore(): Promise<{ signedIn: boolean; linkError?: string }> {
  const params = new URLSearchParams(location.hash.slice(1) || location.search.slice(1))
  const linkError = params.get('error_description') ?? undefined
  const { data } = await client.getSession()
  // The link's tokens, or its error, have been read; neither belongs in the
  // address bar, or in a bookmark made from it.
  if (params.has('access_token') || linkError) {
    history.replaceState(null, '', location.pathname)
  }
  const session: Session | null = data.session
  if (!session) return { signedIn: false, linkError }
  setAccessToken(session.access_token)
  keepFresh()
  return { signedIn: true }
}

/** Emails a sign-in link that comes back to this address. The account is made
 *  the first time an address asks. */
export async function sendSignInLink(email: string): Promise<void> {
  const { error } = await client.signInWithOtp({
    email,
    options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: true },
  })
  if (error) throw error
}

/** Ends the session on this device only. */
export async function signOut(): Promise<void> {
  const { error } = await client.signOut({ scope: 'local' })
  if (error) throw error
  notifySignedOut()
}
