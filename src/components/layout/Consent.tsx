import { useEffect, useState } from 'react'
import { Btn } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { whileReloading } from '../../lib/staleChunk'
import { signedInEmail } from '../../lib/session'

// RFC 0099 — the page an assistant sends the person to when it asks to connect:
// Supabase's OAuth server redirects here with the request's id, and the
// person's answer sends them back to the assistant. Only a signed-in person
// reaches it; App shows the sign-in screen first, which comes back here.

type Request = { name: string; returnsTo: string }

const auth = () => import('../../lib/auth').then(whileReloading)

/** The assistant's address as a person reads it: "claude.ai". */
function host(uri: string): string {
  try {
    return new URL(uri).hostname
  } catch {
    return uri
  }
}

export function Consent({ id }: { id: string | null }) {
  const [request, setRequest] = useState<Request | null>(null)
  const [error, setError] = useState<string | null>(id ? null : 'This page opens from an assistant asking to connect. Start again from the assistant.')
  const [answering, setAnswering] = useState<'allow' | 'deny' | null>(null)

  useEffect(() => {
    if (!id) return
    auth()
      .then(a => a.authorizationRequest(id))
      .then(data => {
        // Said yes before: straight back to the assistant.
        if (!('authorization_id' in data)) return void location.assign(data.redirect_url)
        setRequest({ name: data.client.name || 'An assistant', returnsTo: host(data.redirect_uri) })
      })
      .catch(() => setError('This request has expired or was already answered. Start again from the assistant.'))
  }, [id])

  const answer = async (allow: boolean) => {
    if (!id || answering) return
    setAnswering(allow ? 'allow' : 'deny')
    setError(null)
    try {
      location.assign(await (await auth()).answerAuthorization(id, allow))
    } catch {
      setError('Your answer could not be sent. Check your connection and try again.')
      setAnswering(null)
    }
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-4 bg-paper">
      <div className="w-full max-w-[340px] flex flex-col gap-4">
        <p className="text-[15px] font-bold tracking-[0.14em] text-ink">TEKIŌ</p>

        {request ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-ink leading-[1.4]">
              <span className="font-semibold">{request.name}</span> asks to connect to your Tekiō
              {signedInEmail() ? <> as <span className="font-semibold">{signedInEmail()}</span></> : null}.
            </p>
            <ul className="flex flex-col gap-1.5 text-xs text-ink-2 leading-[1.4] list-disc pl-4">
              <li>It reads what is missing, your readiness and your training.</li>
              <li>It can plan sessions and log what you tell it you did. Each is marked as its own, and can be undone.</li>
              <li>It cannot change or delete anything you logged.</li>
            </ul>
            {error && <p className="text-xs text-ink leading-[1.4]" role="alert">{error}</p>}
            <div className="flex flex-col gap-2">
              <Btn onClick={() => answer(true)} disabled={answering !== null} className="inline-flex items-center justify-center gap-1.5">
                {answering === 'allow' && <Icon name="spinner" size={13} className="animate-spin" />}
                Allow
              </Btn>
              <Btn variant="ghost" onClick={() => answer(false)} disabled={answering !== null} className="inline-flex items-center justify-center gap-1.5">
                {answering === 'deny' && <Icon name="spinner" size={13} className="animate-spin" />}
                Don't allow
              </Btn>
            </div>
            <p className="text-[11px] text-ink-3 leading-[1.4]">Either way you go back to {request.returnsTo}.</p>
          </div>
        ) : error ? (
          <p className="text-sm text-ink leading-[1.4]" role="alert">{error}</p>
        ) : (
          <p className="text-xs text-ink-2 inline-flex items-center gap-1.5" role="status">
            <Icon name="spinner" size={13} className="animate-spin" /> Reading the request…
          </p>
        )}
      </div>
    </div>
  )
}
