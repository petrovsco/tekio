import { describe, it, expect } from 'vitest'
import {
  muscleStates, rankMuscleGaps, qualityStates, systemicReadiness,
  donationStatus, fusedVerdict, overnightHrvReading, bandForZ, HISTORY_WEEKS,
  morningHrvReading, checkInReading, checkInTotal, readinessNotes, autoReadinessMethod, overnightConnected,
  muscleWeeklySets, muscleSources, muscleQualityMix, muscleQualityStates, muscleWindow,
  type MuscleState, type MuscleQuality,
} from '../lib/fusedRead'
import { HRV_BAND_Z, RECOVER_DAYS, MUSCLE_WINDOW_DAYS, MUSCLE_SET_TARGET } from '../constants/app'
import type { TargetUnit } from '../lib/adaptations'
import type {
  Adaptation, WeightEntry, CardioEntry, SportEntry, SleepEntry, DonationEntry,
  ExerciseMuscleLink, MuscleGroup, ReadinessInput, CheckInAnswers,
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
// muscleQualityStates — the drill-down's per-quality map (roadmap 031)
// ---------------------------------------------------------------------------

describe('muscleQualityStates', () => {
  const links = [link('Curls', 'Biceps'), link('Curls', 'Triceps', 2)]
  const entry = (date: string, exercise: string, reps: number[]): WeightEntry =>
    ({ id: `${date}-${exercise}-${reps.join()}`, date, exercise, sets: reps.map(r => ({ weight: 50, reps: r })) })
  const biceps = (states: MuscleState[]) => states.find(m => m.name === 'Biceps')!
  const on = (weights: WeightEntry[], q: MuscleQuality, weekly = 6, overrides?: Record<string, Adaptation>, unit: TargetUnit = 'sets') =>
    biceps(muscleQualityStates(weights, links, GROUPS, q, { unit, weekly }, overrides, TODAY))

  it('exports the same window Home fills against', () => {
    expect(muscleWindow(TODAY)).toEqual({ from: ago(MUSCLE_WINDOW_DAYS - 1), to: TODAY })
  })

  it('lands a 10-rep set on the hypertrophy map, not the strength map', () => {
    const weights = [entry(ago(1), 'Curls', [10, 10, 10])]
    expect(on(weights, 'hypertrophy', 10).sets).toBe(3)
    expect(on(weights, 'strength').sets).toBe(0)
  })

  it('scales the weekly target to the window and weights sets by link level', () => {
    const weights = [entry(ago(1), 'Curls', [10, 10, 10])]
    const states = muscleQualityStates(weights, links, GROUPS, 'hypertrophy', { unit: 'sets', weekly: 10 }, undefined, TODAY)
    expect(biceps(states).fillFraction).toBe(+(3 / (10 * MUSCLE_WINDOW_DAYS / 7)).toFixed(3))
    expect(states.find(m => m.name === 'Triceps')?.sets).toBe(1.5)
  })

  it('tracks recency per quality while recovering stays muscle-level', () => {
    const weights = [
      entry(ago(10), 'Curls', [3, 3]),  // strength only
      entry(ago(1), 'Curls', [12, 12]), // hypertrophy only
    ]
    const strength = on(weights, 'strength')
    expect(strength.daysSince).toBe(10)
    expect(strength.sets).toBe(2)
    expect(strength.recovering).toBe(true) // the any-set recency is 1 day
    expect(on(weights, 'hypertrophy', 10).daysSince).toBe(1)
    expect(biceps(muscleStates(weights, links, GROUPS, TODAY)).daysSince).toBe(1)
  })

  it('reads never-trained in a quality even when the muscle has other history', () => {
    const s = on([entry(ago(1), 'Curls', [10])], 'strength')
    expect(s.sets).toBe(0)
    expect(s.daysSince).toBeNull()
    expect(s.recovering).toBe(true)
  })

  it('counts a power set on the power map only', () => {
    const weights = [entry(ago(1), 'Curls', [10, 10, 10, 10])]
    const asPower = { curls: 'power' as Adaptation }
    expect(on(weights, 'power', 6, asPower).sets).toBe(4)
    expect(on(weights, 'power', 6, asPower).daysSince).toBe(1)
    expect(on(weights, 'hypertrophy', 10, asPower).sets).toBe(0)
    expect(on(weights, 'hypertrophy', 10, asPower).daysSince).toBeNull()
    expect(on(weights, 'power').sets).toBe(0)
  })

  it('reads power in level-weighted sessions per muscle when its target counts sessions (0012)', () => {
    const asPower = { curls: 'power' as Adaptation }
    const weights = [entry(ago(1), 'Curls', [5, 5, 5, 5]), entry(ago(3), 'Curls', [5, 5])]
    const states = muscleQualityStates(weights, links, GROUPS, 'power', { unit: 'sessions', weekly: 2 }, asPower, TODAY)
    expect(biceps(states).sets).toBe(2)                                  // two days, primary mover
    expect(states.find(m => m.name === 'Triceps')?.sets).toBe(1)         // two days at level 2's 0.5
    expect(biceps(states).fillFraction).toBe(+(2 / (2 * MUSCLE_WINDOW_DAYS / 7)).toFixed(3))
  })

  it('counts window sets only but keeps the older last date', () => {
    const s = on([entry(ago(MUSCLE_WINDOW_DAYS + 3), 'Curls', [3, 3])], 'strength')
    expect(s.sets).toBe(0)
    expect(s.daysSince).toBe(MUSCLE_WINDOW_DAYS + 3)
    expect(s.recovering).toBe(false)
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

  it('feeds one quality from a Training-Effect session — anaerobic TE alone feeds nothing (005)', () => {
    const hard = cardioAt(ago(2), {
      aerobicTe: 3.1, anaerobicTe: 2.5, trainingEffectLabel: 'VO2MAX',
    })
    const qs = qualityStates([hard], [], TODAY)
    expect(qs.find(q => q.key === 'vo2max')?.daysSince).toBe(2)
    expect(qs.find(q => q.key === 'anaerobic_capacity')?.daysSince).toBeNull()
    expect(qs.find(q => q.key === 'endurance')?.daysSince).toBeNull()
  })

  it('feeds anaerobic capacity from an intervals row whose anaerobic TE leads (005 vendor tie-break)', () => {
    const emom = cardioAt(ago(1), { format: 'intervals', duration: 20, aerobicTe: 1.9, anaerobicTe: 2.7 })
    const qs = qualityStates([emom], [], TODAY)
    expect(qs.find(q => q.key === 'anaerobic_capacity')?.daysSince).toBe(1)
    expect(qs.find(q => q.key === 'vo2max')?.daysSince).toBeNull()
  })

  it('counts a sport session, timed or not, as endurance (005 run B)', () => {
    const qs = qualityStates([], [sportAt(ago(4)), sportAt(ago(6), 60)], TODAY)
    expect(qs.find(q => q.key === 'endurance')?.daysSince).toBe(4)
    expect(qs.find(q => q.key === 'vo2max')?.daysSince).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// systemicReadiness
// ---------------------------------------------------------------------------

const night = (date: string, score?: number, hrv?: number): SleepEntry => ({
  id: date, date, hours: 7.5, score, hrv, source: 'garmin',
})

/** Invented nights: a baseline alternating 75 / 85 ms (ln SD ≈ 0.0626) from
 * day 7 back, and a rolling week of `week` ms on days 0–6. */
const hrvHistory = (week: number, baselineNights = 30): SleepEntry[] => [
  ...Array.from({ length: 7 }, (_, i) => night(ago(i), 70, week)),
  ...Array.from({ length: baselineNights }, (_, i) => night(ago(i + 7), 70, i % 2 ? 75 : 85)),
]

describe('overnightHrvReading', () => {
  it('reads a week at the baseline mean as ok, score 50', () => {
    const r = overnightHrvReading(hrvHistory(Math.sqrt(75 * 85)), TODAY)
    expect(r?.method).toBe('overnight_hrv')
    expect(r?.z).toBeCloseTo(0, 5)
    expect(r?.score).toBe(50)
    expect(r?.band).toBe('ok')
    expect(r?.recent).toBe(80) // geometric means, rounded to whole ms
    // the normal range is the baseline ± the moderate line (0.5 SD), in ms
    expect(r?.normal).toEqual({ low: 77, high: 82 })
  })

  it('puts a week just under the normal range in moderate', () => {
    const r = overnightHrvReading(hrvHistory(76), TODAY)!
    expect(r.recent).toBeLessThan(r.normal.low)
    expect(r.band).toBe('moderate')
  })

  it('reads in log space: the baseline mean is geometric, not arithmetic', () => {
    // ln-mean of 75/85 is ln(79.84); a week at 80 ms sits just above it
    expect(overnightHrvReading(hrvHistory(80), TODAY)!.z).toBeGreaterThan(0)
    expect(overnightHrvReading(hrvHistory(79.5), TODAY)!.z).toBeLessThan(0)
  })

  it('steadies between 0.5 and 1 SD under, holds beyond 1 SD', () => {
    const sd = Math.abs(Math.log(85) - Math.log(75)) / 2
    const mean = (Math.log(75) + Math.log(85)) / 2
    const at = (z: number) => overnightHrvReading(hrvHistory(Math.exp(mean + z * sd)), TODAY)!
    expect(at(-0.4).band).toBe('ok')
    expect(at(-0.7).band).toBe('moderate')
    expect(at(-1.3).band).toBe('low')
    expect(at(-1.3).score).toBe(0)
  })

  it('never lowers the band for HRV above baseline (one-sided)', () => {
    const r = overnightHrvReading(hrvHistory(100), TODAY)!
    expect(r.band).toBe('ok')
    expect(r.score).toBe(100)
  })

  it('keeps the current week out of the baseline', () => {
    // a week 1.2 SD down reads low; were the week pooled into the baseline it
    // would pull the mean towards itself and read about −0.96, moderate
    const sd = Math.abs(Math.log(85) - Math.log(75)) / 2
    const mean = (Math.log(75) + Math.log(85)) / 2
    const r = overnightHrvReading(hrvHistory(Math.exp(mean - 1.2 * sd)), TODAY)!
    expect(r.z).toBeCloseTo(-1.2, 5)
    expect(r.band).toBe('low')
  })

  it('barely moves on a single bad night', () => {
    const g = Math.sqrt(75 * 85)
    const sleep = [night(ago(0), 70, 60), ...hrvHistory(g).slice(1)]
    expect(overnightHrvReading(sleep, TODAY)!.band).not.toBe('low')
  })

  it('gives no reading before 14 baseline nights', () => {
    expect(overnightHrvReading(hrvHistory(80, 13), TODAY)).toBeNull()
    expect(overnightHrvReading(hrvHistory(80, 14), TODAY)).not.toBeNull()
  })

  it('gives no reading when last night has no HRV', () => {
    const sleep = hrvHistory(80).filter(e => e.date !== ago(0) && e.date !== ago(1))
    expect(overnightHrvReading(sleep, TODAY)).toBeNull()
  })
})

describe('bandForZ', () => {
  it('cuts at the trialled tiers, edges inclusive upward', () => {
    expect(HRV_BAND_Z).toEqual({ moderate: -0.5, low: -1 })
    expect(bandForZ(-0.5)).toBe('ok')
    expect(bandForZ(-0.51)).toBe('moderate')
    expect(bandForZ(-1)).toBe('moderate')
    expect(bandForZ(-1.01)).toBe('low')
  })
})

describe('systemicReadiness', () => {
  it('reads HRV alone: the sleep score is shown, never counted', () => {
    const g = Math.sqrt(75 * 85)
    const good = systemicReadiness(hrvHistory(g).map(e => ({ ...e, score: 95 })), TODAY)
    const bad = systemicReadiness(hrvHistory(g).map(e => ({ ...e, score: 20 })), TODAY)
    expect(good.readiness).toBe(50)
    expect(bad.readiness).toBe(50)
    expect(bad.sleepScore).toBe(20)
    expect(bad.band).toBe('ok')
    expect(bad.method).toBe('overnight_hrv')
  })

  it('has no readiness without an HRV baseline, but still surfaces last night', () => {
    const r = systemicReadiness([night(ago(0), 73, 80), night(ago(1), 80, 82)], TODAY)
    expect(r.readiness).toBeNull()
    expect(r.band).toBeNull()
    expect(r.sleepScore).toBe(73)
    expect(r.hrv).toBe(80)
  })

  it('returns nothing with no data at all', () => {
    expect(systemicReadiness([], TODAY).readiness).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// The typed rungs and the notes (RFC 0092) — every figure invented
// ---------------------------------------------------------------------------

const morning = (date: string, ms: number): ReadinessInput => ({ id: `m${date}`, date, morningHrv: ms })
/** Invented morning readings, the same shape as hrvHistory. */
const morningHistory = (week: number, baselineDays = 30): ReadinessInput[] => [
  ...Array.from({ length: 7 }, (_, i) => morning(ago(i), week)),
  ...Array.from({ length: baselineDays }, (_, i) => morning(ago(i + 7), i % 2 ? 60 : 70)),
]

describe('morningHrvReading', () => {
  it('reads typed mornings with the overnight math, on their own baseline', () => {
    const r = morningHrvReading(morningHistory(Math.sqrt(60 * 70)), TODAY)!
    expect(r.method).toBe('morning_hrv')
    expect(r.z).toBeCloseTo(0, 5)
    expect(r.band).toBe('ok')
    const sd = Math.abs(Math.log(70) - Math.log(60)) / 2
    const mean = (Math.log(60) + Math.log(70)) / 2
    expect(morningHrvReading(morningHistory(Math.exp(mean - 0.7 * sd)), TODAY)!.band).toBe('moderate')
    expect(morningHrvReading(morningHistory(Math.exp(mean - 1.3 * sd)), TODAY)!.band).toBe('low')
  })

  it('needs this morning typed, and 14 baseline readings', () => {
    expect(morningHrvReading(morningHistory(65).filter(e => e.date !== TODAY), TODAY)).toBeNull()
    expect(morningHrvReading(morningHistory(65, 13), TODAY)).toBeNull()
    expect(morningHrvReading(morningHistory(65, 14), TODAY)).not.toBeNull()
  })

  it('never reads overnight HRV, and overnight never reads it', () => {
    expect(morningHrvReading([], TODAY)).toBeNull()
    expect(overnightHrvReading([], TODAY)).toBeNull()
    const sleepOnly = hrvHistory(80)
    expect(systemicReadiness(sleepOnly, TODAY, [], 'morning_hrv').method).toBeNull()
  })
})

const answers = (n: number): CheckInAnswers => ({ energy: n, soreness: n, sleepQuality: n, stress: n, mood: n })
const checkIn = (date: string, a: CheckInAnswers): ReadinessInput => ({ id: `c${date}`, date, checkIn: a })
/** Invented check-ins: 20 days alternating totals of 18 and 20 (mean 19, SD 1), then today. */
const checkInHistory = (todayAnswers: CheckInAnswers, days = 20): ReadinessInput[] => [
  checkIn(TODAY, todayAnswers),
  ...Array.from({ length: days }, (_, i) =>
    checkIn(ago(i + 1), i % 2 ? { ...answers(4) } : { ...answers(4), mood: 2 })),
]

describe('checkInReading', () => {
  it('sums five items, 5 the good end', () => {
    expect(checkInTotal(answers(5))).toBe(25)
    expect(checkInTotal({ energy: 1, soreness: 2, sleepQuality: 3, stress: 4, mood: 5 })).toBe(15)
  })

  it('reads ok at the usual total and above it', () => {
    expect(checkInReading(checkInHistory({ ...answers(4), mood: 3 }), TODAY)!.band).toBe('ok')
    expect(checkInReading(checkInHistory(answers(5)), TODAY)!.band).toBe('ok')
  })

  it('needs both the SD line and the point floor to drop a band', () => {
    // mean 19, SD 1: a total of 17 is −2 SD but only 2 points under → moderate, not low
    const r17 = checkInReading(checkInHistory({ ...answers(4), mood: 1 }), TODAY)!
    expect(r17.recent).toBe(17)
    expect(r17.band).toBe('moderate')
    // 18 is −1 SD but 1 point under → ok
    expect(checkInReading(checkInHistory({ ...answers(4), mood: 2 }), TODAY)!.band).toBe('ok')
    // 15 is −4 SD and 4 points under → low
    expect(checkInReading(checkInHistory(answers(3)), TODAY)!.band).toBe('low')
  })

  it('gives the normal range in points, edges at the moderate line', () => {
    const r = checkInReading(checkInHistory(answers(4)), TODAY)!
    expect(r.normal).toEqual({ low: 17, high: 21 })
  })

  it('needs today answered and 14 earlier check-ins', () => {
    expect(checkInReading(checkInHistory(answers(4)).slice(1), TODAY)).toBeNull()
    expect(checkInReading(checkInHistory(answers(4), 13), TODAY)).toBeNull()
    expect(checkInReading(checkInHistory(answers(4), 14), TODAY)).not.toBeNull()
  })
})

describe('method choice and fallback', () => {
  it('picks the best rung with data when none is picked', () => {
    expect(autoReadinessMethod(hrvHistory(80), [], TODAY)).toBe('overnight_hrv')
    expect(autoReadinessMethod([], morningHistory(65), TODAY)).toBe('morning_hrv')
    expect(autoReadinessMethod([], checkInHistory(answers(4)), TODAY)).toBe('check_in')
    expect(autoReadinessMethod([], [], TODAY)).toBeNull()
  })

  it('counts a device connected only with a night in the last 3 days', () => {
    expect(overnightConnected([night(ago(2), 70, 80)], TODAY)).toBe(true)
    expect(overnightConnected([night(ago(3), 70, 80)], TODAY)).toBe(false)
  })

  it('falls to a lower rung only when that rung has its own reading', () => {
    const inputs = checkInHistory({ ...answers(4), mood: 1 })
    const r = systemicReadiness([], TODAY, inputs, 'morning_hrv')
    expect(r.chosen).toBe('morning_hrv')
    expect(r.method).toBe('check_in')
    expect(r.band).toBe('moderate')
    // never upward: a check-in pick does not read overnight HRV
    expect(systemicReadiness(hrvHistory(80), TODAY, [], 'check_in').method).toBeNull()
  })

  it('asks for today’s typed reading and reports the baseline progress', () => {
    const r = systemicReadiness([], TODAY, morningHistory(65, 3).slice(1), 'morning_hrv')
    expect(r.awaitingInput).toBe(true)
    expect(r.band).toBeNull()
    expect(r.progress).toEqual({ have: 9, need: 21 })
  })

  it('says when overnight has no device', () => {
    const r = systemicReadiness([], TODAY, [], 'overnight_hrv')
    expect(r.connected).toBe(false)
    expect(r.picked).toBe(true)
    expect(r.band).toBeNull()
  })
})

describe('readinessNotes', () => {
  const rhrNight = (date: string, rhr: number, hours = 7.5, source: 'garmin' | 'manual' = 'garmin'): SleepEntry => ({
    id: date, date, hours, restingHr: rhr, source,
  })
  /** Invented nights: resting HR alternating 50 / 52 for 20 nights, then last night. */
  const rhrHistory = (last: number, hours = 7.5, source: 'garmin' | 'manual' = 'garmin') => [
    rhrNight(ago(0), last, hours, source),
    ...Array.from({ length: 20 }, (_, i) => rhrNight(ago(i + 1), i % 2 ? 50 : 52)),
  ]

  it('notes a resting HR at least 5 bpm and 1 SD above the norm', () => {
    expect(readinessNotes(rhrHistory(57), TODAY).restingHrAbove).toBe(6)
    expect(readinessNotes(rhrHistory(55), TODAY).restingHrAbove).toBeNull()
  })

  it('notes a short night from the device only', () => {
    expect(readinessNotes(rhrHistory(51, 5.5), TODAY).shortNight).toBe(5.5)
    expect(readinessNotes(rhrHistory(51, 6), TODAY).shortNight).toBeNull()
    expect(readinessNotes(rhrHistory(51, 5, 'manual'), TODAY).shortNight).toBeNull()
  })

  it('never changes the band', () => {
    const sleep = hrvHistory(Math.sqrt(75 * 85)).map((e, i) => ({ ...e, restingHr: i === 0 ? 70 : 50, hours: i === 0 ? 4 : 7.5 }))
    const r = systemicReadiness(sleep, TODAY)
    expect(r.notes.restingHrAbove).not.toBeNull()
    expect(r.notes.shortNight).toBe(4)
    expect(r.band).toBe('ok')
  })
})

// ---------------------------------------------------------------------------
// donationStatus
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

// ---------------------------------------------------------------------------
// fusedVerdict
// ---------------------------------------------------------------------------

describe('fusedVerdict', () => {
  it('holds a low band, steadies a moderate one, pushes an ok one', () => {
    expect(fusedVerdict('low')).toEqual({ mode: 'hold', cause: 'readiness' })
    expect(fusedVerdict('moderate')).toEqual({ mode: 'steady', cause: 'readiness' })
    expect(fusedVerdict('ok')).toEqual({ mode: 'push', cause: null })
  })

  it('cannot gate without readiness data', () => {
    expect(fusedVerdict(null).mode).toBe('push')
  })

  it('holds on an acute donation regardless of readiness', () => {
    const d = donationStatus([donation(ago(0))], TODAY)
    expect(fusedVerdict('ok', d)).toEqual({ mode: 'hold', cause: 'donation' })
  })
})
