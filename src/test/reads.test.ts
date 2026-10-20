import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  homeRead, adaptationsRead, readinessRead, profileHrMax, muscleStates, systemicReadiness, fusedVerdict,
  donationStatus, readinessTrend, resolveHrMax, type ReadRows,
} from '@tekio/core'

// RFC 0094 step 2b: the three reads as whole answers. Every figure below is
// invented for the test; none is anyone's reading.

const DATE = '2026-10-20'

const rows: ReadRows = {
  weights: [
    { id: 'w1', date: '2026-10-18', exercise: 'Bench press', sets: [{ weight: 60, reps: 8 }, { weight: 60, reps: 8 }, { weight: 60, reps: 8 }] },
    { id: 'w2', date: '2026-10-12', exercise: 'Back squat', sets: [{ weight: 80, reps: 5 }, { weight: 80, reps: 5 }] },
  ],
  cardio: [{ id: 'c1', date: '2026-10-15', type: 'Indoor Rowing', duration: 30, avgHr: 150 }],
  sports: [],
  sleep: Array.from({ length: 20 }, (_, i) => ({
    id: `s${i}`, date: `2026-10-${String(20 - i).padStart(2, '0')}`, hours: 7, hrv: 50 + (i % 5), source: 'garmin' as const,
  })),
  donations: [{ id: 'd1', date: '2026-10-01', type: 'Full Blood', notes: '' }],
  readinessInputs: [],
  muscleGroups: [
    { id: 'chest', name: 'Chest', bodyRegion: 'upper' },
    { id: 'quads', name: 'Quadriceps', bodyRegion: 'lower' },
  ],
  exerciseMuscles: [
    { exercise: 'Bench press', group: 'Chest', region: 'upper', level: 1, contribution: 'stimulus' },
    { exercise: 'Back squat', group: 'Quadriceps', region: 'lower', level: 1, contribution: 'stimulus' },
  ],
  exerciseAdaptations: {},
  adaptationTargets: {},
  hrMax: 190,
  readinessMethod: null,
}

afterEach(() => { vi.useRealTimers() })

describe('the reads are the screens\' compositions, written once', () => {
  it('Home is the muscle, readiness and donation calls it always made', () => {
    const home = homeRead(rows, DATE)
    expect(home.muscles).toEqual(muscleStates(rows.weights, rows.exerciseMuscles, rows.muscleGroups, DATE))
    expect(home.readiness).toEqual(systemicReadiness(rows.sleep, DATE, rows.readinessInputs, null))
    expect(home.donation).toEqual(donationStatus(rows.donations, DATE))
    expect(home.verdict).toEqual(fusedVerdict(home.readiness.band, home.donation))
    expect(home.gaps.map(g => g.name)).toContain('Quadriceps')
  })

  it('never reads the clock: a server on another day gives the same answer', () => {
    const local = homeRead(rows, DATE)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-12-31T23:00:00Z'))
    expect(homeRead(rows, DATE)).toEqual(local)
    expect(adaptationsRead(rows, 'strength', DATE).coverage).toEqual(local.coverage)
    expect(readinessRead(rows, DATE).readiness).toEqual(local.readiness)
  })

  it('Adaptations counts each set and each session once over the window', () => {
    const read = adaptationsRead(rows, 'hypertrophy', DATE)
    expect(read.liftingSets).toBe(5)
    expect(read.cardioSessions).toBe(1)
    expect(read.quality).toBe('hypertrophy')
  })

  it('the readiness sheet carries the trend for the method it reads', () => {
    const read = readinessRead(rows, DATE)
    const method = read.readiness.method ?? read.readiness.chosen
    expect(method).not.toBeNull()
    expect(read.trend).toEqual(readinessTrend(method!, rows.sleep, rows.readinessInputs, DATE))
  })

  it('a stored HRmax counts only with its source, else the age estimate', () => {
    expect(profileHrMax({ hrMaxStored: 188, hrMaxSource: 'typed', birthDate: null }, DATE)).toBe(188)
    expect(profileHrMax({ hrMaxStored: 188, hrMaxSource: null, birthDate: '1990-01-01' }, DATE))
      .toBe(resolveHrMax(null, '1990-01-01', DATE))
  })
})
