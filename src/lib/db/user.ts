import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { WeekStartDay } from '../utils'

export async function getOrCreateUser(): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .upsert(
      { id: USER_ID, units: 'metric', progression_model: 'volume', timezone: 'UTC', week_start_day: 'monday' },
      { onConflict: 'id', ignoreDuplicates: true }
    )
  if (error) throw error
}

export async function getWeekStartDay(): Promise<WeekStartDay> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('week_start_day')
    .eq('id', USER_ID)
    .single()
  if (error) throw error
  return data.week_start_day as WeekStartDay
}

export async function updateWeekStartDay(value: WeekStartDay): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ week_start_day: value })
    .eq('id', USER_ID)
  if (error) throw error
}

/** Muscle-group ids the user wants counted toward adaptation completion (empty = all). */
export async function getTrackedMuscleGroupIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('tracked_muscle_group_ids')
    .eq('id', USER_ID)
    .single()
  if (error) throw error
  const ids = data.tracked_muscle_group_ids
  return Array.isArray(ids) ? (ids as string[]) : []
}

export async function updateTrackedMuscleGroupIds(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ tracked_muscle_group_ids: ids })
    .eq('id', USER_ID)
  if (error) throw error
}

/** The typed HRmax override (bpm), or null when the observed peak stands alone (roadmap 059). */
export async function getHrMaxOverride(): Promise<number | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('hr_max_override')
    .eq('id', USER_ID)
    .single()
  if (error) throw error
  return data.hr_max_override == null ? null : Number(data.hr_max_override)
}

export async function updateHrMaxOverride(value: number | null): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ hr_max_override: value })
    .eq('id', USER_ID)
  if (error) throw error
}
