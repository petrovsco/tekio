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

/** Everything the prefs store reads off the profile row. One select rather than
 *  one per setting — they all live in `user_profiles`, and bootstrap wants them
 *  all at once. Writes stay one column at a time, below. */
export interface UserProfile {
  weekStartDay: WeekStartDay
  /** Muscle-group ids the user wants counted toward adaptation completion (empty = all). */
  trackedMuscleGroupIds: string[]
  /** The HRmax the user set and where it came from, plus the birth date the age estimate needs (roadmap 060). */
  hrMaxStored: number | null
  hrMaxSource: HrMaxSource | null
  birthDate: string | null
}

export async function loadProfile(): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('week_start_day, tracked_muscle_group_ids, hr_max_override, hr_max_source, birth_date')
    .eq('id', USER_ID)
    .single()
  if (error) throw error
  const hrMax = data.hr_max_override == null ? null : Number(data.hr_max_override)
  const source = data.hr_max_source === 'typed' || data.hr_max_source === 'tracker' ? data.hr_max_source : null
  const ids = data.tracked_muscle_group_ids
  return {
    weekStartDay: data.week_start_day as WeekStartDay,
    trackedMuscleGroupIds: Array.isArray(ids) ? (ids as string[]) : [],
    hrMaxStored: hrMax,
    // A source with no number would print "from your tracker" beside nothing.
    hrMaxSource: hrMax == null ? null : source,
    birthDate: data.birth_date ?? null,
  }
}

export async function updateWeekStartDay(value: WeekStartDay): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ week_start_day: value })
    .eq('id', USER_ID)
  if (error) throw error
}

export async function updateTrackedMuscleGroupIds(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ tracked_muscle_group_ids: ids })
    .eq('id', USER_ID)
  if (error) throw error
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
