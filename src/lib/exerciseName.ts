// Roadmap 044: one movement, many spellings, one search.
//
// The same movement gets typed under different names — KB Swing / Kettlebell
// Swing, Press-ups / Push-ups — and every spelling used to create its own row
// in `exercises`. The muscle read then split one movement's sets across two
// names, one of which usually had no muscle links, so it was a silent hole in
// the body map.
//
// Two rules do all the work here, and both are exact matches, not guesses. A
// fuzzy or phonetic match would guess, and a wrong guess books sets onto the
// wrong muscles.

import type { ExerciseAlias } from '../types'

/**
 * The match key for an exercise name: lowercased, letters and digits only.
 *
 * So "pushups", "push ups", "Push-Ups" and "Push-ups" are one name, from one
 * alias entry rather than four. It also closes the twin that punctuation alone
 * created: "Hanging Leg Raises:" (deleted by hand on 2026-09-03) now matches
 * "Hanging Leg Raises" and can never be created again.
 *
 * Mirrored in SQL as `public.normalise_exercise_name(text)`, which the unique
 * indexes on `exercise_aliases` are built over. If one changes, change both.
 */
export function normaliseExerciseName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

/**
 * The canonical name a typed name means, or `null` when nothing known matches.
 *
 * Resolution order is load-bearing: a real exercise name always wins over an
 * alias. An alias row that (wrongly) spells an existing exercise can therefore
 * never hijack it and send its sets somewhere else — the DB has no way to
 * enforce that across two tables, so the rule lives here instead.
 *
 * A user's own alias beats a system one when both spell the same thing, which
 * is why `aliases` is walked in the order the loader returns (user rows first).
 */
export function resolveExerciseName(
  typed: string,
  knownNames: string[],
  aliases: ExerciseAlias[],
): string | null {
  const key = normaliseExerciseName(typed)
  if (!key) return null

  const exact = knownNames.find(n => normaliseExerciseName(n) === key)
  if (exact) return exact

  const alias = aliases.find(a => normaliseExerciseName(a.alias) === key)
  if (!alias) return null

  // The alias points at a name, not a row, so that the shipped list works for
  // a user with zero exercises. If that name already exists under a different
  // punctuation, hand back the spelling actually on file.
  const target = normaliseExerciseName(alias.canonicalName)
  return knownNames.find(n => normaliseExerciseName(n) === target) ?? alias.canonicalName
}

/** Every spelling that reaches `name` — the name itself plus its aliases. */
export function spellingsFor(name: string, aliases: ExerciseAlias[]): string[] {
  const key = normaliseExerciseName(name)
  return aliases.filter(a => normaliseExerciseName(a.canonicalName) === key).map(a => a.alias)
}
