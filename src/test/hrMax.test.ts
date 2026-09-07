import { describe, it, expect } from 'vitest'
import { observedHrMax, resolveHrMax, HR_MAX_WINDOW_MONTHS, HR_MAX_REPLICATION_BPM } from '../lib/hrMax'
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

describe('resolveHrMax — the typed override, and when the heart overrules it', () => {
  const observed = { value: 196, date: '2024-10-25', label: 'Indoor Rowing' }
  it('the override stands unless a synced peak exceeds it by more than 3 bpm', () => {
    expect(resolveHrMax(observed, 200)).toBe(200)
    expect(resolveHrMax(observed, 193)).toBe(193)
    expect(resolveHrMax(observed, 192)).toBe(196)
    expect(resolveHrMax(null, 185)).toBe(185)
  })
  it('without an override the observed peak is the number; without either there is none', () => {
    expect(resolveHrMax(observed, null)).toBe(196)
    expect(resolveHrMax(observed, undefined)).toBe(196)
    expect(resolveHrMax(null, null)).toBeNull()
    expect(resolveHrMax(observed, 0)).toBe(196)
  })
})
