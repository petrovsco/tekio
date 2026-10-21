import type { PlannedSession, PlannedKind } from '../../types'
import * as db from '@tekio/db'
import { appDb } from './_rows'

// ── Planned sessions (planned_sessions, RFC 0104) ────────────────────────────
// Read and written in `@tekio/db`, so the API plans a session exactly as the
// app does (RFC 0094 step 2d).
export type { SessionPlanPatch } from '@tekio/db'
export const loadSessionPlans = (): Promise<PlannedSession[]> => db.loadSessionPlans(appDb())
export const saveSessionPlan = (plan: db.SessionPlanPatch): Promise<PlannedSession> => db.saveSessionPlan(appDb(), plan)
export const updateSessionPlan = (id: string, patch: db.SessionPlanPatch): Promise<void> => db.updateSessionPlan(appDb(), id, patch)
export const markSessionPlanLogged = (id: string, kind: PlannedKind, entryId: string): Promise<void> =>
  db.markSessionPlanLogged(appDb(), id, kind, entryId)
export const deleteSessionPlan = (id: string): Promise<void> => db.deleteSessionPlan(appDb(), id)
export const pruneMissedSessionPlans = (day: string): Promise<void> => db.pruneMissedSessionPlans(appDb(), day)
