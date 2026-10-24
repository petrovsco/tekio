import { groupBy, type MobilityEntry } from '@tekio/core'
import { getOrCreateExerciseRow } from './exercises'
import { userRows, withOrigin, withWriter, deleteRow, type Db, type WriteDb } from './db'


/** Map of exercise_id → its muscle-group names (canonical, shared across sessions). */
async function loadExerciseMuscleMap(db: Db): Promise<Map<string, string[]>> {
  const { data, error } = await db.client
    .from('exercise_muscle_groups')
    .select('exercise_id, muscle_groups(name)')
  if (error) throw error
  const named = (data ?? [])
    .map(row => ({
      exerciseId: row.exercise_id,
      name: (row.muscle_groups as unknown as { name: string } | null)?.name,
    }))
    .filter((r): r is { exerciseId: string; name: string } => !!r.name)
  return groupBy(named, r => r.exerciseId, r => r.name)
}

export async function loadMobility(db: Db): Promise<MobilityEntry[]> {
  const [rows, muscleMap] = await Promise.all([
    userRows(
      db,
      'mobility_sessions',
      'id, session_date, total_duration, notes, mobility_exercises(id, exercise_name, duration_minutes, notes, exercise_id)',
      'session_date',
    ),
    loadExerciseMuscleMap(db),
  ])
  return rows.map(r => {
    const exercises = (r.mobility_exercises ?? []) as { id: string; exercise_name: string; duration_minutes: number | null; notes: string | null; exercise_id: string | null }[]
    return {
      id: r.id,
      date: r.session_date,
      exercises: exercises.map(e => ({
        name: e.exercise_name,
        duration: e.duration_minutes ?? 0,
        notes: e.notes ?? '',
        muscleGroups: e.exercise_id ? muscleMap.get(e.exercise_id) ?? [] : [],
      })),
      duration: r.total_duration ?? exercises.reduce((s, e) => s + (e.duration_minutes ?? 0), 0),
    }
  })
}

/** Replaces an exercise's muscle-group links with the given group names. */
async function setExerciseMuscleGroups(db: Db, exerciseId: string, groupNames: string[]): Promise<void> {
  if (groupNames.length === 0) return
  const { data: groups, error: gErr } = await db.client
    .from('muscle_groups')
    .select('id, name')
    .in('name', groupNames)
  if (gErr) throw gErr
  const ids = (groups ?? []).map(g => g.id)
  if (ids.length === 0) return

  await db.client.from('exercise_muscle_groups').delete().eq('exercise_id', exerciseId)
  const { error: insErr } = await db.client
    .from('exercise_muscle_groups')
    .insert(ids.map(muscle_group_id => ({ exercise_id: exerciseId, muscle_group_id, role: 'primary' })))
  if (insErr) throw insErr
}

/** Persists a session's exercises: links each to an `exercises` row + its muscle groups. */
async function saveMobilityExercises(db: WriteDb, sessionId: string, entry: Pick<MobilityEntry, 'exercises'>): Promise<void> {
  if (entry.exercises.length === 0) return

  // Resolved rows, so `exercise_name` below records the canonical spelling
  // rather than the alias that was typed — otherwise the id would be right and
  // the name shown in the history would still be a twin (roadmap 044).
  const rows = await Promise.all(entry.exercises.map(e => getOrCreateExerciseRow(db, e.name)))
  const exerciseIds = rows.map(r => r.id)

  const { error: exErr } = await db.client.from('mobility_exercises').insert(
    entry.exercises.map((e, i) => ({
      session_id: sessionId,
      exercise_name: rows[i].name,
      duration_minutes: e.duration,
      notes: e.notes || null,
      exercise_id: exerciseIds[i],
    }))
  )
  if (exErr) throw exErr

  await Promise.all(
    entry.exercises.map((e, i) =>
      e.muscleGroups && e.muscleGroups.length > 0
        ? setExerciseMuscleGroups(db, exerciseIds[i], e.muscleGroups)
        : Promise.resolve(),
    ),
  )
}

export async function saveMobilityEntry(db: WriteDb, entry: Omit<MobilityEntry, 'id'>): Promise<MobilityEntry> {
  const totalDuration = entry.exercises.reduce((s, e) => s + e.duration, 0)
  const { data: session, error: sessionErr } = await db.client
    .from('mobility_sessions')
    .insert(withWriter(db, withOrigin(db, { user_id: db.userId, session_date: entry.date, total_duration: totalDuration })))
    .select('id')
    .single()
  if (sessionErr) throw sessionErr

  await saveMobilityExercises(db, session.id, entry)

  return { id: session.id, date: entry.date, exercises: entry.exercises, duration: totalDuration }
}

export const deleteMobilityEntry = (db: Db, id: string): Promise<void> => deleteRow(db, 'mobility_sessions', id)

export async function updateMobilityEntry(
  db: WriteDb,
  id: string,
  patch: Omit<MobilityEntry, 'id'>
): Promise<void> {
  const totalDuration = patch.exercises.reduce((s, e) => s + e.duration, 0)

  const { error: sessionErr } = await db.client
    .from('mobility_sessions')
    .update({ session_date: patch.date, total_duration: totalDuration })
    .eq('id', id)
  if (sessionErr) throw sessionErr

  // Replace exercises: delete existing, re-insert (re-linking exercises + muscle groups)
  await db.client.from('mobility_exercises').delete().eq('session_id', id)
  await saveMobilityExercises(db, id, patch)
}
