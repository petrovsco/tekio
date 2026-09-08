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

/** A grid's strings → storable sets: the revealed rows, half-filled ones dropped. */
export function parseSets(sets: SetStr[], revealed: number): LiftSet[] {
  return sets
    .slice(0, revealed)
    .filter(s => s.weight && s.reps)
    .map(s => ({ weight: +s.weight, reps: +s.reps }))
}
