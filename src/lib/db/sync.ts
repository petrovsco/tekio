import { supabase } from '../supabase'
import { userId } from '../session'
import { KnownError } from '../errorReport'

// ── Garmin sync runs (sync_runs, RFC 0110) ─────────────────────────────────
// Written by `request_garmin_sync` and by every sync workflow's last step; the
// app only reads them and asks for a run.

type SyncStatus = 'requested' | 'ok' | 'failed'

export interface SyncRun {
  id: number
  status: SyncStatus
  requestedAt: string
  finishedAt?: string
}

type SyncRunRow = { id: number; status: string; requested_at: string; finished_at: string | null }

const COLS = 'id, status, requested_at, finished_at'

function mapRun(r: SyncRunRow): SyncRun {
  return {
    id: r.id,
    status: r.status === 'ok' || r.status === 'failed' ? r.status : 'requested',
    requestedAt: r.requested_at,
    finishedAt: r.finished_at ?? undefined,
  }
}

/** The newest run that brought data in, or null when Garmin has never synced —
 *  or when the table is not there yet, so the line simply does not show. */
export async function loadLastGarminSync(): Promise<SyncRun | null> {
  const { data, error } = await supabase
    .from('sync_runs')
    .select(COLS)
    .eq('user_id', userId())
    .eq('provider', 'garmin')
    .eq('status', 'ok')
    .order('finished_at', { ascending: false })
    .limit(1)
  if (error || !data?.length) return null
  return mapRun(data[0] as SyncRunRow)
}

/** Ask for a run now. Returns the run already open when one is (the function
 *  will not start two), else the new one. */
export async function requestGarminSync(): Promise<SyncRun> {
  const { data, error } = await supabase.rpc('request_garmin_sync', { p_user_id: userId() })
  // P0001 is the function's own refusal (the daily limit): a sentence for the
  // screen, not a fault to report.
  if (error) throw error.code === 'P0001' ? new KnownError(error.message) : error
  return mapRun(data as SyncRunRow)
}

export async function loadSyncRun(id: number): Promise<SyncRun | null> {
  const { data, error } = await supabase.from('sync_runs').select(COLS).eq('id', id).maybeSingle()
  if (error) throw error
  return data ? mapRun(data as SyncRunRow) : null
}
