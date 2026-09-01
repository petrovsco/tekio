import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import { getOrCreateExercise } from './program'
import type { MobilityEntry } from '../../types'
import { withOrigin } from '../env'

/** Map of exercise_id → its muscle-group names (canonical, shared across sessions). */
async function loadExerciseMuscleMap(): Promise<Map<string, string[]>> {
  const { data, error } = await supabase
    .from('exercise_muscle_groups')
    .select('exercise_id, muscle_groups(name)')
  if (error) throw error
  const map = new Map<string, string[]>()
  for (const row of data ?? []) {
    const name = (row.muscle_groups as unknown as { name: string } | null)?.name
    if (!name) continue
    const arr = map.get(row.exercise_id) ?? []
    arr.push(name)
    map.set(row.exercise_id, arr)
  }
  return map
}

export async function loadMobility(): Promise<MobilityEntry[]> {
  const [{ data, error }, muscleMap] = await Promise.all([
    supabase
      .from('mobility_sessions')
      .select('id, session_date, total_duration, notes, mobility_exercises(id, exercise_name, duration_minutes, notes, exercise_id)')
      .eq('user_id', USER_ID)
      .order('session_date', { ascending: false }),
    loadExerciseMuscleMap(),
  ])
  if (error) throw error
  return (data ?? []).map(r => {
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
async function setExerciseMuscleGroups(exerciseId: string, groupNames: string[]): Promise<void> {
  if (groupNames.length === 0) return
  const { data: groups, error: gErr } = await supabase
    .from('muscle_groups')
    .select('id, name')
    .in('name', groupNames)
  if (gErr) throw gErr
  const ids = (groups ?? []).map(g => g.id)
  if (ids.length === 0) return

  await supabase.from('exercise_muscle_groups').delete().eq('exercise_id', exerciseId)
  const { error: insErr } = await supabase
    .from('exercise_muscle_groups')
    .insert(ids.map(muscle_group_id => ({ exercise_id: exerciseId, muscle_group_id, role: 'primary' })))
  if (insErr) throw insErr
}

/** Persists a session's exercises: links each to an `exercises` row + its muscle groups. */
async function saveMobilityExercises(sessionId: string, entry: Pick<MobilityEntry, 'exercises'>): Promise<void> {
  if (entry.exercises.length === 0) return

  const exerciseIds = await Promise.all(entry.exercises.map(e => getOrCreateExercise(e.name)))

  const { error: exErr } = await supabase.from('mobility_exercises').insert(
    entry.exercises.map((e, i) => ({
      session_id: sessionId,
      exercise_name: e.name,
      duration_minutes: e.duration,
      notes: e.notes || null,
      exercise_id: exerciseIds[i],
    }))
  )
  if (exErr) throw exErr

  await Promise.all(
    entry.exercises.map((e, i) =>
      e.muscleGroups && e.muscleGroups.length > 0
        ? setExerciseMuscleGroups(exerciseIds[i], e.muscleGroups)
        : Promise.resolve(),
    ),
  )
}

export async function saveMobilityEntry(entry: Omit<MobilityEntry, 'id'>): Promise<MobilityEntry> {
  const totalDuration = entry.exercises.reduce((s, e) => s + e.duration, 0)
  const { data: session, error: sessionErr } = await supabase
    .from('mobility_sessions')
    .insert(withOrigin({ user_id: USER_ID, session_date: entry.date, total_duration: totalDuration }))
    .select('id')
    .single()
  if (sessionErr) throw sessionErr

  await saveMobilityExercises(session.id, entry)

  return { id: session.id, date: entry.date, exercises: entry.exercises, duration: totalDuration }
}

export async function deleteMobilityEntry(id: string): Promise<void> {
  const { error } = await supabase.from('mobility_sessions').delete().eq('id', id)
  if (error) throw error
}

export async function updateMobilityEntry(
  id: string,
  patch: Omit<MobilityEntry, 'id'>
): Promise<void> {
  const totalDuration = patch.exercises.reduce((s, e) => s + e.duration, 0)

  const { error: sessionErr } = await supabase
    .from('mobility_sessions')
    .update({ session_date: patch.date, total_duration: totalDuration })
    .eq('id', id)
  if (sessionErr) throw sessionErr

  // Replace exercises: delete existing, re-insert (re-linking exercises + muscle groups)
  await supabase.from('mobility_exercises').delete().eq('session_id', id)
  await saveMobilityExercises(id, patch)
}
