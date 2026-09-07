import { describe, it, expect } from 'vitest'
import { normaliseExerciseName, resolveExerciseName, spellingsFor } from '../lib/exerciseName'
import type { ExerciseAlias } from '../types'

const sys = (alias: string, canonicalName: string): ExerciseAlias => ({ alias, canonicalName, isOwn: false })
const own = (alias: string, canonicalName: string): ExerciseAlias => ({ alias, canonicalName, isOwn: true })

describe('normaliseExerciseName', () => {
  it('folds case, spacing and punctuation into one key', () => {
    const key = normaliseExerciseName('Push-ups')
    for (const spelling of ['push ups', 'PUSHUPS', 'Push-Ups', '  push_ups  ', 'push.ups']) {
      expect(normaliseExerciseName(spelling)).toBe(key)
    }
  })

  it('closes the trailing-punctuation twin', () => {
    expect(normaliseExerciseName('Hanging Leg Raises:')).toBe(normaliseExerciseName('Hanging Leg Raises'))
  })

  it('keeps digits, so 90/90 and 9090 are the same name but 45 is not', () => {
    expect(normaliseExerciseName('90/90 Hip Rotation')).toBe('9090hiprotation')
    expect(normaliseExerciseName('45/45 Hip Rotation')).not.toBe('9090hiprotation')
  })

  it('does not collapse different movements', () => {
    expect(normaliseExerciseName('Back Squat')).not.toBe(normaliseExerciseName('Front Squat'))
  })
})

describe('resolveExerciseName', () => {
  const names = ['Push-ups', 'Kettlebell Swing', 'Bench Press']
  const aliases = [sys('Press-ups', 'Push-ups'), sys('KB Swing', 'Kettlebell Swing')]

  it('finds a known exercise through a spelling difference alone', () => {
    expect(resolveExerciseName('pushups', names, aliases)).toBe('Push-ups')
  })

  it('finds it through an alias', () => {
    expect(resolveExerciseName('press ups', names, aliases)).toBe('Push-ups')
    expect(resolveExerciseName('kb-swing', names, aliases)).toBe('Kettlebell Swing')
  })

  it('returns null for a name it has never seen, so a new exercise is created', () => {
    expect(resolveExerciseName('Zercher Squat', names, aliases)).toBeNull()
  })

  it('lets a real exercise name win over an alias that would hijack it', () => {
    // A bad alias row claiming an existing exercise must not redirect its sets.
    const hijack = [sys('Bench Press', 'Push-ups')]
    expect(resolveExerciseName('Bench Press', names, hijack)).toBe('Bench Press')
  })

  it("prefers the user's own alias over the shipped one", () => {
    const both = [own('KB Swing', 'Bench Press'), sys('KB Swing', 'Kettlebell Swing')]
    expect(resolveExerciseName('kb swing', names, both)).toBe('Bench Press')
  })

  it('works for a user with zero exercises — the point of a name-level alias', () => {
    expect(resolveExerciseName('press ups', [], aliases)).toBe('Push-ups')
  })

  it('hands back the spelling on file when the alias target differs by punctuation', () => {
    expect(resolveExerciseName('KB Swing', ['Kettlebell-Swing'], aliases)).toBe('Kettlebell-Swing')
  })

  it('ignores empty and punctuation-only input', () => {
    expect(resolveExerciseName('   ', names, aliases)).toBeNull()
    expect(resolveExerciseName('---', names, aliases)).toBeNull()
  })
})

describe('spellingsFor', () => {
  it('lists every alias that reaches a name', () => {
    const aliases = [sys('KB Swing', 'Kettlebell Swing'), sys('KB Swings', 'Kettlebell Swing'), sys('Press-ups', 'Push-ups')]
    expect(spellingsFor('Kettlebell Swing', aliases)).toEqual(['KB Swing', 'KB Swings'])
    expect(spellingsFor('Deadlift', aliases)).toEqual([])
  })
})
