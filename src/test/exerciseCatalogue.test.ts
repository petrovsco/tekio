import { describe, it, expect } from 'vitest'
import { EXERCISE_CATALOGUE, catalogueEntryFor, catalogueProblems, linksFor, type CatalogueEntry } from '../constants/exerciseCatalogue'
import { MOVEMENT_PATTERNS, MUSCLES } from '../constants/movementPatterns'
import { MOVEMENT_AREAS } from '../constants/movementQuestion'

describe('the exercise catalogue (RFC 0074 standing check)', () => {
  it('has no problems', () => {
    expect(catalogueProblems(EXERCISE_CATALOGUE)).toEqual([])
  })

  it('names only real muscles', () => {
    const known = new Set<string>(MUSCLES)
    for (const e of EXERCISE_CATALOGUE) {
      for (const m of Object.keys(linksFor(e))) expect(known, `${e.name}: ${m}`).toContain(m)
    }
  })

  it('gives every pattern a prime mover', () => {
    for (const [k, p] of Object.entries(MOVEMENT_PATTERNS)) {
      expect(Object.values(p.links), k).toContain(1)
    }
  })
})

describe('catalogueProblems catches a planted bad link', () => {
  const base: CatalogueEntry = { name: 'Machine Curl', pattern: 'elbowFlexion' }

  it('a curl with Lats', () => {
    const planted = { ...base, links: { Biceps: 1, Lats: 2 } as const, reason: 'misclick' }
    expect(catalogueProblems([planted])).toEqual(['Machine Curl is a curl with a Lats link'])
  })

  it('an override with no reason', () => {
    expect(catalogueProblems([{ ...base, links: { Biceps: 1, Forearms: 2 } }]))
      .toEqual(['Machine Curl departs from elbowFlexion without a reason'])
  })

  it('an override that changes nothing', () => {
    expect(catalogueProblems([{ ...base, links: { Biceps: 1, Forearms: 3 }, reason: 'x' }]))
      .toEqual(['Machine Curl overrides elbowFlexion with the same links'])
  })

  it('two spellings of one name', () => {
    expect(catalogueProblems([base, { name: 'Hammer Curl', pattern: 'elbowFlexion', aliases: ['machine-curl'] }]))
      .toEqual(['"machine-curl" (an alias of Hammer Curl) collides with Machine Curl'])
  })
})

describe('the movement question', () => {
  it('offers every pattern exactly once', () => {
    const offered = MOVEMENT_AREAS.flatMap(a => a.choices.map(c => c.pattern)).sort()
    expect(offered).toEqual(Object.keys(MOVEMENT_PATTERNS).sort())
  })
})

describe('catalogueEntryFor', () => {
  it('finds a lift by its name or a spelling, ignoring case and punctuation', () => {
    expect(catalogueEntryFor('back squat')?.name).toBe('Back Squat')
    expect(catalogueEntryFor('Barbell-Back-Squat')?.name).toBe('Back Squat')
  })

  it('knows nothing about a name it does not list', () => {
    expect(catalogueEntryFor('Zercher Wheelbarrow Press')).toBeUndefined()
  })
})
