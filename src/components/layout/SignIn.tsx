import { useState, type FormEvent } from 'react'
import { Btn } from '../ui/Button'
import { Inp } from '../ui/Input'
import { Icon } from '../ui/Icon'

// RFC 0003 — the one screen a signed-out person sees. An address and a link by
// email: no password to choose, forget or leak. The account is made the first
// time an address asks, so there is no separate sign-up.

const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** What the server said, in the app's words. Rate limits are the one a person
 *  meets: Supabase allows few emails an hour per address. */
function sendError(err: unknown): string {
  const status = (err as { status?: number })?.status
  if (status === 429) return 'Too many links asked for. Wait a few minutes, then try again.'
  return 'The link could not be sent. Check your connection and try again.'
}

export function SignIn({ linkError }: { linkError?: string }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(
    linkError ? 'That sign-in link has expired or was already used. Send a new one.' : null,
  )

  const valid = LOOKS_LIKE_EMAIL.test(email.trim())

  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid || sending) return
    setSending(true)
    setError(null)
    try {
      const address = email.trim()
      await (await import('../../lib/auth')).sendSignInLink(address)
      setSentTo(address)
    } catch (err) {
      setError(sendError(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-4 bg-paper">
      <div className="w-full max-w-[340px] flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-[15px] font-bold tracking-[0.14em] text-ink">TEKIŌ</p>
          <p className="text-xs text-ink-2 leading-[1.4]">Tells you what's missing.</p>
        </div>

        {sentTo ? (
          <div className="flex flex-col gap-3" role="status">
            <p className="text-sm text-ink leading-[1.4]">
              Check your email. We sent a sign-in link to <span className="font-semibold">{sentTo}</span>.
            </p>
            <p className="text-xs text-ink-2 leading-[1.4]">
              The link signs you in on the device you open it on. You can close this page.
            </p>
            <div>
              <Btn variant="ghost" onClick={() => { setSentTo(null); setEmail('') }} className="!px-0">
                Use a different address
              </Btn>
            </div>
          </div>
        ) : (
          <form onSubmit={send} className="flex flex-col gap-3" noValidate>
            <Inp
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            {error && <p className="text-xs text-ink leading-[1.4]" role="alert">{error}</p>}
            <Btn type="submit" disabled={!valid || sending} className="inline-flex items-center justify-center gap-1.5">
              {sending && <Icon name="spinner" size={13} className="animate-spin" />}
              {sending ? 'Sending…' : 'Send sign-in link'}
            </Btn>
            <p className="text-[11px] text-ink-3 leading-[1.4]">
              New here? The same link makes your account.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
