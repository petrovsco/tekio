import type { Adaptation } from '../types'

/** Training modality an adaptation is primarily trained through. */
export type AdaptationModality = 'resistance' | 'cardio' | 'skill'

export interface AdaptationRx {
  /** Load / intensity guidance. */
  load: string
  reps: string
  sets: string
  rest: string
  /** Proximity to failure / effort. */
  effort: string
  /** One-line coaching cue. */
  cue: string
}

export interface AdaptationMeta {
  key: Adaptation
  label: string
  icon: string
  /** Hex colour used for bars, chips and accents. */
  color: string
  /** One-line essence, shown under the label. */
  summary: string
  rx: AdaptationRx
  modality: AdaptationModality
  /**
   * Inclusive rep range used to auto-classify a resistance set into this
   * adaptation. `null` = not rep-derived (needs an exercise tag, or comes from
   * cardio / skill logging).
   */
  repRange: [number, number] | null
  /**
   * Default weekly per-muscle-group target (weighted sets) used to colour a
   * muscle green (on track) vs amber (needs work). `0` = not muscle-targeted
   * (cardio / skill adaptations show sessions instead).
   */
  weeklyMuscleTarget: number
  /**
   * Weekly session target for non-resistance adaptations (cardio / skill). An
   * adaptation counts as "on target" once this many sessions are logged. `0` for
   * resistance adaptations, which are judged by their muscle targets instead.
   */
  weeklySessionTarget: number
}

/**
 * The nine adaptations, ordered along Galpin's force–velocity → endurance
 * continuum. This array is the single source of truth for the dashboard,
 * tooltips and reference card.
 */
export const ADAPTATIONS: AdaptationMeta[] = [
  {
    key: 'skill',
    label: 'Skill',
    icon: '🎯',
    color: '#8b5cf6',
    summary: 'Movement proficiency & technique',
    modality: 'skill',
    repRange: null,
    weeklyMuscleTarget: 0,
    weeklySessionTarget: 3,
    rx: {
      load: 'Very light / bodyweight',
      reps: '3–5 crisp reps',
      sets: 'Many short bouts',
      rest: 'Full — stay fresh',
      effort: 'Never to fatigue',
      cue: 'Practice often with perfect form; stop before quality drops.',
    },
  },
  {
    key: 'speed',
    label: 'Speed',
    icon: '⚡',
    color: '#06b6d4',
    summary: 'Rate of movement / quickness',
    modality: 'resistance',
    repRange: null,
    /**
     * 6 — convention only. No literature doses speed in weekly sets per muscle;
     * the honest unit is contacts/sprints per session. This is an exposure
     * counter (2 sessions × 3 sets), not a dose. Was 3 — below one session of
     * its own rx, so a single session turned a muscle green.
     * See docs/roadmap/done/011-adaptation-weekly-targets.md#grounding
     */
    weeklyMuscleTarget: 6,
    weeklySessionTarget: 0,
    rx: {
      load: '0–30% 1RM',
      reps: '1–5, maximal velocity',
      sets: '3–5',
      rest: '2–5 min (full)',
      effort: 'Never to fatigue',
      cue: 'Every rep as fast as possible; quit when speed drops.',
    },
  },
  {
    key: 'power',
    label: 'Power',
    icon: '💥',
    color: '#f97316',
    summary: 'Force × velocity — explosiveness',
    modality: 'resistance',
    repRange: null,
    /**
     * 6 — convention only, and deliberately identical to speed: no source
     * supports speed and power carrying different numbers (Galpin prescribes
     * both identically), so the old 3-vs-4 split was invented. Exposure
     * counter, not a dose. Was 4.
     * See docs/roadmap/done/011-adaptation-weekly-targets.md#grounding
     */
    weeklyMuscleTarget: 6,
    weeklySessionTarget: 0,
    rx: {
      load: '30–70% 1RM',
      reps: '1–5, explosive intent',
      sets: '3–5',
      rest: '2–5 min (full)',
      effort: 'Never to fatigue',
      cue: 'Jumps, throws, Olympic lifts — move with maximal intent.',
    },
  },
  {
    key: 'strength',
    label: 'Strength',
    icon: '🏋️',
    color: '#ef4444',
    summary: 'Maximal force production',
    modality: 'resistance',
    repRange: [1, 5],
    /**
     * 6 — DERIVED, not published. No source gives a weekly per-muscle set target
     * for strength: ACSM 2026 gives 2–3 sets *per exercise* at ≥2 sessions/week,
     * and Ralston 2017's bands are also per exercise. 6 assumes ~1 strength
     * exercise per muscle per session — verified true in this user's logged data
     * (2026-08-26: 35 muscle×session pairs, mean 1.00, max 1). Was 8; the
     * direction is solid (strength diminishes faster than hypertrophy —
     * Pelland 2026; low volume already captured ~80% of the effect — Ralston
     * 2017), so the strength floor must sit below hypertrophy's 10.
     * If sessions ever run 2+ exercises per muscle, 8–12 becomes correct again.
     * See docs/roadmap/done/011-adaptation-weekly-targets.md#grounding
     */
    weeklyMuscleTarget: 6,
    weeklySessionTarget: 0,
    rx: {
      load: '85–100% 1RM',
      reps: '3–5',
      sets: '3–5',
      rest: '2–5 min (full)',
      effort: '1–2 reps shy of failure',
      cue: 'Galpin’s 3–5 rule: 3–5 reps, 3–5 sets, 3–5 min rest, ~3–5×/week.',
    },
  },
  {
    key: 'hypertrophy',
    label: 'Hypertrophy',
    icon: '💪',
    color: '#6366f1',
    summary: 'Muscle growth',
    modality: 'resistance',
    repRange: [6, 15],
    /**
     * 10 — grounded, and the only one of the five with a direct, replicated
     * per-muscle weekly threshold (ACSM 2026 "≥10 sets/week"; Schoenfeld 2017
     * meta-regression). This IS the floor of `rx.sets` below: 10 = "enough to
     * grow", 10–20 = "where growth is actually driven". They are ONE claim —
     * never edit one without the other. If the floor moves to 12 (Baz-Valle's
     * optimum for trained men), rx.sets becomes '12–20 / muscle / week'.
     * See docs/roadmap/done/011-adaptation-weekly-targets.md#grounding
     */
    weeklyMuscleTarget: 10,
    weeklySessionTarget: 0,
    rx: {
      load: '30–80% 1RM',
      reps: '5–30 (≈8–15)',
      sets: '10–20 / muscle / week',
      rest: '30 s–2 min',
      effort: '0–4 reps shy of failure',
      cue: 'Drive total weekly volume with high effort per set.',
    },
  },
  {
    key: 'muscular_endurance',
    label: 'Muscular Endurance',
    icon: '🔁',
    color: '#14b8a6',
    summary: 'Resistance to local muscle fatigue',
    modality: 'resistance',
    repRange: [16, 999],
    /**
     * 6 — convention only. Local muscular endurance is dosed by load and reps,
     * not weekly sets, in both the 2009 and 2026 ACSM position stands. Value
     * unchanged; it is anchored to Israetel's maintenance-volume heuristic
     * (a single-practitioner model, not a measurement).
     * See docs/roadmap/done/011-adaptation-weekly-targets.md#grounding
     */
    weeklyMuscleTarget: 6,
    weeklySessionTarget: 0,
    rx: {
      load: '<50% 1RM',
      reps: '15–40+',
      sets: '2–4',
      rest: 'Short (<60 s)',
      effort: 'To / near failure',
      cue: 'High-rep, short-rest circuits and bodyweight work.',
    },
  },
  {
    key: 'anaerobic_capacity',
    label: 'Anaerobic Capacity',
    icon: '🔥',
    color: '#eab308',
    summary: 'Glycolytic power / lactate tolerance',
    modality: 'cardio',
    repRange: null,
    weeklyMuscleTarget: 0,
    /**
     * 1 — convention only. No adequacy-threshold literature exists for a
     * non-competitive trained adult: the improvement studies are block-shaped
     * (SIT trials run 3×/wk for 4–7 weeks) and the quality detrains slowly. This
     * is a scheduling convention for keeping anaerobic work in rotation, not a
     * physiological floor. See docs/roadmap/done/011-adaptation-weekly-targets.md#grounding
     */
    weeklySessionTarget: 1,
    rx: {
      load: 'All-out',
      reps: '20 s–2 min efforts',
      sets: '3–8 rounds',
      rest: 'Incomplete (1:2–1:4)',
      effort: 'Maximal',
      cue: 'Brutal short intervals with partial recovery.',
    },
  },
  {
    key: 'vo2max',
    label: 'Max Aerobic (VO₂max)',
    icon: '🫀',
    color: '#ec4899',
    summary: 'Maximal oxygen uptake',
    modality: 'cardio',
    repRange: null,
    weeklyMuscleTarget: 0,
    /**
     * 1 — grounded as an ADEQUACY FLOOR, not an optimum. ~1 session/week (even
     * 0.5) holds VO₂max when intensity is preserved: Hickson 1981, Spiering
     * 2021, Slettaløkken 2014. 2/wk is where the largest gains appear — that
     * belongs in the app's copy, not in this threshold. A 2026-08-26 scout run
     * proposed raising this to 2 and withdrew it: the study behind that proposal
     * is exploratory, not randomised, and reports significant improvement at
     * EVERY frequency including 1/wk, with CIs crossing zero.
     * The real risk here is the classifier, not the count — a session typed
     * VO₂max from Garmin zones may never have reached 90–100% HRmax.
     * See docs/roadmap/done/011-adaptation-weekly-targets.md#grounding
     */
    weeklySessionTarget: 1,
    rx: {
      load: '~90–100% max HR',
      reps: '3–8 min efforts',
      sets: '4–6',
      rest: '≈1:1',
      effort: 'Maximal',
      cue: 'Classic 4×4 min at 90–95% HRmax, 3 min easy between.',
    },
  },
  {
    key: 'endurance',
    label: 'Long-Duration Endurance',
    icon: '🏃',
    color: '#10b981',
    summary: 'Aerobic base / steady state',
    modality: 'cardio',
    repRange: null,
    weeklyMuscleTarget: 0,
    /**
     * 2 — convention only, and the UNIT is known to be wrong. Zone 2 is dosed in
     * weekly minutes everywhere it is published (WHO 150–300, Galpin 150–200,
     * Attia 180–240), and bout structure is irrelevant to cardiorespiratory
     * fitness at matched volume (Murphy 2019). Sessions are typed endurance at
     * ≥25 min, so 2 certifies ~50 min/week as adequate — a third of WHO's floor.
     * Deliberately NOT raised: even 3 yields only ~75 min/week here, which buys
     * a more plausible number without making it true. The fix is a weekly-minutes
     * target (Garmin already supplies duration), which also forces a choice in
     * the Attia-vs-Galpin bout-length split.
     * See docs/roadmap/done/011-adaptation-weekly-targets.md#grounding
     */
    weeklySessionTarget: 2,
    rx: {
      load: 'Zone 2 (conversational)',
      reps: '30 min–hours',
      sets: '1 continuous',
      rest: '—',
      effort: 'Easy, sustainable',
      cue: 'Nasal-breathing pace; builds mitochondria & fat oxidation.',
    },
  },
]

/** Fast lookup by key. */
export const ADAPTATION_MAP: Record<Adaptation, AdaptationMeta> = Object.fromEntries(
  ADAPTATIONS.map(a => [a.key, a]),
) as Record<Adaptation, AdaptationMeta>

/** Cross-cutting principle shown at the top of the reference card. */
export const ADAPTATION_PRINCIPLE =
  'Skill · Speed · Power · Strength are quality-driven — never train to fatigue, rest fully. ' +
  'Hypertrophy → Endurance are volume/fatigue-driven — accumulate work and push effort.'

/**
 * Keyword → adaptation defaults for exercises whose quality can’t be read from
 * reps alone (explosive / plyometric / sprint work). Checked as case-insensitive
 * substring matches; first hit wins. User-set tags override these.
 */
const KEYWORD_ADAPTATION: [string, Adaptation][] = [
  // Speed / sprint / reactive
  ['sprint', 'speed'],
  ['dash', 'speed'],
  ['agility', 'speed'],
  ['pogo', 'speed'],
  // Power / plyometric / ballistic / Olympic
  ['clean', 'power'],
  ['snatch', 'power'],
  ['jerk', 'power'],
  ['box jump', 'power'],
  ['broad jump', 'power'],
  ['jump squat', 'power'],
  ['jump', 'power'],
  ['plyo', 'power'],
  ['throw', 'power'],
  ['med ball', 'power'],
  ['medicine ball', 'power'],
  ['slam', 'power'],
  ['kettlebell swing', 'power'],
  ['kb swing', 'power'],
  ['sled', 'power'],
  ['hop', 'power'],
]

/** Built-in adaptation for an exercise name, or null if it should fall back to reps. */
export function defaultAdaptationForExercise(name: string): Adaptation | null {
  const n = name.toLowerCase()
  for (const [kw, a] of KEYWORD_ADAPTATION) {
    if (n.includes(kw)) return a
  }
  return null
}
