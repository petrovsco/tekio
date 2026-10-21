import type { PlannedExercise, LiftSet } from '../../types'
import * as db from '@tekio/db'
import { appDb } from './_rows'

// ── Planned exercises (planned_exercises, RFC 0098) ──────────────────────────
// Read and written in `@tekio/db`, so the API plans a lift exactly as the app
// does (RFC 0094 step 2d).
export const loadPlans = (): Promise<PlannedExercise[]> => db.loadPlans(appDb())
export const savePlan = (plan: { date: string; exercise: string; targets: LiftSet[]; supersetId?: string }): Promise<PlannedExercise> =>
  db.savePlan(appDb(), plan)
export const updatePlan = (id: string, patch: { date: string; exercise: string; targets: LiftSet[]; supersetId?: string | null }): Promise<void> =>
  db.updatePlan(appDb(), id, patch)
export const patchPlans = (ids: string[], patch: { supersetId?: string; date?: string }): Promise<void> => db.patchPlans(appDb(), ids, patch)
export const markPlanLogged = (id: string, sessionExerciseId: string): Promise<void> => db.markPlanLogged(appDb(), id, sessionExerciseId)
export const deletePlan = (id: string): Promise<void> => db.deletePlan(appDb(), id)
export const pruneMissedPlans = (day: string): Promise<void> => db.pruneMissedPlans(appDb(), day)
