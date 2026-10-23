import { READINESS_METHODS, type ReadinessMethod, type HrMaxSource, type WeekStartDay } from '@tekio/core'
import type { Db } from './db'

/** Everything the prefs store reads off the profile row. One select rather than
 *  one per setting — they all live in `user_profiles`, and bootstrap wants them
 *  all at once. */
export interface UserProfile {
  weekStartDay: WeekStartDay
  /** The HRmax the user set and where it came from, plus the birth date the age estimate needs (roadmap 060). */
  hrMaxStored: number | null
  hrMaxSource: HrMaxSource | null
  birthDate: string | null
  /** The readiness method picked in Profile; null = automatic (RFC 0092). */
  readinessMethod: ReadinessMethod | null
}

/** A first sign-in has no profile row yet; this writes one with the defaults
 *  and leaves an existing one as it is. */
export async function ensureProfile(db: Db): Promise<void> {
  const { error } = await db.client
    .from('user_profiles')
    .upsert(
      { id: db.userId, units: 'metric', progression_model: 'volume', timezone: 'UTC', week_start_day: 'monday' },
      { onConflict: 'id', ignoreDuplicates: true },
    )
  if (error) throw error
}

export async function loadProfile(db: Db): Promise<UserProfile> {
  const { data, error } = await db.client
    .from('user_profiles')
    .select('week_start_day, hr_max_override, hr_max_source, birth_date, readiness_method')
    .eq('id', db.userId)
    .single()
  if (error) throw error
  const hrMax = data.hr_max_override == null ? null : Number(data.hr_max_override)
  const source = data.hr_max_source === 'typed' || data.hr_max_source === 'tracker' ? data.hr_max_source : null
  return {
    weekStartDay: data.week_start_day as WeekStartDay,
    hrMaxStored: hrMax,
    // A source with no number would print "from your tracker" beside nothing.
    hrMaxSource: hrMax == null ? null : source,
    birthDate: data.birth_date ?? null,
    readinessMethod: (READINESS_METHODS as readonly string[]).includes(data.readiness_method ?? '')
      ? data.readiness_method as ReadinessMethod
      : null,
  }
}

/** The settings a person changes, any of them at once. An HRmax travels with
 *  where it came from: typing one and accepting the tracker's peak write the
 *  same column, last write wins, and clearing it clears its source too. */
export interface ProfilePatch {
  weekStartDay?: WeekStartDay
  hrMax?: { value: number | null; source: HrMaxSource }
  birthDate?: string | null
  readinessMethod?: ReadinessMethod | null
}

export async function updateProfile(db: Db, patch: ProfilePatch): Promise<void> {
  const row: Record<string, unknown> = {}
  if (patch.weekStartDay !== undefined) row.week_start_day = patch.weekStartDay
  if (patch.hrMax !== undefined) {
    row.hr_max_override = patch.hrMax.value
    row.hr_max_source = patch.hrMax.value == null ? null : patch.hrMax.source
  }
  if (patch.birthDate !== undefined) row.birth_date = patch.birthDate
  if (patch.readinessMethod !== undefined) row.readiness_method = patch.readinessMethod
  if (!Object.keys(row).length) return
  const { error } = await db.client.from('user_profiles').update(row).eq('id', db.userId)
  if (error) throw error
}
