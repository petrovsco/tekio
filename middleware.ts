/**
 * Vercel Edge Middleware — Staging protection
 *
 * Env vars (set in Vercel dashboard — no VITE_ prefix, server-side only):
 *   BASIC_AUTH_ENABLED   "true" to show login gate
 *   BASIC_AUTH_USER      Username
 *   BASIC_AUTH_PASSWORD  Password
 *
 * NOTE: Browser native Basic Auth (WWW-Authenticate) does not work on Vercel —
 * the CDN strips that header before it reaches the browser. This middleware
 * serves a custom HTML login form and uses a session cookie instead.
 */
import { next } from '@vercel/edge'

const COOKIE = 'tekio_stg'

// The gate is the first screen anyone sees, so it speaks the app's visual
// language (tekio.rfcs/design-system.md): paper ground, one white card, the
// TEKIŌ wordmark, fields and a solid-ink commit per §8. It is plain inline CSS
// because the app's stylesheet sits behind this gate too.
const loginPage = (error = false) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#faf9f7">
  <title>Tekiō — Sign in</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100svh;
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
      background: #faf9f7; color: #1a1a1a;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .card {
      width: min(320px, 100%);
      background: #ffffff;
      border: 1px solid #e2e2e0;
      border-radius: 3px;
      padding: 20px 16px 16px;
    }
    .mark { font-size: 15px; font-weight: 700; letter-spacing: 0.14em; }
    .sub { font-size: 12px; line-height: 1.4; color: #6b6b6b; margin-top: 4px; }
    .rule { height: 1px; background: #eeeeec; margin: 16px 0; }
    label {
      display: block; margin-bottom: 4px;
      font-size: 9px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.12em; color: #8a8a8a;
    }
    input {
      display: block; width: 100%; margin-bottom: 12px;
      padding: 8px 10px;
      background: #ffffff; color: #1a1a1a;
      border: 1px solid #e2e2e0; border-radius: 3px;
      font: inherit; font-size: 16px; /* 16px keeps iOS from zooming the field */
      outline: none;
    }
    input:focus { border-color: #1a1a1a; }
    button {
      width: 100%; margin-top: 4px; padding: 9px 12px;
      background: #1a1a1a; color: #ffffff;
      border: 1px solid #1a1a1a; border-radius: 3px;
      font: inherit; font-size: 12px; font-weight: 600; cursor: pointer;
    }
    button:hover { background: #333333; }
    button:focus-visible { outline: 2px solid #1a1a1a; outline-offset: 2px; }
    .err { font-size: 11px; line-height: 1.4; color: #c2410c; margin-bottom: 12px; }
  </style>
</head>
<body>
  <main class="card">
    <div class="mark">TEKIŌ</div>
    <p class="sub">Private build. Sign in to continue.</p>
    <div class="rule"></div>
    ${error ? '<p class="err" role="alert">Incorrect credentials — try again.</p>' : ''}
    <form method="POST">
      <label for="u">Username</label>
      <input id="u" type="text" name="u" autocomplete="username" autocapitalize="none" spellcheck="false" autofocus>
      <label for="p">Password</label>
      <input id="p" type="password" name="p" autocomplete="current-password">
      <button type="submit">Sign in</button>
    </form>
  </main>
</body>
</html>`

export const config = {
  matcher: ['/(.*)'],
}

export default async function middleware(request: Request): Promise<Response> {
  if (process.env.BASIC_AUTH_ENABLED !== 'true') return next()

  const authUser = process.env.BASIC_AUTH_USER ?? ''
  const authPass = process.env.BASIC_AUTH_PASSWORD ?? ''
  const token = btoa(`${authUser}:${authPass}`)

  // Already authenticated via session cookie
  const cookies = request.headers.get('cookie') ?? ''
  if (cookies.split(';').some(c => c.trim() === `${COOKIE}=${token}`)) {
    return next()
  }

  const url = new URL(request.url)

  // Handle login form submission (POST to any path — same URL)
  if (request.method === 'POST') {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const u = params.get('u') ?? ''
    const p = params.get('p') ?? ''

    if (u === authUser && p === authPass) {
      // Correct — set cookie and redirect back to the requested page
      return new Response(null, {
        status: 302,
        headers: {
          Location: url.pathname + url.search,
          'Set-Cookie': `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
        },
      })
    }

    // Wrong credentials
    return new Response(loginPage(true), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  // Unauthenticated GET — show login form
  return new Response(loginPage(), {
    status: 401,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
