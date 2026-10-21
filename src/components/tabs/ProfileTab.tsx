import { useState } from 'react'
import { usePrefs } from '../../store/prefs'
import { Card, SecTitle } from '../ui/Card'
import { Inp } from '../ui/Input'
import { Btn } from '../ui/Button'
import { useHrMax } from '../../hooks/useHrMax'
import { fmtDate } from '../../lib/utils'
import { HR_MAX_WINDOW_MONTHS, HR_MAX_FORMULA_INTERCEPT, HR_MAX_FORMULA_SLOPE } from '@tekio/core'
import { ReadinessMethodCard } from './profile/ReadinessMethodCard'
import { signedInEmail } from '../../lib/session'
import { useAppStore } from '../../store/app'

// Profile is who is using the app: the account, the body the reads are
// computed for, and the devices that measure it. How the app behaves is
// Settings.

export function ProfileTab({ focus = null }: { focus?: string | null }) {
  const { setHrMaxStored, setBirthDate } = usePrefs()
  const [signingOut, setSigningOut] = useState(false)
  const setToast = useAppStore(s => s.setToast)
  // RFC 0003. The library is already loaded by the time Profile opens; the
  // import only hands it over. A failed sign-out leaves the session as it was,
  // and says so. A good one reloads the app onto the sign-in screen.
  const signOut = async () => {
    setSigningOut(true)
    try {
      await (await import('../../lib/auth')).signOut()
    } catch {
      setSigningOut(false)
      setToast('Could not sign out. Check your connection and try again.')
    }
  }

  // The profile HRmax (roadmap 060): the number the user set — typed here, or
  // the tracker peak accepted here — else the age estimate. The typed draft
  // commits on blur or Enter; a sync never writes the number itself.
  const { observed, stored, birthDate, estimate, hrMax, source, proposal } = useHrMax()
  const [hrDraft, setHrDraft] = useState<string | null>(null)
  const commitHrMax = () => {
    if (hrDraft === null) return
    const n = Number.parseInt(hrDraft, 10)
    setHrMaxStored(Number.isFinite(n) && n > 0 ? n : null, 'typed')
    setHrDraft(null)
  }
  const hrMaxStatus =
    source === 'tracker' && stored
      ? `Using ${stored.value} bpm from your tracker${observed?.value === stored.value ? ` (${observed.label}, ${fmtDate(observed.date, { midSentence: true })})` : ''}.`
      : source === 'typed' && stored
        ? `Using ${stored.value} bpm you typed.`
        : source === 'estimate'
          ? `Estimated ${estimate} bpm from your age (${HR_MAX_FORMULA_INTERCEPT} − ${HR_MAX_FORMULA_SLOPE} × age, about ±10 bpm for one person) — a tracker peak or a typed number replaces it.`
          : 'No number yet — add your birth date, or type a max heart rate from another device or a test.'

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SecTitle>Account</SecTitle>
        <p className="text-xs text-ink-2 mb-2.5 leading-[1.4]">
          Signed in as <span className="font-semibold text-ink">{signedInEmail() ?? 'you'}</span>.
        </p>
        <Btn variant="secondary" onClick={signOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </Btn>
      </Card>

      <Card>
        <SecTitle>Max heart rate</SecTitle>
        <p className="text-xs text-ink-2 mb-2.5 leading-[1.4]">
          {hrMaxStatus}{' '}
          {hrMax != null
            ? 'A typed average heart rate on a manual session is read against it; set the watch to it too.'
            : 'Until then a typed average heart rate on a manual session is not read.'}
        </p>
        {/* The tracker's replicated peak is offered, never imposed: accepting
            it writes the stored number, and it is offered again whenever a
            higher one repeats (roadmap 060, forks B and C). */}
        {proposal && (
          <div className="flex items-center justify-between gap-3 border border-line rounded-[3px] px-2.5 py-2 mb-2.5">
            <span className="text-xs text-ink leading-[1.4]">
              Your tracker recorded {proposal.value} bpm twice in the last {HR_MAX_WINDOW_MONTHS} months ({proposal.label}, {fmtDate(proposal.date, { midSentence: true })}).
            </span>
            <Btn small className="shrink-0" onClick={() => setHrMaxStored(proposal.value, 'tracker')}>
              Use {proposal.value}
            </Btn>
          </div>
        )}
        {/* items-end keeps the two inputs on one line even if a label wraps on
            a narrow phone; the short label means it does not. The status line
            above already says where a typed number comes from. */}
        <div className="grid grid-cols-2 gap-2.5 items-end">
          <Inp
            label="Birth date"
            type="date"
            value={birthDate ?? ''}
            onChange={e => { const v = e.target.value || null; if (v !== birthDate) setBirthDate(v) }}
          />
          <Inp
            label="Measured max (bpm)"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="—"
            value={hrDraft ?? (stored == null ? '' : String(stored.value))}
            onChange={e => setHrDraft(e.target.value)}
            onBlur={commitHrMax}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
          />
        </div>
      </Card>

      <ReadinessMethodCard focus={focus === 'readiness'} />
    </div>
  )
}
