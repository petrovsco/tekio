import { supabase } from '../supabase'
import { userId } from '../session'
import type { WeightEntry, LiftSet } from '../../types'
import type { PatternKey } from '../../constants/movementPatterns'
import { withOrigin } from '../env'
// One resolver for every write path (roadmap 044) — a second copy here is how
// the alias fix would silently miss half the ways a set gets logged.
import { getOrCreateExerciseRow } from './exercises'
import { appDb, deleteRow } from './_rows'
import { loadWeights as dbLoadWeights } from '@tekio/db'
import { liftSetProblem } from '@tekio/core'
import { KnownError } from '../errorReport'

/** A set as its `session_sets` row: a hold is one rep and its seconds (RFC 0107). */
const setRow = (sessionExerciseId: string, n: number, s: LiftSet) => ({
  session_exercise_id: sessionExerciseId,
  set_number: n,
  weight: s.weight,
  reps: s.reps,
  ...(s.seconds != null ? { duration_s: s.seconds } : {}),
})

/** The day's session, with how many exercises it already holds. The count
 *  rides on the same request: a separate one cost a round trip on every first
 *  tick of a lift. */
async function getOrCreateSession(date: string): Promise<{ id: string; exercises: number }> {
  const { data: existing } = await supabase
    .from('training_sessions')
    .select('id, session_exercises(count)')
    .eq('user_id', userId())
    .eq('session_date', date)
    .maybeSingle()
  if (existing) {
    const counted = existing.session_exercises as unknown as { count: number }[] | null
    return { id: existing.id, exercises: counted?.[0]?.count ?? 0 }
  }

  const { data, error } = await supabase
    .from('training_sessions')
    .insert(withOrigin({ user_id: userId(), session_date: date }))
    .select('id')
    .single()
  if (error) throw error
  return { id: data.id, exercises: 0 }
}

/** Delete a training session once its last exercise is gone — the row exists
 *  only to hold them. Not routed through `deleteRow`: this cleanup ignores its
 *  error on purpose, because a session left behind is tidiness, not data loss. */
async function deleteSessionIfEmpty(sessionId: string): Promise<void> {
  const { count } = await supabase
    .from('session_exercises')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)
  if ((count ?? 0) === 0) {
    await supabase.from('training_sessions').delete().eq('id', sessionId)
  }
}

export const loadWeights = () => dbLoadWeights(appDb())

/** `linked` is true when this save created the exercise and wrote its muscle
 *  links (RFC 0074), so the caller knows the muscle read must be reloaded. */
export async function saveWeightEntry(
  entry: Omit<WeightEntry, 'id'> & { id?: string },
  pattern?: PatternKey,
): Promise<{ entry: WeightEntry; linked: boolean }> {
  // Nothing is written unless every set can be: an entry is never stored
  // without its sets, and never with a set the table would refuse.
  if (entry.sets.length === 0) throw new KnownError('An exercise needs at least one set.')
  const problem = entry.sets.map(liftSetProblem).find(Boolean)
  if (problem) throw new KnownError(problem)

  // The row, not just its id: what the user typed may be an alias, and the
  // entry handed back seeds the in-memory log. Returning the typed spelling
  // would leave the muscle read blind to this set until the next reload —
  // exactly the split roadmap 044 closes.
  const [exercise, session] = await Promise.all([
    getOrCreateExerciseRow(entry.exercise, { link: true, pattern }),
    getOrCreateSession(entry.date),
  ])

  const { data: se, error: seErr } = await supabase
    .from('session_exercises')
    .insert({
      session_id: session.id,
      exercise_id: exercise.id,
      // Appended after the exercises already in this session.
      sort_order: session.exercises,
      superset_group_id: entry.supersetId ?? null,
    })
    .select('id')
    .single()
  if (seErr) throw seErr

  if (entry.sets.length > 0) {
    const { error: setsErr } = await supabase.from('session_sets').insert(
      entry.sets.map((s, i) => setRow(se.id, i + 1, s))
    )
    if (setsErr) {
      // No entry without its sets: a failed save must not leave an empty
      // exercise in the day's history for each retry.
      await supabase.from('session_exercises').delete().eq('id', se.id)
      throw setsErr
    }
  }

  return {
    entry: { id: se.id, date: entry.date, exercise: exercise.name, sets: entry.sets, supersetId: entry.supersetId },
    linked: exercise.linked,
  }
}

export async function deleteWeightEntry(id: string): Promise<void> {
  // Get the session_id before deleting
  const { data: se } = await supabase
    .from('session_exercises')
    .select('session_id')
    .eq('id', id)
    .maybeSingle()

  await deleteRow('session_exercises', id)

  if (se?.session_id) await deleteSessionIfEmpty(se.session_id)
}

const sameSet = (a: LiftSet, b: LiftSet) => a.weight === b.weight && a.reps === b.reps && a.seconds === b.seconds

/** `prev` is what the entry holds now, when the caller knows it. */
export async function updateWeightEntry(
  id: string,
  patch: { sets: LiftSet[]; date?: string },
  prev?: LiftSet[],
): Promise<void> {
  // Check before the delete below: a refused insert after it would leave the
  // entry with no sets at all.
  if (patch.sets.length === 0) throw new KnownError('An exercise needs at least one set.')
  const problem = patch.sets.map(liftSetProblem).find(Boolean)
  if (problem) throw new KnownError(problem)

  // Ticking the next set on Weights adds one row at the end, and unticking the
  // last takes one off (RFC 0106). Either is a single request; rewriting every
  // set was two in a row, on every tick.
  const n = Math.min(patch.sets.length, prev?.length ?? 0)
  if (!patch.date && prev && prev.length !== patch.sets.length && patch.sets.slice(0, n).every((s, i) => sameSet(s, prev[i]))) {
    const { error } = patch.sets.length > prev.length
      ? await supabase.from('session_sets').insert(
          patch.sets.slice(n).map((s, i) => setRow(id, n + i + 1, s)),
        )
      : await supabase.from('session_sets').delete().eq('session_exercise_id', id).gt('set_number', n)
    if (error) throw error
    return
  }

  // Replace all sets for this session_exercise
  await supabase.from('session_sets').delete().eq('session_exercise_id', id)
  if (patch.sets.length > 0) {
    const { error } = await supabase.from('session_sets').insert(
      patch.sets.map((s, i) => setRow(id, i + 1, s))
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

    const { id: newSessionId } = await getOrCreateSession(patch.date)

    const { error } = await supabase
      .from('session_exercises')
      .update({ session_id: newSessionId })
      .eq('id', id)
    if (error) throw error

    if (se?.session_id && se.session_id !== newSessionId) {
      await deleteSessionIfEmpty(se.session_id)
    }
  }
}
