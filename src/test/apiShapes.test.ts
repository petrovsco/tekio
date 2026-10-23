// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { homeRead, adaptationsRead, readinessRead, MUSCLE_QUALITIES, type ReadRows } from '@tekio/core'
import type { StartRows, StartSettings } from '@tekio/db'
import { HomeBody, AdaptationsBody, ReadinessBody } from '../../packages/api/src/readShapes'
import { StartBody } from '../../packages/api/src/start'

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

describe('the opening load’s OpenAPI shape', () => {
  it('describes every field the app opens with, synced and planned rows included', () => {
    const start: StartRows & StartSettings = {
      weights: [...rows.weights, { id: 'w3', date: DATE, exercise: 'Plank', sets: [{ weight: 0, reps: 1, seconds: 45 }], supersetId: 'g1' }],
      bodyweight: [{ id: 'b1', date: DATE, weight: 75 }],
      cardio: [{
        id: 'c2', date: DATE, type: 'Running', format: 'intervals', boutSeconds: 60, duration: 40, distance: 8, avgHr: 150,
        notes: 'tempo', source: 'garmin', garminActivityId: 1, elevationGain: 30, maxHr: 175, aerobicTe: 3.1,
        anaerobicTe: 1.2, trainingEffectLabel: 'TEMPO', trainingLoad: 90, zoneDistribution: [60, 600, 900, 600, 240],
      }],
      mobility: [{ id: 'm1', date: DATE, duration: 10, exercises: [{ name: 'Pigeon', duration: 10, notes: '', muscleGroups: ['Glutes'] }] }],
      muscleGroups: rows.muscleGroups,
      exerciseMuscles: rows.exerciseMuscles,
      exerciseAdaptations: { 'box jump': 'power' },
      sports: [...rows.sports, { id: 'sp2', date: DATE, sport: 'Tennis', withTrainer: true, quality: 5, notes: '', competitorNames: ['A'], result: 'win', teammateNames: [] }],
      sportTypes: [{ name: 'Tennis', hasCompetitor: true, hasTeammate: false }],
      donations: rows.donations,
      sleep: [...rows.sleep, { id: 's-q', date: DATE, hours: 7.5, quality: 4, notes: 'ok', scoreQualifier: 'GOOD' }],
      sauna: [{ id: 'sa1', date: DATE, duration: 15, tempC: 85, notes: '' }],
      cold: [{ id: 'co1', date: DATE, duration: 3 }],
      adaptationTargets: { strength: { weeklyMuscleTarget: 10, weeklySessionTarget: 2, weeklyMinutesTarget: 0 } },
      exerciseAliases: [{ alias: 'bench', canonicalName: 'Bench press', isOwn: true }],
      readinessInputs: [...rows.readinessInputs, { id: 'r2', date: day(1), morningHrv: 55 }],
      plans: [{ id: 'p1', date: DATE, exercise: 'Back squat', targets: [{ weight: 80, reps: 5 }], plannedBy: 'user', loggedAs: 'w2', supersetId: 'g2' }],
      sessionPlans: [
        { id: 'ps1', date: DATE, kind: 'cardio', name: 'Indoor Rowing', duration: 30, distance: 6, format: 'steady', plannedBy: 'agent', notes: '' },
        { id: 'ps2', date: DATE, kind: 'mobility', name: '', stretches: [{ name: 'Pigeon', duration: 5 }], plannedBy: 'user', loggedAs: 'm1' },
      ],
      profile: { weekStartDay: 'sunday', hrMaxStored: 190, hrMaxSource: 'tracker', birthDate: '1990-01-01', readinessMethod: 'check_in' },
      sections: [{ sectionKey: 'Weights', showInMenu: true, sortOrder: 0 }],
    }
    roundTrip(StartBody, start)
  })
})
