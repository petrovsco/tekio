import type { SetStr } from './sets'

// The Weights log form as typed, kept on the device until it is saved
// (RFC 0106). Leaving the tab, reloading or switching between the lifts of a
// superset keeps every typed set; only Save writes to the log. Per device, like
// the Planned card's fold: a blocked storage just starts an empty form.

/** One lift on the form. A lift filled from a plan keeps the plan's id, and
 *  its superset's, so saving ticks the plan and logs into the superset. */
export interface DraftLift {
  /** Stable while the lift is on the form, so a save removes exactly it. */
  id: string
  ex: string
  sets: SetStr[]
  revealed: number
  planId?: string
  supersetId?: string
}

export interface LogDraft {
  date: string
  lifts: DraftLift[]
  /** The lift the form is showing. */
  active: number
}

const KEY = 'tekio.weightsDraft'

export const emptyLift = (): DraftLift => ({ id: crypto.randomUUID(), ex: '', sets: [{ weight: '', reps: '' }], revealed: 1 })

/** Whether anything was typed into a lift: a name or any set value. */
export const liftTouched = (l: DraftLift): boolean =>
  l.ex.trim() !== '' || l.sets.some(s => s.weight !== '' || s.reps !== '')

export function readDraft(fallbackDate: string): LogDraft {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const d = JSON.parse(raw) as LogDraft
      if (Array.isArray(d.lifts) && d.lifts.length > 0 && typeof d.date === 'string') {
        return { ...d, active: Math.min(Math.max(0, d.active | 0), d.lifts.length - 1) }
      }
    }
  } catch { /* an unreadable draft starts an empty form */ }
  return { date: fallbackDate, lifts: [emptyLift()], active: 0 }
}

export function writeDraft(d: LogDraft): void {
  try {
    if (d.lifts.length === 1 && !liftTouched(d.lifts[0])) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, JSON.stringify(d))
  } catch { /* kept in memory only */ }
}
