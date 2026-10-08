import type { LiftSet } from '../types'

/**
 * A set as a form holds it. Inputs are strings — a half-typed "6" must survive
 * a keystroke — so the stored {@link LiftSet} is only built on save.
 */
export interface SetStr { weight: string; reps: string }

/** Stored sets → the string pairs a sets grid edits. */
export function toSetStr(sets: LiftSet[]): SetStr[] {
  return sets.map(s => ({ weight: String(s.weight), reps: String(s.reps) }))
}

/** Why a stored set cannot be saved, or null when it can. Reps are a whole
 * count of at least one; a load is a number of zero or more. */
export function liftSetProblem(s: LiftSet): string | null {
  if (!Number.isInteger(s.reps) || s.reps < 1) return 'Reps must be a whole number.'
  if (!Number.isFinite(s.weight) || s.weight < 0) return 'Weight must be a number of 0 or more.'
  return null
}

/** Why a grid's sets cannot be saved, or null when they can: a revealed row
 * with an impossible value blocks the save rather than being rounded or
 * dropped, so what is stored is what was typed. */
export function setsProblem(sets: SetStr[], revealed: number): string | null {
  for (const [i, s] of sets.slice(0, revealed).entries()) {
    if (!s.weight || !s.reps) continue
    const why = liftSetProblem({ weight: +s.weight, reps: +s.reps })
    if (why) return `Set ${i + 1}: ${why}`
  }
  return null
}

/** A grid's strings → storable sets: the revealed rows, half-filled ones dropped. */
export function parseSets(sets: SetStr[], revealed: number): LiftSet[] {
  return sets
    .slice(0, revealed)
    .filter(s => s.weight && s.reps)
    .map(s => ({ weight: +s.weight, reps: +s.reps }))
}
