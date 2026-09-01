import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { WeightEntry, LiftSet } from '../../types'
import { withOrigin } from '../env'

async function getOrCreateExercise(name: string): Promise<string> {
  await supabase
    .from('exercises')
    .upsert(withOrigin({ user_id: USER_ID, name, is_system: false }), { onConflict: 'user_id,name' })
  const { data, error } = await supabase
    .from('exercises')
    .select('id')
    .eq('user_id', USER_ID)
    .eq('name', name)
    .single()
  if (error) throw error
  return data.id
}

async function getOrCreateSession(date: string): Promise<string> {
  const { data: existing } = await supabase
    .from('training_sessions')
    .select('id')
    .eq('user_id', USER_ID)
    .eq('session_date', date)
    .maybeSingle()
  if (existing) return existing.id

  const { data, error } = await supabase
    .from('training_sessions')
    .insert(withOrigin({ user_id: USER_ID, session_date: date }))
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function loadWeights(): Promise<WeightEntry[]> {
  const { data, error } = await supabase
    .from('training_sessions')
    .select(`
      session_date,
      session_exercises (
        id,
        sort_order,
        superset_group_id,
        exercises ( name ),
        session_sets ( set_number, weight, reps )
      )
    `)
    .eq('user_id', USER_ID)
    .order('session_date', { ascending: false })
  if (error) throw error

  const entries: WeightEntry[] = []
  for (const session of data ?? []) {
    const exercises = (session.session_exercises ?? []) as unknown as {
      id: string
      sort_order: number
      superset_group_id: string | null
      exercises: { name: string } | null
      session_sets: { set_number: number; weight: number; reps: number }[]
    }[]

    const sorted = [...exercises].sort((a, b) => a.sort_order - b.sort_order)
    for (const se of sorted) {
      const sets: LiftSet[] = [...(se.session_sets ?? [])]
        .sort((a, b) => a.set_number - b.set_number)
        .map(s => ({ weight: Number(s.weight), reps: s.reps }))

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

export async function saveWeightEntry(
  entry: Omit<WeightEntry, 'id'> & { id?: string }
): Promise<WeightEntry> {
  const [exerciseId, sessionId] = await Promise.all([
    getOrCreateExercise(entry.exercise),
    getOrCreateSession(entry.date),
  ])

  // Determine sort_order (append after existing exercises in this session)
  const { count } = await supabase
    .from('session_exercises')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  const { data: se, error: seErr } = await supabase
    .from('session_exercises')
    .insert({
      session_id: sessionId,
      exercise_id: exerciseId,
      sort_order: count ?? 0,
      superset_group_id: entry.supersetId ?? null,
    })
    .select('id')
    .single()
  if (seErr) throw seErr

  if (entry.sets.length > 0) {
    const { error: setsErr } = await supabase.from('session_sets').insert(
      entry.sets.map((s, i) => ({
        session_exercise_id: se.id,
        set_number: i + 1,
        weight: s.weight,
        reps: s.reps,
      }))
    )
    if (setsErr) throw setsErr
  }

  return { id: se.id, date: entry.date, exercise: entry.exercise, sets: entry.sets, supersetId: entry.supersetId }
}

export async function deleteWeightEntry(id: string): Promise<void> {
  // Get the session_id before deleting
  const { data: se } = await supabase
    .from('session_exercises')
    .select('session_id')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('session_exercises').delete().eq('id', id)
  if (error) throw error

  // Clean up empty sessions
  if (se?.session_id) {
    const { count } = await supabase
      .from('session_exercises')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', se.session_id)
    if ((count ?? 0) === 0) {
      await supabase.from('training_sessions').delete().eq('id', se.session_id)
    }
  }
}

export async function updateWeightEntry(
  id: string,
  patch: { sets: LiftSet[]; date?: string }
): Promise<void> {
  // Replace all sets for this session_exercise
  await supabase.from('session_sets').delete().eq('session_exercise_id', id)
  if (patch.sets.length > 0) {
    const { error } = await supabase.from('session_sets').insert(
      patch.sets.map((s, i) => ({
        session_exercise_id: id,
        set_number: i + 1,
        weight: s.weight,
        reps: s.reps,
      }))
    )
    if (error) throw error
  }

  // If date supplied, move session_exercise to the correct training_session
  if (patch.date) {
    const { data: se } = await supabase
      .from('session_exercises')
      .select('session_id')
      .eq('id', id)
      .single()

    const newSessionId = await getOrCreateSession(patch.date)

    const { error } = await supabase
      .from('session_exercises')
      .update({ session_id: newSessionId })
      .eq('id', id)
    if (error) throw error

    // Clean up the old session if it is now empty
    if (se?.session_id && se.session_id !== newSessionId) {
      const { count } = await supabase
        .from('session_exercises')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', se.session_id)
      if ((count ?? 0) === 0) {
        await supabase.from('training_sessions').delete().eq('id', se.session_id)
      }
    }
  }
}
