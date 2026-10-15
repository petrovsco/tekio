import { describe, it, expect } from 'vitest'
import { syncWhen, syncStale } from '../lib/syncWhen'

// Local-clock dates, as the phone reads them.
const at = (d: number, h: number, m: number) => new Date(2026, 9, d, h, m).toISOString()
const now = new Date(2026, 9, 15, 9, 30)

describe('syncWhen', () => {
  it('says just now inside a minute', () => {
    expect(syncWhen(new Date(2026, 9, 15, 9, 29, 30).toISOString(), now)).toBe('just now')
  })
  it('prints the clock for today', () => {
    expect(syncWhen(at(15, 8, 2), now)).toBe('08:02')
  })
  it('names yesterday by the calendar, not by 24 hours', () => {
    expect(syncWhen(at(14, 23, 50), now)).toBe('yesterday 23:50')
  })
  it('prints the day for anything older', () => {
    expect(syncWhen(at(12, 8, 0), now)).toBe('12 Oct')
  })
})

describe('syncStale', () => {
  it('is fresh within a day and stale after it', () => {
    expect(syncStale(at(14, 10, 0), now)).toBe(false)
    expect(syncStale(at(14, 8, 0), now)).toBe(true)
  })
})
