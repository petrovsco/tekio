import type { PlannedSession } from '../../types'
import * as db from '@tekio/db'
import { appDb } from './_rows'
import { api, body, done } from '../api'

// ── Planned sessions (planned_sessions, RFC 0104) ────────────────────────────
// Loaded straight from the database still; written through the API (RFC 0094
// step 4), so the app plans a session exactly as the agent will.
export type { SessionPlanPatch } from '@tekio/db'
export const loadSessionPlans = (): Promise<PlannedSession[]> => db.loadSessionPlans(appDb())
export const saveSessionPlan = async (plan: db.SessionPlanPatch): Promise<PlannedSession> =>
  (await body(api.POST('/api/plans/sessions', { body: { ...plan, plannedBy: 'user' } }))) as PlannedSession
export const updateSessionPlan = (id: string, patch: db.SessionPlanPatch): Promise<void> =>
  done(api.PUT('/api/plans/sessions/{id}', { params: { path: { id } }, body: { ...patch, plannedBy: 'user' } }))
/** The API reads the plan's kind itself, with the check that it is the caller's. */
export const markSessionPlanLogged = (id: string, entryId: string): Promise<void> =>
  done(api.PUT('/api/plans/sessions/{id}/logged', { params: { path: { id } }, body: { entryId } }))
export const deleteSessionPlan = (id: string): Promise<void> =>
  done(api.DELETE('/api/plans/sessions/{id}', { params: { path: { id } } }))
