import { describe, it, expect } from 'vitest'
import {
  classifyWeightSet,
  classifyCardio,
  classifyCardioAdaptations,
  classifySportAdaptations,
  ENDURANCE_FLOOR_MIN,
  TE_STIMULUS_THRESHOLD,
  ANAEROBIC_BOUT_MAX_S,
  VO2MAX_Z5_MIN,
  SPORT_DEFAULT_ADAPTATION,
  typedHrBand,
  classifyTypedHr,
  isThresholdCardio,
  isThresholdSport,
  thresholdEnduranceCount,
  HR_ENDURANCE_MAX_PCT,
  HR_VO2MAX_MIN_PCT,
  resolveExerciseAdaptation,
  adaptationCoverage,
  buildMuscleStatusTree,
  muscleStimulus,
  weightSetsIn,
  MUSCLE_QUALITIES,
  GAP_CUTOFF,
} from '../lib/adaptations'
import { muscleQualityStates, muscleWindow, rankMuscleGaps } from '../lib/fusedRead'
import type { CardioEntry, CardioFormat, ExerciseMuscleLink, MuscleGroup, SportEntry, WeightEntry } from '../types'
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

// The rules are docs/grounding/005-hr-zone-intensity-classification.md (2026-09-06).

describe('classifyCardio — no intensity data (005 run B)', () => {
  const c = (duration: number, format?: CardioFormat): CardioEntry => ({ id: 'x', date: '2025-01-01', type: 'Running', duration, format })
  it('duration is an endurance-credit floor, never a VO₂max or anaerobic selector', () => {
    expect(classifyCardio(c(45))).toBe('endurance')
    expect(classifyCardio(c(ENDURANCE_FLOOR_MIN))).toBe('endurance')
    expect(classifyCardio(c(12))).toBeNull()
    expect(classifyCardio(c(4))).toBeNull()
    expect(classifyCardio(c(15, 'steady'))).toBeNull()
  })
  it('an intervals row with no data is VO₂max — the app’s own 4×4 — whatever its length', () => {
    expect(classifyCardio(c(36, 'intervals'))).toBe('vo2max')
    expect(classifyCardio(c(10, 'intervals'))).toBe('vo2max')
  })
})

// ── The typed-HR path (005 run B, built in 059) ───────────────────────────────

describe('typedHrBand / classifyTypedHr — a typed average HR against the profile HRmax (059)', () => {
  const HRMAX = 196 // the user's replicated observed peak on 2026-09-07
  const c = (duration: number, avgHr?: number, extra: Partial<CardioEntry> = {}): CardioEntry =>
    ({ id: 'x', date: '2025-01-01', type: 'Indoor Rowing', duration, avgHr, ...extra })
  it('bands in whole percent at the grounded cuts: ≤ 83 endurance, 84–88 threshold, ≥ 89 VO₂max', () => {
    expect(HR_ENDURANCE_MAX_PCT).toBe(83)
    expect(HR_VO2MAX_MIN_PCT).toBe(89)
    expect(typedHrBand(163, HRMAX)).toBe('endurance')   // 83.2 % → 83
    expect(typedHrBand(164, HRMAX)).toBe('threshold')   // 83.7 % → 84
    expect(typedHrBand(173, HRMAX)).toBe('threshold')   // 88.3 % → 88
    expect(typedHrBand(174, HRMAX)).toBe('vo2max')      // 88.8 % → 89
    expect(typedHrBand(120, HRMAX)).toBe('endurance')   // no lower cut — 005 B set none
  })
  it('never divides by a guess: no HR or no HRmax is null, and the row falls to the duration floor', () => {
    expect(typedHrBand(undefined, HRMAX)).toBeNull()
    expect(typedHrBand(160, null)).toBeNull()
    expect(typedHrBand(160, 0)).toBeNull()
    expect(classifyTypedHr(c(45, 175), null)).toBeNull()
    expect(classifyCardio(c(45, 175))).toBe('endurance')
    expect(classifyCardio(c(20, 175))).toBeNull()
  })
  it('the HR picks the bucket, the existing floors decide the credit', () => {
    expect(classifyCardio(c(30, 175), HRMAX)).toBe('vo2max')
    expect(classifyCardio(c(VO2MAX_Z5_MIN, 175), HRMAX)).toBe('vo2max')
    expect(classifyCardio(c(VO2MAX_Z5_MIN - 1, 175), HRMAX)).toBeNull()
    expect(classifyCardio(c(45, 160), HRMAX)).toBe('endurance')   // 82 %
    expect(classifyCardio(c(45, 170), HRMAX)).toBe('endurance')   // 87 % — threshold is a label (057), not a bucket
    expect(classifyCardio(c(ENDURANCE_FLOOR_MIN - 1, 160), HRMAX)).toBeNull()
  })
  it('Garmin data and the intervals format both win over the typed HR', () => {
    expect(classifyCardio(c(45, 175, { aerobicTe: 2.5, anaerobicTe: 1.0 }), HRMAX)).toBe('endurance')
    expect(classifyCardio(c(45, 175, { format: 'steady' }), HRMAX)).toBe('vo2max')
    expect(classifyCardio(c(30, 140, { format: 'intervals' }), HRMAX)).toBe('vo2max')
    expect(classifyCardio(c(30, 140, { format: 'intervals', boutSeconds: 60 }), HRMAX)).toBe('anaerobic_capacity')
  })
  it('the denominator moves the read: 160 bpm is threshold-band endurance at 185 and plain endurance at 196; 170 is VO₂max at 185 only', () => {
    expect(typedHrBand(160, 185)).toBe('threshold')   // 86 %
    expect(typedHrBand(160, 196)).toBe('endurance')   // 82 %
    expect(classifyCardio(c(30, 170), 185)).toBe('vo2max')      // 92 %
    expect(classifyCardio(c(30, 170), 196)).toBe('endurance')   // 87 %
  })
})

// ── classifyCardioAdaptations (Garmin-informed, 005 run A) ────────────────────

describe('classifyCardioAdaptations', () => {
  const base = { id: 'x', date: '2025-01-01', type: 'Cycling' as const, duration: 60 }

  it('credits one adaptation or none — never two for one session', () => {
    for (const e of [
      { ...base, aerobicTe: 3.5, anaerobicTe: 2.4, trainingEffectLabel: 'VO2MAX' },
      { ...base, format: 'intervals' as const, aerobicTe: 3.2, anaerobicTe: 2.4, trainingEffectLabel: 'SPEED' },
      { ...base, aerobicTe: 3.2, anaerobicTe: 0.4, trainingEffectLabel: 'AEROBIC_BASE' },
    ]) expect(classifyCardioAdaptations(e).length).toBeLessThanOrEqual(1)
  })

  it('maps an easy aerobic ride to endurance', () => {
    const out = classifyCardioAdaptations({ ...base, aerobicTe: 3.2, anaerobicTe: 0.4, trainingEffectLabel: 'AEROBIC_BASE' })
    expect(out).toEqual(['endurance'])
  })

  it('credits nothing below the aerobic floor — a walk at TE 0.7 is not an endurance session', () => {
    expect(classifyCardioAdaptations({ ...base, aerobicTe: 0.7, anaerobicTe: 0.0, trainingEffectLabel: 'RECOVERY' })).toEqual([])
    expect(classifyCardioAdaptations({ ...base, aerobicTe: 1.4, anaerobicTe: 0.3, trainingEffectLabel: 'RECOVERY' })).toEqual([])
    expect(classifyCardioAdaptations({ ...base, aerobicTe: TE_STIMULUS_THRESHOLD, anaerobicTe: 0.1, trainingEffectLabel: 'AEROBIC_BASE' })).toEqual(['endurance'])
  })

  it('a 4×4 flagged intervals is VO₂max, whatever Garmin’s whole-session label says', () => {
    const n4x4 = { ...base, format: 'intervals' as const, duration: 36, aerobicTe: 3.0, anaerobicTe: 2.1 }
    expect(classifyCardioAdaptations({ ...n4x4, trainingEffectLabel: 'AEROBIC_BASE' })).toEqual(['vo2max'])
    expect(classifyCardioAdaptations({ ...n4x4, trainingEffectLabel: 'RECOVERY' })).toEqual(['vo2max'])
    expect(classifyCardioAdaptations({ ...n4x4, trainingEffectLabel: 'SPEED', zoneDistribution: [130, 580, 480, 800, 40] })).toEqual(['vo2max'])
  })

  it('on an intervals row the bout length decides first: ≤ 120 s is anaerobic capacity, longer is VO₂max', () => {
    const iv = { ...base, format: 'intervals' as const, duration: 30, aerobicTe: 3.0, anaerobicTe: 2.1, trainingEffectLabel: 'AEROBIC_BASE' }
    expect(classifyCardioAdaptations({ ...iv, boutSeconds: 60 })).toEqual(['anaerobic_capacity'])
    expect(classifyCardioAdaptations({ ...iv, boutSeconds: ANAEROBIC_BOUT_MAX_S })).toEqual(['anaerobic_capacity'])
    expect(classifyCardioAdaptations({ ...iv, boutSeconds: 240 })).toEqual(['vo2max'])
    // The bout beats the Z5 dose and the TE tie-break, both ways.
    expect(classifyCardioAdaptations({ ...iv, boutSeconds: 45, zoneDistribution: [60, 120, 200, 600, VO2MAX_Z5_MIN * 60] })).toEqual(['anaerobic_capacity'])
    expect(classifyCardioAdaptations({ ...iv, boutSeconds: 240, aerobicTe: 1.8, anaerobicTe: 2.6 })).toEqual(['vo2max'])
    // On a steady / unstated row the field means nothing and is ignored.
    expect(classifyCardioAdaptations({ ...base, boutSeconds: 60, aerobicTe: 3.0, anaerobicTe: 0.4, trainingEffectLabel: 'AEROBIC_BASE' })).toEqual(['endurance'])
  })

  it('anaerobic TE ≥ 2.0 never awards anaerobic capacity on its own; on an intervals row anaerobic > aerobic is the vendor tie-break', () => {
    expect(classifyCardioAdaptations({ ...base, aerobicTe: 3.5, anaerobicTe: 2.4, trainingEffectLabel: 'AEROBIC_BASE' })).toEqual(['endurance'])
    expect(classifyCardioAdaptations({ ...base, format: 'intervals', duration: 20, aerobicTe: 1.8, anaerobicTe: 2.6, trainingEffectLabel: 'ANAEROBIC_CAPACITY' }))
      .toEqual(['anaerobic_capacity'])
  })

  it('≥ 8 min in Z5 makes a steady session VO₂max; Z4 time never decides', () => {
    const z5Long = classifyCardioAdaptations({ ...base, aerobicTe: 3.0, anaerobicTe: 0.5, zoneDistribution: [60, 120, 200, 600, VO2MAX_Z5_MIN * 60] })
    expect(z5Long).toEqual(['vo2max'])
    // The old rule's "hard" fixture: Z4+Z5 > Z1+Z2 but only 6.7 min in Z5 → endurance.
    const z4Heavy = classifyCardioAdaptations({ ...base, aerobicTe: 3.0, anaerobicTe: 0.5, zoneDistribution: [60, 120, 200, 600, 400] })
    expect(z4Heavy).toEqual(['endurance'])
    const easy = classifyCardioAdaptations({ ...base, aerobicTe: 3.0, anaerobicTe: 0.5, zoneDistribution: [600, 900, 200, 60, 0] })
    expect(easy).toEqual(['endurance'])
  })

  it('Garmin’s VO₂max-family label is a fallback read only when zones are absent', () => {
    expect(classifyCardioAdaptations({ ...base, aerobicTe: 3.4, anaerobicTe: 1.0, trainingEffectLabel: 'VO2MAX' })).toEqual(['vo2max'])
    expect(classifyCardioAdaptations({ ...base, aerobicTe: 3.4, anaerobicTe: 1.0, trainingEffectLabel: 'VO2MAX', zoneDistribution: [300, 900, 900, 600, 200] }))
      .toEqual(['endurance'])
  })

  it('tempo / lactate-threshold work is endurance — the adaptation it trains, by a harder route than Zone 2 (fork 1b)', () => {
    expect(classifyCardioAdaptations({ ...base, aerobicTe: 3.3, anaerobicTe: 0.8, trainingEffectLabel: 'TEMPO' })).toEqual(['endurance'])
    expect(classifyCardioAdaptations({ ...base, aerobicTe: 3.6, anaerobicTe: 1.2, trainingEffectLabel: 'LACTATE_THRESHOLD', zoneDistribution: [100, 400, 900, 1500, 100] })).toEqual(['endurance'])
    // The aerobic floor still applies: a short tempo effort at TE 1.5 credits nothing.
    expect(classifyCardioAdaptations({ ...base, duration: 12, aerobicTe: 1.5, anaerobicTe: 0.6, trainingEffectLabel: 'TEMPO' })).toEqual([])
  })
})

describe('classifySportAdaptations', () => {
  const s = (extra: Partial<SportEntry> = {}): SportEntry => ({ id: 's', date: '2025-01-01', sport: 'Tennis', withTrainer: false, quality: 3, notes: '', ...extra })
  it('a hand-logged match (no Garmin data) is endurance by convention, timed or not', () => {
    expect(classifySportAdaptations(s({ duration: 90 }))).toEqual([SPORT_DEFAULT_ADAPTATION])
    expect(classifySportAdaptations(s({ duration: 20 }))).toEqual(['endurance'])
    expect(classifySportAdaptations(s())).toEqual(['endurance'])
    expect(classifySportAdaptations(s({ duration: 60, avgHr: 150 }))).toEqual(['endurance'])
    // A typed HR never promotes a match (059 decision 4): HR over-reads tennis by
    // about a zone, and Z5 = 0 on every synced match. The threshold label is 057's.
    expect(classifySportAdaptations(s({ duration: 60, avgHr: 178 }))).toEqual(['endurance'])
  })
  // The three matches the watch had synced by 2026-09-06 (058): two are
  // SPEED-labelled, but zones are present and Z5 = 0, so the label never decides.
  it('a synced match reads its Garmin data through the cardio rules — the three synced matches stay endurance', () => {
    expect(classifySportAdaptations(s({ duration: 47.24, avgHr: 146, maxHr: 173, aerobicTe: 3.1, anaerobicTe: 2.5, trainingEffectLabel: 'SPEED', trainingLoad: 115.55, zoneDistribution: [155.5, 690, 1128, 861.1, 0] }))).toEqual(['endurance'])
    expect(classifySportAdaptations(s({ duration: 46.31, avgHr: 139, maxHr: 171, aerobicTe: 2.7, anaerobicTe: 2.2, trainingEffectLabel: 'SPEED', trainingLoad: 76.5, zoneDistribution: [177, 1194, 1252.4, 153, 0] }))).toEqual(['endurance'])
    expect(classifySportAdaptations(s({ duration: 43.16, avgHr: 124, maxHr: 172, aerobicTe: 2.3, anaerobicTe: 2.0, trainingEffectLabel: 'RECOVERY', trainingLoad: 54.47, zoneDistribution: [654.1, 1059.8, 561, 104, 0] }))).toEqual(['endurance'])
  })
  it('below the aerobic floor a synced match credits nothing — the convention is for rows with no data, not a rescue', () => {
    expect(classifySportAdaptations(s({ duration: 40, aerobicTe: 1.6, anaerobicTe: 0.9, trainingEffectLabel: 'RECOVERY', zoneDistribution: [900, 800, 300, 40, 0] }))).toEqual([])
    expect(classifySportAdaptations(s({ duration: 40, aerobicTe: TE_STIMULUS_THRESHOLD, anaerobicTe: 0.9, trainingEffectLabel: 'RECOVERY', zoneDistribution: [900, 800, 300, 40, 0] }))).toEqual(['endurance'])
  })
  it('8 min in Z5 makes a match VO₂max work whatever the label; the label stands in only when zones are absent', () => {
    expect(classifySportAdaptations(s({ duration: 60, aerobicTe: 3.8, anaerobicTe: 2.9, trainingEffectLabel: 'AEROBIC_BASE', zoneDistribution: [100, 500, 900, 1500, VO2MAX_Z5_MIN * 60] }))).toEqual(['vo2max'])
    expect(classifySportAdaptations(s({ duration: 40, aerobicTe: 3.0, anaerobicTe: 2.4, trainingEffectLabel: 'SPEED' }))).toEqual(['vo2max'])
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
      // 20-min Tennis session → a match is endurance (005 run B), not a skill count.
      sports: [{ id: 's', date: '2025-01-04', sport: 'Tennis', withTrainer: false, quality: 3, notes: '', duration: 20 }],
      exerciseMuscles: links,
      muscleGroups: groups,
      from: '2025-01-01',
      date: '2025-01-07',
    })

    expect(cov.strength.volume).toBe(3)
    expect(cov.hypertrophy.volume).toBe(4)
    expect(cov.power.volume).toBe(5)
    expect(cov.endurance.volume).toBe(2)      // Running 45 min (≥ the 25-min floor) + the tennis match
    expect(cov.vo2max.volume).toBe(0)

    const chestStrength = cov.strength.muscles.find(m => m.id === 'chest')!
    expect(chestStrength.aggSets).toBe(3)
    const chestHyp = cov.hypertrophy.muscles.find(m => m.id === 'chest')!
    expect(chestHyp.aggSets).toBe(4)
    // Box Jump power routed to Front Delt (child of Shoulders)
    const shouldersPower = cov.power.muscles.find(m => m.id === 'shoulders')!
    expect(shouldersPower.aggSets).toBe(5)
  })

  it('counts a Garmin ride toward one adaptation — anaerobic TE ≥ 2.0 no longer double-counts it (005)', () => {
    const cov = adaptationCoverage({
      weights: [],
      // Hard ride, no zones: the VO2MAX label is the fallback → VO₂max only.
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
    expect(cov.anaerobic_capacity.volume).toBe(0)
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

// ── The threshold label (roadmap 057) ────────────────────────────────────────

describe('isThresholdCardio / isThresholdSport / thresholdEnduranceCount', () => {
  const HRMAX = 196
  const c = (extra: Partial<CardioEntry> = {}): CardioEntry =>
    ({ id: 'x', date: '2025-01-10', type: 'Running', duration: 45, ...extra })
  const s = (extra: Partial<SportEntry> = {}): SportEntry =>
    ({ id: 'y', date: '2025-01-10', sport: 'Tennis', withTrainer: false, quality: 3, notes: '', duration: 60, ...extra })

  it('flags Garmin’s own two words and nothing else', () => {
    expect(isThresholdCardio(c({ aerobicTe: 3.3, trainingEffectLabel: 'TEMPO' }))).toBe(true)
    expect(isThresholdCardio(c({ aerobicTe: 3.6, trainingEffectLabel: 'LACTATE_THRESHOLD' }))).toBe(true)
    expect(isThresholdCardio(c({ aerobicTe: 3.2, trainingEffectLabel: 'AEROBIC_BASE' }))).toBe(false)
    expect(isThresholdCardio(c({ aerobicTe: 4.1, trainingEffectLabel: 'VO2MAX' }))).toBe(false)
    expect(isThresholdCardio(c())).toBe(false)
  })

  it('reads a typed average HR in the 84–88 % band when the row carries no Garmin word', () => {
    expect(isThresholdCardio(c({ avgHr: 170 }), HRMAX)).toBe(true)    // 87 %
    expect(isThresholdCardio(c({ avgHr: 160 }), HRMAX)).toBe(false)   // 82 % — easy
    expect(isThresholdCardio(c({ avgHr: 175 }), HRMAX)).toBe(false)   // 89 % — VO₂max
    expect(isThresholdCardio(c({ avgHr: 170 }))).toBe(false)          // no HRmax, no guess
  })

  it('the typed path never reads an intervals average; Garmin’s word stands on any row', () => {
    expect(isThresholdCardio(c({ format: 'intervals', avgHr: 170 }), HRMAX)).toBe(false)
    expect(isThresholdCardio(c({ format: 'intervals', aerobicTe: 3.4, trainingEffectLabel: 'TEMPO' }), HRMAX)).toBe(true)
  })

  it('a sport row is Garmin’s word only — a hand-logged match is never flagged', () => {
    expect(isThresholdSport(s({ aerobicTe: 3.3, trainingEffectLabel: 'TEMPO' }))).toBe(true)
    expect(isThresholdSport(s({ avgHr: 170 }))).toBe(false)
  })

  it('counts only the sessions that credit endurance, inside the window', () => {
    const rows = [
      c({ date: '2025-01-10', aerobicTe: 3.3, trainingEffectLabel: 'TEMPO' }),            // counts
      c({ date: '2025-01-11', avgHr: 170 }),                                              // counts — typed HR
      c({ date: '2025-01-12', aerobicTe: 3.2, trainingEffectLabel: 'AEROBIC_BASE' }),     // easy
      c({ date: '2025-01-13', duration: 20, avgHr: 170 }),                                // under the floor: credits nothing
      c({ date: '2025-01-13', format: 'intervals', boutSeconds: 240, aerobicTe: 3.4, trainingEffectLabel: 'TEMPO' }), // VO₂max
      c({ date: '2025-01-20', aerobicTe: 3.3, trainingEffectLabel: 'TEMPO' }),            // outside the window
    ]
    const matches = [s({ date: '2025-01-11', aerobicTe: 3.0, trainingEffectLabel: 'LACTATE_THRESHOLD' })]
    expect(thresholdEnduranceCount(rows, matches, '2025-01-08', '2025-01-14', HRMAX)).toBe(3)
    expect(thresholdEnduranceCount(rows, [], '2025-01-08', '2025-01-14', null)).toBe(1) // no HRmax: only Garmin’s word
  })
})
