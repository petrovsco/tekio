import type { ErrorReport } from '../errorReport'
import { api, done } from '../api'

// error_reports (RFC 0103), through the API (RFC 0094 step 4). The table is
// closed to every client; the database function behind the route is the only
// way in, and it reads nothing back.

export const sendErrorReport = ({ signature, payload }: ErrorReport): Promise<void> =>
  done(api.POST('/api/error-reports', { body: { signature, payload } }))
