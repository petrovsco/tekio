import { KnownError, liftSetProblem, type WeightEntry, type LiftSet } from '@tekio/core'
import type { PatternKey } from '@tekio/core/catalogue'
import { userRows, withOrigin, type Db, type WriteDb } from './db'
// One resolver for every write path (roadmap 044) — a second copy here is how
// the alias fix would silently miss half the ways a set gets logged.
import { getOrCreateExerciseRow } from './exercises'

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

// The writes (RFC 0094 step 2d): the web app calls them with its own client and
// the API with the caller's, so a lift is logged one way whoever logs it.

/** A set as its `session_sets` row: a hold is one rep and its seconds (RFC 0107). */
const setRow = (sessionExerciseId: string, n: number, s: LiftSet) => ({
  session_exercise_id: sessionExerciseId,
  set_number: n,
  weight: s.weight,
  reps: s.reps,
  ...(s.seconds != null ? { duration_s: s.seconds } : {}),
})

/** Nothing is written unless every set can be: an entry is never stored
 *  without its sets, and never with a set the table would refuse. */
function checkSets(sets: LiftSet[]): void {
  if (sets.length === 0) throw new KnownError('An exercise needs at least one set.')
  const problem = sets.map(liftSetProblem).find(Boolean)
  if (problem) throw new KnownError(problem)
}

/** The day's session, with how many exercises it already holds. The count
 *  rides on the same request: a separate one cost a round trip on every first
 *  tick of a lift. */
async function getOrCreateSession(db: WriteDb, date: string): Promise<{ id: string; exercises: number }> {
  const { data: existing } = await db.client
    .from('training_sessions')
    .select('id, session_exercises(count)')
    .eq('user_id', db.userId)
    .eq('session_date', date)
    .maybeSingle()
  if (existing) {
    const counted = existing.session_exercises as unknown as { count: number }[] | null
    return { id: existing.id, exercises: counted?.[0]?.count ?? 0 }
  }

  const { data, error } = await db.client
    .from('training_sessions')
    .insert(withOrigin(db, { user_id: db.userId, session_date: date }))
    .select('id')
    .single()
  if (error) throw error
  return { id: data.id, exercises: 0 }
}

/** Delete a training session once its last exercise is gone — the row exists
 *  only to hold them. Its error is ignored on purpose: a session left behind
 *  is tidiness, not data loss. */
async function deleteSessionIfEmpty(db: Db, sessionId: string): Promise<void> {
  const { count } = await db.client
    .from('session_exercises')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)
  if ((count ?? 0) === 0) {
    await db.client.from('training_sessions').delete().eq('id', sessionId)
  }
}

/** `linked` is true when this save created the exercise and wrote its muscle
 *  links (RFC 0074), so the caller knows the muscle read must be reloaded. */
export async function saveWeightEntry(
  db: WriteDb,
  entry: Omit<WeightEntry, 'id'> & { id?: string },
  pattern?: PatternKey,
): Promise<{ entry: WeightEntry; linked: boolean }> {
  checkSets(entry.sets)

  // The row, not just its id: what the user typed may be an alias, and the
  // entry handed back seeds the in-memory log. Returning the typed spelling
  // would leave the muscle read blind to this set until the next reload —
  // exactly the split roadmap 044 closes.
  const [exercise, session] = await Promise.all([
    getOrCreateExerciseRow(db, entry.exercise, { link: true, pattern }),
    getOrCreateSession(db, entry.date),
  ])

  const { data: se, error: seErr } = await db.client
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

  const { error: setsErr } = await db.client.from('session_sets').insert(
    entry.sets.map((s, i) => setRow(se.id, i + 1, s))
  )
  if (setsErr) {
    // No entry without its sets: a failed save must not leave an empty
    // exercise in the day's history for each retry.
    await db.client.from('session_exercises').delete().eq('id', se.id)
    throw setsErr
  }

  return {
    entry: { id: se.id, date: entry.date, exercise: exercise.name, sets: entry.sets, supersetId: entry.supersetId },
    linked: exercise.linked,
  }
}

/** One logged lift, if it is this user's: the sets it holds now. Null for an
 *  id that is not theirs, so the API can refuse to touch it. */
export async function loadOwnWeightSets(db: Db, id: string): Promise<LiftSet[] | null> {
  const { data, error } = await db.client
    .from('session_exercises')
    .select('id, training_sessions!inner(user_id), session_sets(set_number, weight, reps, duration_s)')
    .eq('id', id)
    .eq('training_sessions.user_id', db.userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const sets = (data.session_sets ?? []) as unknown as
    { set_number: number; weight: number; reps: number; duration_s: number | null }[]
  return [...sets]
    .sort((a, b) => a.set_number - b.set_number)
    .map(s => ({ weight: Number(s.weight), reps: s.reps, ...(s.duration_s != null ? { seconds: s.duration_s } : {}) }))
}

export async function deleteWeightEntry(db: Db, id: string): Promise<void> {
  // Get the session_id before deleting
  const { data: se } = await db.client
    .from('session_exercises')
    .select('session_id')
    .eq('id', id)
    .maybeSingle()

  const { error } = await db.client.from('session_exercises').delete().eq('id', id)
  if (error) throw error

  if (se?.session_id) await deleteSessionIfEmpty(db, se.session_id)
}

const sameSet = (a: LiftSet, b: LiftSet) => a.weight === b.weight && a.reps === b.reps && a.seconds === b.seconds

/** `prev` is what the entry holds now, when the caller knows it. */
export async function updateWeightEntry(
  db: WriteDb,
  id: string,
  patch: { sets: LiftSet[]; date?: string },
  prev?: LiftSet[],
): Promise<void> {
  // Check before the delete below: a refused insert after it would leave the
  // entry with no sets at all.
  checkSets(patch.sets)

  // Ticking the next set on Weights adds one row at the end, and unticking the
  // last takes one off (RFC 0106). Either is a single request; rewriting every
  // set was two in a row, on every tick.
  const n = Math.min(patch.sets.length, prev?.length ?? 0)
  if (!patch.date && prev && prev.length !== patch.sets.length && patch.sets.slice(0, n).every((s, i) => sameSet(s, prev[i]))) {
    const { error } = patch.sets.length > prev.length
      ? await db.client.from('session_sets').insert(
          patch.sets.slice(n).map((s, i) => setRow(id, n + i + 1, s)),
        )
      : await db.client.from('session_sets').delete().eq('session_exercise_id', id).gt('set_number', n)
    if (error) throw error
    return
  }

  // Replace all sets for this session_exercise
  await db.client.from('session_sets').delete().eq('session_exercise_id', id)
  const { error } = await db.client.from('session_sets').insert(
    patch.sets.map((s, i) => setRow(id, i + 1, s))
  )
  if (error) throw error

  // If date supplied, move session_exercise to the correct training_session
  if (patch.date) {
    const { data: se } = await db.client
      .from('session_exercises')
      .select('session_id')
      .eq('id', id)
      .single()

    const { id: newSessionId } = await getOrCreateSession(db, patch.date)

    const { error } = await db.client
      .from('session_exercises')
      .update({ session_id: newSessionId })
      .eq('id', id)
    if (error) throw error

    if (se?.session_id && se.session_id !== newSessionId) {
      await deleteSessionIfEmpty(db, se.session_id)
    }
  }
}
