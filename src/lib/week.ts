import { fmtSet } from '@tekio/core'
import type { CardioEntry, MobilityEntry, PlannedExercise, PlannedKind, PlannedSession, SportEntry } from '../types'
import { addDays, fmtDate } from './utils'
import { planTitle, planChips } from '../components/tabs/plans/planText'

// The week of plans (RFC 0114): every planned lift and session of seven days,
// whichever tab plans it. A plan stays a prefill here as on the cards: the week
// moves and adds plans, and nothing in it is logged or counted.

export type WeekKind = 'lifts' | PlannedKind

/** One plan as the week lists it. */
export interface WeekItem {
  id: string
  date: string
  kind: WeekKind
  /** The name the plan's card row prints. */
  title: string
  /** The name with its targets, for an opened day. */
  summary: string
  /** What a folded day prints: a lift's name, a session's name and targets,
   *  a mobility block's count of stretches. */
  brief: string
  plannedBy: 'user' | 'agent'
  logged: boolean
  /** The plan itself, for Move. */
  plan: { lift: PlannedExercise } | { session: PlannedSession }
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

/** Whether a cardio, sport or mobility plan has become work: logged from its
 *  card, or, for cardio and sport, a session of the same type or sport on its
 *  day by any route, a Garmin sync included (RFC 0104). A link to an entry
 *  since deleted is no link. */
export function sessionPlanLogged(
  p: PlannedSession,
  done: { cardio: CardioEntry[]; sports: SportEntry[]; mobility: MobilityEntry[] },
): boolean {
  if (p.kind === 'cardio') return done.cardio.some(e => e.id === p.loggedAs || (e.date === p.date && same(e.type, p.name)))
  if (p.kind === 'sport') return done.sports.some(e => e.id === p.loggedAs || (e.date === p.date && same(e.sport, p.name)))
  return !!p.loggedAs && done.mobility.some(e => e.id === p.loggedAs)
}

/** "3×85kg×5" when every target is the same, else each one. */
function liftTargets(p: PlannedExercise): string {
  const t = p.targets.map(fmtSet)
  if (t.length === 0) return ''
  return t.every(x => x === t[0]) ? `${t.length}×${t[0]}` : t.join(', ')
}

function stretchCount(p: PlannedSession): string {
  const n = p.stretches?.length ?? 0
  const mins = (p.stretches ?? []).reduce((a, x) => a + (x.duration || 0), 0)
  return [`Mobility · ${n} ${n === 1 ? 'stretch' : 'stretches'}`, ...(mins ? [`${mins} min`] : [])].join(' · ')
}

export function weekItems(
  plans: PlannedExercise[],
  sessions: PlannedSession[],
  done: { cardio: CardioEntry[]; sports: SportEntry[]; mobility: MobilityEntry[] },
): WeekItem[] {
  return [
    ...plans.map((p): WeekItem => ({
      id: p.id, date: p.date, kind: 'lifts', title: p.exercise,
      summary: [p.exercise, liftTargets(p)].filter(Boolean).join(' '), brief: p.exercise,
      plannedBy: p.plannedBy, logged: !!p.loggedAs, plan: { lift: p },
    })),
    ...sessions.map((p): WeekItem => ({
      id: p.id, date: p.date, kind: p.kind, title: planTitle(p),
      summary: [planTitle(p), ...planChips(p)].join(' · '),
      brief: p.kind === 'mobility' ? stretchCount(p) : [planTitle(p), ...planChips(p)].join(' · '),
      plannedBy: p.plannedBy, logged: sessionPlanLogged(p, done), plan: { session: p },
    })),
  ]
}

/** The seven days from `start`. */
export const weekDays = (start: string): string[] => Array.from({ length: 7 }, (_, i) => addDays(start, i))

/** "9–15 Nov", or "30 Nov – 6 Dec" across a month. */
export function weekRange(start: string): string {
  const end = addDays(start, 6)
  const [d1, m1] = fmtDate(start, { relative: false, year: 'never' }).split(' ')
  const e = fmtDate(end, { relative: false, year: 'never' })
  return m1 === e.split(' ')[1] ? `${d1}–${e}` : `${d1} ${m1} – ${e}`
}

/** The days of the week a plan can move to: today or later, not its own. */
export const moveTargets = (days: string[], from: string, today: string): string[] =>
  days.filter(d => d >= today && d !== from)

/** The plans counted in the week's preview line: open lifts from today on.
 *  Dated today, because the preview reads one day's open plan. */
export function openLiftsAhead(plans: PlannedExercise[], days: string[], today: string): PlannedExercise[] {
  const last = days[days.length - 1]
  return plans
    .filter(p => !p.loggedAs && p.date >= today && p.date >= days[0] && p.date <= last)
    .map(p => ({ ...p, date: today }))
}
