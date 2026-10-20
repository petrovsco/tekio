import { READINESS_METHODS, type ReadinessMethod, type HrMaxSource, type WeekStartDay } from '@tekio/core'
import type { Db } from './db'

/** Everything the prefs store reads off the profile row. One select rather than
 *  one per setting — they all live in `user_profiles`, and bootstrap wants them
 *  all at once. Writes stay one column at a time, in the app's src/lib/db/user.ts. */
export interface UserProfile {
  weekStartDay: WeekStartDay
  /** The HRmax the user set and where it came from, plus the birth date the age estimate needs (roadmap 060). */
  hrMaxStored: number | null
  hrMaxSource: HrMaxSource | null
  birthDate: string | null
  /** The readiness method picked in Profile; null = automatic (RFC 0092). */
  readinessMethod: ReadinessMethod | null
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
