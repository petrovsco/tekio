import { describe, it, expect } from 'vitest'
import { homeRead, homeView, mapCallouts, zoneFills, BODY_MAP, MAPPED_MUSCLES, muscleShort, type ReadRows } from '@tekio/core'

// RFC 0096: what Home prints, written once for every client. Every figure
// below is invented for the test; none is anyone's reading.

const DATE = '2026-10-20'

const rows: ReadRows = {
  weights: [
    { id: 'w1', date: '2026-10-18', exercise: 'Bench press', sets: [{ weight: 60, reps: 8 }, { weight: 60, reps: 8 }, { weight: 60, reps: 8 }] },
  ],
  cardio: [],
  sports: [],
  sleep: [],
  donations: [],
  readinessInputs: [],
  muscleGroups: [
    { id: 'chest', name: 'Chest', bodyRegion: 'upper' },
    { id: 'quads', name: 'Quadriceps', bodyRegion: 'lower' },
    { id: 'hams', name: 'Hamstrings', bodyRegion: 'lower' },
  ],
  exerciseMuscles: [
    { exercise: 'Bench press', group: 'Chest', region: 'upper', level: 1, contribution: 'stimulus' },
  ],
  exerciseAdaptations: {},
  adaptationTargets: {},
  hrMax: 190,
  readinessMethod: null,
}

const view = (r: ReadRows, bodyweight = null as { id: string; date: string; weight: number } | null) =>
  homeView(homeRead(r, DATE), r, '2026-10-19', bodyweight)

describe('Home prints one view on every client', () => {
  it('with nothing logged it says so, and points at nothing', () => {
    const v = view({ ...rows, weights: [] })
    expect(v.zeroData).toBe(true)
    expect(v.verdict.text).toBe('Nothing logged yet.')
    expect(v.map.callouts).toEqual([])
    expect(v.qualities.line).toBe('All seven qualities — no data yet.')
    expect(v.wholeBody.every(t => t.step === null && t.edge === 'blank')).toBe(true)
  })

  it('a push day names its two largest gaps, in the verdict and on the map', () => {
    const v = view(rows)
    expect(v.verdict.text).toBe('Push. Hams and quads are the gap.')
    expect(v.verdict.sub).toContain('Hams: never trained.')
    expect(v.map.callouts.map(c => c.label)).toEqual(['1 · HAMS', '2 · QUADS', '3 · CHEST'])
    expect(v.map.callouts[0].sub).toBe('never trained')
    expect(v.readiness.gated).toBe(false)
    expect(v.readinessLabel).toBe('no readiness data')
  })

  it('the fold tiles read the latest weigh-in and the donation record', () => {
    const v = view({ ...rows, donations: [{ id: 'd1', date: '2026-10-19', type: 'Full Blood', notes: '' }] },
      { id: 'b1', date: '2026-10-19', weight: 70.25 })
    expect(v.folds[0]).toMatchObject({ kind: 'weight', value: '70.3 kg', note: 'yesterday' })
    expect(v.folds[1]).toMatchObject({ kind: 'blood', note: '48 h hold', accent: true })
    expect(v.verdict.text).toBe('Hold. Walk or mobility only.')
    expect(v.readiness.gated).toBe(true)
    expect(v.banner).toContain('48 h acute window')
  })

  it('a callout prints the unit it is given', () => {
    const gaps = homeRead(rows, DATE).gaps
    expect(mapCallouts(gaps, 'sessions')[0].sub).toBe('never trained')
  })
})

describe('the body map is one geometry for every client', () => {
  it('every muscle a callout can point at has a name and a zone to point into', () => {
    const zoned = new Set([...BODY_MAP.front, ...BODY_MAP.back].map(z => z.muscle))
    for (const m of MAPPED_MUSCLES) {
      expect(zoned.has(m), m).toBe(true)
      expect(muscleShort(m), m).toMatch(/^[A-Z ]+$/)
    }
  })
})

describe('each zone of the map arrives already filled', () => {
  it('a zone with no sets of its own follows a trained parent, and no data leaves every zone blank', () => {
    const child = [...BODY_MAP.front, ...BODY_MAP.back].find(z => z.parent && z.parent !== z.muscle)!
    const parent = { name: child.parent, sets: 12, fillFraction: 0.5, recovering: true }
    const fills = zoneFills([parent] as never, false)
    expect(fills.find(f => f.muscle === child.muscle)).toEqual({ muscle: child.muscle, step: 2, recovering: true, pick: child.parent })
    expect(new Set(fills.map(f => f.muscle)).size).toBe(fills.length)
    expect(zoneFills([parent] as never, true).every(f => f.step === null && !f.recovering)).toBe(true)
  })
})
