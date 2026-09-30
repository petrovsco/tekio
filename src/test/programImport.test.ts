import { describe, it, expect } from 'vitest'
import { parseProgramJson } from '../lib/programImport'

describe('parseProgramJson', () => {
  it('rejects invalid JSON', () => {
    const res = parseProgramJson('{ not json')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error).toMatch(/Invalid JSON/)
  })

  it('requires a name', () => {
    const res = parseProgramJson(JSON.stringify({ days: [] }))
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error).toMatch(/name/)
  })

  it('requires a non-empty days array', () => {
    const res = parseProgramJson(JSON.stringify({ name: 'P', days: [] }))
    expect(res.ok).toBe(false)
  })

  it('parses a day with typed blocks, tags and supersets', () => {
    const json = {
      name: 'Volleyball Program',
      startDate: '2026-06-22',
      weeklyPrinciples: { protein: '1.6g/kg', sleep: 8 },
      days: [
        {
          name: 'Tuesday — Lower',
          dayOfWeek: 'Tuesday',
          blocks: [
            {
              name: 'Squat block',
              type: 'weight',
              scheduledTime: '18:00',
              durationMinutes: 60,
              exercises: [
                { name: 'Back Squat', tag: 'STRENGTH', sets: 4, reps: 5, weight: '100 kg' },
                { name: 'Face Pull', tag: 'PREHAB' },
              ],
              supersets: [['Back Squat', 'Face Pull']],
            },
          ],
        },
      ],
    }
    const res = parseProgramJson(JSON.stringify(json))
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const p = res.program
    expect(p.name).toBe('Volleyball Program')
    expect(p.startDate).toBe('2026-06-22')
    expect(p.weeklyPrinciples).toEqual({ protein: '1.6g/kg', sleep: 8 })
    expect(p.phases?.length).toBe(1)
    expect(p.days.length).toBe(1)
    const day = p.days[0]
    expect(day.dayOfWeek).toBe('Tuesday')
    expect(day.blocks.length).toBe(1)
    const block = day.blocks![0]
    expect(block.blockType).toBe('weight')
    expect(block.scheduledTime).toBe('18:00')
    expect(block.durationMinutes).toBe(60)
    expect(block.exercises[0]).toMatchObject({ exercise: 'Back Squat', trainingTag: 'STRENGTH', setsText: '4', repsText: '5', weightText: '100 kg' })
    expect(block.supersets).toEqual([['Back Squat', 'Face Pull']])
    // flat view derived from weight block
    expect(day.exercises).toEqual(['Back Squat', 'Face Pull'])
    expect(day.supersets).toEqual([['Back Squat', 'Face Pull']])
  })

  it('defaults the training tag from the block type when omitted', () => {
    const json = {
      name: 'P',
      days: [{ name: 'Mon', blocks: [{ name: 'Swim', type: 'sport', exercises: [{ name: 'Freestyle' }] }] }],
    }
    const res = parseProgramJson(JSON.stringify(json))
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.program.days[0].blocks![0].exercises[0].trainingTag).toBe('SKILL')
    // sport block contributes nothing to the flat weight view
    expect(res.program.days[0].exercises).toEqual([])
  })

  it('rejects an unknown block type', () => {
    const res = parseProgramJson(JSON.stringify({ name: 'P', days: [{ name: 'D', blocks: [{ name: 'x', type: 'cardio' }] }] }))
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error).toMatch(/unknown block type/)
  })

  it('expands a variant into a second stored day', () => {
    const json = {
      name: 'P',
      days: [
        {
          name: 'Thursday — Upper',
          dayOfWeek: 'Thursday',
          blocks: [{ name: 'Upper Power', type: 'weight', exercises: [{ name: 'Bench', tag: 'STRENGTH' }] }],
          variant: {
            label: 'Volleyball variant',
            replacesBlock: 'Upper Power',
            alternateBlock: { name: 'Explosive primer', type: 'warmup', exercises: [{ name: 'Pogo Hops', tag: 'POWER' }] },
          },
        },
      ],
    }
    const res = parseProgramJson(JSON.stringify(json))
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.program.days.length).toBe(2)
    const [base, variant] = res.program.days
    expect(base.isVariant).toBe(false)
    expect(base.variantGroupKey).toBe('Thursday')
    expect(variant.isVariant).toBe(true)
    expect(variant.variantGroupKey).toBe('Thursday')
    expect(variant.name).toBe('Volleyball variant')
    // base block replaced by alternate
    expect(variant.blocks!.map(b => b.name)).toEqual(['Explosive primer'])
  })
})
