import type { ReadinessInput, CheckInAnswers } from '../../types'
import * as db from '@tekio/db'
import { appDb } from './_rows'
import { api, body } from '../api'

// ── Typed readiness inputs (readiness_inputs, RFC 0092) ─────────────────────
// Loaded straight from the database still; a morning is saved through the API
// (RFC 0094 step 4), one row a day, put by its date.
export const loadReadinessInputs = (): Promise<ReadinessInput[]> => db.loadReadinessInputs(appDb())
export const saveMorningHrv = (date: string, ms: number): Promise<ReadinessInput> =>
  body(api.PUT('/api/readiness/{date}/morning-hrv', { params: { path: { date } }, body: { ms } }))
export const saveCheckIn = (date: string, a: CheckInAnswers): Promise<ReadinessInput> =>
  body(api.PUT('/api/readiness/{date}/check-in', { params: { path: { date } }, body: a }))
