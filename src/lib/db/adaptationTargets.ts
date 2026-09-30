import { supabase } from '../supabase'
import type { Adaptation } from '../../types'

export interface AdaptationTarget {
  weeklyMuscleTarget: number
  weeklySessionTarget: number
  weeklyMinutesTarget: number
}

export type AdaptationTargetMap = Partial<Record<Adaptation, AdaptationTarget>>

/** Per-adaptation weekly targets stored server-side (override the built-in defaults). */
export async function loadAdaptationTargets(): Promise<AdaptationTargetMap> {
  const { data, error } = await supabase
    .from('adaptation_targets')
    .select('adaptation, weekly_muscle_target, weekly_session_target, weekly_minutes_target')
  if (error) throw error
  const out: AdaptationTargetMap = {}
  for (const r of data ?? []) {
    out[r.adaptation as Adaptation] = {
      weeklyMuscleTarget: Number(r.weekly_muscle_target),
      weeklySessionTarget: Number(r.weekly_session_target),
      weeklyMinutesTarget: Number(r.weekly_minutes_target ?? 0),
    }
  }
  return out
}

/** Update one adaptation's weekly targets. */
export async function updateAdaptationTarget(
  adaptation: Adaptation,
  patch: Partial<AdaptationTarget>,
): Promise<void> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.weeklyMuscleTarget !== undefined) update.weekly_muscle_target = patch.weeklyMuscleTarget
  if (patch.weeklySessionTarget !== undefined) update.weekly_session_target = patch.weeklySessionTarget
  if (patch.weeklyMinutesTarget !== undefined) update.weekly_minutes_target = patch.weeklyMinutesTarget
  const { error } = await supabase
    .from('adaptation_targets')
    .update(update)
    .eq('adaptation', adaptation)
  if (error) throw error
}
