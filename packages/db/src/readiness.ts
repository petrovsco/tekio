import type { ReadinessInput, CheckInAnswers } from '@tekio/core'
import { userRows, withOrigin, type Db, type WriteDb } from './db'

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

const READINESS_COLS = 'id, log_date, morning_hrv, energy, soreness, sleep_quality, stress, mood'

function mapReadinessRow(r: ReadinessRow): ReadinessInput {
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

export async function loadReadinessInputs(db: Db): Promise<ReadinessInput[]> {
  return readinessFromRows(await userRows(db, 'readiness_inputs', READINESS_COLS, 'log_date'))
}

export const readinessFromRows = (rows: ReadinessRow[]): ReadinessInput[] => rows.map(mapReadinessRow)

async function upsertDay(db: WriteDb, date: string, cols: Record<string, number>): Promise<ReadinessInput> {
  const { data, error } = await db.client
    .from('readiness_inputs')
    .upsert(withOrigin(db, { user_id: db.userId, log_date: date, ...cols }), { onConflict: 'user_id,log_date' })
    .select(READINESS_COLS)
    .single()
  if (error) throw error
  return mapReadinessRow(data as ReadinessRow)
}

export const saveMorningHrv = (db: WriteDb, date: string, ms: number): Promise<ReadinessInput> =>
  upsertDay(db, date, { morning_hrv: ms })

export const saveCheckIn = (db: WriteDb, date: string, a: CheckInAnswers): Promise<ReadinessInput> =>
  upsertDay(db, date, {
    energy: a.energy, soreness: a.soreness, sleep_quality: a.sleepQuality, stress: a.stress, mood: a.mood,
  })
