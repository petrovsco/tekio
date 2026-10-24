// Who is asking (RFC 0094 step 2c, on RFC 0003's accounts). Every read route
// takes the caller's Supabase access token as a bearer token. The API reads the
// user id out of it with the same two claims as the app's `userId()` and the
// database's `app.current_user_id()`, then loads with a client that sends that
// same token, so the policies still decide what the call may touch.
//
// The token's signature is checked by Supabase Auth, once per request, while
// the rows load: a forged or expired token is refused before any answer leaves.
// The database checks it again on every query, so nothing is read on a claim
// alone even in that window.

interface Claims { sub?: unknown; exp?: unknown; client_id?: unknown; app_metadata?: { user_id?: unknown } }

/** The bearer token on a request, or null. */
export function bearer(header: string | undefined): string | null {
  const m = header?.match(/^Bearer\s+(\S+)$/i)
  return m ? m[1] : null
}

/** The id the caller's rows are filed under, or null for a token that is not
 *  a well-formed, unexpired Supabase access token. */
export function tokenUserId(token: string, now = Date.now()): string | null {
  try {
    const c = claims(token)
    if (typeof c.sub !== 'string' || typeof c.exp !== 'number' || c.exp * 1000 <= now) return null
    const adopted = c.app_metadata?.user_id
    return typeof adopted === 'string' && adopted ? adopted : c.sub
  } catch {
    return null
  }
}

/** The OAuth client a token was issued to (RFC 0099), or null for a
 *  person's own sign-in. Supabase's OAuth server puts `client_id` in the
 *  tokens it issues to an assistant; a sign-in link's tokens carry none. It
 *  cannot be forged: Auth checks the signature before anything is written. */
export function tokenClientId(token: string): string | null {
  try {
    const id = claims(token).client_id
    return typeof id === 'string' && id ? id : null
  } catch {
    return null
  }
}

function claims(token: string): Claims {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as Claims
}

/** Whether Supabase Auth accepts the token as a live session. */
export async function tokenAccepted(
  supabaseUrl: string, anonKey: string, token: string, fetchFn: typeof fetch,
): Promise<boolean> {
  const res = await fetchFn(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  })
  return res.ok
}
