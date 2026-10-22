import { supabase } from '../supabase'
import { userId } from '../session'
import { loadProfile as dbLoadProfile, type ProfilePatch } from '@tekio/db'
import type { ReadinessMethod, HrMaxSource, WeekStartDay } from '@tekio/core'
import { appDb } from './_rows'
import { api, done } from '../api'

// Opening the app still makes sure the profile row exists and reads it
// straight from the database, beside the rest of the start-up, while the two
// ways of starting are timed (RFC 0094 step 4). A setting changed in Profile
// or Settings is written through the API.
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

const patchProfile = (body: ProfilePatch) =>
  done(api.PATCH('/api/profile', { body }))

export const updateWeekStartDay = (value: WeekStartDay): Promise<void> => patchProfile({ weekStartDay: value })

/** One stored number, last write wins: typing and accepting the tracker's peak write the same column. */
export const updateHrMax = (value: number | null, source: HrMaxSource): Promise<void> => patchProfile({ hrMax: { value, source } })

export const updateBirthDate = (value: string | null): Promise<void> => patchProfile({ birthDate: value })

export const updateReadinessMethod = (value: ReadinessMethod | null): Promise<void> => patchProfile({ readinessMethod: value })
