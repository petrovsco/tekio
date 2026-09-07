import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { WeekStartDay } from '../utils'
import type { HrMaxSource } from '../hrMax'

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

/** The HRmax the user set and where it came from, plus the birth date the age estimate needs (roadmap 060). */
export interface HrMaxProfile {
  hrMaxStored: number | null
  hrMaxSource: HrMaxSource | null
  birthDate: string | null
}

export async function getHrMaxProfile(): Promise<HrMaxProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('hr_max_override, hr_max_source, birth_date')
    .eq('id', USER_ID)
    .single()
  if (error) throw error
  const value = data.hr_max_override == null ? null : Number(data.hr_max_override)
  const source = data.hr_max_source === 'typed' || data.hr_max_source === 'tracker' ? data.hr_max_source : null
  return {
    hrMaxStored: value,
    hrMaxSource: value == null ? null : source,
    birthDate: data.birth_date ?? null,
  }
}

/** One stored number, last write wins: typing and accepting the tracker's peak write the same column. */
export async function updateHrMax(value: number | null, source: HrMaxSource): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ hr_max_override: value, hr_max_source: value == null ? null : source })
    .eq('id', USER_ID)
  if (error) throw error
}

export async function updateBirthDate(value: string | null): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ birth_date: value })
    .eq('id', USER_ID)
  if (error) throw error
}
