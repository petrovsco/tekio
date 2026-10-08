import { describe, it, expect } from 'vitest'
import { lastPerformance, mergeById, oneRM, bestOneRM, isSetPR, weightsPickerNames, withinTimeFrame, weekKey, grainForFrame, rollupCardio, hasLonePoint, daysBetween, groupBy, uniqSorted, fmtSets, fmtAgo, formatDurationMins, parseDurationMins, fmtDate, DATE_DAY_MONTH, DATE_MONTH, DATE_WEEKDAY } from '../lib/utils'
import type { WeightEntry, ExerciseMuscleLink } from '../types'

// ---------------------------------------------------------------------------
// daysBetween / groupBy — the shared helpers (roadmap 048 A3/A10/A11)
// ---------------------------------------------------------------------------

describe('daysBetween', () => {
  it('counts whole days between date strings', () => {
    expect(daysBetween('2026-08-28', '2026-08-30')).toBe(2)
    expect(daysBetween('2026-08-30', '2026-08-30')).toBe(0)
  })

  it('is negative when `to` is before `from`', () => {
    expect(daysBetween('2026-08-30', '2026-08-28')).toBe(-2)
  })

  it('crosses a DST boundary without drifting', () => {
    // Europe/Sofia moves its clocks on 2026-10-25; both dates parse as UTC
    // midnight, so the count stays whole whatever the browser's timezone.
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
  })
})

describe('groupBy', () => {
  const rows = [{ k: 'a', n: 1 }, { k: 'b', n: 2 }, { k: 'a', n: 3 }]

  it('keeps first-seen key order and within-group order', () => {
    const g = groupBy(rows, r => r.k)
    expect([...g.keys()]).toEqual(['a', 'b'])
    expect(g.get('a')).toEqual([{ k: 'a', n: 1 }, { k: 'a', n: 3 }])
  })

  it('maps each row into its group when given a value function', () => {
    expect(groupBy(rows, r => r.k, r => r.n).get('a')).toEqual([1, 3])
  })

  it('returns an empty map for no rows', () => {
    expect(groupBy([], (r: { k: string }) => r.k).size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 1RM estimation
// ---------------------------------------------------------------------------

describe('uniqSorted', () => {
  it('de-duplicates and sorts', () => {
    expect(uniqSorted(['Squat', 'Bench', 'Squat', 'Curl'])).toEqual(['Bench', 'Curl', 'Squat'])
  })

  it('is empty for an empty list, and never mutates its argument', () => {
    const xs = ['b', 'a']
    expect(uniqSorted([])).toEqual([])
    expect(uniqSorted(xs)).toEqual(['a', 'b'])
    expect(xs).toEqual(['b', 'a'])
  })
})

describe('fmtSets', () => {
  it('prints whole numbers plain and fractions to one decimal', () => {
    expect(fmtSets(0)).toBe('0')
    expect(fmtSets(12)).toBe('12')
    expect(fmtSets(1.5)).toBe('1.5')
    // A level-2 muscle link weighs 0.5, so thirds of a set never occur; round.
    expect(fmtSets(2.25)).toBe('2.3')
  })
})

describe('fmtAgo', () => {
  it('says never, today, or N d ago', () => {
    expect(fmtAgo(null)).toBe('never')
    expect(fmtAgo(0)).toBe('today')
    expect(fmtAgo(1)).toBe('1 d ago')
    expect(fmtAgo(116)).toBe('116 d ago')
  })
})

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

  it('weights average heart rate by minutes, over the sessions that carry both', () => {
    // 30 min at 120 and 90 min at 160: a plain mean says 140, the minutes say
    // (3600 + 14400) / 120 = 150. The third session has no heart rate and the
    // fourth no duration, so neither moves the average — both are counted.
    const rows = rollupCardio([
      { date: '2026-03-02', duration: 30, avgHr: 120 },
      { date: '2026-03-04', duration: 90, avgHr: 160 },
      { date: '2026-03-05', duration: 45 },
      { date: '2026-03-06', avgHr: 180 },
    ], 'month')
    expect(rows).toEqual([{ key: '2026-03', sessions: 4, duration: 165, avgHr: 150 }])
  })
})

describe('hasLonePoint', () => {
  const paced = (key: string) => ({ key, sessions: 1, duration: 30, distance: 5, pace: 6 })
  const empty = (key: string) => ({ key, sessions: 0, duration: 0 })
  const bare = (key: string) => ({ key, sessions: 1, duration: 30 })

  it('is true for a paced bucket with a hole on both sides, at the edges too', () => {
    const rows = [paced('2026-01'), empty('2026-02'), paced('2026-03'), empty('2026-04'), paced('2026-05')]
    expect(rows.map((_, i) => hasLonePoint(rows, i, 'pace'))).toEqual([true, false, true, false, true])
  })

  it('is false for a paced bucket joined to a neighbour', () => {
    const rows = [paced('2026-01'), paced('2026-02'), empty('2026-03')]
    expect(rows.map((_, i) => hasLonePoint(rows, i, 'pace'))).toEqual([false, false, false])
  })

  it('treats a bucket of sessions without distance as a hole', () => {
    const rows = [paced('2026-01'), bare('2026-02'), paced('2026-03')]
    expect(rows.map((_, i) => hasLonePoint(rows, i, 'pace'))).toEqual([true, false, true])
  })

  it('is lone for a single paced bucket, and false with no buckets at all', () => {
    expect(hasLonePoint([paced('2026-01')], 0, 'pace')).toBe(true)
    expect(hasLonePoint([], 0, 'pace')).toBe(false)
  })
})

describe('oneRM', () => {
  it('reports a single rep as measured, not estimated', () => {
    expect(oneRM(100, 1)).toEqual({ kind: 'measured', kg: 100 })
  })

  it('estimates inside the window with Brzycki, rounded to the plate', () => {
    // Brzycki: 100 × 36/32 = 112.5 — already on a 2.5 kg boundary
    expect(oneRM(100, 5)).toEqual({ kind: 'estimated', kg: 112.5, fromReps: 5 })
    // Brzycki: 100 × 36/34 = 105.88 → 105
    expect(oneRM(100, 3)).toEqual({ kind: 'estimated', kg: 105, fromReps: 3 })
  })

  it('refuses to estimate above the grounded ceiling', () => {
    expect(oneRM(100, 6)).toBeNull()
    expect(oneRM(50, 40)).toBeNull()
  })

  it('is null for empty input', () => {
    expect(oneRM(0, 5)).toBeNull()
    expect(oneRM(100, 0)).toBeNull()
  })
})

describe('bestOneRM', () => {
  it('takes the best across sets and ignores out-of-window ones', () => {
    const sets = [{ weight: 80, reps: 8 }, { weight: 100, reps: 3 }, { weight: 60, reps: 12 }]
    expect(bestOneRM(sets)).toEqual({ kind: 'estimated', kg: 105, fromReps: 3 })
  })

  it('prefers a measured max over an equal estimate', () => {
    // 89 × 36/32 = 100.125 → 100, the same number the single rep proves outright
    expect(bestOneRM([{ weight: 89, reps: 5 }, { weight: 100, reps: 1 }]))
      .toEqual({ kind: 'measured', kg: 100 })
  })

  it('is null when no set supports one', () => {
    expect(bestOneRM([])).toBeNull()
    expect(bestOneRM([{ weight: 60, reps: 12 }])).toBeNull()
  })
})

describe('isSetPR', () => {
  const history = [{ weight: 100, reps: 5 }, { weight: 110, reps: 3 }]

  it('is a best when nothing logged matched the load at the reps', () => {
    expect(isSetPR({ weight: 105, reps: 5 }, history)).toBe(true)
    expect(isSetPR({ weight: 100, reps: 6 }, history)).toBe(true)
  })

  it('is not a best when a logged set already did as much', () => {
    expect(isSetPR({ weight: 100, reps: 5 }, history)).toBe(false)
    expect(isSetPR({ weight: 95, reps: 3 }, history)).toBe(false)
  })

  it('needs a real set', () => {
    expect(isSetPR({ weight: 0, reps: 5 }, history)).toBe(false)
    expect(isSetPR({ weight: 100, reps: 0 }, history)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(id: string, date: string, exercise: string): WeightEntry {
  return { id, date, exercise, sets: [{ weight: 100, reps: 5 }] }
}

// ---------------------------------------------------------------------------
// lastPerformance
// ---------------------------------------------------------------------------

describe('lastPerformance', () => {
  const w = (id: string, exercise: string, date: string): WeightEntry =>
    ({ id, exercise, date, sets: [{ weight: 60, reps: 8 }] })

  const rows = [
    w('1', 'Bench Press', '2025-01-08'),
    w('2', 'Bench Press', '2025-02-06'),
    w('3', 'Bench Press', '2025-01-22'),
    w('4', 'Squat', '2025-03-01'),
  ]

  it('returns the most recent session whatever the array order', () => {
    expect(lastPerformance(rows, 'Bench Press')?.id).toBe('2')
  })

  it('matches the name case-insensitively and trims it', () => {
    expect(lastPerformance(rows, '  bench press ')?.id).toBe('2')
  })

  it('returns undefined for a blank name or an exercise never logged', () => {
    expect(lastPerformance(rows, '   ')).toBeUndefined()
    expect(lastPerformance(rows, 'Deadlift')).toBeUndefined()
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

describe('formatDurationMins / parseDurationMins', () => {
  it('drops the hour under 60 minutes', () => {
    expect(formatDurationMins(42.5)).toBe('42:30')
    expect(formatDurationMins(0.25)).toBe('0:15')
  })
  it('shows H:MM:SS from an hour up', () => {
    expect(formatDurationMins(60)).toBe('1:00:00')
    expect(formatDurationMins(95 + 7 / 60)).toBe('1:35:07')
  })
  it('rounds to the second without ever printing :60', () => {
    expect(formatDurationMins(59.9999)).toBe('1:00:00')
    expect(formatDurationMins(4.9999)).toBe('5:00')
  })
  it('round-trips what it prints', () => {
    for (const mins of [0.5, 42.5, 60, 95 + 7 / 60, 150])
      expect(parseDurationMins(formatDurationMins(mins))).toBeCloseTo(mins, 5)
  })
  it('still reads plain minutes and MM:SS', () => {
    expect(parseDurationMins('45')).toBe(45)
    expect(parseDurationMins('12:30')).toBe(12.5)
  })
})


// ---------------------------------------------------------------------------
// fmtDate — the locale picks the order, the style picks how much
// ---------------------------------------------------------------------------
describe('fmtDate', () => {
  it('puts the day first where the locale does, and the month first where it does', () => {
    expect(fmtDate('2026-10-08', undefined, 'en-GB')).toBe('08/10/2026')
    expect(fmtDate('2026-10-08', undefined, 'en-US')).toBe('10/08/2026')
    expect(fmtDate('2026-10-08', DATE_DAY_MONTH, 'de-DE')).toBe('08.10.')
  })
  it('reads the stored day as that calendar day, not UTC midnight', () => {
    expect(fmtDate('2026-01-01', DATE_WEEKDAY, 'en-GB')).toBe('Thu 1 Jan')
  })
  it('formats a month bucket', () => {
    expect(fmtDate('2026-10', DATE_MONTH, 'en-GB')).toBe('10/2026')
  })
  it('passes anything that is not a date through unchanged', () => {
    expect(fmtDate('', undefined, 'en-GB')).toBe('')
  })
})
