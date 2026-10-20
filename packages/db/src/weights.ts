import type { WeightEntry, LiftSet } from '@tekio/core'
import { userRows, type Db } from './db'

export async function loadWeights(db: Db): Promise<WeightEntry[]> {
  const sessions = await userRows(
    db,
    'training_sessions',
    'session_date, session_exercises(id, sort_order, superset_group_id, exercises(name), session_sets(set_number, weight, reps, duration_s))',
    'session_date',
  )

  const entries: WeightEntry[] = []
  for (const session of sessions) {
    const exercises = (session.session_exercises ?? []) as unknown as {
      id: string
      sort_order: number
      superset_group_id: string | null
      exercises: { name: string } | null
      session_sets: { set_number: number; weight: number; reps: number; duration_s: number | null }[]
    }[]

    const sorted = [...exercises].sort((a, b) => a.sort_order - b.sort_order)
    for (const se of sorted) {
      const sets: LiftSet[] = [...(se.session_sets ?? [])]
        .sort((a, b) => a.set_number - b.set_number)
        .map(s => ({ weight: Number(s.weight), reps: s.reps, ...(s.duration_s != null ? { seconds: s.duration_s } : {}) }))

      entries.push({
        id: se.id,
        date: session.session_date,
        exercise: se.exercises?.name ?? '',
        sets,
        ...(se.superset_group_id ? { supersetId: se.superset_group_id } : {}),
      })
    }
  }
  return entries
}
