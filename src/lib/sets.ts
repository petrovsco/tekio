import type { LiftSet } from '../types'

/**
 * A set as a form holds it. Inputs are strings — a half-typed "6" must survive
 * a keystroke — so the stored {@link LiftSet} is only built on save. `reps` is
 * the grid's count column: on a timed lift (RFC 0107) it holds the seconds.
 */
export interface SetStr { weight: string; reps: string }

/** Whether a set is a hold measured in seconds rather than reps (RFC 0107). */
export const isTimedSet = (s: LiftSet): boolean => s.seconds != null

/** Stored sets → the string pairs a sets grid edits. */
export function toSetStr(sets: LiftSet[]): SetStr[] {
  return sets.map(s => ({ weight: String(s.weight), reps: String(s.seconds ?? s.reps) }))
}

/** Whether a grid row is filled in enough to save. A hold's added load may be
 *  left empty: an empty one is bodyweight. */
export const rowFilled = (s: SetStr, timed = false): boolean =>
  s.reps !== '' && (timed || s.weight !== '')

/** One grid row → the set it stores. A hold is one rep held for its seconds,
 *  so a reader that knows nothing of time still reads a valid set. */
export function toLiftSet(s: SetStr, timed = false): LiftSet {
  return timed
    ? { weight: +s.weight, reps: 1, seconds: +s.reps }
    : { weight: +s.weight, reps: +s.reps }
}

/** Why a stored set cannot be saved, or null when it can. Reps, or a hold's
 *  seconds, are a whole count of at least one; a load is a number of zero or
 *  more. */
export function liftSetProblem(s: LiftSet): string | null {
  if (isTimedSet(s)) {
    if (!Number.isInteger(s.seconds) || s.seconds! < 1) return 'Seconds must be a whole number.'
  } else if (!Number.isInteger(s.reps) || s.reps < 1) return 'Reps must be a whole number.'
  if (!Number.isFinite(s.weight) || s.weight < 0) return 'Weight must be a number of 0 or more.'
  return null
}

/** Why a grid's sets cannot be saved, or null when they can: a revealed row
 *  with an impossible value blocks the save rather than being rounded or
 *  dropped, so what is stored is what was typed. */
export function setsProblem(sets: SetStr[], revealed: number, timed = false): string | null {
  for (const [i, s] of sets.slice(0, revealed).entries()) {
    if (!rowFilled(s, timed)) continue
    const why = liftSetProblem(toLiftSet(s, timed))
    if (why) return `Set ${i + 1}: ${why}`
  }
  return null
}

/** A grid's strings → storable sets: the revealed rows, half-filled ones dropped. */
export function parseSets(sets: SetStr[], revealed: number, timed = false): LiftSet[] {
  return sets
    .slice(0, revealed)
    .filter(s => rowFilled(s, timed))
    .map(s => toLiftSet(s, timed))
}

/** One set as every list prints it: "60kg×8", or a hold's "45 s" and
 *  "10kg · 30 s" (RFC 0107). */
export function fmtSet(s: LiftSet): string {
  if (!isTimedSet(s)) return `${s.weight}kg×${s.reps}`
  return s.weight > 0 ? `${s.weight}kg · ${s.seconds} s` : `${s.seconds} s`
}
