import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { ReadinessInput, CheckInAnswers } from '../../types'
import { withOrigin } from '../env'
import { userRows } from './_rows'

// ── Typed readiness inputs (readiness_inputs, RFC 0092) ─────────────────────
// One row per morning. A save writes only its own columns, so typing the
// morning HRV never clears a check-in on the same day, and the other way round.

type ReadinessRow = {
  id: string
  log_date: string
  morning_hrv: number | string | null
  energy: number | null
  soreness: number | null
  sleep_quality: number | null
  stress: number | null
  mood: number | null
}

const COLS = 'id, log_date, morning_hrv, energy, soreness, sleep_quality, stress, mood'

function mapRow(r: ReadinessRow): ReadinessInput {
  const complete = r.energy != null && r.soreness != null && r.sleep_quality != null
    && r.stress != null && r.mood != null
  return {
    id: r.id,
    date: r.log_date,
    morningHrv: r.morning_hrv != null ? Number(r.morning_hrv) : undefined,
    checkIn: complete
      ? { energy: r.energy!, soreness: r.soreness!, sleepQuality: r.sleep_quality!, stress: r.stress!, mood: r.mood! }
      : undefined,
  }
}

export async function loadReadinessInputs(): Promise<ReadinessInput[]> {
  const rows = await userRows('readiness_inputs', COLS, 'log_date')
  return rows.map(mapRow)
}

async function upsertDay(date: string, cols: Record<string, number>): Promise<ReadinessInput> {
  const { data, error } = await supabase
    .from('readiness_inputs')
    .upsert(withOrigin({ user_id: USER_ID, log_date: date, ...cols }), { onConflict: 'user_id,log_date' })
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
