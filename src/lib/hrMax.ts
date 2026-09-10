import type { CardioEntry, SportEntry } from '../types'
import { today } from './utils'

// Every number below is tekio.rfcs/rfcs/done/0059-profile-hrmax-typed-hr-path.md#grounding.

/** 24 — months of synced rows the observed HRmax is read over; a convention inside 12–36: age moves HRmax ~0.7 bpm/yr (Gellish 2007 — under 1.5 bpm inside the window), training status 3–7 % (Zavorsky 2000), and a shorter window mistakes fewer all-out efforts for drift (on the development dataset a 12-month read gives 191 against a 24-month read of 196), see tekio.rfcs/rfcs/done/0059-profile-hrmax-typed-hr-path.md#grounding */
export const HR_MAX_WINDOW_MONTHS = 24

/** 3 — bpm a second session must come within for a session max to count: the observed HRmax is a replicated peak, never the single highest reading, because a wrist-optical spike can sit 20 bpm above anything a second session reaches (Navalta 2020: limits of agreement −32 to +162 bpm; a 214 appears in the development dataset) and Garmin's auto-detect ratchets to any such reading; a chest strap's precision plus day-to-day noise, a convention, see tekio.rfcs/rfcs/done/0059-profile-hrmax-typed-hr-path.md#grounding */
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

// ─── The number the app divides by (roadmap 060) ─────────────────────────────
// The observed peak above is a proposal, never the number itself: the user
// accepts it on the Profile, or types one from another device or a test, and
// a sync never overwrites what they set. Without either, an age estimate.

/** Where the stored HRmax came from: typed by the user, or the tracker peak they accepted. */
export type HrMaxSource = 'typed' | 'tracker'

/** 208 — the intercept of the Tanaka age formula (HRmax ≈ 208 − 0.7 × age), the default when the user has set no number; lowest RMSE of the age formulas in athletes (Tanaka 2001; Kasiak 2023: 9.2 bpm) and still ±9–11 bpm for one person (Martin 2025), so the Profile calls it an estimate; never 220 − age (Robergs & Landwehr 2002), see tekio.rfcs/rfcs/done/0059-profile-hrmax-typed-hr-path.md#grounding */
export const HR_MAX_FORMULA_INTERCEPT = 208

/** 0.7 — bpm of HRmax lost per year of age in the same formula (Tanaka 2001; within-person 0.7 bpm/yr, Gellish 2007), see tekio.rfcs/rfcs/done/0059-profile-hrmax-typed-hr-path.md#grounding */
export const HR_MAX_FORMULA_SLOPE = 0.7

/** Whole years from `birthDate` to `date`; null without a birth date, or for one not yet reached. */
export function ageAt(birthDate: string | null | undefined, date: string = today()): number | null {
  if (!birthDate || birthDate > date) return null
  const b = new Date(`${birthDate}T00:00:00Z`)
  const d = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(b.getTime()) || Number.isNaN(d.getTime())) return null
  const age = d.getUTCFullYear() - b.getUTCFullYear()
  const beforeBirthday =
    d.getUTCMonth() < b.getUTCMonth() || (d.getUTCMonth() === b.getUTCMonth() && d.getUTCDate() < b.getUTCDate())
  return beforeBirthday ? age - 1 : age
}

/** The age estimate, rounded to a whole bpm; null without a birth date. */
export function formulaHrMax(birthDate: string | null | undefined, date: string = today()): number | null {
  const age = ageAt(birthDate, date)
  return age == null ? null : Math.round(HR_MAX_FORMULA_INTERCEPT - HR_MAX_FORMULA_SLOPE * age)
}

/**
 * The HRmax the app divides by: the number the user set — typed, or the
 * tracker peak they accepted — else the age estimate from their birth date,
 * else null, and the typed-HR path stays off.
 */
export function resolveHrMax(stored: number | null | undefined, birthDate: string | null | undefined, date: string = today()): number | null {
  if (stored != null && stored > 0) return stored
  return formulaHrMax(birthDate, date)
}

/**
 * The tracker peak the Profile offers: the observed peak when the user has
 * no stored number, or when it sits more than {@link HR_MAX_REPLICATION_BPM}
 * bpm above the one they have — offered again every time a higher one
 * repeats. A lower peak is never proposed, and the estimate never blocks one.
 */
export function hrMaxProposal(observed: ObservedHrMax | null, stored: number | null | undefined): ObservedHrMax | null {
  if (observed == null) return null
  if (stored == null || stored <= 0) return observed
  return observed.value > stored + HR_MAX_REPLICATION_BPM ? observed : null
}
