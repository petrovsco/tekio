import { supabase } from '../supabase'
import { userId } from '../session'
import type { ReadinessInput, CheckInAnswers } from '../../types'
import { withOrigin } from '../env'
import { appDb } from './_rows'
import { READINESS_COLS as COLS, mapReadinessRow as mapRow, loadReadinessInputs as dbLoadReadinessInputs, type ReadinessRow } from '@tekio/db'

// ── Typed readiness inputs (readiness_inputs, RFC 0092) ─────────────────────
// One row per morning. A save writes only its own columns, so typing the
// morning HRV never clears a check-in on the same day, and the other way round.

export const loadReadinessInputs = (): Promise<ReadinessInput[]> => dbLoadReadinessInputs(appDb())

async function upsertDay(date: string, cols: Record<string, number>): Promise<ReadinessInput> {
  const { data, error } = await supabase
    .from('readiness_inputs')
    .upsert(withOrigin({ user_id: userId(), log_date: date, ...cols }), { onConflict: 'user_id,log_date' })
    .select(COLS)
    .single()
  if (error) throw error
  return mapRow(data as ReadinessRow)
}

export const saveMorningHrv = (date: string, ms: number): Promise<ReadinessInput> =>
  upsertDay(date, { morning_hrv: ms })

export const saveCheckIn = (date: string, a: CheckInAnswers): Promise<ReadinessInput> =>
  upsertDay(date, {
    energy: a.energy, soreness: a.soreness, sleep_quality: a.sleepQuality, stress: a.stress, mood: a.mood,
  })
