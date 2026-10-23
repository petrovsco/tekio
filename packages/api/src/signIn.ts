// Signing in from a phone app (RFC 0096), through the API rather than straight
// to Supabase Auth: an app then carries only the API's address, never the
// project's public key. That key must not ship in a build anyone can download
// while the open policies still stand beside the owner ones (RFC 0003).
//
// The same email link the web app sends, in the PKCE flow: the app keeps a
// secret verifier and sends only its hash with the request, and the link comes
// back to the app with a one-time code that only that verifier can turn into a
// session. A link asked for on the phone is opened on the phone; the web app's
// implicit flow stays for links opened on another device.
import { createRoute, z } from '@hono/zod-openapi'
import { ErrorBody, json } from './schemas'

const Session = z.object({
  accessToken: z.string().openapi({ description: 'The bearer token every other route takes.' }),
  refreshToken: z.string(),
  expiresAt: z.number().openapi({ description: 'When the access token runs out, in seconds since 1970.' }),
  email: z.string().nullable(),
}).openapi('Session')

const refusedBy = (what: string) => ({
  400: json(`${what} The reason is in \`error\`.`, ErrorBody),
})

export const signInLinkRoute = createRoute({
  method: 'post', path: '/sign-in/link', operationId: 'sendSignInLink',
  summary: 'Email a sign-in link; the account is made the first time an address asks.',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email(),
            redirectTo: z.string().url().openapi({ description: 'Where the link comes back to: the app’s own address, on the project’s allow list.' }),
            codeChallenge: z.string().min(43).max(128)
              .openapi({ description: 'The base64url SHA-256 of the verifier the app keeps (PKCE, S256).' }),
          }),
        },
      },
    },
  },
  responses: { 204: { description: 'Sent.' }, ...refusedBy('Not sent, for instance too many links in a row.') },
})

export const signInSessionRoute = createRoute({
  method: 'post', path: '/sign-in/session', operationId: 'exchangeSignInCode',
  summary: 'Turn the code a sign-in link came back with into a session.',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: z.object({ code: z.string().min(1), codeVerifier: z.string().min(43).max(128) }),
        },
      },
    },
  },
  responses: { 200: json('The session.', Session), ...refusedBy('A used, expired or foreign code.') },
})

export const refreshSessionRoute = createRoute({
  method: 'post', path: '/sign-in/refresh', operationId: 'refreshSession',
  summary: 'A fresh access token for a refresh token; each refresh token works once.',
  request: {
    body: { required: true, content: { 'application/json': { schema: z.object({ refreshToken: z.string().min(1) }) } } },
  },
  responses: { 200: json('The session, with its new refresh token.', Session), ...refusedBy('The session has ended: sign in again.') },
})

interface AuthConfig { supabaseUrl: string; anonKey: string; fetch: typeof fetch }

type Outcome<T> = { ok: true; value: T } | { ok: false; error: string }

/** Supabase Auth's own words for a refusal, or a plain one. */
async function reason(res: Response): Promise<string> {
  const body = await res.json().catch(() => null) as { msg?: string; error_description?: string; message?: string } | null
  return body?.msg ?? body?.error_description ?? body?.message ?? 'Sign-in was refused.'
}

function auth(config: AuthConfig, path: string, body: unknown): Promise<Response> {
  return config.fetch(`${config.supabaseUrl}/auth/v1/${path}`, {
    method: 'POST',
    headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function sendLink(
  config: AuthConfig, req: { email: string; redirectTo: string; codeChallenge: string },
): Promise<Outcome<null>> {
  const res = await auth(config, `otp?redirect_to=${encodeURIComponent(req.redirectTo)}`, {
    email: req.email,
    create_user: true,
    code_challenge: req.codeChallenge,
    code_challenge_method: 's256',
  })
  return res.ok ? { ok: true, value: null } : { ok: false, error: await reason(res) }
}

type SessionBody = z.infer<typeof Session>

async function session(res: Response): Promise<Outcome<SessionBody>> {
  if (!res.ok) return { ok: false, error: await reason(res) }
  const s = await res.json() as { access_token: string; refresh_token: string; expires_at?: number; expires_in?: number; user?: { email?: string } }
  return {
    ok: true,
    value: {
      accessToken: s.access_token,
      refreshToken: s.refresh_token,
      expiresAt: s.expires_at ?? Math.floor(Date.now() / 1000) + (s.expires_in ?? 3600),
      email: s.user?.email ?? null,
    },
  }
}

export async function exchangeCode(config: AuthConfig, req: { code: string; codeVerifier: string }): Promise<Outcome<SessionBody>> {
  return session(await auth(config, 'token?grant_type=pkce', { auth_code: req.code, code_verifier: req.codeVerifier }))
}

export async function refresh(config: AuthConfig, refreshToken: string): Promise<Outcome<SessionBody>> {
  return session(await auth(config, 'token?grant_type=refresh_token', { refresh_token: refreshToken }))
}
