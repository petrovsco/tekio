import { describe, it, expect } from 'vitest'
import {
  daysBetween, muscleStates, rankMuscleGaps, qualityStates, systemicReadiness,
  donationStatus, waterStatus, fusedVerdict, powerSetCount, HISTORY_WEEKS,
  muscleWeeklySets, muscleSources, muscleQualityMix,
} from '../lib/fusedRead'
import { PUSH_THRESHOLD, RECOVER_DAYS, MUSCLE_WINDOW_DAYS, MUSCLE_SET_TARGET } from '../constants/app'
import type {
  WeightEntry, CardioEntry, SportEntry, SleepEntry, DonationEntry, WaterEntry,
  ExerciseMuscleLink, MuscleGroup,
} from '../types'

const TODAY = '2026-08-30'

/** YYYY-MM-DD `n` days before TODAY. */
function ago(n: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

const weight = (date: string, exercise: string, nSets = 3): WeightEntry => ({
  id: `${date}-${exercise}`,
  date,
  exercise,
  sets: Array.from({ length: nSets }, () => ({ weight: 50, reps: 10 })),
})

const link = (
  exercise: string, group: string, level: 1 | 2 | 3 = 1,
  contribution: 'stimulus' | 'recovery' = 'stimulus',
): ExerciseMuscleLink => ({ exercise, group, region: 'upper', level, contribution })

const GROUPS: MuscleGroup[] = [
  { id: 'arms', name: 'Arms', bodyRegion: 'upper' },
  { id: 'chest', name: 'Chest', bodyRegion: 'upper' },
  { id: 'biceps', name: 'Biceps', bodyRegion: 'upper', parentId: 'arms' },
  { id: 'triceps', name: 'Triceps', bodyRegion: 'upper', parentId: 'arms' },
]

// ---------------------------------------------------------------------------
// daysBetween
// ---------------------------------------------------------------------------

describe('daysBetween', () => {
  it('counts whole days between date strings', () => {
    expect(daysBetween('2026-08-28', TODAY)).toBe(2)
    expect(daysBetween(TODAY, TODAY)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// muscleStates
// ---------------------------------------------------------------------------

describe('muscleStates', () => {
  const links = [link('Curls', 'Biceps', 1), link('Curls', 'Triceps', 2)]

  it('weights sets by link level within the cycle window', () => {
    const states = muscleStates([weight(ago(5), 'Curls', 4)], links, GROUPS, TODAY)
    expect(states.find(m => m.name === 'Biceps')?.sets).toBe(4)
    expect(states.find(m => m.name === 'Triceps')?.sets).toBe(2) // level 2 → ×0.5
  })

  it('excludes sets outside the window but keeps them for recency', () => {
    const states = muscleStates([weight(ago(MUSCLE_WINDOW_DAYS + 5), 'Curls')], links, GROUPS, TODAY)
    const biceps = states.find(m => m.name === 'Biceps')
    expect(biceps?.sets).toBe(0)
    expect(biceps?.daysSince).toBe(MUSCLE_WINDOW_DAYS + 5)
  })

  it('judges the fill over MUSCLE_WINDOW_DAYS, not the program cycle (039 S12)', () => {
    const states = muscleStates([
      weight(ago(MUSCLE_WINDOW_DAYS - 1), 'Curls', 3), // last day inside the window
      weight(ago(MUSCLE_WINDOW_DAYS), 'Curls', 5),     // first day outside it
    ], links, GROUPS, TODAY)
    const biceps = states.find(m => m.name === 'Biceps')
    expect(biceps?.sets).toBe(3)
    expect(biceps?.fillFraction).toBe(+(3 / MUSCLE_SET_TARGET).toFixed(3))
  })

  it('marks a never-trained muscle with null recency', () => {
    const chest = muscleStates([weight(ago(5), 'Curls')], links, GROUPS, TODAY)
      .find(m => m.name === 'Chest')
    expect(chest?.daysSince).toBeNull()
    expect(chest?.sets).toBe(0)
    expect(chest?.recovering).toBe(false)
  })

  it('flags a freshly hit muscle as recovering', () => {
    const states = muscleStates([weight(ago(RECOVER_DAYS - 1), 'Curls')], links, GROUPS, TODAY)
    expect(states.find(m => m.name === 'Biceps')?.recovering).toBe(true)
    const later = muscleStates([weight(ago(RECOVER_DAYS), 'Curls')], links, GROUPS, TODAY)
    expect(later.find(m => m.name === 'Biceps')?.recovering).toBe(false)
  })

  it('ignores recovery-contribution links', () => {
    const states = muscleStates(
      [weight(ago(1), 'Dead Hang')],
      [link('Dead Hang', 'Chest', 1, 'recovery')],
      GROUPS, TODAY,
    )
    expect(states.find(m => m.name === 'Chest')?.daysSince).toBeNull()
  })

  it('gives a level-3 link no sets and no recency (zero-weight tier, roadmap 042)', () => {
    const states = muscleStates(
      [weight(ago(1), 'Pull-ups', 4)],
      [link('Pull-ups', 'Biceps', 2), link('Pull-ups', 'Triceps', 3)],
      GROUPS, TODAY,
    )
    expect(states.find(m => m.name === 'Biceps')?.sets).toBe(2)
    const triceps = states.find(m => m.name === 'Triceps')
    expect(triceps?.sets).toBe(0)
    expect(triceps?.daysSince).toBeNull()
    expect(triceps?.recovering).toBe(false)
  })

  it('marks childless top-level groups as leaves, parents not', () => {
    const states = muscleStates([], [], GROUPS, TODAY)
    expect(states.find(m => m.name === 'Chest')?.leaf).toBe(true)
    expect(states.find(m => m.name === 'Arms')?.leaf).toBe(false)
    expect(states.find(m => m.name === 'Biceps')?.leaf).toBe(true)
  })
})

describe('rankMuscleGaps', () => {
  it('ranks never-trained first, then fewest sets, leaves only', () => {
    const weights = [
      weight(ago(3), 'Curls', 8),      // biceps 8 sets
      weight(ago(20), 'Extensions', 2), // triceps 2 sets
    ]
    const links = [link('Curls', 'Biceps'), link('Extensions', 'Triceps')]
    const ranked = rankMuscleGaps(muscleStates(weights, links, GROUPS, TODAY))
    expect(ranked.map(m => m.name)).toEqual(['Chest', 'Triceps', 'Biceps'])
  })
})

describe('powerSetCount', () => {
  it('counts sets classified as power via keyword default or override, in window only', () => {
    const weights = [
      weight(ago(3), 'Box Jump', 4),                  // keyword default → power
      weight(ago(3), 'Curls', 5),                     // 10 reps → not power
      weight(ago(MUSCLE_WINDOW_DAYS + 1), 'Box Jump'), // outside the window
    ]
    expect(powerSetCount(weights, undefined, TODAY)).toBe(4)
    expect(powerSetCount(weights, { curls: 'power' }, TODAY)).toBe(9)
  })
})

// ---------------------------------------------------------------------------
// The drill-in trio: weekly volume, sources, quality mix
// ---------------------------------------------------------------------------

describe('muscleWeeklySets', () => {
  it('buckets level-weighted sets into history weeks, most recent last', () => {
    const links = [link('Curls', 'Biceps'), link('Rows', 'Biceps', 2)]
    const weights = [
      weight(TODAY, 'Curls', 3),                    // last week
      weight(ago(6), 'Rows', 4),                    // last week, ×0.5 → 2
      weight(ago(7), 'Curls', 2),                   // week 5
      weight(ago(HISTORY_WEEKS * 7 - 1), 'Curls'),  // first week of the history
      weight(ago(HISTORY_WEEKS * 7), 'Curls', 8),   // outside
    ]
    expect(muscleWeeklySets(weights, links, 'Biceps', TODAY)).toEqual([3, 0, 0, 0, 2, 5])
  })

  it('draws history past the fill window — the bars are not the claim (039 §6.6)', () => {
    const links = [link('Curls', 'Biceps')]
    const weights = [weight(ago(MUSCLE_WINDOW_DAYS + 1), 'Curls', 4)]
    expect(muscleWeeklySets(weights, links, 'Biceps', TODAY).reduce((s, n) => s + n, 0)).toBe(4)
    expect(muscleStates(weights, links, GROUPS, TODAY).find(m => m.name === 'Biceps')?.sets).toBe(0)
  })

  it('ignores exercises that do not feed the muscle', () => {
    const weights = [weight(ago(1), 'Squats', 5)]
    expect(muscleWeeklySets(weights, [link('Squats', 'Quads')], 'Biceps', TODAY))
      .toEqual([0, 0, 0, 0, 0, 0])
  })
})

describe('muscleSources', () => {
  const links = [link('Curls', 'Biceps'), link('Rows', 'Biceps', 2)]

  it('ranks by recency, counts window volume, carries the last scheme', () => {
    const weights = [
      weight(ago(10), 'Curls', 3),
      weight(ago(2), 'Rows', 4),
      weight(ago(5), 'Curls', 2),
      weight(ago(1), 'Squats', 5), // feeds another muscle
    ]
    const src = muscleSources(weights, [...links, link('Squats', 'Quads')], 'Biceps', TODAY)
    expect(src.map(s => s.exercise)).toEqual(['Rows', 'Curls'])
    expect(src[0].windowSets).toBe(2)  // 4 sets × 0.5
    expect(src[1].windowSets).toBe(5)  // 3 + 2 direct sets
    expect(src[1].lastDate).toBe(ago(5))
    expect(src[1].lastSets).toHaveLength(2)
  })

  it('keeps an out-of-window exercise as a repeatable scheme with zero window volume', () => {
    const src = muscleSources([weight(ago(MUSCLE_WINDOW_DAYS + 10), 'Curls', 3)], links, 'Biceps', TODAY)
    expect(src).toHaveLength(1)
    expect(src[0].windowSets).toBe(0)
    expect(src[0].lastSets).toHaveLength(3)
  })

  it('returns empty for a never-fed muscle', () => {
    expect(muscleSources([weight(ago(1), 'Curls')], links, 'Chest', TODAY)).toEqual([])
  })

  it('lists no source and no weekly sets for a level-3 link (roadmap 042)', () => {
    const weights = [weight(ago(1), 'Pull-ups', 4)]
    const withStabiliser = [...links, link('Pull-ups', 'Biceps', 3)]
    expect(muscleSources(weights, withStabiliser, 'Biceps', TODAY)).toEqual([])
    expect(muscleWeeklySets(weights, withStabiliser, 'Biceps', TODAY).reduce((s, n) => s + n, 0)).toBe(0)
  })
})

describe('muscleQualityMix', () => {
  it('classifies weighted sets by rep range, override-aware', () => {
    const links = [link('Curls', 'Biceps'), link('Rows', 'Biceps', 2)]
    const weights: WeightEntry[] = [
      { id: 'a', date: ago(1), exercise: 'Curls', sets: [{ weight: 50, reps: 3 }, { weight: 40, reps: 12 }] },
      { id: 'b', date: ago(2), exercise: 'Rows', sets: [{ weight: 60, reps: 20 }, { weight: 60, reps: 20 }] },
      { id: 'c', date: ago(MUSCLE_WINDOW_DAYS), exercise: 'Curls', sets: [{ weight: 50, reps: 3 }] }, // outside
    ]
    // The 20-rep row sets sit in the hypertrophy/endurance overlap (039 S11),
    // so they count toward both; at level 2 the pair weighs 1.
    expect(muscleQualityMix(weights, links, 'Biceps', undefined, TODAY)).toEqual({
      strength: 1, hypertrophy: 2, muscular_endurance: 1, power: 0,
    })
    expect(muscleQualityMix(weights, links, 'Biceps', { curls: 'power' }, TODAY)).toEqual({
      strength: 0, hypertrophy: 1, muscular_endurance: 1, power: 2,
    })
  })
})

// ---------------------------------------------------------------------------
// qualityStates
// ---------------------------------------------------------------------------

describe('qualityStates', () => {
  const cardioAt = (date: string, extra: Partial<CardioEntry> = {}): CardioEntry => ({
    id: date, date, type: 'Running', duration: 40, ...extra,
  })
  const sportAt = (date: string, duration?: number): SportEntry => ({
    id: date, date, sport: 'Tennis', withTrainer: false, quality: 4, notes: '', duration,
  })

  it('reads all three as never/stale with no sessions', () => {
    for (const q of qualityStates([], [], TODAY)) {
      expect(q.daysSince).toBeNull()
      expect(q.stale).toBe(true)
    }
  })

  it('feeds endurance from a long duration-classified session', () => {
    const qs = qualityStates([cardioAt(ago(3))], [], TODAY)
    const endurance = qs.find(q => q.key === 'endurance')
    expect(endurance?.daysSince).toBe(3)
    expect(endurance?.stale).toBe(false)
    expect(qs.find(q => q.key === 'vo2max')?.stale).toBe(true)
  })

  it('flips stale exactly past the window', () => {
    const at = (n: number) =>
      qualityStates([cardioAt(ago(n))], [], TODAY).find(q => q.key === 'endurance')
    expect(at(14)?.stale).toBe(false)
    expect(at(15)?.stale).toBe(true)
  })

  it('feeds multiple qualities from one Training-Effect session', () => {
    const hard = cardioAt(ago(2), {
      aerobicTe: 3.1, anaerobicTe: 2.5, trainingEffectLabel: 'VO2MAX',
    })
    const qs = qualityStates([hard], [], TODAY)
    expect(qs.find(q => q.key === 'vo2max')?.daysSince).toBe(2)
    expect(qs.find(q => q.key === 'anaerobic_capacity')?.daysSince).toBe(2)
    expect(qs.find(q => q.key === 'endurance')?.daysSince).toBeNull()
  })

  it('counts a sport session without duration as vo2max', () => {
    const qs = qualityStates([], [sportAt(ago(4))], TODAY)
    expect(qs.find(q => q.key === 'vo2max')?.daysSince).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// systemicReadiness
// ---------------------------------------------------------------------------

const night = (date: string, score?: number, hrv?: number): SleepEntry => ({
  id: date, date, hours: 7.5, score, hrv, source: 'garmin',
})

describe('systemicReadiness', () => {
  it('scores 50/50 sleep + HRV, with a steady HRV series at baseline (50)', () => {
    const sleep = Array.from({ length: 10 }, (_, i) => night(ago(i), 70, 80))
    const r = systemicReadiness(sleep, TODAY)
    expect(r.basis).toBe('sleep+hrv')
    expect(r.hrvScore).toBe(50)
    expect(r.readiness).toBe(60) // (70 + 50) / 2
    expect(r.hrv).toBe(80)
  })

  it('gates on a sustained HRV drop plus poor sleep', () => {
    const sleep = [
      ...Array.from({ length: 3 }, (_, i) => night(ago(i), 52, 60)),
      ...Array.from({ length: 27 }, (_, i) => night(ago(i + 3), 75, 80)),
    ]
    const r = systemicReadiness(sleep, TODAY)
    expect(r.hrvScore).toBeLessThan(20)
    expect(r.readiness).toBeLessThan(PUSH_THRESHOLD)
  })

  it('barely moves on a single bad night', () => {
    const sleep = [
      night(ago(0), 73, 60),
      ...Array.from({ length: 20 }, (_, i) => night(ago(i + 1), 73, 80)),
    ]
    const r = systemicReadiness(sleep, TODAY)
    expect(r.readiness).toBeGreaterThan(PUSH_THRESHOLD)
  })

  it('degrades to sleep-only without an HRV baseline', () => {
    const sleep = [night(ago(0), 73, 80), night(ago(1), 80, 82)] // only 2 samples
    const r = systemicReadiness(sleep, TODAY)
    expect(r.basis).toBe('sleep')
    expect(r.readiness).toBe(73)
    expect(r.hrvScore).toBeNull()
    expect(r.hrv).toBe(80) // raw value still surfaces for the gate card
  })

  it('returns none when the last night is too old', () => {
    const sleep = Array.from({ length: 10 }, (_, i) => night(ago(i + 2), 70, 80))
    const r = systemicReadiness(sleep, TODAY)
    expect(r.basis).toBe('none')
    expect(r.readiness).toBeNull()
  })

  it('returns none with no data at all', () => {
    expect(systemicReadiness([], TODAY).readiness).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// donationStatus + waterStatus
// ---------------------------------------------------------------------------

const donation = (date: string, type: 'Full Blood' | 'Plasma' = 'Full Blood'): DonationEntry => ({
  id: date, date, type, notes: '',
})

describe('donationStatus', () => {
  it('holds inside 48 h, suppresses aerobically inside 21 d', () => {
    const acute = donationStatus([donation(ago(1))], TODAY)
    expect(acute.acuteHold).toBe(true)
    expect(acute.aerobicSuppressed).toBe(true)

    const tail = donationStatus([donation(ago(12))], TODAY)
    expect(tail.acuteHold).toBe(false)
    expect(tail.aerobicSuppressed).toBe(true)
    expect(tail.eligibleInDays).toBe(44) // 56 − 12

    const past = donationStatus([donation(ago(22))], TODAY)
    expect(past.aerobicSuppressed).toBe(false)
  })

  it('never suppresses for plasma, but still counts eligibility', () => {
    const s = donationStatus([donation(ago(1), 'Plasma')], TODAY)
    expect(s.daysSince).toBeNull()
    expect(s.acuteHold).toBe(false)
    expect(s.aerobicSuppressed).toBe(false)
    expect(s.eligibleInDays).toBe(13) // plasma interval 14 − 1
  })

  it('is clear with no donations', () => {
    const s = donationStatus([], TODAY)
    expect(s.daysSince).toBeNull()
    expect(s.eligibleInDays).toBe(0)
  })
})

describe('waterStatus', () => {
  const water = (date: string, amountMl: number): WaterEntry => ({ id: `${date}-${amountMl}`, date, amountMl })

  it('sums the most recent logged day and reports staleness', () => {
    const s = waterStatus([water(ago(15), 400), water(ago(15), 300), water(ago(40), 2000)], TODAY)
    expect(s.daysSince).toBe(15)
    expect(s.lastDayMl).toBe(700)
  })

  it('is null when never logged', () => {
    expect(waterStatus([], TODAY).daysSince).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// fusedVerdict
// ---------------------------------------------------------------------------

describe('fusedVerdict', () => {
  it('holds below the push threshold, pushes at it', () => {
    expect(fusedVerdict(PUSH_THRESHOLD - 1)).toEqual({ mode: 'hold', cause: 'readiness' })
    expect(fusedVerdict(PUSH_THRESHOLD)).toEqual({ mode: 'push', cause: null })
  })

  it('cannot gate without readiness data', () => {
    expect(fusedVerdict(null).mode).toBe('push')
  })

  it('holds on an acute donation regardless of readiness', () => {
    const d = donationStatus([donation(ago(0))], TODAY)
    expect(fusedVerdict(90, d)).toEqual({ mode: 'hold', cause: 'donation' })
  })
})
