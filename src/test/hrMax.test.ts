import { describe, it, expect } from 'vitest'
import {
  observedHrMax, resolveHrMax, formulaHrMax, ageAt, hrMaxProposal,
  HR_MAX_WINDOW_MONTHS, HR_MAX_REPLICATION_BPM, HR_MAX_FORMULA_INTERCEPT, HR_MAX_FORMULA_SLOPE,
} from '../lib/hrMax'
import type { CardioEntry, SportEntry } from '../types'

const row = (date: string, maxHr: number | undefined, type: CardioEntry['type'] = 'Indoor Rowing'): CardioEntry =>
  ({ id: `${date}-${maxHr}`, date, type, duration: 40, maxHr })
const match = (date: string, maxHr: number): SportEntry =>
  ({ id: `t-${date}`, date, sport: 'Tennis', withTrainer: false, quality: 3, notes: '', maxHr })

describe('observedHrMax — the replicated peak (059)', () => {
  const TODAY = '2026-09-07'
  // the user's own top readings on 2026-09-07: 214 and 200 are singleton runs,
  // 196 / 195 / 192 a rowing cluster.
  const peter = [
    row('2023-07-02', 214, 'Running'), row('2023-12-17', 200, 'Running'),
    row('2024-10-25', 196), row('2025-03-04', 195), row('2025-04-01', 192), row('2026-08-28', 189, 'Running'),
  ]
  it('is the highest peak a second session comes within 3 bpm of, never the single highest reading', () => {
    expect(HR_MAX_REPLICATION_BPM).toBe(3)
    expect(observedHrMax(peter, [], TODAY)).toEqual({ value: 196, date: '2024-10-25', label: 'Indoor Rowing' })
    expect(observedHrMax([row('2026-01-01', 200), row('2026-02-01', 190)], [], TODAY)).toBeNull()
    expect(observedHrMax([row('2026-01-01', 200), row('2026-02-01', 197)], [], TODAY)?.value).toBe(200)
  })
  it('reads a rolling 24-month window: once the cluster ages out, 191 stands', () => {
    expect(HR_MAX_WINDOW_MONTHS).toBe(24)
    const rows = [...peter, row('2025-11-07', 191), row('2025-12-05', 191)]
    expect(observedHrMax(rows, [], TODAY)?.value).toBe(196)
    expect(observedHrMax(rows, [], '2027-11-01')?.value).toBe(191)
    expect(observedHrMax(rows, [], '2024-10-25')).toBeNull()
  })
  it('one row is never a maximum, a future-dated row is ignored, and a swim never sets the number', () => {
    expect(observedHrMax([row('2026-01-01', 196)], [], TODAY)).toBeNull()
    expect(observedHrMax([row('2026-01-01', 196), row('2026-12-01', 195)], [], TODAY)).toBeNull()
    expect(observedHrMax([
      row('2026-01-01', 190, 'Swimming'), row('2026-02-01', 189, 'Swimming'), row('2026-03-01', 180), row('2026-04-01', 178),
    ], [], TODAY)?.value).toBe(180)
    expect(observedHrMax([row('2026-01-01', undefined), row('2026-02-01', undefined)], [], TODAY)).toBeNull()
  })
  it('a synced match counts — tennis is played on land', () => {
    expect(observedHrMax([row('2026-01-01', 172)], [match('2026-02-01', 173)], TODAY))
      .toEqual({ value: 173, date: '2026-02-01', label: 'Tennis' })
  })
})

describe('formulaHrMax — the age estimate (060)', () => {
  it('is Tanaka, 208 − 0.7 × age, rounded: 184 at 35, 180 at 40, 194 at 20', () => {
    expect(HR_MAX_FORMULA_INTERCEPT).toBe(208)
    expect(HR_MAX_FORMULA_SLOPE).toBe(0.7)
    expect(formulaHrMax('1991-03-10', '2026-09-07')).toBe(184)
    expect(formulaHrMax('1986-09-07', '2026-09-07')).toBe(180)
    expect(formulaHrMax('2006-01-01', '2026-09-07')).toBe(194)
  })
  it('counts whole years — the day before a birthday is still the younger age', () => {
    expect(ageAt('1991-09-08', '2026-09-07')).toBe(34)
    expect(ageAt('1991-09-07', '2026-09-07')).toBe(35)
    expect(ageAt('1991-09-06', '2026-09-07')).toBe(35)
  })
  it('has nothing to say without a birth date, or for one in the future', () => {
    expect(formulaHrMax(null, '2026-09-07')).toBeNull()
    expect(formulaHrMax(undefined, '2026-09-07')).toBeNull()
    expect(formulaHrMax('', '2026-09-07')).toBeNull()
    expect(formulaHrMax('2027-01-01', '2026-09-07')).toBeNull()
    expect(formulaHrMax('not a date', '2026-09-07')).toBeNull()
  })
})

describe('resolveHrMax — the number the user set, else the estimate, else nothing (060)', () => {
  const BIRTH = '1991-03-10'
  it('a stored number wins over the estimate whatever its size', () => {
    expect(resolveHrMax(196, BIRTH, '2026-09-07')).toBe(196)
    expect(resolveHrMax(170, BIRTH, '2026-09-07')).toBe(170)
  })
  it('without one the birth date gives the estimate; without either there is none', () => {
    expect(resolveHrMax(null, BIRTH, '2026-09-07')).toBe(184)
    expect(resolveHrMax(undefined, BIRTH, '2026-09-07')).toBe(184)
    expect(resolveHrMax(0, BIRTH, '2026-09-07')).toBe(184)
    expect(resolveHrMax(null, null, '2026-09-07')).toBeNull()
  })
})

describe('hrMaxProposal — the tracker peak is offered, never imposed (060)', () => {
  const observed = { value: 196, date: '2024-10-25', label: 'Indoor Rowing' }
  it('is offered when the user has no stored number, whatever the estimate says', () => {
    expect(hrMaxProposal(observed, null)).toEqual(observed)
    expect(hrMaxProposal(observed, undefined)).toEqual(observed)
    expect(hrMaxProposal(observed, 0)).toEqual(observed)
  })
  it('is offered again only when it sits more than 3 bpm above the stored number', () => {
    expect(hrMaxProposal(observed, 192)).toEqual(observed)
    expect(hrMaxProposal(observed, 193)).toBeNull()
    expect(hrMaxProposal(observed, 196)).toBeNull()
    expect(hrMaxProposal(observed, 200)).toBeNull()
  })
  it('a lower peak is never proposed, and no peak proposes nothing', () => {
    expect(hrMaxProposal({ ...observed, value: 190 }, 196)).toBeNull()
    expect(hrMaxProposal(null, null)).toBeNull()
    expect(hrMaxProposal(null, 185)).toBeNull()
  })
})
