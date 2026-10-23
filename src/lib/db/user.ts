import type { ProfilePatch } from '@tekio/db'
import type { ReadinessMethod, HrMaxSource, WeekStartDay } from '@tekio/core'
import { api, done } from '../api'

// The profile arrives with the start (./start.ts), which writes the row on a
// first sign-in; a setting changed in Profile or Settings is written through
// the API (RFC 0094 step 4).

const patchProfile = (body: ProfilePatch) =>
  done(api.PATCH('/api/profile', { body }))

export const updateWeekStartDay = (value: WeekStartDay): Promise<void> => patchProfile({ weekStartDay: value })

/** One stored number, last write wins: typing and accepting the tracker's peak write the same column. */
export const updateHrMax = (value: number | null, source: HrMaxSource): Promise<void> => patchProfile({ hrMax: { value, source } })

export const updateBirthDate = (value: string | null): Promise<void> => patchProfile({ birthDate: value })

export const updateReadinessMethod = (value: ReadinessMethod | null): Promise<void> => patchProfile({ readinessMethod: value })
