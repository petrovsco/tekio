import { describe, it, expect } from 'vitest'
import catalogue from '../../scripts/garmin-sync/activity_types.json'
import { CARDIO_TYPE_MAP } from '../constants/app'

// tekio.rfcs/rfcs/done/0073-garmin-sync-every-activity-type.md: every type in
// Garmin's catalogue is decided up front, so a sport never played before syncs
// on first play. The sync builds its three maps from this file; this test is
// what stops an entry from being added to it undecided, or decided twice.

type Entry = { typeKey: string; parent: string | null; cardio?: string; sport?: string; skip?: string; legacy?: string }
const types = catalogue.types as Entry[]
const reasons = catalogue.reasons as Record<string, string>

describe('Garmin activity-type catalogue', () => {
  it('decides every type exactly once — cardio, sport or skip', () => {
    for (const t of types) {
      const decisions = [t.cardio, t.sport, t.skip].filter(d => d !== undefined)
      expect(decisions, t.typeKey).toHaveLength(1)
    }
  })

  it('lists each type once', () => {
    const keys = types.map(t => t.typeKey)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('lands cardio only on a modality the app has, and only hiit by name', () => {
    const modalities = new Set(Object.values(CARDIO_TYPE_MAP))
    for (const t of types.filter(t => t.cardio)) {
      if (t.cardio === 'by_name') expect(t.typeKey).toBe('hiit')
      else expect(modalities.has(t.cardio!), `${t.typeKey} → ${t.cardio}`).toBe(true)
    }
  })

  it('gives every skip a written reason, and every sport a name', () => {
    for (const t of types.filter(t => t.skip)) expect(reasons[t.skip!], t.typeKey).toBeTruthy()
    for (const t of types.filter(t => t.sport)) expect(t.sport!.trim(), t.typeKey).toBe(t.sport)
  })

  it('keeps the decisions taken on 2026-09-27', () => {
    const by = new Map(types.map(t => [t.typeKey, t]))
    expect(by.get('tennis_v2')?.sport).toBe('Tennis')
    expect(by.get('volleyball')?.sport).toBe('Volleyball')
    expect(by.get('skating_ws')?.sport).toBe('Skating')
    expect(by.get('walking')?.skip).toBe('walking')
    expect(by.get('hiking')?.skip).toBe('walking')
    expect(by.get('strength_training')?.skip).toBe('strength')
  })
})
