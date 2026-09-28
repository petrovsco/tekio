import type { CardioEntry, SportEntry } from '../../../types'

/**
 * Which sessions the Cardio screen is looking at (roadmap 076). One choice at
 * the top of the screen, and every card below follows it — the log form, the
 * progress chart, sessions per week and the history — so the screen never
 * shows a sport chart under a cardio form. Cardio comes first because it is
 * the default; All is last because it is the rarely needed one.
 */
export type Lens = 'cardio' | 'sport' | 'all'

export const LENSES: { value: Lens; label: string }[] = [
  { value: 'cardio', label: 'Cardio' },
  { value: 'sport', label: 'Sport' },
  { value: 'all', label: 'All' },
]

/** A sport session is cardio stimulus, so under All the two tables read as one
 *  list; the kind is kept so each row can still say what it is. */
export type Session =
  | { kind: 'cardio'; entry: CardioEntry }
  | { kind: 'sport'; entry: SportEntry }

/** The name a session is filed under: the cardio type or the sport. */
export const sessionLabel = (s: Session): string =>
  s.kind === 'cardio' ? s.entry.type : s.entry.sport

/** The sessions the lens admits, newest first. */
export function lensSessions(cardio: CardioEntry[], sports: SportEntry[], lens: Lens): Session[] {
  return [
    ...(lens === 'sport' ? [] : cardio.map(entry => ({ kind: 'cardio' as const, entry }))),
    ...(lens === 'cardio' ? [] : sports.map(entry => ({ kind: 'sport' as const, entry }))),
  ].sort((a, b) => b.entry.date.localeCompare(a.entry.date))
}
