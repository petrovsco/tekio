import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import { withOrigin } from '../env'
import { normaliseExerciseName, resolveExerciseName } from '../exerciseName'
import type { ExerciseAlias } from '../../types'

/**
 * The alias list: the rows shipped with the app (`user_id is null`) plus this
 * user's own. Own rows come first so that `resolveExerciseName`, which takes
 * the first match, prefers them when both spell the same thing.
 */
export async function loadExerciseAliases(): Promise<ExerciseAlias[]> {
  const { data, error } = await supabase
    .from('exercise_aliases')
    .select('alias, canonical_name, user_id')
    .or(`user_id.eq.${USER_ID},user_id.is.null`)
  if (error) throw error
  return (data ?? [])
    .map(r => ({ alias: r.alias, canonicalName: r.canonical_name, isOwn: r.user_id !== null }))
    .sort((a, b) => Number(b.isOwn) - Number(a.isOwn))
}

/**
 * The one place a typed exercise name becomes a row id — roadmap 044.
 *
 * Weights and program logging each used to carry their own copy of this, which
 * is exactly how a twin gets created: a fix applied to one path leaves the
 * other one making duplicates. Now there is one path, and it resolves before
 * it writes:
 *
 *   1. an existing exercise whose name matches ignoring case and punctuation
 *      (so "pushups" lands on "Push-ups", and the trailing-colon twin is gone);
 *   2. else a known alias, resolved to its canonical name;
 *   3. else the name as typed — a genuinely new exercise.
 *
 * The read is one small select over the user's own exercises and aliases
 * (~110 and ~70 rows), which keeps the match key in a single TypeScript
 * function rather than splitting it between here and SQL.
 */
export async function getOrCreateExerciseRow(name: string): Promise<{ id: string; name: string }> {
  const typed = name.trim()

  const [{ data: existing, error: exErr }, aliases] = await Promise.all([
    supabase.from('exercises').select('id, name').eq('user_id', USER_ID),
    loadExerciseAliases(),
  ])
  if (exErr) throw exErr
  const rows = existing ?? []

  const canonical = resolveExerciseName(typed, rows.map(r => r.name), aliases) ?? typed

  const key = normaliseExerciseName(canonical)
  const hit = rows.find(r => normaliseExerciseName(r.name) === key)
  if (hit) return hit

  await supabase
    .from('exercises')
    .upsert(withOrigin({ user_id: USER_ID, name: canonical, is_system: false }), { onConflict: 'user_id,name' })
  const { data, error } = await supabase
    .from('exercises')
    .select('id')
    .eq('user_id', USER_ID)
    .eq('name', canonical)
    .single()
  if (error) throw error
  return { id: data.id, name: canonical }
}

/** The id alone, for the callers that do not display the name back. */
export async function getOrCreateExercise(name: string): Promise<string> {
  return (await getOrCreateExerciseRow(name)).id
}
