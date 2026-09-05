import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import type { Adaptation, BodyRegion, ExerciseMuscleLink, MuscleContribution, MuscleGroup } from '../../types'
import { withOrigin } from '../env'

export async function loadMuscleGroups(): Promise<MuscleGroup[]> {
  const { data, error } = await supabase
    .from('muscle_groups')
    .select('id, name, body_region, parent_id')
    .order('name')
  if (error) throw error
  return (data ?? []).map(g => ({
    id: g.id,
    name: g.name,
    bodyRegion: g.body_region as BodyRegion,
    parentId: g.parent_id,
  }))
}

/** The whole exercise catalogue (id + name + optional adaptation tag). */
export async function loadExercises(): Promise<{ id: string; name: string; adaptation: Adaptation | null }[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, default_adaptation')
    .order('name')
  if (error) throw error
  return (data ?? []).map(e => ({
    id: e.id,
    name: e.name,
    adaptation: (e.default_adaptation ?? null) as Adaptation | null,
  }))
}

/** Set (or clear, with null) an exercise's adaptation override. */
export async function setExerciseAdaptation(
  exerciseId: string,
  adaptation: Adaptation | null,
): Promise<void> {
  const { error } = await supabase
    .from('exercises')
    .update({ default_adaptation: adaptation })
    .eq('id', exerciseId)
  if (error) throw error
}

/** Name-keyed exercise→muscle links (with impact level + stimulus/recovery). */
export async function loadExerciseMuscleLinks(): Promise<ExerciseMuscleLink[]> {
  const { data, error } = await supabase
    .from('exercise_muscle_groups')
    .select('level, contribution, exercises(name), muscle_groups(name, body_region)')
  if (error) throw error
  const links: ExerciseMuscleLink[] = []
  for (const row of data ?? []) {
    const exercise = (row.exercises as unknown as { name: string } | null)?.name
    const mg = row.muscle_groups as unknown as { name: string; body_region: BodyRegion } | null
    if (!exercise || !mg) continue
    links.push({
      exercise,
      group: mg.name,
      region: mg.body_region,
      level: (row.level ?? 1) as 1 | 2 | 3,
      contribution: row.contribution === 'recovery' ? 'recovery' : 'stimulus',
    })
  }
  return links
}

// ── Exercise ↔ muscle mapping editor ────────────────────────────────────────────

/** A single editable exercise→muscle link, keyed by ids (PK = exerciseId + muscleGroupId). */
export interface ExerciseMuscleRow {
  exerciseId: string
  muscleGroupId: string
  level: 1 | 2 | 3
  contribution: MuscleContribution
}

const roleForLevel = (level: 1 | 2 | 3): 'primary' | 'secondary' => (level === 1 ? 'primary' : 'secondary')

/** Id-keyed exercise→muscle links, for the mapping editor. */
export async function loadExerciseMuscleRows(): Promise<ExerciseMuscleRow[]> {
  const { data, error } = await supabase
    .from('exercise_muscle_groups')
    .select('exercise_id, muscle_group_id, level, contribution')
  if (error) throw error
  return (data ?? []).map(r => ({
    exerciseId: r.exercise_id,
    muscleGroupId: r.muscle_group_id,
    level: (r.level ?? 1) as 1 | 2 | 3,
    contribution: r.contribution === 'recovery' ? 'recovery' : 'stimulus',
  }))
}

/** Insert or update one exercise→muscle link (role is derived from level). */
export async function upsertExerciseMuscle(row: ExerciseMuscleRow): Promise<void> {
  const { error } = await supabase.from('exercise_muscle_groups').upsert(
    {
      exercise_id: row.exerciseId,
      muscle_group_id: row.muscleGroupId,
      role: roleForLevel(row.level),
      level: row.level,
      contribution: row.contribution,
    },
    { onConflict: 'exercise_id,muscle_group_id' },
  )
  if (error) throw error
}

export async function deleteExerciseMuscle(exerciseId: string, muscleGroupId: string): Promise<void> {
  const { error } = await supabase
    .from('exercise_muscle_groups')
    .delete()
    .eq('exercise_id', exerciseId)
    .eq('muscle_group_id', muscleGroupId)
  if (error) throw error
}

/** Create a new exercise (user-scoped) and return its id + name. */
export async function createExercise(name: string): Promise<{ id: string; name: string }> {
  const { data, error } = await supabase
    .from('exercises')
    .insert(withOrigin({ user_id: USER_ID, name: name.trim(), is_system: false }))
    .select('id, name')
    .single()
  if (error) throw error
  return { id: data.id, name: data.name }
}

/** Create a new muscle group and return its id + name. */
export async function createMuscleGroup(
  name: string,
  bodyRegion: BodyRegion,
  parentId?: string | null,
): Promise<{ id: string; name: string }> {
  const { data, error } = await supabase
    .from('muscle_groups')
    .insert({ name: name.trim(), body_region: bodyRegion, parent_id: parentId ?? null })
    .select('id, name')
    .single()
  if (error) throw error
  return { id: data.id, name: data.name }
}

/** Update a muscle group's name, region and/or parent. */
export async function updateMuscleGroup(
  id: string,
  patch: { name?: string; bodyRegion?: BodyRegion; parentId?: string | null },
): Promise<void> {
  const update: Record<string, unknown> = {}
  if (patch.name !== undefined) update.name = patch.name.trim()
  if (patch.bodyRegion !== undefined) update.body_region = patch.bodyRegion
  if (patch.parentId !== undefined) update.parent_id = patch.parentId
  const { error } = await supabase.from('muscle_groups').update(update).eq('id', id)
  if (error) throw error
}

/** Delete a muscle group. Exercise links cascade; fails if it has child groups
 *  or — until the habit tables are dropped (roadmap 025) — if a leftover
 *  `habits` row still points at it (surfaced to the caller). */
export async function deleteMuscleGroup(id: string): Promise<void> {
  const { error } = await supabase.from('muscle_groups').delete().eq('id', id)
  if (error) throw error
}
