import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { PlannedExercise, LiftSet } from '../../types'
import { withOrigin } from '../env'
import { userRows, deleteRow } from './_rows'

// ── Planned exercises (planned_exercises, RFC 0098) ──────────────────────────
// A table of its own, which no read selects from: a plan cannot count as done
// until it is logged through `saveWeightEntry`, like any other set.

type PlanRow = {
  id: string
  plan_date: string
  exercise: string
  target_sets: { weight: number | string; reps: number | string }[] | null
  sort_order: number
  planned_by: 'user' | 'agent'
  session_exercise_id: string | null
}

const COLS = 'id, plan_date, exercise, target_sets, sort_order, planned_by, session_exercise_id'

function mapRow(r: PlanRow): PlannedExercise {
  return {
    id: r.id,
    date: r.plan_date,
    exercise: r.exercise,
    targets: (r.target_sets ?? []).map(s => ({ weight: Number(s.weight), reps: Number(s.reps) })),
    plannedBy: r.planned_by,
    ...(r.session_exercise_id ? { loggedAs: r.session_exercise_id } : {}),
  }
}

/** Newest date first; within a day, in the order they were planned. */
export async function loadPlans(): Promise<PlannedExercise[]> {
  const rows = (await userRows('planned_exercises', COLS, 'plan_date')) as PlanRow[]
  return [...rows]
    .sort((a, b) => b.plan_date.localeCompare(a.plan_date) || a.sort_order - b.sort_order)
    .map(mapRow)
}

export async function savePlan(plan: { date: string; exercise: string; targets: LiftSet[] }): Promise<PlannedExercise> {
  const { count } = await supabase
    .from('planned_exercises')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', USER_ID)
    .eq('plan_date', plan.date)
  const { data, error } = await supabase
    .from('planned_exercises')
    .insert(withOrigin({
      user_id: USER_ID,
      plan_date: plan.date,
      exercise: plan.exercise,
      target_sets: plan.targets,
      sort_order: count ?? 0,
      planned_by: 'user',
    }))
    .select(COLS)
    .single()
  if (error) throw error
  return mapRow(data as PlanRow)
}

/** Change what a plan says: its day, its exercise, its targets. */
export async function updatePlan(id: string, patch: { date: string; exercise: string; targets: LiftSet[] }): Promise<void> {
  const { error } = await supabase
    .from('planned_exercises')
    .update({ plan_date: patch.date, exercise: patch.exercise, target_sets: patch.targets })
    .eq('id', id)
  if (error) throw error
}

/** The plan became logged work: point it at the entry it became. */
export async function markPlanLogged(id: string, sessionExerciseId: string): Promise<void> {
  const { error } = await supabase
    .from('planned_exercises')
    .update({ session_exercise_id: sessionExerciseId })
    .eq('id', id)
  if (error) throw error
}

export const deletePlan = (id: string): Promise<void> => deleteRow('planned_exercises', id)
