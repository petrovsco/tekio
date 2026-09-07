import type { CardioEntry, SportEntry } from '../types'
import { today } from './utils'

// Every number below is docs/roadmap/done/059-profile-hrmax-typed-hr-path.md#grounding.

/** 24 — months of synced rows the observed HRmax is read over; a convention inside 12–36: age moves HRmax ~0.7 bpm/yr (Gellish 2007 — under 1.5 bpm inside the window), training status 3–7 % (Zavorsky 2000), and a shorter window mistakes fewer all-out efforts for drift (Peter's 12-month read is 191, his 24-month read 196), see docs/roadmap/done/059-profile-hrmax-typed-hr-path.md#grounding */
export const HR_MAX_WINDOW_MONTHS = 24

/** 3 — bpm a second session must come within for a session max to count: the observed HRmax is a replicated peak, never the single highest reading, because a wrist-optical spike can sit 20 bpm above anything a second session reaches (Navalta 2020: limits of agreement −32 to +162 bpm; Peter's 214) and Garmin's auto-detect ratchets to any such reading; a chest strap's precision plus day-to-day noise, a convention, see docs/roadmap/done/059-profile-hrmax-typed-hr-path.md#grounding */
export const HR_MAX_REPLICATION_BPM = 3

/** The observed HRmax and the session that set it. */
export interface ObservedHrMax {
  value: number
  date: string
  /** What the session was — a cardio modality or the sport's name. */
  label: string
}

/** ISO date `months` months before `date`. */
function monthsBefore(date: string, months: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() - months)
  return d.toISOString().slice(0, 10)
}

/**
 * The HRmax the user's own rows show (roadmap 059): the highest session max HR
 * inside the last {@link HR_MAX_WINDOW_MONTHS} months that a second session
 * comes within {@link HR_MAX_REPLICATION_BPM} bpm of. Land modalities only —
 * a swimmer's ceiling sits 6–7 bpm lower (Olstad 2019) and would drag the
 * number down; a synced match counts, tennis is played on land. Null when no
 * peak repeats — one reading is never a maximum — so the typed-HR path stays
 * off rather than dividing by a guess.
 */
export function observedHrMax(cardio: CardioEntry[], sports: SportEntry[], date: string = today()): ObservedHrMax | null {
  const from = monthsBefore(date, HR_MAX_WINDOW_MONTHS)
  const peaks: ObservedHrMax[] = []
  for (const c of cardio) {
    if (c.maxHr == null || c.type === 'Swimming' || c.date < from || c.date > date) continue
    peaks.push({ value: c.maxHr, date: c.date, label: c.type })
  }
  for (const s of sports) {
    if (s.maxHr == null || s.date < from || s.date > date) continue
    peaks.push({ value: s.maxHr, date: s.date, label: s.sport })
  }
  peaks.sort((a, b) => b.value - a.value || (a.date < b.date ? 1 : -1))
  // Sorted high to low, so the next peak is the nearest reading at or below
  // this one; if it is within the tolerance the peak is replicated.
  for (let i = 0; i + 1 < peaks.length; i++) {
    if (peaks[i + 1].value >= peaks[i].value - HR_MAX_REPLICATION_BPM) return peaks[i]
  }
  return null
}

/**
 * The HRmax the app divides by: the typed override when there is one, unless
 * a synced peak has since exceeded it by more than
 * {@link HR_MAX_REPLICATION_BPM} bpm — the heart settles the argument. Null
 * when neither exists.
 */
export function resolveHrMax(observed: ObservedHrMax | null, override: number | null | undefined): number | null {
  if (override != null && override > 0) {
    return observed != null && observed.value > override + HR_MAX_REPLICATION_BPM ? observed.value : override
  }
  return observed?.value ?? null
}
