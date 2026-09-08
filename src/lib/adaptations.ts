import type {
  Adaptation, WeightEntry, CardioEntry, SportEntry, GarminIntensity, ExerciseMuscleLink, MuscleGroup,
} from '../types'
import { ADAPTATIONS, ADAPTATION_MAP, defaultAdaptationForExercise } from '../constants/adaptations'
import { LEVEL_WEIGHT, today } from './utils'

// ── Classification ─────────────────────────────────────────────────────────────

/**
 * Adaptation an exercise is *always* trained for, regardless of reps.
 * Precedence: user override map → built-in keyword defaults → null (use reps).
 */
export function resolveExerciseAdaptation(
  exercise: string,
  overrides?: Record<string, Adaptation>,
): Adaptation | null {
  const key = exercise.toLowerCase()
  if (overrides && overrides[key]) return overrides[key]
  return defaultAdaptationForExercise(exercise)
}

/**
 * Rep-derived adaptations, ordered by their range's lower bound. Derived from
 * `repRange` so the boundaries have exactly one home — see
 * docs/grounding-inventory.md §2.
 */
const REP_DERIVED = ADAPTATIONS
  .filter(a => a.repRange !== null)
  .sort((a, b) => a.repRange![0] - b.repRange![0])

/**
 * Every adaptation a single logged resistance set trains. An exercise
 * `override` wins outright (one quality, whatever the reps); otherwise every
 * rep-derived adaptation whose `repRange` covers the set is returned, in
 * continuum order. Bands may overlap, and a set inside an overlap counts in
 * full toward each — the model cardio already uses (roadmap 039 §6.0). A set
 * outside every band snaps to the nearest one.
 */
export function classifyWeightSet(reps: number, override?: Adaptation | null): Adaptation[] {
  if (override) return [override]
  const hits = REP_DERIVED.filter(a => reps >= a.repRange![0] && reps <= a.repRange![1])
  if (hits.length > 0) return hits.map(a => a.key)
  const edge = reps < REP_DERIVED[0].repRange![0] ? REP_DERIVED[0] : REP_DERIVED[REP_DERIVED.length - 1]
  return [edge.key]
}

// ── Cardio session → adaptation (roadmap 005, grounded 2026-09-06) ────────────
// The rules and every number below are docs/grounding/005-hr-zone-intensity-classification.md.

/** 25 — endurance-credit floor for a steady/unstated row with no HR data; a convention inside 20–30 min (Tekiō's 30-min endurance definition, ACSM's ≥ 20-min vigorous bout) — duration never selects VO₂max or anaerobic (Gastin 2001; Buchheit & Laursen 2013), see docs/grounding/005-hr-zone-intensity-classification.md#grounding */
export const ENDURANCE_FLOOR_MIN = 25

/** 2.0 — Firstbeat's band edge ('maintaining'); vendor convention, aerobic floor only — never awards anaerobic capacity, no 'dominant counts' rescue, see docs/grounding/005-hr-zone-intensity-classification.md#grounding */
export const TE_STIMULUS_THRESHOLD = 2.0

/** 8 — minutes at ≥ 90 % HRmax (Garmin Z5; range 5–10) that make a session VO₂max work: the dose is minutes at ≥ 90 % (Buchheit & Laursen 2013; Seiler 2013: a 4×4 runs at ≈ 94 % HRpeak); Z4 straddles the threshold band and never decides, see docs/grounding/005-hr-zone-intensity-classification.md#grounding */
export const VO2MAX_Z5_MIN = 8

/** 120 — the work-bout length (s) at or below which an intervals row is anaerobic-capacity work, above which it is VO₂max: aerobic and anaerobic contributions are equal at ~75 s and longer efforts are aerobically dominated (Gastin 2001); Tekiō's anaerobic protocol is 20 s–2 min all-out (row 3.7), its VO₂max intervals 3–8 min (row 3.8; Seiler & Tønnessen 2009: ~1–8 min at 90–100 % V̇O₂max), see docs/grounding/005-hr-zone-intensity-classification.md#grounding */
export const ANAEROBIC_BOUT_MAX_S = 120

/** Labels that stand in for the Z5 dose when the row carries no zones — a heuristic over the same TE + time-in-zone inputs (US 11771355 B2), so a fallback only. Garmin's TEMPO / LACTATE_THRESHOLD are deliberately not here and not special-cased: threshold work trains endurance by a harder route than Zone 2, so it falls to the aerobic floor (005 fork 1b, Peter 2026-09-07). */
const VO2MAX_LABELS = /VO2|VO₂|ANAEROBIC|SPRINT|SPEED/

/** Minutes in Garmin's Z5 (≥ 90 % HRmax), or null when the row carries no zones. */
function z5Minutes(entry: GarminIntensity): number | null {
  const z = entry.zoneDistribution
  return z && z.length >= 5 ? (z[4] ?? 0) / 60 : null
}

/**
 * What a steady session's Garmin data says it trained — the core the cardio
 * and sport classifiers share (roadmap 058), so the rules have one home.
 * VO₂max on ≥ {@link VO2MAX_Z5_MIN} minutes in Z5. Otherwise a VO₂max-family
 * label is read only when zones are absent; else aerobic TE ≥
 * {@link TE_STIMULUS_THRESHOLD} is endurance — tempo and lactate-threshold
 * runs included, since the classifier says what a session trained, not
 * whether it was the polarized way to train it (005 fork 1b). `null` when
 * the row carries no Training Effect: the caller says what a row with no
 * intensity data is (a duration floor for cardio, the convention for sport).
 */
function classifyGarminIntensity(entry: GarminIntensity): Adaptation[] | null {
  const z5 = z5Minutes(entry)
  if (z5 != null && z5 >= VO2MAX_Z5_MIN) return ['vo2max']
  if (entry.aerobicTe == null && entry.anaerobicTe == null) return null
  const label = entry.trainingEffectLabel?.toUpperCase() ?? ''
  if (z5 == null && VO2MAX_LABELS.test(label)) return ['vo2max']
  return (entry.aerobicTe ?? 0) >= TE_STIMULUS_THRESHOLD ? ['endurance'] : []
}

/**
 * The cardio adaptations a session credits — one, or none. `[]` is a real
 * answer: a walk, a threshold run and a 15-min unstated jog all train nothing
 * the read counts. The order is the session-goal method the training-load
 * literature uses (Seiler & Kjerland 2006; Sylta 2014): structure first, then
 * the Z5 dose, then Garmin's label, then duration as a floor.
 *
 * 1. `format = 'intervals'` is never endurance. The work-bout length decides
 *    when the row carries it (≤ {@link ANAEROBIC_BOUT_MAX_S} s → anaerobic
 *    capacity, longer → VO₂max). Without it the Z5 dose confirms VO₂max,
 *    Garmin's own primary rule (anaerobic TE > aerobic TE) is the vendor
 *    tie-break for anaerobic capacity, and the rest is VO₂max — the app's own
 *    4×4 protocol.
 * 2. A steady or unstated row reads its Garmin data through
 *    {@link classifyGarminIntensity}.
 * 3. With no Garmin data, a typed average HR against the profile HRmax picks
 *    the bucket ({@link classifyTypedHr}, roadmap 059).
 * 4. With no intensity data at all, ≥ {@link ENDURANCE_FLOOR_MIN} min is endurance.
 *
 * Anaerobic TE alone never awards anaerobic capacity: Firstbeat's "anaerobic"
 * is any work above VO₂max intensity, Tekiō's is 20 s–2 min all-out repeats.
 */
export function classifyCardioAdaptations(entry: CardioEntry, hrMax?: number | null): Adaptation[] {
  if (entry.format === 'intervals') {
    if (entry.boutSeconds != null) return entry.boutSeconds <= ANAEROBIC_BOUT_MAX_S ? ['anaerobic_capacity'] : ['vo2max']
    const z5 = z5Minutes(entry)
    if (z5 != null && z5 >= VO2MAX_Z5_MIN) return ['vo2max']
    const hasTe = entry.aerobicTe != null || entry.anaerobicTe != null
    if (hasTe && (entry.anaerobicTe ?? 0) > (entry.aerobicTe ?? 0)) return ['anaerobic_capacity']
    return ['vo2max']
  }
  return classifyGarminIntensity(entry) ?? classifyTypedHr(entry, hrMax) ?? (entry.duration >= ENDURANCE_FLOOR_MIN ? ['endurance'] : [])
}

/** The single adaptation a session credits, or null when it credits none (first of {@link classifyCardioAdaptations}). */
export function classifyCardio(entry: CardioEntry, hrMax?: number | null): Adaptation | null {
  return classifyCardioAdaptations(entry, hrMax)[0] ?? null
}

/** 'endurance' — a tennis match is ~70–75 % HRmax, ~52 % V̇O₂max, ~77 % of time below VT1 and ~3 % above VT2 with 5–10 s rallies (Baiget 2015; Ferrauti 2001; Fernandez 2006): aerobic-base work, not VO₂max or anaerobic; convention, singles and doubles alike, see docs/grounding/005-hr-zone-intensity-classification.md#grounding */
export const SPORT_DEFAULT_ADAPTATION: Adaptation = 'endurance'

/**
 * The cardio adaptations a sport session credits. A synced row carries the
 * same Garmin data a cardio row does (roadmap 058) and reads it through the
 * same steady-row core: a match with 8 min in Z5 is VO₂max work, one below
 * the aerobic floor credits nothing. Only a row with no Garmin data — every
 * hand-logged match, timed or not, singles or doubles — is
 * {@link SPORT_DEFAULT_ADAPTATION}. `format` is never read: a sport row has
 * none, and a match is never intervals.
 */
export function classifySportAdaptations(entry: SportEntry): Adaptation[] {
  return classifyGarminIntensity(entry) ?? [SPORT_DEFAULT_ADAPTATION]
}

// ── Muscle stimulus — the one accounting (roadmap 039 §6) ──────────────────────

/** The four muscle-linked qualities (doctrine P2 — they read per muscle). */
export const MUSCLE_QUALITIES = ['strength', 'hypertrophy', 'muscular_endurance', 'power'] as const
export type MuscleQuality = typeof MUSCLE_QUALITIES[number]

const isMuscleQuality = (a: Adaptation): a is MuscleQuality =>
  (MUSCLE_QUALITIES as readonly string[]).includes(a)

const perQuality = <T>(make: () => T): Record<MuscleQuality, T> =>
  Object.fromEntries(MUSCLE_QUALITIES.map(q => [q, make()])) as Record<MuscleQuality, T>

export interface MuscleStimulus {
  /** Level-weighted *hard* sets per muscle group, each set counted once — a set
   *  is one set of work for the muscle however many qualities it trains. Power
   *  sets are not hard sets (never near failure) and are left out: the floor
   *  this is measured against was grounded on hard sets (039 S3). */
  total: Record<string, number>
  /** Level-weighted sets per muscle group per quality. A set counts in full for
   *  every quality whose rep band covers it, so over the three hard qualities
   *  (strength, hypertrophy, muscular endurance) each muscle satisfies
   *  max_q byQuality[q] ≤ total ≤ Σ_q byQuality[q]; `power` sits outside. */
  byQuality: Record<MuscleQuality, Record<string, number>>
  /** Plain set counts per quality (no muscle weighting), same multi-membership. */
  sets: Record<MuscleQuality, number>
}

/**
 * Level-weighted resistance stimulus per muscle group inside the inclusive date
 * window [from, to]. Home's map (the 42-day cycle window) and the Adaptations
 * tab (week-to-date) both read this — one accounting; the window is the only
 * thing that differs, and each surface names its window on screen. Only
 * `stimulus` links count; recovery links never add sets. A power set (override
 * or keyword) counts in `byQuality.power` only, never in `total` — see
 * docs/grounding/039-adaptations-read.md#grounding (S3). An override
 * naming a cardio quality still counts in `total` (the muscle did the work) and
 * in no `byQuality` bucket. See the same brief, §6.
 */
export function muscleStimulus(
  weights: WeightEntry[],
  exerciseMuscles: ExerciseMuscleLink[],
  window: { from: string; to: string },
  overrides?: Record<string, Adaptation>,
): MuscleStimulus {
  const linksByExercise = new Map<string, ExerciseMuscleLink[]>()
  for (const l of exerciseMuscles) {
    if (l.contribution !== 'stimulus') continue
    const k = l.exercise.toLowerCase()
    const arr = linksByExercise.get(k) ?? []
    arr.push(l)
    linksByExercise.set(k, arr)
  }

  const total: Record<string, number> = {}
  const byQuality = perQuality<Record<string, number>>(() => ({}))
  const sets = perQuality(() => 0)
  for (const w of weights) {
    if (w.date < window.from || w.date > window.to) continue
    const override = resolveExerciseAdaptation(w.exercise, overrides)
    const links = linksByExercise.get(w.exercise.toLowerCase()) ?? []
    for (const set of w.sets) {
      const qualities = classifyWeightSet(set.reps, override).filter(isMuscleQuality)
      const hard = !qualities.includes('power')
      for (const q of qualities) sets[q] += 1
      for (const l of links) {
        const lw = LEVEL_WEIGHT[l.level] ?? 0
        if (!lw) continue // zero-weight tier (level 3, roadmap 042): no sets, no key
        if (hard) total[l.group] = (total[l.group] ?? 0) + lw
        for (const q of qualities) byQuality[q][l.group] = (byQuality[q][l.group] ?? 0) + lw
      }
    }
  }
  const round = (r: Record<string, number>) => { for (const k in r) r[k] = +r[k].toFixed(2) }
  round(total)
  for (const q of MUSCLE_QUALITIES) round(byQuality[q])
  return { total, byQuality, sets }
}

/** Resistance sets logged inside [from, to], each counted once — the honest
 *  "lifting sets" figure. Summing per-adaptation volumes double counts under
 *  overlap. */
export function weightSetsIn(weights: WeightEntry[], from: string, to: string): number {
  let n = 0
  for (const w of weights) if (inRange(w.date, from, to)) n += w.sets.length
  return n
}

// ── Coverage ────────────────────────────────────────────────────────────────────

type MuscleStatus = 'on_track' | 'needs_work' | 'untouched'

export interface MuscleStatusRow {
  id: string
  name: string
  parentId: string | null
  /** Weighted sets toward this adaptation this week (self only). */
  sets: number
  /** Weighted sets including immediate children. */
  aggSets: number
  target: number
  status: MuscleStatus
  /** aggSets / target, uncapped — the same ramp input Home's map uses (039 §6.1). */
  fillFraction: number
  children: MuscleStatusRow[]
}

export interface AdaptationSummary {
  key: Adaptation
  /** Primary weekly volume: set count (resistance) or session count (cardio). */
  volume: number
  unit: 'sets' | 'sessions'
  /** Top-level muscle rows with rolled-up children (resistance adaptations only). */
  muscles: MuscleStatusRow[]
  /** On-track / worked / total counts over the *judged* leaves (resistance only) — see `met`. */
  onTrack: number
  worked: number
  totalMuscles: number
  /** Session target for the cardio adaptations over the window (0 for resistance). */
  sessionTarget: number
  /**
   * Whether the adaptation is on target over the window — no judged muscle
   * below GAP_CUTOFF of its target (resistance), or the session target reached
   * (cardio). The judged muscles are the leaves the gap map draws callouts for,
   * inside the tracked top-level groups, so the "N of 7 on target" counter, its
   * "Short:" line and the map's callouts read one threshold (roadmap 045).
   */
  met: boolean
}

/** 0.70 — the ramp's top band. Below it a muscle still reads as a visible gap
 * on the map; at or above it the muscle counts toward "on target" — one line
 * for the callouts and the counter (roadmap 045). Display convention, not a
 * physiological line: no study places a cutoff at any fraction of the floor;
 * 0.70 sits just above the maintenance zone (Bickel 2011: 1/9–1/3 of a full
 * dose keeps muscle in young adults; Israetel MV ≈ 0.6 × floor).
 * See docs/grounding/039-adaptations-read.md#grounding */
export const GAP_CUTOFF = 0.70

// statusFor — three states are a label of a continuous fill (sets ÷ floor), not three physiological
// bands: stimulus is graded from the first set (Schoenfeld 2017, Pelland 2026, Krieger 2010; trained
// men at ~3 sets/wk still grow, Schoenfeld 2019). Only 0 (untouched) and the floor carry meaning;
// the on_track line sits at GAP_CUTOFF so it is the line the map's callouts stop at (roadmap 045).
// See docs/grounding/039-adaptations-read.md#grounding
function statusFor(sets: number, fillFraction: number): MuscleStatus {
  if (sets <= 0) return 'untouched'
  if (fillFraction >= GAP_CUTOFF) return 'on_track'
  return 'needs_work'
}

const inRange = (d: string, start: string, end: string) => d >= start && d <= end

/**
 * Per-adaptation coverage across all modalities inside the inclusive window
 * [from, date]. Resistance adaptations get a rolled-up muscle-group breakdown
 * with status; cardio adaptations report session counts. Resistance sets come
 * from {@link muscleStimulus}, so a set inside a rep-band overlap counts toward
 * every quality it trains — the four muscle-linked volumes may add up to more
 * than the sets logged (roadmap 039 §6.0). The muscle read counts logged sets
 * only; habits never feed it (doctrine §5).
 *
 * Every target on the metadata is a *weekly* rate; `windowDays` scales it to
 * the window (rate × days / 7 — the same construction as MUSCLE_SET_TARGET,
 * roadmap 039 §6.6). Default 7: a calendar week, targets as written.
 */
/**
 * Per-adaptation weekly target overrides as they arrive from the DB. Structural
 * on purpose: `lib/` stays free of `lib/db/` imports.
 */
export type TargetOverrides =
  Partial<Record<Adaptation, { weeklyMuscleTarget: number; weeklySessionTarget?: number }>>

/**
 * The weekly per-muscle set target for one adaptation: the user's override if
 * there is one, else the model default on the adaptation's metadata.
 *
 * One resolver, so every read that draws a muscle against its target draws it
 * against the same number — the rule roadmap 063 set for the whole-body strip
 * and 064 applied here. Callers scale it to their own window; the muscle reads
 * do that with {@link windowMuscleTarget} in `fusedRead.ts`.
 */
export function weeklyMuscleTarget(quality: Adaptation, targets?: TargetOverrides): number {
  return targets?.[quality]?.weeklyMuscleTarget ?? ADAPTATION_MAP[quality].weeklyMuscleTarget
}

export function adaptationCoverage(
  args: {
    weights: WeightEntry[]
    cardio: CardioEntry[]
    sports: SportEntry[]
    exerciseMuscles: ExerciseMuscleLink[]
    muscleGroups: MuscleGroup[]
    from: string
    date?: string
    /** Length of the window in days; weekly targets are scaled to it. Default 7. */
    windowDays?: number
    /** Optional exercise-name → adaptation overrides (lowercased keys). */
    overrides?: Record<string, Adaptation>
    /**
     * Top-level muscle-group ids the user tracks toward completion. Empty/omitted
     * counts every muscle group.
     */
    trackedMuscleIds?: string[]
    /**
     * Per-adaptation weekly target overrides (from the DB). Missing keys fall back
     * to the built-in defaults on each adaptation's metadata.
     */
    targets?: TargetOverrides
    /** The profile HRmax (roadmap 059) a typed average HR on a manual cardio row is read against. */
    hrMax?: number | null
  },
): Record<Adaptation, AdaptationSummary> {
  const { weights, cardio, sports, exerciseMuscles, muscleGroups, from, overrides, targets } = args
  const date = args.date ?? today()
  const scale = (args.windowDays ?? 7) / 7
  const trackedSet = args.trackedMuscleIds && args.trackedMuscleIds.length > 0
    ? new Set(args.trackedMuscleIds)
    : null

  const stimulus = muscleStimulus(weights, exerciseMuscles, { from, to: date }, overrides)

  const volume = {} as Record<Adaptation, number>
  for (const a of ADAPTATIONS) volume[a.key] = 0
  for (const q of MUSCLE_QUALITIES) volume[q] = stimulus.sets[q]

  // Cardio sessions. A Garmin ride can count toward multiple adaptations (e.g.
  // VO₂max + anaerobic) when several systems each got a real Training Effect.
  for (const c of cardio) {
    if (!inRange(c.date, from, date)) continue
    for (const a of classifyCardioAdaptations(c, args.hrMax)) volume[a] += 1
  }

  // Sport sessions count as cardio work — a match is endurance (roadmap 005).
  for (const s of sports) {
    if (!inRange(s.date, from, date)) continue
    for (const a of classifySportAdaptations(s)) volume[a] += 1
  }

  const out = {} as Record<Adaptation, AdaptationSummary>
  for (const meta of ADAPTATIONS) {
    const muscleTarget = weeklyMuscleTarget(meta.key, targets) * scale
    const sessionTarget = (targets?.[meta.key]?.weeklySessionTarget ?? meta.weeklySessionTarget) * scale
    const isResistance = meta.modality === 'resistance' && muscleTarget > 0
    const muscles = isResistance && isMuscleQuality(meta.key)
      ? buildMuscleStatusTree(stimulus.byQuality[meta.key], muscleGroups, muscleTarget)
      : []
    // Judge the leaves the gap map draws callouts for (a childless top-level
    // group is its own leaf), inside the tracked subset — or every group if
    // none is set. Rolled-up parents are not judged: "Shoulders on target"
    // above a REAR DELT callout is the contradiction 045 removes.
    const relevant = muscles
      .filter(m => !trackedSet || trackedSet.has(m.id))
      .flatMap(m => (m.children.length > 0 ? m.children : [m]))
    const onTrack = relevant.filter(m => m.status === 'on_track').length
    const met = isResistance
      ? relevant.length > 0 && onTrack === relevant.length
      : volume[meta.key] >= sessionTarget && sessionTarget > 0
    out[meta.key] = {
      key: meta.key,
      volume: volume[meta.key],
      unit: meta.modality === 'resistance' ? 'sets' : 'sessions',
      muscles,
      onTrack,
      worked: relevant.filter(m => m.status !== 'untouched').length,
      totalMuscles: relevant.length,
      sessionTarget,
      met,
    }
  }
  return out
}

/** One quality's state inside the window: nothing logged, some but not the
 *  target, or the target reached. */
export type CoverageState = 'untouched' | 'short' | 'on_target'

/**
 * The one word a quality gets inside the window. Everything on screen that
 * names a quality's state calls this — the "what is missing" sentence, the
 * Adaptations header, and Home's whole-body squares (roadmap 063) — so two
 * surfaces can no longer reach opposite words through two thresholds. It reads
 * `volume` and `met` off the coverage summary and makes no claim of its own.
 */
export function coverageState(c: AdaptationSummary): CoverageState {
  if (c.volume === 0) return 'untouched'
  return c.met ? 'on_target' : 'short'
}

/**
 * The seven sorted into the two states worth naming, both in ADAPTATIONS order;
 * a quality on target is in neither. This is the one split Home's "what is
 * missing" line and the Adaptations header both print (roadmap 062).
 */
export function splitCoverage(
  coverage: Record<Adaptation, AdaptationSummary>,
): { untouched: Adaptation[]; short: Adaptation[] } {
  const untouched: Adaptation[] = []
  const short: Adaptation[] = []
  for (const a of ADAPTATIONS) {
    const state = coverageState(coverage[a.key])
    if (state === 'untouched') untouched.push(a.key)
    else if (state === 'short') short.push(a.key)
  }
  return { untouched, short }
}

/**
 * Rolls direct per-group weighted sets up into a top-level tree (parent +
 * immediate children), assigning each a status against `target`.
 */
export function buildMuscleStatusTree(
  byGroupName: Record<string, number>,
  groups: MuscleGroup[],
  target: number,
): MuscleStatusRow[] {
  const direct = (name: string) => +(byGroupName[name] ?? 0).toFixed(2)
  const fill = (n: number) => (target > 0 ? +(n / target).toFixed(3) : 0)

  const tops = groups.filter(g => !g.parentId)
  return tops
    .map(top => {
      const children = groups
        .filter(g => g.parentId === top.id)
        .map<MuscleStatusRow>(c => {
          const sets = direct(c.name)
          const fillFraction = fill(sets)
          return {
            id: c.id, name: c.name, parentId: c.parentId ?? null,
            sets, aggSets: sets, target,
            status: statusFor(sets, fillFraction), fillFraction, children: [],
          }
        })
      const selfSets = direct(top.name)
      const aggSets = +(selfSets + children.reduce((s, c) => s + c.sets, 0)).toFixed(2)
      const fillFraction = fill(aggSets)
      return {
        id: top.id, name: top.name, parentId: null,
        sets: selfSets, aggSets, target,
        status: statusFor(aggSets, fillFraction),
        fillFraction,
        children: children.sort((a, b) => b.sets - a.sets || a.name.localeCompare(b.name)),
      }
    })
    .sort((a, b) => b.aggSets - a.aggSets || a.name.localeCompare(b.name))
}

// ── The typed-HR path (roadmap 059) — its rule and two cuts are docs/roadmap/done/059-profile-hrmax-typed-hr-path.md#grounding ──

/** 83 — % of HRmax at or below which a typed average HR on a steady row is endurance work: Tønnessen's Z2 is 74–83 % HRmax (Stöggl & Sperlich 2015) and 84–88 % is the threshold band — a label (057), never a bucket — so this cut moves no credit on its own; a ±5 % band, not a line (Jamnick 2020), see docs/roadmap/done/059-profile-hrmax-typed-hr-path.md#grounding */
export const HR_ENDURANCE_MAX_PCT = 83

/** 89 — % of HRmax at or above which a typed average HR on a steady row is VO₂max work: Tønnessen's Z4 floor (89 %), Garmin's Z5 line (90 %) and Buchheit & Laursen 2013's ≥ 90 % criterion coincide, so one cut serves this path and the Z5 dose (row 6.4); steady 85 % work raised V̇O₂max less than intervals (Helgerud 2007), which is why the band below files as endurance, see docs/roadmap/done/059-profile-hrmax-typed-hr-path.md#grounding */
export const HR_VO2MAX_MIN_PCT = 89

export type TypedHrBand = 'endurance' | 'threshold' | 'vo2max'

/**
 * The band a typed average HR sits in against the profile HRmax, in whole
 * percent so the edges match the source's integer bands (Z2 ≤ 83, Z3 84–88,
 * Z4 ≥ 89). Null when either number is missing — the path never divides by a
 * guess (059 decision 2).
 */
export function typedHrBand(avgHr: number | undefined, hrMax: number | null | undefined): TypedHrBand | null {
  if (avgHr == null || avgHr <= 0 || hrMax == null || hrMax <= 0) return null
  const pct = Math.round((100 * avgHr) / hrMax)
  if (pct >= HR_VO2MAX_MIN_PCT) return 'vo2max'
  return pct > HR_ENDURANCE_MAX_PCT ? 'threshold' : 'endurance'
}

/**
 * What a steady/unstated row with no Garmin data but a typed average HR
 * credits (005 run B, built in 059). The HR picks the bucket; the floors the
 * synced path already uses decide the credit: ≥ {@link HR_VO2MAX_MIN_PCT} % is
 * VO₂max when the row is at least {@link VO2MAX_Z5_MIN} min — a steady row's
 * average holds for its whole length, so its minutes at ≥ 90 % are its
 * duration and the same dose applies — and anything below is endurance at the
 * {@link ENDURANCE_FLOOR_MIN} floor, threshold band included (that band is a
 * label, 057). Null when the path does not apply, so the caller falls through
 * to the duration floor. Never read on an `intervals` row — the average of a
 * 4×4 is meaningless — and never on a sport row, which stays endurance (059
 * decision 4).
 */
export function classifyTypedHr(entry: Pick<CardioEntry, 'avgHr' | 'duration'>, hrMax?: number | null): Adaptation[] | null {
  const band = typedHrBand(entry.avgHr, hrMax)
  if (band == null) return null
  if (band === 'vo2max') return entry.duration >= VO2MAX_Z5_MIN ? ['vo2max'] : []
  return entry.duration >= ENDURANCE_FLOOR_MIN ? ['endurance'] : []
}

// ── The threshold label (roadmap 057) — an annotation, never a bucket ─────────

/** Garmin's own words for a session whose primary benefit was threshold work; read as written, so no new claim is made (`/ground` Step 0, vendor exemption). */
const THRESHOLD_LABELS = /TEMPO|LACTATE_THRESHOLD/

/** Whether Garmin called this session threshold work. False on a hand-logged row, which carries no label. */
function garminThreshold(entry: GarminIntensity): boolean {
  return THRESHOLD_LABELS.test(entry.trainingEffectLabel?.toUpperCase() ?? '')
}

/**
 * Whether a cardio session pushed the lactate threshold. A *label* on the row
 * and a count inside the endurance band — the credit stays whatever
 * {@link classifyCardioAdaptations} says, because an eighth bucket is what 005
 * fork 1b removed (roadmap 057). Two paths, in the classifier's own order:
 * Garmin's word when the row carries one, otherwise a typed average HR in
 * {@link typedHrBand}'s `'threshold'` band (84–88 % HRmax, grounded in 059).
 * The typed path skips an `intervals` row — the average of a 4×4 is
 * meaningless — while Garmin's word stands on any row it appears on, including
 * the HIIT sessions it labels `TEMPO`.
 */
export function isThresholdCardio(entry: CardioEntry, hrMax?: number | null): boolean {
  if (entry.trainingEffectLabel) return garminThreshold(entry)
  if (entry.format === 'intervals') return false
  return typedHrBand(entry.avgHr, hrMax) === 'threshold'
}

/**
 * Whether a sport session pushed the lactate threshold. Garmin's word only: a
 * match's average HR is the average of an intermittent effort, so the typed
 * path never reads it (059 decision 4) and a hand-logged match is never
 * flagged.
 */
export function isThresholdSport(entry: SportEntry): boolean {
  return garminThreshold(entry)
}

/**
 * How many of the endurance-credited sessions inside [from, to] were at
 * threshold — the sub-line under the endurance band. A session counts only if
 * it credits endurance: a HIIT row Garmin called `TEMPO` is VO₂max work by the
 * bout it was run in, and belongs in no endurance count whatever its label says.
 */
export function thresholdEnduranceCount(
  cardio: CardioEntry[],
  sports: SportEntry[],
  from: string,
  to: string,
  hrMax?: number | null,
): number {
  const c = cardio.filter(e =>
    inRange(e.date, from, to)
    && classifyCardioAdaptations(e, hrMax).includes('endurance')
    && isThresholdCardio(e, hrMax)).length
  const s = sports.filter(e =>
    inRange(e.date, from, to)
    && classifySportAdaptations(e).includes('endurance')
    && isThresholdSport(e)).length
  return c + s
}
