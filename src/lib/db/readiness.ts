import type { ReadinessInput, CheckInAnswers } from '../../types'
import { api, body } from '../api'

// ── Typed readiness inputs (readiness_inputs, RFC 0092) ─────────────────────
// A morning is saved through the API (RFC 0094 step 4), one row a day, put by
// its date; the inputs load with the rest at start (./start.ts).
export const saveMorningHrv = (date: string, ms: number): Promise<ReadinessInput> =>
  body(api.PUT('/api/readiness/{date}/morning-hrv', { params: { path: { date } }, body: { ms } }))
export const saveCheckIn = (date: string, a: CheckInAnswers): Promise<ReadinessInput> =>
  body(api.PUT('/api/readiness/{date}/check-in', { params: { path: { date } }, body: a }))
