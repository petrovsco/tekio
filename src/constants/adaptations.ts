import type { Adaptation } from '../types'

/** Training modality an adaptation is primarily trained through. */
export type AdaptationModality = 'resistance' | 'cardio'

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
  /** One-line essence, shown under the sheet title. No icon and no colour per
   *  adaptation: colour carries one meaning in this app (design-system §1) and
   *  the chrome has no emoji (§7) — both fields went with roadmap 031 unit 4. */
  summary: string
  rx: AdaptationRx
  modality: AdaptationModality
  /**
   * Inclusive rep range used to auto-classify a resistance set into this
   * adaptation. Bands may overlap — a set counts in full toward every
   * adaptation whose band covers it (roadmap 039 §6.0). `null` = not
   * rep-derived (needs an exercise tag, or comes from cardio logging).
   */
  repRange: [number, number] | null
  /**
   * Default weekly per-muscle-group target (weighted sets) used to colour a
   * muscle green (on track) vs amber (needs work). `0` = not muscle-targeted
   * (cardio adaptations show sessions instead).
   */
  weeklyMuscleTarget: number
  /**
   * Weekly session target for the whole-body cardio adaptations. An adaptation
   * counts as "on target" once this many sessions are logged. `0` for the
   * muscle-linked adaptations, which are judged by their muscle targets instead.
   */
  weeklySessionTarget: number
}

/**
 * The seven adaptations, ordered along Galpin's force–velocity → endurance
 * continuum: four muscle-linked (power → muscular endurance, read per muscle)
 * then three whole-body cardio qualities (read per session). Speed and skill
 * were dropped 2026-08-29 — see
 * docs/roadmap/done/019-adaptation-model-simplification.md.
 * This array is the single source of truth for the Adaptations drill-down and
 * its rx sheet.
 */
export const ADAPTATIONS: AdaptationMeta[] = [
  {
    key: 'power',
    label: 'Power',
    summary: 'Force × velocity — explosiveness',
    modality: 'resistance',
    repRange: null,
    /**
     * 6 — convention only, unchanged by the nine → seven simplification. No
     * literature doses power in weekly sets per muscle; the honest unit is
     * contacts/throws per session, so this is an exposure counter (2 sessions ×
     * 3 sets), not a dose. Was 4, raised to 6 to match the retired `speed`
     * entry because no source supported the two carrying different numbers
     * (Galpin prescribed both identically) — that reasoning is why the value is
     * 6 and survives speed's removal.
     * See docs/roadmap/done/011-adaptation-weekly-targets.md#grounding
     */
    weeklyMuscleTarget: 6,
    weeklySessionTarget: 0,
    /**
     * rx.power — 30–70 % 1RM is the pooled position-stand range (ACSM 2026,
     * Currier) and Galpin's; the measured optima are exercise-specific:
     * jumps/throws ≤30 %, squat/bench 30–70 %, cleans ≥70 % (Soriano 2015,
     * 2017; Cormie 2011). Reps 1–5 / sets 3–5 / rest 2–5 min are NSCA's power
     * rows (written for 75–90 % lifts); ≥2 min rest preserves power (Hernández
     * Davó 2016, de Salles 2009), ≤24 reps·sets/session (ACSM 2026). "Never to
     * fatigue" ≈ ≤20 % velocity loss (Pareja-Blanco 2017, 2020; Jukic 2023);
     * intent is the stimulus (Behm & Sale 1993). Heavy strength sets also
     * build power in the not-yet-strong (Cormie 2010) but never feed the
     * power map — 039 S4 fork 1.
     * See docs/grounding/039-adaptations-read.md#grounding
     */
    rx: {
      load: '30–70% 1RM (jumps & throws lighter, Olympic lifts heavier)',
      reps: '1–5 (lifts) · 3–8 (jumps, throws), explosive intent',
      sets: '3–5',
      rest: '2–5 min (full)',
      effort: 'Never to fatigue — stop when the reps slow',
      cue: 'Jumps, throws, Olympic lifts — move with maximal intent.',
    },
  },
  {
    key: 'strength',
    label: 'Strength',
    summary: 'Maximal force production',
    modality: 'resistance',
    // repRange [1, 5] — kept 2026-09-03 (039 S11, ledger D32), now OVERLAPPING hypertrophy at 5: a 5-rep set is one
    // strength set and one hypertrophy set (Campos 2002 — one 3–5 RM set fed both). A band counts a set in full toward
    // each quality that covers it (039 §6.0). The hi edge 5 is a convention inside a grounded 5–8 band: 1RM gain is
    // monotonic in load, the meta-analytic high-load bin ends at ≤7–8 RM (Carvalho 2022; Lopez 2021; Currier 2023) and
    // every zone statement at 5–6 (ACSM 2009 1–6 RM; Galpin ≤5; Israetel 3–6); 5 not 8 so a 6–8-rep week reads as a
    // strength gap. See docs/grounding/039-adaptations-read.md#grounding
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
    /**
     * rx.strength — heavy loads drive 1RM strength: ≥80 % 1RM in the position
     * stand (ACSM 2026, Currier) and the network meta-analysis (Currier 2023,
     * n = 5,097); high > moderate > low load even volume-matched (Lopez 2021,
     * Carvalho 2022, Schoenfeld 2017). 85–100 % is the floor 3–5 reps at 1–2
     * RIR implies (a 5–7 RM; NSCA: >85 % for <6 reps) inside that band — do
     * not "correct" it to 80. Reps 3–5 sit inside ACSM 2009's 1–6 RM
     * (singles/doubles left out by choice); sets 3–5 inside 2–3 sets/exercise
     * (ACSM 2026) and the weekly-set dose–response (Ralston 2017). Rest
     * 2–5 min: >2 min maximises strength in trained lifters (Grgic 2018),
     * 3–5 min (de Salles 2009, ACSM 2009). Effort: proximity to failure barely
     * moves strength (Robinson 2024; Grgic 2022; Davies 2016; Vieira 2021) —
     * 1–2 RIR is a default inside "not to failure". The cue is Galpin's
     * "3 to 5" heuristic (Huberman Lab guest series pt 2, 2023; ep. 65, 2022)
     * — a practitioner rule whose parts the literature supports piecewise;
     * its "×/week" is a whole-body session count (frequency acts through
     * volume — Grgic 2018) and is convention.
     * See docs/grounding/039-adaptations-read.md#grounding
     */
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
    summary: 'Muscle growth',
    modality: 'resistance',
    // repRange [6, 15] → [5, 30] on 2026-09-03 (039 S11, ledger D30). Growth per hard set is load-independent from ~30 %
    // 1RM (≈30–35 reps to failure) up to ≥80 % (Lasevicius 2018, 2022; Schoenfeld 2017; Lopez 2021), and 3–5 RM sets grow
    // muscle when volume suffices (Schoenfeld 2014) though under-delivering per set at 2–4 RM (Schoenfeld 2016); 5–30 is
    // Galpin's and Israetel's band. Edges are conventions inside grounded bands (lo 3–6, hi 25–35). The 30 edge assumes
    // hard sets (S3): a 20-rep set far from failure grew 2.8 %, ns (Lasevicius 2022). Overlaps strength at 5 and muscular
    // endurance at 15–30. See docs/grounding/039-adaptations-read.md#grounding
    repRange: [5, 30],
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
    summary: 'Resistance to local muscle fatigue',
    modality: 'resistance',
    // repRange [16, 999] → [15, 999] on 2026-09-03 (039 S11, ledger D31). ≥15 reps beat 7–13 for relative local endurance
    // (Hackett 2022 meta-analysis, g = 0.97 at post-training 1RM); ACSM 2009 says >15; the trained bands that produced the
    // advantage were 20–28 and 25–35 RM (Campos 2002; Schoenfeld 2015). 15 not 16 because ≥15 is the cut that was tested;
    // not Galpin's test-based 5 (every set would be an endurance set) nor Huberman's 12 — the lo edge is a convention
    // inside a 12–20 band. Reps proxy load; a 15–30-rep set is also a hypertrophy set.
    // See docs/grounding/039-adaptations-read.md#grounding
    repRange: [15, 999],
    /**
     * 6 — convention only. Local muscular endurance is dosed by load and reps,
     * not weekly sets, in both the 2009 and 2026 ACSM position stands. Value
     * unchanged; it is anchored to Israetel's maintenance-volume heuristic
     * (a single-practitioner model, not a measurement).
     * See docs/roadmap/done/011-adaptation-weekly-targets.md#grounding
     */
    weeklyMuscleTarget: 6,
    weeklySessionTarget: 0,
    /**
     * rx.muscular_endurance — 40–60 % 1RM for >15 reps with <90 s rest is the
     * ACSM 2009 prescription; the card's <60 s and 2–4 sets are conventions
     * inside it (NSCA: <67 %, >12 reps, 2–3 sets, <30 s). Higher reps (≥15;
     * 18–125) beat 7–13 for relative endurance when tested at post-training
     * 1RM (Hackett 2022, 14 studies; Campos 2002; Schoenfeld 2015; Anderson &
     * Kearney 1982) but not at pre-training 1RM — the load effect is equivocal
     * (Schoenfeld 2021, Wang 2023), so the honest claim is specificity: you
     * get better at repeating the load you practise. More sets help (Radaelli
     * 2015: 5 > 3 > 1 for 20 RM); rest length did not (Schoenfeld 2016: 1 min
     * = 3 min). "To/near failure" is how every located trial trained, not a
     * tested variable. Load moved <50 % → 40–60 % on 2026-09-03 (039 S6 fork
     * 2, ledger D19) so the load and rep fields describe one set.
     * See docs/grounding/039-adaptations-read.md#grounding
     */
    rx: {
      load: '40–60% 1RM',
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
    // rx.anaerobic_capacity — anaerobic capacity (maximal accumulated O2 deficit) is separately trainable: 6 wk of
    // sprint work +10 % (Medbø & Burgers 1990), 7–8 × 20 s at 170 % VO2max / 10 s +28 % where moderate continuous
    // work moved nothing (Tabata 1996); 8 × 20 s / 10 s raised it where 4 × 4 min did not (Hov 2023, Helgerud 2023).
    // All-out is the SIT definition (MacInnis & Gibala 2017; Weston 2014). 20 s–2 min: 20, 30 and 90 s efforts all
    // raised an anaerobic outcome (Tabata; Gibala 2006; Ziemann 2011) and the anaerobic share is ≥ half up to ≈ 75 s
    // (Gastin 2001). Rounds 4–8 and rest 1:1–1:4 are conventions inside the trials (4–10 rounds; 2:1 to 1:7) and
    // Galpin's 30/30 × 4+ and 20/30 × 6–8 (Huberman Lab guest series pt 3, 2023); NSCA's rows are 1:3–1:5 (15–30 s)
    // and 1:3–1:4 (1–3 min). Shorter rest builds the deficit (Tabata 1997), longer rest keeps power per rep (Hazell
    // 2010). Floors moved 3 → 4 rounds and 1:2 → 1:1 on 2026-09-03 (039 S7 forks 1–2, ledger D21–D22) — no trial or
    // practitioner used three rounds or less than 1:1. See docs/grounding/039-adaptations-read.md#grounding
    rx: {
      load: 'All-out',
      reps: '20 s–2 min efforts',
      sets: '4–8 rounds',
      rest: 'Incomplete (1:1–1:4)',
      effort: 'Maximal',
      cue: 'Brutal short intervals with partial recovery.',
    },
  },
  {
    key: 'vo2max',
    label: 'Max Aerobic (VO₂max)',
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
    // rx.vo2max — long hard intervals raise VO2max more than anything else at matched work: 4 × 4 min at 90–95 %
    // HRmax / 3 min active +7.2 % vs 15/15 +5.5 % and no change for threshold or LSD (Helgerud 2007, the cue's
    // protocol); 4 × 8 min at 90 % beat 4 × 4 at 94 % and 4 × 16 at 88 % — total work × intensity interact (Seiler
    // 2013); intervals ≥ 2 min and ≥ 15 min/session are the only formats that beat continuous training (Wen 2019,
    // 53 RCTs; Bacon 2013). 90–100 % HRmax: the "red zone" is ≥ 90 % VO2max (Buchheit & Laursen 2013; Wenger &
    // Bell 1986). Sprints raise VO2max less and not stroke volume (Hov 2023; Helgerud 2023; Rosenblat 2022) — that
    // is S7's card. Sets 4–6 and rest ≈1:1 are conventions inside "≥ 16 min of work" (Helgerud 4:3; Attia 4:4;
    // Bacon ≥ 1:1). Effort is the hardest even pace that survives all reps (Seiler's isoeffort design), not a
    // sprint — reworded 2026-09-03 (039 S8 fork 2, ledger D24). Cue attributed to Helgerud et al. 2007 the same
    // day (fork 3, D23): Galpin does not prescribe the 4 × 4, Attia does without naming it.
    // See docs/grounding/039-adaptations-read.md#grounding
    rx: {
      load: '~90–100% max HR',
      reps: '3–8 min efforts',
      sets: '4–6',
      rest: '≈1:1',
      effort: 'Max you can hold evenly across reps',
      cue: 'Helgerud’s 4×4: 4 min at 90–95% HRmax, 3 min easy between.',
    },
  },
  {
    key: 'endurance',
    label: 'Long-Duration Endurance',
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
    // rx.endurance — Zone 2 is the band immediately below LT1/VT1 (Sitko 2025 expert panel; Jamnick 2020); the talk
    // test is the validated field proxy (≈ VT1 across modes and after VT shifts — Persinger 2004, Foster 2008, Reed &
    // Pipe 2014). No %HRmax is printed on purpose: VT1 ≈ 81 % and Fatmax ≈ 72 % HRmax with 6–29 % CV (Meixner 2025,
    // n = 50) vs ACSM's 64–76 % — a fixed % is the weakest anchor. "30 min" is ACSM 2011's daily dose (≥30 min·d⁻¹)
    // used as a per-bout floor — a CONVENTION: no human per-bout threshold exists (Murphy 2019, Jakicic 2019), the
    // floor lengthens as intensity drops in rats (Dudley 1982), Galpin says 20–30, Attia/San-Millán ≥45. The cue was
    // reworded 2026-09-03 (039 S9, ledger D27–D28): "nasal-breathing pace" was Huberman's proxy — nasal-only breathing
    // is a ventilation ceiling that moves with practice (Mapelli 2025; Dallam 2018), never tested against LT1;
    // "builds mitochondria & fat oxidation" is true but not distinctive — work-matched intervals do both at least as
    // well (MacInnis 2017; Granata 2016; Talanian 2007; Yin 2023 meta-analysis; Storoschuk 2025 review), volume
    // drives content (Granata 2018). See docs/grounding/039-adaptations-read.md#grounding
    rx: {
      load: 'Zone 2 (conversational)',
      reps: '30 min–hours',
      sets: '1 continuous',
      rest: '—',
      effort: 'Easy, sustainable',
      cue: 'Talk-test pace: full sentences, a little strained. Minutes are the dose; hard intervals build mitochondria too.',
    },
  },
]

/** Fast lookup by key. */
export const ADAPTATION_MAP: Record<Adaptation, AdaptationMeta> = Object.fromEntries(
  ADAPTATIONS.map(a => [a.key, a]),
) as Record<Adaptation, AdaptationMeta>

/** Cross-cutting principle shown at the top of the reference card. */
// ADAPTATION_PRINCIPLE — three camps, not two. Quality (power, strength): fatigue in the set costs power and RFD per
// % velocity loss (Jukic 2023; Pareja-Blanco 2017, 2020) and strength gains are flat across RIR — failure is
// unnecessary, not harmful (Robinson 2024; Grgic 2022; Davies 2016; Vieira 2021) — so "stop short of failure", not
// "never"; rest > 2 min in trained lifters (Grgic 2018). Effort (hypertrophy, muscular endurance, anaerobic): volume
// is the dose (Schoenfeld 2017; Pelland 2026), proximity to failure a modest slope that matters at light loads
// (Refalo 2023; Lasevicius 2022); anaerobic is all-out (Tabata 1996; Hall 2023). Rest is not the divider — > 60–90 s
// also grows more muscle (Singer 2024; Schoenfeld 2016). Pace (VO2max, endurance): hardest even pace across reps
// (Seiler 2013; Helgerud 2007), and ~80 % of endurance time easy (Seiler 2010; Stöggl 2014) — "push effort" was
// wrong for both. Framing: Galpin's "intensity drives strength/power, volume drives hypertrophy" (Huberman Lab guest
// series pt 2, 2023; ep. 65, 2022) on Zatsiorsky's three methods and the NSCA rest table; Israetel's efficiency-vs-
// stimulus is the same split. Nobody extends it to cardio — the seven-quality line is Tekiō's (039 S10).
// See docs/grounding/039-adaptations-read.md#grounding
// Two camps → three on 2026-09-03 (039 S10 forks 1–3, ledger D25); the card's attribution line is D26.
export const ADAPTATION_PRINCIPLE =
  'Power · Strength are quality-driven — heavy or fast, rest fully, stop short of failure. ' +
  'Hypertrophy · Muscular endurance · Anaerobic are effort-driven — accumulate hard sets, close to failure or all-out. ' +
  'VO₂max · Endurance are pace-driven — the hardest even pace you can repeat, or easy on purpose.'

/**
 * Keyword → adaptation defaults for exercises whose quality can’t be read from
 * reps alone (explosive / plyometric / sprint work). Checked in order against
 * the lower-cased name — a string as a substring, a RegExp as itself; first
 * hit wins. User-set tags override these.
 *
 * KEYWORD_ADAPTATION — Galpin's power exercise list as substrings. Jumps/plyo/
 * Olympic lifts/throws/sprints/swings are power work by the load and velocity
 * literature on `rx.power` above (swings: Lake & Lauder 2012, Otto 2012);
 * `sled` is power only when sprinted (Alcaraz 2018, Cross 2017) and `agility`
 * is a convention (Sheppard & Young 2006). A ≥16-rep swing set also trains
 * endurance (Junior 2022) — the rule counts it as power only, by decision
 * (039 S4 fork 3). `hop` and `jump` match whole words only: as substrings
 * they caught "Cable Woodchop" and "Jumping Jacks", and a chop set silently
 * left the hard-set total (DB check 2026-09-03). `clapping` is on Galpin's
 * list and is the one ballistic push-up name no other keyword catches.
 * See docs/grounding/039-adaptations-read.md#grounding
 */
const KEYWORD_ADAPTATION: [string | RegExp, Adaptation][] = [
  // Sprint / reactive work. These four tagged the retired `speed` adaptation
  // until 2026-08-29; they now tag power, which is the only remaining home for
  // maximal-velocity work. No new claim — the rule that already read "this is a
  // velocity quality, not a rep count" now points at the one velocity quality
  // left. See docs/roadmap/done/019-adaptation-model-simplification.md.
  ['sprint', 'power'],
  ['dash', 'power'],
  ['agility', 'power'],
  ['pogo', 'power'],
  // Plyometric / ballistic / Olympic
  ['clean', 'power'],
  ['snatch', 'power'],
  ['jerk', 'power'],
  ['box jump', 'power'],
  ['broad jump', 'power'],
  ['jump squat', 'power'],
  [/\bjumps?\b/, 'power'],
  ['plyo', 'power'],
  ['clapping', 'power'],
  ['throw', 'power'],
  ['med ball', 'power'],
  ['medicine ball', 'power'],
  ['slam', 'power'],
  ['kettlebell swing', 'power'],
  ['kb swing', 'power'],
  ['sled', 'power'],
  [/\bhops?\b/, 'power'],
]

/**
 * Names that contain a power keyword but are conditioning, not power work —
 * they fall back to reps like any ordinary exercise (039 S4).
 */
const NOT_POWER = ['jump rope']

/** Built-in adaptation for an exercise name, or null if it should fall back to reps. */
export function defaultAdaptationForExercise(name: string): Adaptation | null {
  const n = name.toLowerCase()
  if (NOT_POWER.some(x => n.includes(x))) return null
  for (const [kw, a] of KEYWORD_ADAPTATION) {
    if (typeof kw === 'string' ? n.includes(kw) : kw.test(n)) return a
  }
  return null
}
