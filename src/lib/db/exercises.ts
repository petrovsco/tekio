import { supabase } from '../supabase'
import { USER_ID } from '../../constants/app'
import { withOrigin } from '../env'
import { normaliseExerciseName, resolveExerciseName } from '../exerciseName'
import type { ExerciseAlias } from '../../types'
import type { LinkSet, PatternKey } from '../../constants/movementPatterns'

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
 * Two logging paths once carried their own copy of this, which is exactly how
 * a twin gets created: a fix applied to one path leaves the other one making
 * duplicates. Now there is one path, and it resolves before it writes:
 *
 *   1. an existing exercise whose name matches ignoring case and punctuation
 *      (so "pushups" lands on "Push-ups", and the trailing-colon twin is gone);
 *   2. else a known alias, resolved to its canonical name;
 *   3. else a catalogue lift, by its name or one of its spellings (RFC 0074);
 *   4. else the name as typed — a genuinely new exercise.
 *
 * The read is one small select over the user's own exercises and aliases
 * (~110 and ~70 rows), which keeps the match key in a single TypeScript
 * function rather than splitting it between here and SQL.
 *
 * With `link`, a row created here also gets its muscle links (RFC 0074): the
 * catalogue entry's, else those of the movement the user named. A row that
 * already exists is never relinked — what it carries was decided elsewhere.
 * Mobility does not pass `link`; its drills keep their own recovery model.
 */
export async function getOrCreateExerciseRow(
  name: string,
  opts: { link?: boolean; pattern?: PatternKey } = {},
): Promise<{ id: string; name: string; linked: boolean }> {
  const typed = name.trim()

  const [{ data: existing, error: exErr }, aliases, catalogue] = await Promise.all([
    supabase.from('exercises').select('id, name').eq('user_id', USER_ID),
    loadExerciseAliases(),
    // A dynamic import keeps 270 lifts off the first paint: the store loads
    // this file at startup, and only a write ever needs the catalogue.
    import('../../constants/exerciseCatalogue'),
  ])
  if (exErr) throw exErr
  const rows = existing ?? []
  const find = (n: string) => rows.find(r => normaliseExerciseName(r.name) === normaliseExerciseName(n))

  const resolved = resolveExerciseName(typed, rows.map(r => r.name), aliases) ?? typed
  const hit = find(resolved)
  if (hit) return { ...hit, linked: false }

  // Only after the user's own rows: a name on file is never redirected to a
  // catalogue lift that happens to list it as a spelling.
  const entry = catalogue.catalogueEntryFor(resolved)
  if (entry) {
    const owned = find(entry.name)
    if (owned) return { ...owned, linked: false }
  }
  const canonical = entry?.name ?? resolved

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

  const links = !opts.link ? null
    : entry ? catalogue.linksFor(entry)
    : opts.pattern ? catalogue.linksFor({ name: canonical, pattern: opts.pattern })
    : null
  const linked = links ? await writeLinks(data.id, links) : false
  return { id: data.id, name: canonical, linked }
}

/** Write a new exercise's muscle links. Role follows level, as on every
 *  existing row: a prime mover is `primary`, anything else `secondary`. */
async function writeLinks(exerciseId: string, links: LinkSet): Promise<boolean> {
  const names = Object.keys(links)
  if (!names.length) return false
  const { data: groups, error } = await supabase.from('muscle_groups').select('id, name').in('name', names)
  if (error) throw error
  const rows = (groups ?? []).map(g => {
    const level = links[g.name as keyof LinkSet]!
    return { exercise_id: exerciseId, muscle_group_id: g.id, level, role: level === 1 ? 'primary' : 'secondary', contribution: 'stimulus' }
  })
  const { error: insErr } = await supabase
    .from('exercise_muscle_groups')
    .upsert(rows, { onConflict: 'exercise_id,muscle_group_id', ignoreDuplicates: true })
  if (insErr) throw insErr
  return rows.length > 0
}
