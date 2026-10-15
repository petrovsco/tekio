import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../ui/Icon'
import { useAppStore } from '../../../store/app'
import { loadLastGarminSync, loadSyncRun, requestGarminSync } from '../../../lib/db/sync'
import { syncStale, syncWhen } from '../../../lib/syncWhen'
import { KnownError, reportError } from '../../../lib/errorReport'

// "Garmin · 08:02" beside the wordmark (RFC 0110): when Garmin last reached
// Tekiō, and a tap asks it again. Absent until Garmin has synced once — a user
// with nothing connected never sees it. A day without a sync turns it to the
// accent, because the verdict below it is then reading yesterday's night.

/** How often a running sync is checked, and when the app stops waiting. The
 *  workflow takes 15–50 s; three minutes covers a slow GitHub runner. */
const POLL_MS = 4000
const GIVE_UP_MS = 3 * 60 * 1000

type Phase =
  | { kind: 'idle' }
  | { kind: 'syncing' }
  | { kind: 'failed'; message: string }

export function SyncLine() {
  const refreshSynced = useAppStore(s => s.refreshSynced)
  const [last, setLast] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [, tick] = useState(0)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    let live = true
    loadLastGarminSync().then(run => { if (live && run?.finishedAt) setLast(run.finishedAt) })
    // Keeps "just now" and the stale tone honest while Home stays open.
    const clock = window.setInterval(() => tick(n => n + 1), 60_000)
    return () => { live = false; window.clearInterval(clock); window.clearTimeout(timer.current) }
  }, [])

  if (!last && phase.kind === 'idle') return null

  const start = async () => {
    if (phase.kind === 'syncing') return
    setPhase({ kind: 'syncing' })
    try {
      const run = await requestGarminSync()
      const deadline = Date.now() + GIVE_UP_MS
      const poll = async () => {
        try {
          const now = await loadSyncRun(run.id)
          if (now?.status === 'ok') {
            await refreshSynced()
            setLast(now.finishedAt ?? new Date().toISOString())
            setPhase({ kind: 'idle' })
          } else if (now?.status === 'failed') {
            setPhase({ kind: 'failed', message: 'Garmin sync failed · tap to retry' })
          } else if (Date.now() > deadline) {
            setPhase({ kind: 'failed', message: "Garmin didn't answer · tap to retry" })
          } else {
            timer.current = window.setTimeout(poll, POLL_MS)
          }
        } catch {
          // A dropped poll is a dropped connection, not a failed sync: try
          // again on the next beat until the deadline.
          if (Date.now() > deadline) setPhase({ kind: 'failed', message: "Garmin didn't answer · tap to retry" })
          else timer.current = window.setTimeout(poll, POLL_MS)
        }
      }
      timer.current = window.setTimeout(poll, POLL_MS)
    } catch (e) {
      reportError(e, 'write')
      setPhase({ kind: 'failed', message: e instanceof KnownError ? e.message : "Couldn't ask Garmin · tap to retry" })
    }
  }

  const syncing = phase.kind === 'syncing'
  const failed = phase.kind === 'failed'
  const stale = !syncing && (failed || (last !== null && syncStale(last)))
  const label = syncing ? 'Syncing Garmin…'
    : failed ? phase.message
    : `Garmin · ${syncWhen(last!)}`

  return (
    <button
      onClick={start}
      disabled={syncing}
      aria-label={syncing ? 'Syncing Garmin' : `${label}. Sync Garmin now`}
      className={`ml-auto -my-2.5 -mr-2 px-2 py-2.5 flex items-center gap-[5px] text-[11px] rounded-[3px] cursor-pointer disabled:cursor-default ${stale ? 'text-signal' : syncing ? 'text-ink' : 'text-ink-2'}`}
    >
      <Icon name={syncing ? 'spinner' : 'sync'} size={13} className={syncing ? 'animate-spin' : undefined} />
      {label}
    </button>
  )
}
