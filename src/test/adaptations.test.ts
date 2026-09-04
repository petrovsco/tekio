import { describe, it, expect } from 'vitest'
import {
  classifyWeightSet,
  classifyCardio,
  classifyCardioAdaptations,
  resolveExerciseAdaptation,
  adaptationCoverage,
  buildMuscleStatusTree,
  muscleStimulus,
  weightSetsIn,
  MUSCLE_QUALITIES,
  GAP_CUTOFF,
} from '../lib/adaptations'
import { muscleQualityStates, muscleWindow, rankMuscleGaps } from '../lib/fusedRead'
import type { CardioEntry, ExerciseMuscleLink, MuscleGroup, WeightEntry } from '../types'
import { ADAPTATIONS, ADAPTATION_MAP } from '../constants/adaptations'
import { MUSCLE_WINDOW_DAYS } from '../constants/app'

// ── rx blocks (grounded values, roadmap 039 S5–S8) ──────────────────────────

describe('rx prescriptions', () => {
  const rx = (key: string) => ADAPTATIONS.find(a => a.key === key)!.rx
  it('keeps the grounded strength and endurance load bands', () => {
    expect(rx('strength').load).toBe('85–100% 1RM')
    expect(rx('strength').reps).toBe('3–5')
    // S6 fork 2: the endurance load is the ACSM 2009 band, so load, reps and
    // effort describe the same set (a 15 RM is ≈65 % 1RM, not <50 %).
    expect(rx('muscular_endurance').load).toBe('40–60% 1RM')
    expect(rx('muscular_endurance').reps).toBe('15–40+')
  })
  it('keeps the grounded anaerobic and VO₂max fields (S7 + S8)', () => {
    // S7 forks 1–2: both floors moved to what the trials used — no located
    // protocol ran three rounds or rested less than 1:1 for anaerobic capacity.
    expect(rx('anaerobic_capacity').sets).toBe('4–8 rounds')
    expect(rx('anaerobic_capacity').rest).toBe('Incomplete (1:1–1:4)')
    // S8 fork 3: the 4×4 is Helgerud 2007's protocol and the cue says so;
    // fork 2: the effort is an even pace across reps, not a sprint.
    expect(rx('vo2max').cue).toMatch(/^Helgerud’s 4×4/)
    expect(rx('vo2max').effort).toBe('Max you can hold evenly across reps')
  })
})

// ── classifyWeightSet ─────────────────────────────────────────────────────────

describe('classifyWeightSet', () => {
  it('maps rep ranges to strength / hypertrophy / muscular endurance', () => {
    // Bands overlap (roadmap 039 §6.0; edges grounded in S11, ledger D30–D32):
    // strength [1, 5], hypertrophy [5, 30], muscular endurance [15, 999]. A set
    // inside an overlap counts in full toward each, in continuum order.
    // Outside every edge it snaps to the nearest band.
    expect(classifyWeightSet(1)).toEqual(['strength'])
    expect(classifyWeightSet(4)).toEqual(['strength'])
    expect(classifyWeightSet(5)).toEqual(['strength', 'hypertrophy'])
    expect(classifyWeightSet(6)).toEqual(['hypertrophy'])
    expect(classifyWeightSet(14)).toEqual(['hypertrophy'])
    expect(classifyWeightSet(15)).toEqual(['hypertrophy', 'muscular_endurance'])
    expect(classifyWeightSet(20)).toEqual(['hypertrophy', 'muscular_endurance'])
    expect(classifyWeightSet(30)).toEqual(['hypertrophy', 'muscular_endurance'])
    expect(classifyWeightSet(31)).toEqual(['muscular_endurance'])
    expect(classifyWeightSet(0)).toEqual(['strength'])
    expect(classifyWeightSet(1000)).toEqual(['muscular_endurance'])
  })

  it('lets an exercise override win outright over reps', () => {
    expect(classifyWeightSet(3, 'power')).toEqual(['power'])
    expect(classifyWeightSet(20, 'power')).toEqual(['power'])
  })
})

// ── classifyCardio ────────────────────────────────────────────────────────────

describe('classifyCardio', () => {
  const c = (duration: number): CardioEntry => ({ id: 'x', date: '2025-01-01', type: 'Running', duration })
  it('splits by duration proxy when no Training Effect data', () => {
    expect(classifyCardio(c(45))).toBe('endurance')
    expect(classifyCardio(c(25))).toBe('endurance')
    expect(classifyCardio(c(12))).toBe('vo2max')
    expect(classifyCardio(c(4))).toBe('anaerobic_capacity')
  })
})

// ── classifyCardioAdaptations (Garmin-informed) ───────────────────────────────

describe('classifyCardioAdaptations', () => {
  const base = { id: 'x', date: '2025-01-01', type: 'Cycling' as const, duration: 60 }

  it('falls back to the duration bucket without Training Effect', () => {
    expect(classifyCardioAdaptations({ ...base, duration: 60 })).toEqual(['endurance'])
    expect(classifyCardioAdaptations({ ...base, duration: 12 })).toEqual(['vo2max'])
  })

  it('maps an easy aerobic ride to endurance only', () => {
    // Long zone-2 ride: strong aerobic TE, negligible anaerobic.
    const out = classifyCardioAdaptations({ ...base, aerobicTe: 3.2, anaerobicTe: 0.4, trainingEffectLabel: 'BASE' })
    expect(out).toEqual(['endurance'])
  })

  it('counts a hard interval ride as BOTH vo2max and anaerobic (each TE ≥ 2.0)', () => {
    const out = classifyCardioAdaptations({ ...base, aerobicTe: 3.5, anaerobicTe: 2.4, trainingEffectLabel: 'VO2MAX' })
    expect(out).toContain('vo2max')
    expect(out).toContain('anaerobic_capacity')
    expect(out).not.toContain('endurance')
  })

  it('still counts the dominant system when nothing clears the threshold', () => {
    // Short easy spin: dominant aerobic but below the 2.0 stimulus threshold.
    const out = classifyCardioAdaptations({ ...base, aerobicTe: 1.4, anaerobicTe: 0.3, trainingEffectLabel: 'RECOVERY' })
    expect(out).toEqual(['endurance'])
  })

  it('uses HR zone distribution to split aerobic when unlabelled', () => {
    // More time in Z4–Z5 than Z1–Z2 → the aerobic stimulus is VO₂max, not base.
    const hard = classifyCardioAdaptations({ ...base, aerobicTe: 3.0, anaerobicTe: 0.5, zoneDistribution: [60, 120, 200, 600, 400] })
    expect(hard).toEqual(['vo2max'])
    const easy = classifyCardioAdaptations({ ...base, aerobicTe: 3.0, anaerobicTe: 0.5, zoneDistribution: [600, 900, 200, 60, 0] })
    expect(easy).toEqual(['endurance'])
  })
})

// ── resolveExerciseAdaptation ─────────────────────────────────────────────────

describe('resolveExerciseAdaptation', () => {
  it('uses built-in keyword defaults', () => {
    expect(resolveExerciseAdaptation('Box Jump')).toBe('power')
    expect(resolveExerciseAdaptation('Power Clean')).toBe('power')
    // Sprint / reactive keywords tagged the retired `speed` adaptation until
    // 2026-08-29; they now tag power (roadmap 019).
    expect(resolveExerciseAdaptation('40m Sprint')).toBe('power')
    expect(resolveExerciseAdaptation('Pogo Hops')).toBe('power')
  })

  it('returns null for ordinary lifts (fall back to reps)', () => {
    expect(resolveExerciseAdaptation('Back Squat')).toBeNull()
    expect(resolveExerciseAdaptation('Bench Press')).toBeNull()
  })

  it('lets user overrides win over keyword defaults', () => {
    expect(resolveExerciseAdaptation('Box Jump', { 'box jump': 'strength' })).toBe('strength')
  })

  // `hop` / `jump` match whole words only, and rope skipping is conditioning —
  // a chop or a skip must not become a power set (roadmap 039 S4).
  it('keeps chops, jumping jacks and jump rope out of power', () => {
    expect(resolveExerciseAdaptation('Cable Woodchop')).toBeNull()
    expect(resolveExerciseAdaptation('Jumping Jacks')).toBeNull()
    expect(resolveExerciseAdaptation('Jump Rope')).toBeNull()
  })

  it('still tags hops, jumps and clapping push-ups as power', () => {
    expect(resolveExerciseAdaptation('Skater Hop')).toBe('power')
    expect(resolveExerciseAdaptation('Skater Hops')).toBe('power')
    expect(resolveExerciseAdaptation('Jump Back Squat')).toBe('power')
    expect(resolveExerciseAdaptation('Clapping Push-up')).toBe('power')
  })
})

// ── buildMuscleStatusTree ─────────────────────────────────────────────────────

const groups: MuscleGroup[] = [
  { id: 'chest', name: 'Chest', bodyRegion: 'upper', parentId: null },
  { id: 'shoulders', name: 'Shoulders', bodyRegion: 'upper', parentId: null },
  { id: 'front-delt', name: 'Front Delt', bodyRegion: 'upper', parentId: 'shoulders' },
]

describe('buildMuscleStatusTree', () => {
  it('rolls children into parents and assigns status by target', () => {
    const tree = buildMuscleStatusTree({ Chest: 12, 'Front Delt': 4 }, groups, 10)
    const chest = tree.find(r => r.id === 'chest')!
    const shoulders = tree.find(r => r.id === 'shoulders')!
    expect(chest.status).toBe('on_track') // 12/10 = 1.2 ≥ GAP_CUTOFF
    expect(shoulders.aggSets).toBe(4)      // rolled up from child
    expect(shoulders.status).toBe('needs_work') // 0.4 < GAP_CUTOFF
    expect(shoulders.children[0].name).toBe('Front Delt')
  })

  it('marks untouched groups', () => {
    const tree = buildMuscleStatusTree({}, groups, 10)
    expect(tree.every(r => r.status === 'untouched')).toBe(true)
  })
})

// ── adaptationCoverage ────────────────────────────────────────────────────────

const links: ExerciseMuscleLink[] = [
  { exercise: 'Bench Press', group: 'Chest', region: 'upper', level: 1, contribution: 'stimulus' },
  { exercise: 'Box Jump', group: 'Front Delt', region: 'upper', level: 1, contribution: 'stimulus' },
]

function w(id: string, date: string, exercise: string, reps: number, nSets: number): WeightEntry {
  return { id, date, exercise, sets: Array.from({ length: nSets }, () => ({ weight: 60, reps })) }
}

describe('adaptationCoverage', () => {
  it('classifies sets into adaptations and accumulates muscle stimulus', () => {
    const cov = adaptationCoverage({
      weights: [
        w('a', '2025-01-02', 'Bench Press', 4, 3),  // strength ×3, Chest lvl1 → 3
        w('b', '2025-01-03', 'Bench Press', 10, 4), // hypertrophy ×4, Chest → 4
        w('c', '2025-01-03', 'Box Jump', 5, 5),     // power ×5 (keyword), Front Delt → 5
      ],
      cardio: [{ id: 'r', date: '2025-01-04', type: 'Running', duration: 45 }],
      // 20-min Tennis session → classified as cardio by duration (VO₂max).
      sports: [{ id: 's', date: '2025-01-04', sport: 'Tennis', withTrainer: false, quality: 3, notes: '', duration: 20 }],
      exerciseMuscles: links,
      muscleGroups: groups,
      from: '2025-01-01',
      date: '2025-01-07',
    })

    expect(cov.strength.volume).toBe(3)
    expect(cov.hypertrophy.volume).toBe(4)
    expect(cov.power.volume).toBe(5)
    expect(cov.endurance.volume).toBe(1)      // Running 45 min
    expect(cov.vo2max.volume).toBe(1)         // Tennis 20 min → cardio, not a skill count

    const chestStrength = cov.strength.muscles.find(m => m.id === 'chest')!
    expect(chestStrength.aggSets).toBe(3)
    const chestHyp = cov.hypertrophy.muscles.find(m => m.id === 'chest')!
    expect(chestHyp.aggSets).toBe(4)
    // Box Jump power routed to Front Delt (child of Shoulders)
    const shouldersPower = cov.power.muscles.find(m => m.id === 'shoulders')!
    expect(shouldersPower.aggSets).toBe(5)
  })

  it('counts a Garmin ride toward every stimulated adaptation', () => {
    const cov = adaptationCoverage({
      weights: [],
      // Hard interval ride: aerobic TE 3.5 (VO₂max) + anaerobic TE 2.4 → both count.
      cardio: [{
        id: 'g', date: '2025-01-04', type: 'Cycling', duration: 55,
        aerobicTe: 3.5, anaerobicTe: 2.4, trainingEffectLabel: 'VO2MAX', source: 'garmin',
      }],
      sports: [],
      exerciseMuscles: links,
      muscleGroups: groups,
      from: '2025-01-01',
      date: '2025-01-07',
    })
    expect(cov.vo2max.volume).toBe(1)
    expect(cov.anaerobic_capacity.volume).toBe(1)
    expect(cov.endurance.volume).toBe(0)
  })

  it('ignores entries outside the week window', () => {
    const cov = adaptationCoverage({
      weights: [w('a', '2024-12-30', 'Bench Press', 4, 3)],
      cardio: [],
      sports: [],
      exerciseMuscles: links,
      muscleGroups: groups,
      from: '2025-01-01',
      date: '2025-01-07',
    })
    expect(cov.strength.volume).toBe(0)
  })

  it('scales the weekly targets to the window — rate × days / 7 (roadmap 031)', () => {
    const cov = adaptationCoverage({
      weights: [], cardio: [], sports: [],
      exerciseMuscles: links, muscleGroups: groups,
      from: '2025-01-01', date: '2025-01-14', windowDays: 14,
    })
    expect(cov.endurance.sessionTarget).toBe(4) // 2/wk over two weeks
    expect(cov.strength.muscles.find(m => m.id === 'chest')!.target).toBe(12) // 6/wk over two weeks
  })

  it('counts each set once in total and once per quality it trains', () => {
    const stim = muscleStimulus(
      [
        w('a', '2025-01-02', 'Bench Press', 4, 3),
        w('b', '2025-01-03', 'Bench Press', 10, 4),
        w('c', '2025-01-04', 'Bench Press', 20, 2),
      ],
      links, { from: '2025-01-01', to: '2025-01-07' },
    )
    // 9 sets of work; the 20-rep sets are hypertrophy AND endurance (S11).
    expect(stim.total.Chest).toBe(9)
    expect(stim.byQuality.strength.Chest).toBe(3)
    expect(stim.byQuality.hypertrophy.Chest).toBe(6)
    expect(stim.byQuality.muscular_endurance.Chest).toBe(2)
    expect(stim.sets.strength).toBe(3)
    // The overlap invariant (039 §6.0): the per-quality figures bracket the
    // total — here max 6 ≤ 9 ≤ sum 11. Power sits outside the bracket
    // (039 S3) — it never enters `total`.
    const hardQualities = MUSCLE_QUALITIES.filter(q => q !== 'power')
    for (const m of Object.keys(stim.total)) {
      const parts = hardQualities.map(q => stim.byQuality[q][m] ?? 0)
      expect(Math.max(...parts)).toBeLessThanOrEqual(stim.total[m])
      expect(parts.reduce((s, v) => s + v, 0)).toBeGreaterThanOrEqual(stim.total[m])
    }
  })

  it('routes an override to its quality only; recovery links never add sets', () => {
    const recovery: ExerciseMuscleLink = { exercise: 'Bench Press', group: 'Front Delt', region: 'upper', level: 2, contribution: 'recovery' }
    const stim = muscleStimulus(
      [w('a', '2025-01-02', 'Bench Press', 10, 2)],
      [...links, recovery], { from: '2025-01-01', to: '2025-01-07' }, { 'bench press': 'power' },
    )
    expect(stim.byQuality.power.Chest).toBe(2)
    expect(stim.byQuality.hypertrophy.Chest).toBeUndefined()
    expect(stim.total['Front Delt']).toBeUndefined()
  })

  it('gives a level-3 link nothing: no total, no quality bucket, no key (roadmap 042)', () => {
    const stabiliser: ExerciseMuscleLink = { exercise: 'Bench Press', group: 'Medial Delt', region: 'upper', level: 3, contribution: 'stimulus' }
    const stim = muscleStimulus(
      [w('a', '2025-01-02', 'Bench Press', 10, 3)],
      [...links, stabiliser], { from: '2025-01-01', to: '2025-01-07' },
    )
    expect(stim.total.Chest).toBe(3)
    expect(stim.byQuality.hypertrophy.Chest).toBe(3)
    expect('Medial Delt' in stim.total).toBe(false)
    expect('Medial Delt' in stim.byQuality.hypertrophy).toBe(false)
  })

  it('leaves power sets out of the hard-set total (039 S3)', () => {
    const stim = muscleStimulus(
      [w('a', '2025-01-02', 'Bench Press', 10, 3), w('b', '2025-01-03', 'Bench Press', 5, 4)],
      links, { from: '2025-01-01', to: '2025-01-07' }, { 'bench press': 'power' },
    )
    // Both entries are power via the override: they show on the power map...
    expect(stim.byQuality.power.Chest).toBe(7)
    expect(stim.sets.power).toBe(7)
    // ...and buy nothing toward the pooled floor Home measures against.
    expect(stim.total.Chest).toBeUndefined()

    const mixed = muscleStimulus(
      [w('a', '2025-01-02', 'Bench Press', 10, 3), w('b', '2025-01-03', 'Box Jump', 5, 4)],
      [...links, { exercise: 'Box Jump', group: 'Chest', region: 'upper', level: 1, contribution: 'stimulus' }],
      { from: '2025-01-01', to: '2025-01-07' },
    )
    // Keyword power (Box Jump) behaves the same: 3 hard sets, 4 power sets.
    expect(mixed.total.Chest).toBe(3)
    expect(mixed.byQuality.hypertrophy.Chest).toBe(3)
    expect(mixed.byQuality.power.Chest).toBe(4)
  })

  it('weightSetsIn counts sets once inside the window', () => {
    const ws = [w('a', '2025-01-02', 'Bench Press', 10, 2), w('z', '2024-12-01', 'Bench Press', 4, 9)]
    expect(weightSetsIn(ws, '2025-01-01', '2025-01-07')).toBe(2)
  })
})

// ── one threshold: the counter reads the map's GAP_CUTOFF (roadmap 045) ──────

describe('on target — counter, "Short:" line and map callouts read one line', () => {
  // The drill-down's window: MUSCLE_WINDOW_DAYS ending on `date`, weekly rate
  // scaled to it — the same construction AdaptationsTab feeds both reads.
  const date = '2025-01-14'
  const { from } = muscleWindow(date)
  const weekly = ADAPTATION_MAP.hypertrophy.weeklyMuscleTarget
  const target = weekly * MUSCLE_WINDOW_DAYS / 7
  const chestOnly = groups.filter(g => g.id === 'chest')

  // Both surfaces at once: `met` drives the header count and the "Short:"
  // line; the callouts are the leaves under GAP_CUTOFF on the quality map.
  function read(weights: WeightEntry[], muscleGroups: MuscleGroup[], exerciseMuscles = links, tracked?: string[]) {
    const cov = adaptationCoverage({
      weights, cardio: [], sports: [], exerciseMuscles, muscleGroups,
      from, date, windowDays: MUSCLE_WINDOW_DAYS, trackedMuscleIds: tracked,
    })
    const states = muscleQualityStates(weights, exerciseMuscles, muscleGroups, 'hypertrophy', weekly, undefined, date)
    const callouts = rankMuscleGaps(states).filter(m => m.fillFraction < GAP_CUTOFF).map(m => m.name)
    return { met: cov.hypertrophy.met, callouts, muscles: cov.hypertrophy.muscles }
  }

  it('a muscle at 0.85 of target is on target and draws no callout', () => {
    const r = read([w('a', '2025-01-10', 'Bench Press', 10, Math.round(target * 0.85))], chestOnly)
    const fill = r.muscles.find(m => m.id === 'chest')!.fillFraction
    expect(fill).toBeGreaterThanOrEqual(GAP_CUTOFF)
    expect(fill).toBeLessThan(1) // short of the 100 % floor — the old bar would have said "Short:"
    expect(r.met).toBe(true)
    expect(r.callouts).toEqual([])
  })

  it('a muscle at 0.50 of target is short and is the callout', () => {
    const r = read([w('a', '2025-01-10', 'Bench Press', 10, target * 0.5)], chestOnly)
    expect(r.met).toBe(false)
    expect(r.callouts).toEqual(['Chest'])
  })

  it('judges the leaves the map draws, not the rolled-up parent', () => {
    // Front Delt full fills Shoulders' roll-up too, but the map draws leaves and
    // Rear Delt is untouched — so the counter must read "short" with it.
    const shoulders: MuscleGroup[] = [
      { id: 'shoulders', name: 'Shoulders', bodyRegion: 'upper', parentId: null },
      { id: 'front-delt', name: 'Front Delt', bodyRegion: 'upper', parentId: 'shoulders' },
      { id: 'rear-delt', name: 'Rear Delt', bodyRegion: 'upper', parentId: 'shoulders' },
    ]
    const press: ExerciseMuscleLink[] = [
      { exercise: 'Overhead Press', group: 'Front Delt', region: 'upper', level: 1, contribution: 'stimulus' },
    ]
    const r = read([w('a', '2025-01-10', 'Overhead Press', 10, target)], shoulders, press, ['shoulders'])
    expect(r.muscles.find(m => m.id === 'shoulders')!.fillFraction).toBe(1)
    expect(r.met).toBe(false)
    expect(r.callouts).toEqual(['Rear Delt'])
  })
})
