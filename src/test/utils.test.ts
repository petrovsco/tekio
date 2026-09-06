import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cycleInfo, isDeloadDate, isTodayDone, mergeById, cycleExerciseProgress, estimate1RM, best1RM, weightsPickerNames, withinTimeFrame, weekKey, grainForFrame, rollupCardio } from '../lib/utils'
import type { WeightEntry, Program, ProgramDay, ExerciseMuscleLink } from '../types'

// ---------------------------------------------------------------------------
// 1RM estimation
// ---------------------------------------------------------------------------

describe('withinTimeFrame', () => {
  const ref = '2026-09-06'

  it('All time admits everything', () => {
    expect(withinTimeFrame('2023-05-13', 'All time', ref)).toBe(true)
  })

  it('This year is the calendar year of the reference date', () => {
    expect(withinTimeFrame('2026-01-01', 'This year', ref)).toBe(true)
    expect(withinTimeFrame('2025-12-31', 'This year', ref)).toBe(false)
  })

  it('Last N days is inclusive of the cutoff day', () => {
    expect(withinTimeFrame('2026-08-07', 'Last 30 days', ref)).toBe(true)
    expect(withinTimeFrame('2026-08-06', 'Last 30 days', ref)).toBe(false)
    expect(withinTimeFrame('2026-06-08', 'Last 90 days', ref)).toBe(true)
    expect(withinTimeFrame('2026-06-07', 'Last 90 days', ref)).toBe(false)
  })

  it('crosses a year boundary by the calendar, not the year', () => {
    expect(withinTimeFrame('2025-12-20', 'Last 30 days', '2026-01-10')).toBe(true)
  })
})

describe('grainForFrame', () => {
  it('follows the frame, not the point count', () => {
    expect(grainForFrame('Last 30 days')).toBe('session')
    expect(grainForFrame('Last 90 days')).toBe('session')
    expect(grainForFrame('This year')).toBe('week')
    expect(grainForFrame('All time')).toBe('month')
  })
})

describe('rollupCardio', () => {
  const run = (date: string, duration: number, distance?: number) => ({ date, duration, distance })

  it('sums a bucket and weights pace by distance', () => {
    // A plain mean of the two paces (6 and 5 min/km) would say 5.5; the 20 km
    // run weighs four times the 5 km one, so the honest figure is 130 / 25.
    expect(rollupCardio([run('2026-03-02', 30, 5), run('2026-03-04', 100, 20)], 'month'))
      .toEqual([{ key: '2026-03', sessions: 2, duration: 130, distance: 25, pace: 5.2 }])
  })

  it('counts a session without distance in the duration but not the pace', () => {
    expect(rollupCardio([run('2026-03-02', 30, 5), run('2026-03-04', 45)], 'month'))
      .toEqual([{ key: '2026-03', sessions: 2, duration: 75, distance: 5, pace: 6 }])
  })

  it('has no distance or pace when no session in the bucket carried one', () => {
    expect(rollupCardio([run('2026-03-02', 30)], 'month'))
      .toEqual([{ key: '2026-03', sessions: 1, duration: 30 }])
  })

  it('keeps an empty month in the middle as a zero bucket with no pace', () => {
    const rows = rollupCardio([run('2025-11-10', 30, 5), run('2026-02-01', 30, 5)], 'month')
    expect(rows.map(b => [b.key, b.sessions, b.duration, b.pace])).toEqual([
      ['2025-11', 1, 30, 6],
      ['2025-12', 0, 0, undefined],
      ['2026-01', 0, 0, undefined],
      ['2026-02', 1, 30, 6],
    ])
  })

  it('buckets weeks by the same start day as weekKey, empty weeks included', () => {
    // 2026-09-01 is a Tuesday and 2026-09-06 the Sunday of the same week; the
    // 16th is two weeks on, so the week of the 7th sits empty between them.
    const rows = rollupCardio([run('2026-09-01', 30), run('2026-09-06', 30), run('2026-09-16', 30)], 'week')
    expect(rows.map(b => [b.key, b.sessions])).toEqual([
      [weekKey('2026-09-01'), 2],
      [weekKey('2026-09-09'), 0],
      [weekKey('2026-09-16'), 1],
    ])
  })

  it('takes the week start day, so Sunday-start weeks match the sport card', () => {
    const rows = rollupCardio([run('2026-09-06', 30), run('2026-09-07', 30)], 'week', 'sunday')
    expect(rows.map(b => [b.key, b.sessions])).toEqual([[weekKey('2026-09-06', 'sunday'), 2]])
  })

  it('rolls December into the next year', () => {
    const rows = rollupCardio([run('2025-12-15', 30), run('2026-01-15', 30)], 'month')
    expect(rows.map(b => b.key)).toEqual(['2025-12', '2026-01'])
  })

  it('returns nothing for no sessions', () => {
    expect(rollupCardio([], 'month')).toEqual([])
  })
})

describe('estimate1RM', () => {
  it('returns the weight itself for a single rep', () => {
    expect(estimate1RM(100, 1)).toBe(100)
  })

  it('blends Epley and Brzycki for multi-rep sets', () => {
    // Epley: 100×(1+5/30)=116.67 ; Brzycki: 100×36/32=112.5 ; mean ≈ 114.58
    expect(estimate1RM(100, 5)).toBeCloseTo(114.58, 1)
  })

  it('falls back to Epley at very high reps', () => {
    expect(estimate1RM(50, 40)).toBeCloseTo(50 * (1 + 40 / 30), 5)
  })

  it('is zero for empty input', () => {
    expect(estimate1RM(0, 5)).toBe(0)
    expect(estimate1RM(100, 0)).toBe(0)
  })
})

describe('best1RM', () => {
  it('takes the max estimate across sets', () => {
    const sets = [{ weight: 80, reps: 8 }, { weight: 100, reps: 3 }, { weight: 60, reps: 12 }]
    expect(best1RM(sets)).toBeCloseTo(estimate1RM(100, 3), 5)
  })

  it('is zero with no sets', () => {
    expect(best1RM([])).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProgram(startDate: string): Program {
  return {
    name: 'Test',
    startDate,
    currentDayIndex: 0,
    lastAdvancedDate: startDate,
    days: [],
  }
}

function makeEntry(id: string, date: string, exercise: string): WeightEntry {
  return { id, date, exercise, sets: [{ weight: 100, reps: 5 }] }
}

// Fix "today" to a known date so tests are deterministic
function freezeToday(dateStr: string) {
  const fakeNow = new Date(dateStr).getTime()
  vi.spyOn(Date, 'now').mockReturnValue(fakeNow)
  // Also mock `new Date()` for utils that use it
  vi.setSystemTime(new Date(dateStr))
}

// ---------------------------------------------------------------------------
// cycleInfo
// ---------------------------------------------------------------------------

describe('cycleInfo', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('returns week 1 and no deload when no program', () => {
    freezeToday('2025-01-06')
    expect(cycleInfo(null)).toEqual({ week: 1, isDeload: false, isComplete: false })
    expect(cycleInfo(undefined)).toEqual({ week: 1, isDeload: false, isComplete: false })
  })

  it('returns week 1 on day 0 (start date = today)', () => {
    freezeToday('2025-01-06')
    expect(cycleInfo(makeProgram('2025-01-06'))).toEqual({ week: 1, isDeload: false, isComplete: false })
  })

  it('returns week 2 after 7 days', () => {
    freezeToday('2025-01-13')
    expect(cycleInfo(makeProgram('2025-01-06'))).toEqual({ week: 2, isDeload: false, isComplete: false })
  })

  it('returns week 6 (deload) at exactly 5 full weeks in (day 35)', () => {
    // startDate 2025-01-01, today = 2025-02-05 (+35 days)
    freezeToday('2025-02-05')
    const info = cycleInfo(makeProgram('2025-01-01'))
    expect(info.week).toBe(6)
    expect(info.isDeload).toBe(true)
    expect(info.isComplete).toBe(false)
  })

  it('deload triggers at wc === CYCLE (6), NOT at wc > 6', () => {
    // week 5 should NOT be deload
    freezeToday('2025-01-29') // +28 days from 2025-01-01
    expect(cycleInfo(makeProgram('2025-01-01'))).toEqual({ week: 5, isDeload: false, isComplete: false })
  })

  it('marks program complete after the deload week has elapsed (42+ days)', () => {
    // 6 * 7 = 42 days in → cycle is done, no rolling
    freezeToday('2025-02-12') // +42 days from 2025-01-01
    const info = cycleInfo(makeProgram('2025-01-01'))
    expect(info.isComplete).toBe(true)
    expect(info.isDeload).toBe(false)
  })

  it('remains complete further beyond the cycle end (no wrapping)', () => {
    // 49 days in → still complete, NOT back to week 1
    freezeToday('2025-02-19') // +49 days from 2025-01-01
    const info = cycleInfo(makeProgram('2025-01-01'))
    expect(info.isComplete).toBe(true)
    expect(info.week).toBe(6) // stays at CYCLE, never "week 7"
  })
})

// ---------------------------------------------------------------------------
// isDeloadDate
// ---------------------------------------------------------------------------

describe('isDeloadDate', () => {
  it('returns false when startDate is null or undefined', () => {
    expect(isDeloadDate(null, '2025-01-06')).toBe(false)
    expect(isDeloadDate(undefined, '2025-01-06')).toBe(false)
  })

  it('returns false for a non-deload date (week 1)', () => {
    // startDate 2025-01-01, check date 2025-01-01 (day 0 → week 1)
    expect(isDeloadDate('2025-01-01', '2025-01-01')).toBe(false)
  })

  it('returns false for week 5', () => {
    // +28 days = week 5
    expect(isDeloadDate('2025-01-01', '2025-01-29')).toBe(false)
  })

  it('returns true for week 6 (deload week)', () => {
    // +35 days from 2025-01-01 = week 6
    expect(isDeloadDate('2025-01-01', '2025-02-05')).toBe(true)
  })

  it('returns true for any date within the deload week', () => {
    // Days 35–41 all land in week 6
    expect(isDeloadDate('2025-01-01', '2025-02-06')).toBe(true) // day 36
    expect(isDeloadDate('2025-01-01', '2025-02-07')).toBe(true) // day 37
  })

  it('returns false after deload week ends (cycle wraps)', () => {
    // +42 days → week 1 of next cycle
    expect(isDeloadDate('2025-01-01', '2025-02-12')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isTodayDone
// ---------------------------------------------------------------------------

describe('isTodayDone', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  const TODAY = '2025-06-01'

  function makeDay(exercises: string[]): ProgramDay {
    return { name: 'Test Day', exercises, supersets: [] }
  }

  it('returns true when day is null or has no exercises', () => {
    freezeToday(TODAY)
    expect(isTodayDone([], null)).toBe(true)
    expect(isTodayDone([], makeDay([]))).toBe(true)
  })

  it('returns false when none logged', () => {
    freezeToday(TODAY)
    const day = makeDay(['Squat', 'Bench'])
    expect(isTodayDone([], day)).toBe(false)
  })

  it('returns false when only some exercises are logged (uses .every not .some)', () => {
    freezeToday(TODAY)
    const day = makeDay(['Squat', 'Bench', 'Row'])
    const entries = [makeEntry('1', TODAY, 'Squat'), makeEntry('2', TODAY, 'Bench')]
    expect(isTodayDone(entries, day)).toBe(false)
  })

  it('returns true when all exercises are logged today', () => {
    freezeToday(TODAY)
    const day = makeDay(['Squat', 'Bench'])
    const entries = [makeEntry('1', TODAY, 'Squat'), makeEntry('2', TODAY, 'Bench')]
    expect(isTodayDone(entries, day)).toBe(true)
  })

  it('ignores entries from other dates', () => {
    freezeToday(TODAY)
    const day = makeDay(['Squat'])
    const entries = [makeEntry('1', '2025-05-31', 'Squat')] // yesterday
    expect(isTodayDone(entries, day)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// cycleExerciseProgress
// ---------------------------------------------------------------------------

describe('cycleExerciseProgress', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  function makeDay(exercises: string[]): ProgramDay {
    return { name: 'Test Day', exercises, supersets: [] }
  }

  it('returns empty array when no exercises in cycle days', () => {
    const cycle = { startDate: '2025-01-01', endDate: '2025-02-01', days: [] }
    expect(cycleExerciseProgress([], cycle)).toEqual([])
  })

  it('skips exercises with no logged data in range', () => {
    const cycle = { startDate: '2025-01-01', endDate: '2025-02-01', days: [makeDay(['Squat'])] }
    expect(cycleExerciseProgress([], cycle)).toEqual([])
  })

  it('computes first/last/delta from logged entries within the date range', () => {
    const cycle = { startDate: '2025-01-01', endDate: '2025-02-01', days: [makeDay(['Squat'])] }
    const weights = [
      makeEntry('1', '2025-01-05', 'Squat'),
      { id: '2', date: '2025-01-20', exercise: 'Squat', sets: [{ weight: 120, reps: 5 }] },
    ]
    const result = cycleExerciseProgress(weights, cycle)
    expect(result).toHaveLength(1)
    expect(result[0].exercise).toBe('Squat')
    expect(result[0].maxWeight).toMatchObject({ first: 100, last: 120, delta: 20 })
    expect(result[0].maxWeight.series).toEqual([{ x: '2025-01-05', y: 100 }, { x: '2025-01-20', y: 120 }])
  })

  it('reports the peak value even when it falls between first and last', () => {
    const cycle = { startDate: '2025-01-01', endDate: '2025-02-01', days: [makeDay(['Squat'])] }
    const weights: WeightEntry[] = [
      { id: '1', date: '2025-01-05', exercise: 'Squat', sets: [{ weight: 100, reps: 5 }] },
      { id: '2', date: '2025-01-12', exercise: 'Squat', sets: [{ weight: 130, reps: 5 }] }, // peak, mid-cycle
      { id: '3', date: '2025-01-20', exercise: 'Squat', sets: [{ weight: 115, reps: 5 }] },
    ]
    const result = cycleExerciseProgress(weights, cycle)
    expect(result[0].maxWeight).toMatchObject({ first: 100, last: 115, peak: 130, delta: 15 })
  })

  it('computes volume (weight × reps summed per session) alongside max weight', () => {
    const cycle = { startDate: '2025-01-01', endDate: '2025-02-01', days: [makeDay(['Squat'])] }
    const weights: WeightEntry[] = [
      { id: '1', date: '2025-01-05', exercise: 'Squat', sets: [{ weight: 100, reps: 5 }, { weight: 80, reps: 8 }] },
      { id: '2', date: '2025-01-20', exercise: 'Squat', sets: [{ weight: 120, reps: 5 }] },
    ]
    const result = cycleExerciseProgress(weights, cycle)
    expect(result[0].volume.series).toEqual([{ x: '2025-01-05', y: 1140 }, { x: '2025-01-20', y: 600 }])
    expect(result[0].volume).toMatchObject({ first: 1140, last: 600, delta: -540 })
  })

  it('excludes entries outside the cycle date range', () => {
    const cycle = { startDate: '2025-01-10', endDate: '2025-01-20', days: [makeDay(['Squat'])] }
    const weights = [
      makeEntry('1', '2025-01-05', 'Squat'), // before range
      makeEntry('2', '2025-01-25', 'Squat'), // after range
    ]
    expect(cycleExerciseProgress(weights, cycle)).toEqual([])
  })

  it('falls back to today() as the end date when endDate is null (ongoing cycle)', () => {
    freezeToday('2025-01-15')
    const cycle = { startDate: '2025-01-01', endDate: null, days: [makeDay(['Squat'])] }
    const weights = [
      makeEntry('1', '2025-01-10', 'Squat'),
      makeEntry('2', '2025-01-20', 'Squat'), // after "today", should be excluded
    ]
    const result = cycleExerciseProgress(weights, cycle)
    expect(result[0].maxWeight.series).toEqual([{ x: '2025-01-10', y: 100 }])
  })

  it('uses the max weight within a session for the maxWeight series value', () => {
    const cycle = { startDate: '2025-01-01', endDate: '2025-02-01', days: [makeDay(['Squat'])] }
    const weights: WeightEntry[] = [
      { id: '1', date: '2025-01-05', exercise: 'Squat', sets: [{ weight: 80, reps: 8 }, { weight: 100, reps: 3 }] },
    ]
    expect(cycleExerciseProgress(weights, cycle)[0].maxWeight.first).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// mergeById
// ---------------------------------------------------------------------------

describe('mergeById', () => {
  it('returns existing entries when incoming is empty', () => {
    const a = makeEntry('1', '2025-01-01', 'Squat')
    expect(mergeById([a], [])).toEqual([a])
  })

  it('adds new incoming entries not in existing', () => {
    const a = makeEntry('1', '2025-01-01', 'Squat')
    const b = makeEntry('2', '2025-01-02', 'Bench')
    expect(mergeById([a], [b])).toHaveLength(2)
  })

  it('incoming entry overwrites existing entry with same id', () => {
    const original = makeEntry('1', '2025-01-01', 'Squat')
    const updated = { ...original, exercise: 'Deadlift' }
    const result = mergeById([original], [updated])
    expect(result).toHaveLength(1)
    expect(result[0].exercise).toBe('Deadlift')
  })

  it('preserves unique ids from both arrays without duplicates', () => {
    const a = makeEntry('1', '2025-01-01', 'Squat')
    const b = makeEntry('2', '2025-01-02', 'Bench')
    const c = makeEntry('3', '2025-01-03', 'Row')
    const result = mergeById([a, b], [b, c])
    expect(result).toHaveLength(3)
    expect(result.map(r => r.id).sort()).toEqual(['1', '2', '3'])
  })

  it('returns empty array when both inputs are empty', () => {
    expect(mergeById([], [])).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Weights picker — logged names plus the catalogue's stimulus exercises (043)
// ---------------------------------------------------------------------------

describe('weightsPickerNames', () => {
  const link = (exercise: string, contribution: ExerciseMuscleLink['contribution'], level: 1 | 2 = 1): ExerciseMuscleLink =>
    ({ exercise, group: 'Glutes', region: 'lower', level, contribution })
  const logged = [{ exercise: 'Rows' }, { exercise: 'Bench Press' }, { exercise: 'Rows' }] as WeightEntry[]

  it('offers everything logged plus every catalogue exercise with a stimulus link', () => {
    const links = [link('Kettlebell Swing', 'stimulus'), link('Kettlebell Swing', 'stimulus', 2), link('Bench Press', 'stimulus')]
    expect(weightsPickerNames(logged, links)).toEqual(['Bench Press', 'Kettlebell Swing', 'Rows'])
  })

  it('keeps recovery-only rows out, but a logged name stays in even without links', () => {
    const links = [link('Couch Stretch', 'recovery'), link('Sprint', 'stimulus')]
    expect(weightsPickerNames(logged, links)).toEqual(['Bench Press', 'Rows', 'Sprint'])
  })

  it('is empty when nothing is logged and nothing is mapped', () => {
    expect(weightsPickerNames([], [])).toEqual([])
  })
})
