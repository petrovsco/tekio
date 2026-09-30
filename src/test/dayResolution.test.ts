import { describe, it, expect, vi, afterEach } from 'vitest'
import { weekdayOf, programMode, resolveTodayDay, isDayDoneInWeek, activeVariantWeekdays, variantGroups } from '../lib/utils'
import type { Program, ProgramDay, ProgramPhase, ProgramWeekOverride, WeightEntry } from '../types'

function day(name: string, opts: Partial<ProgramDay> = {}): ProgramDay {
  return { name, exercises: [], supersets: [], blocks: [], ...opts }
}

function program(days: ProgramDay[], opts: Partial<Program> = {}): Program {
  return { name: 'P', startDate: '2026-06-01', currentDayIndex: 0, lastAdvancedDate: '2026-06-01', days, ...opts }
}

const phase = (days: ProgramDay[]): ProgramPhase => ({ name: 'Main', sortOrder: 0, durationWeeks: 6, goal: 'general', days })

afterEach(() => vi.useRealTimers())

describe('weekdayOf', () => {
  it('maps dates to ISO weekday names', () => {
    expect(weekdayOf('2026-06-22')).toBe('Monday')
    expect(weekdayOf('2026-06-24')).toBe('Wednesday')
    expect(weekdayOf('2026-06-28')).toBe('Sunday')
  })
})

describe('programMode', () => {
  it('is weekday when any day is pinned', () => {
    const p = program([day('A', { dayOfWeek: 'Tuesday' }), day('B')], { phases: [phase([])] })
    expect(programMode(p)).toBe('weekday')
  })

  it('is flexible for a phased program with no pinned days', () => {
    const days = [day('A'), day('B')]
    expect(programMode(program(days, { phases: [phase(days)] }))).toBe('flexible')
  })

  it('is index for a legacy flat program (no phases, no pins)', () => {
    expect(programMode(program([day('A'), day('B')]))).toBe('index')
  })
})

describe('resolveTodayDay', () => {
  it('index mode follows currentDayIndex', () => {
    const p = program([day('A'), day('B'), day('C')], { currentDayIndex: 4 })
    expect(resolveTodayDay(p)?.name).toBe('B') // 4 % 3 = 1
  })

  it('weekday mode picks the day matching the date', () => {
    const p = program(
      [day('Mon', { dayOfWeek: 'Monday' }), day('Tue', { dayOfWeek: 'Tuesday' })],
      { phases: [phase([])] },
    )
    expect(resolveTodayDay(p, '2026-06-23')?.name).toBe('Tue') // Tuesday
  })

  it('weekday mode returns null on an unscheduled weekday (rest)', () => {
    const p = program([day('Mon', { dayOfWeek: 'Monday' })], { phases: [phase([])] })
    expect(resolveTodayDay(p, '2026-06-23')).toBeNull() // Tuesday, nothing scheduled
  })

  it('weekday mode prefers the non-variant base day', () => {
    const p = program([
      day('Thu base', { dayOfWeek: 'Thursday', isVariant: false }),
      day('Thu variant', { dayOfWeek: 'Thursday', isVariant: true }),
    ], { phases: [phase([])] })
    expect(resolveTodayDay(p, '2026-06-25')?.name).toBe('Thu base') // Thursday
  })

  it('weekday mode picks the variant when its weekday is toggled on', () => {
    const p = program([
      day('Thu base', { dayOfWeek: 'Thursday', isVariant: false }),
      day('Thu variant', { dayOfWeek: 'Thursday', isVariant: true }),
    ], { phases: [phase([])] })
    const on = new Set<'Thursday'>(['Thursday'])
    expect(resolveTodayDay(p, '2026-06-25', on)?.name).toBe('Thu variant')
    // A different toggled weekday doesn't affect Thursday
    expect(resolveTodayDay(p, '2026-06-25', new Set(['Friday' as const]))?.name).toBe('Thu base')
  })

  it('flexible mode returns null (checklist handles it)', () => {
    const days = [day('A'), day('B')]
    expect(resolveTodayDay(program(days, { phases: [phase(days)] }))).toBeNull()
  })
})

describe('isDayDoneInWeek', () => {
  const w = (date: string, ex: string): WeightEntry => ({ id: date + ex, date, exercise: ex, sets: [{ weight: 100, reps: 5 }] })

  it('is true when all weight exercises are logged within the week', () => {
    const d = day('Lower', { exercises: ['Back Squat', 'Face Pull'] })
    const weights = [w('2026-06-22', 'Back Squat'), w('2026-06-24', 'Face Pull')]
    expect(isDayDoneInWeek(weights, d, '2026-06-22', '2026-06-28')).toBe(true)
  })

  it('is false when an exercise is logged before the week', () => {
    const d = day('Lower', { exercises: ['Back Squat', 'Face Pull'] })
    const weights = [w('2026-06-22', 'Back Squat'), w('2026-06-15', 'Face Pull')]
    expect(isDayDoneInWeek(weights, d, '2026-06-22', '2026-06-28')).toBe(false)
  })

  it('is false for a day with no weight exercises', () => {
    expect(isDayDoneInWeek([], day('Swim'), '2026-06-22', '2026-06-28')).toBe(false)
  })
})

describe('activeVariantWeekdays', () => {
  const ov = (userProgramId: string, dayOfWeek: ProgramWeekOverride['dayOfWeek'], variantActive: boolean): ProgramWeekOverride =>
    ({ userProgramId, weekStartDate: '2026-06-22', dayOfWeek, variantActive })

  it('collects only active weekdays for the given program', () => {
    const overrides = [ov('up1', 'Thursday', true), ov('up1', 'Saturday', false), ov('up2', 'Thursday', true)]
    const set = activeVariantWeekdays(overrides, 'up1')
    expect(set.has('Thursday')).toBe(true)
    expect(set.has('Saturday')).toBe(false)
    expect(set.size).toBe(1)
  })
})

describe('variantGroups', () => {
  it('pairs each variant day with its base for the same weekday', () => {
    const p = program([
      day('Thu base', { dayOfWeek: 'Thursday', isVariant: false }),
      day('Thu variant', { dayOfWeek: 'Thursday', isVariant: true }),
      day('Mon swim', { dayOfWeek: 'Monday' }),
    ], { phases: [phase([])] })
    const groups = variantGroups(p)
    expect(groups).toHaveLength(1)
    expect(groups[0].weekday).toBe('Thursday')
    expect(groups[0].base?.name).toBe('Thu base')
    expect(groups[0].variant.name).toBe('Thu variant')
  })
})
