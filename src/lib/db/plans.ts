import type { PlannedExercise, LiftSet } from '../../types'
import * as db from '@tekio/db'
import { appDb } from './_rows'
import { api, body, done } from '../api'

// ── Planned exercises (planned_exercises, RFC 0098) ──────────────────────────
// Loaded straight from the database still; written through the API (RFC 0094
// step 4), so the app plans a lift exactly as the agent will.
type LiftPlan = { date: string; exercise: string; targets: LiftSet[] }

export const loadPlans = (): Promise<PlannedExercise[]> => db.loadPlans(appDb())
export const savePlan = (plan: LiftPlan & { supersetId?: string }): Promise<PlannedExercise> =>
  body(api.POST('/api/plans/lifts', { body: { ...plan, plannedBy: 'user' } }))
export const updatePlan = (id: string, patch: LiftPlan & { supersetId?: string | null }): Promise<void> =>
  done(api.PUT('/api/plans/lifts/{id}', { params: { path: { id } }, body: { ...patch, plannedBy: 'user' } }))
export const patchPlans = async (ids: string[], patch: { supersetId?: string; date?: string }): Promise<void> => {
  if (ids.length) await done(api.PATCH('/api/plans/lifts', { body: { ids, ...patch } }))
}
export const markPlanLogged = (id: string, sessionExerciseId: string): Promise<void> =>
  done(api.PUT('/api/plans/lifts/{id}/logged', { params: { path: { id } }, body: { entryId: sessionExerciseId } }))
export const deletePlan = (id: string): Promise<void> =>
  done(api.DELETE('/api/plans/lifts/{id}', { params: { path: { id } } }))

/** Deletes the plans of both kinds dated before `day` that were never logged:
 *  missed, and kept on the card a week to be rescheduled or removed (RFC 0104). */
export const pruneMissedPlans = (day: string): Promise<void> =>
  done(api.DELETE('/api/plans/missed', { params: { query: { before: day } } }))
