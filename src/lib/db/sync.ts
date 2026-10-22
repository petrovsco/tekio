// Garmin sync runs (RFC 0110), read and asked for through the API (RFC 0094
// step 4), which runs the same calls in @tekio/db.
import type { SyncRun } from '@tekio/db'
import { api, body } from '../api'

export type { SyncRun }

/** The newest run that brought data in, or null when Garmin has never synced. */
export const loadLastGarminSync = (): Promise<SyncRun | null> => body(api.GET('/api/sync/garmin'))

/** Ask for a run now. The daily limit comes back as a sentence for the screen. */
export const requestGarminSync = (): Promise<SyncRun> => body(api.POST('/api/sync/garmin'))

export const loadSyncRun = async (id: number): Promise<SyncRun | null> => {
  const { data, response } = await api.GET('/api/sync/runs/{id}', { params: { path: { id } } })
  if (response.status === 404) return null
  if (!response.ok || !data) throw new Error(`/api/sync/runs answered ${response.status}`)
  return data
}
