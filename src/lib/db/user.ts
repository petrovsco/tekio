import { supabase } from '../supabase'
import { userId } from '../session'
import { loadProfile as dbLoadProfile } from '@tekio/db'
import type { ReadinessMethod, HrMaxSource, WeekStartDay } from '@tekio/core'
import { appDb } from './_rows'

export async function getOrCreateUser(): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .upsert(
      { id: userId(), units: 'metric', progression_model: 'volume', timezone: 'UTC', week_start_day: 'monday' },
      { onConflict: 'id', ignoreDuplicates: true }
    )
  if (error) throw error
}

export const loadProfile = () => dbLoadProfile(appDb())

export async function updateWeekStartDay(value: WeekStartDay): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ week_start_day: value })
    .eq('id', userId())
  if (error) throw error
}

/** One stored number, last write wins: typing and accepting the tracker's peak write the same column. */
export async function updateHrMax(value: number | null, source: HrMaxSource): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ hr_max_override: value, hr_max_source: value == null ? null : source })
    .eq('id', userId())
  if (error) throw error
}

export async function updateBirthDate(value: string | null): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ birth_date: value })
    .eq('id', userId())
  if (error) throw error
}

export async function updateReadinessMethod(value: ReadinessMethod | null): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ readiness_method: value })
    .eq('id', userId())
  if (error) throw error
}
