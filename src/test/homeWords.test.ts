import { describe, it, expect } from 'vitest'
import { verdictCopy, type MuscleState, type SystemicReadiness, type DonationStatus } from '@tekio/core'

// RFC 0099: Home's verdict words come from the core, so the API can send them
// to an assistant word for word. Every muscle state here is invented.

const muscle = (name: string, sets: number, daysSince: number | null, recovering = false): MuscleState =>
  ({ id: name, name, parentId: null, leaf: true, sets, daysSince, recovering, fillFraction: sets / 20 })
const sys = { method: 'overnight_hrv' } as SystemicReadiness
const noDonation = { daysSince: null, acuteHold: false, aerobicSuppressed: false } as DonationStatus

describe("Home's verdict words", () => {
  it('names the two largest gaps and how recent the last stimulus was', () => {
    const gaps = [muscle('Quadriceps', 0, null), muscle('Posterior Deltoid', 1.5, 6)]
    const states = [...gaps, muscle('Chest', 12, 2)]
    expect(verdictCopy({ zeroData: false, verdict: { mode: 'push', cause: null }, sys, don: noDonation, gaps, states }))
      .toEqual({
        text: 'Push. Quads and post delt are the gap.',
        sub: 'Quads: never trained. Post delt: 1.5 sets in 14 days. Nothing is sore — last stimulus 2 d ago.',
      })
  })

  it('holds the day inside a donation window, whatever the gaps', () => {
    const don = { daysSince: 1, acuteHold: true, aerobicSuppressed: true } as DonationStatus
    expect(verdictCopy({
      zeroData: false, verdict: { mode: 'hold', cause: 'donation' }, sys, don, gaps: [muscle('Quadriceps', 0, null)], states: [],
    })).toEqual({ text: 'Hold. Walk or mobility only.', sub: 'Full blood donation 1 d ago — the 48 h acute window gates the day.' })
  })

  it('says steady days are lighter before the gaps', () => {
    const states = [muscle('Chest', 4, 0, true)]
    const copy = verdictCopy({ zeroData: false, verdict: { mode: 'steady', cause: 'readiness' }, sys, don: noDonation, gaps: states, states })
    expect(copy.text).toBe('Steady. Chest is the gap.')
    expect(copy.sub).toBe('Lighter today: no intervals or max efforts. Chest: 4 sets in 14 days. Chest still recovering (2 days).')
  })
})
