import { supabase } from '../supabase'
import type { Adaptation, BodyRegion, ExerciseMuscleLink, MuscleGroup } from '../../types'

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
