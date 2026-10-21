// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { homeRead, adaptationsRead, readinessRead, MUSCLE_QUALITIES, type ReadRows } from '@tekio/core'
import { HomeBody, AdaptationsBody, ReadinessBody } from '../../packages/api/src/readShapes'

// RFC 0094: the OpenAPI description of the three reads names every field they
// return. The build already fails when a schema lacks a field its core type
// has; this is the other direction, against real answers: parsing strips
// anything undescribed, so an answer that comes back changed went undescribed.
// Every figure is invented for the test.

const DATE = '2026-10-20'
const day = (n: number) => `2026-10-${String(20 - n).padStart(2, '0')}`

const rows: ReadRows = {
  weights: [
    { id: 'w1', date: day(2), exercise: 'Bench press', sets: [{ weight: 60, reps: 8 }, { weight: 60, reps: 8 }, { weight: 60, reps: 8 }] },
    { id: 'w2', date: day(8), exercise: 'Back squat', sets: [{ weight: 80, reps: 5 }, { weight: 80, reps: 5 }] },
  ],
  cardio: [{ id: 'c1', date: day(5), type: 'Indoor Rowing', duration: 30, avgHr: 150 }],
  sports: [{ id: 'sp1', date: day(3), sport: 'Volleyball', withTrainer: false, quality: 4, notes: '', duration: 90 }],
  sleep: Array.from({ length: 19 }, (_, i) => ({
    id: `s${i}`, date: day(i), hours: 7, score: 70, hrv: 50 + (i % 5), restingHr: 52, source: 'garmin' as const,
  })),
  donations: [{ id: 'd1', date: day(1), type: 'Full Blood', notes: '' }],
  readinessInputs: [{ id: 'r1', date: DATE, checkIn: { energy: 4, soreness: 2, sleepQuality: 3, stress: 2, mood: 4 } }],
  muscleGroups: [
    { id: 'chest', name: 'Chest', bodyRegion: 'upper' },
    { id: 'upper-chest', name: 'Upper chest', bodyRegion: 'upper', parentId: 'chest' },
    { id: 'quads', name: 'Quadriceps', bodyRegion: 'lower' },
  ],
  exerciseMuscles: [
    { exercise: 'Bench press', group: 'Chest', region: 'upper', level: 1, contribution: 'stimulus' },
    { exercise: 'Bench press', group: 'Upper chest', region: 'upper', level: 2, contribution: 'stimulus' },
    { exercise: 'Back squat', group: 'Quadriceps', region: 'lower', level: 1, contribution: 'stimulus' },
  ],
  exerciseAdaptations: {},
  adaptationTargets: {},
  hrMax: 190,
  readinessMethod: null,
}

const roundTrip = (schema: { parse(v: unknown): unknown }, value: unknown) =>
  expect(schema.parse(JSON.parse(JSON.stringify(value)))).toEqual(JSON.parse(JSON.stringify(value)))

describe('the reads’ OpenAPI shapes', () => {
  it('describe every field of Home', () => {
    const home = homeRead(rows, DATE)
    expect(home.coverage.strength.muscles.some(m => m.children.length > 0)).toBe(true)
    roundTrip(HomeBody, home)
  })

  it('describe every field of Adaptations, for each quality', () => {
    for (const q of MUSCLE_QUALITIES) roundTrip(AdaptationsBody, adaptationsRead(rows, q, DATE))
  })

  it('describe every field of the readiness sheet, for each method', () => {
    for (const method of ['overnight_hrv', 'morning_hrv', 'check_in'] as const) {
      const read = readinessRead({ ...rows, readinessMethod: method }, DATE)
      roundTrip(ReadinessBody, read)
    }
    expect(readinessRead(rows, DATE).trend?.days.length).toBeGreaterThan(0)
  })
})
