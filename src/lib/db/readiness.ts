import type { ReadinessInput, CheckInAnswers } from '../../types'
import * as db from '@tekio/db'
import { appDb } from './_rows'

// ── Typed readiness inputs (readiness_inputs, RFC 0092) ─────────────────────
// Read and written in `@tekio/db`, so the API saves a morning exactly as the
// app does (RFC 0094 step 2d).
export const loadReadinessInputs = (): Promise<ReadinessInput[]> => db.loadReadinessInputs(appDb())
export const saveMorningHrv = (date: string, ms: number): Promise<ReadinessInput> => db.saveMorningHrv(appDb(), date, ms)
export const saveCheckIn = (date: string, a: CheckInAnswers): Promise<ReadinessInput> => db.saveCheckIn(appDb(), date, a)
