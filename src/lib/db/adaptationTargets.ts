import { supabase } from '../supabase'
import type { Adaptation } from '../../types'

interface AdaptationTarget {
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
