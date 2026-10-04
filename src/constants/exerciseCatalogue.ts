// RFC 0074: the committed exercise catalogue. A name typed for the first time
// should usually land on a row here, already mapped, instead of creating an
// unmapped exercise whose sets count for nothing on the muscle read.
//
// Each entry names its movement pattern and inherits that pattern's links
// (src/constants/movementPatterns.ts). An entry that departs from its pattern
// carries its own complete link set AND a one-line reason; the standing check
// in src/test/exerciseCatalogue.test.ts fails on links without one.
//
// Scope: lifts. Stretches, foam rolling and mobility drills keep their own
// `recovery` model; jumps, throws, sprints and sled work are power drills with
// hand-written links and no pattern yet.

import { MOVEMENT_PATTERNS, type LinkSet, type PatternKey } from './movementPatterns'
import { normaliseExerciseName as key } from '../lib/exerciseName'

export interface CatalogueEntry {
  /** Canonical name, as `exercises.name` spells it. */
  name: string
  pattern: PatternKey
  /** Other spellings, resolved through `exercise_aliases` (RFC 0044). Only
   *  spellings that normalise differently from `name` belong here. */
  aliases?: string[]
  /** A complete link set replacing the pattern's — never a partial patch. */
  links?: LinkSet
  /** Required whenever `links` is set: why this lift is not its pattern. */
  reason?: string
}

/** The links an entry writes: its own override, else its pattern's. */
export const linksFor = (e: CatalogueEntry): LinkSet => e.links ?? MOVEMENT_PATTERNS[e.pattern].links

export const EXERCISE_CATALOGUE: CatalogueEntry[] = [
  // ── Squat ─────────────────────────────────────────────────────────────────
  { name: 'Back Squat', pattern: 'squat', aliases: ['Barbell Back Squat', 'Squat'] },
  { name: 'Goblet Squat', pattern: 'squat', aliases: ['Goblet Squats'] },
  { name: 'Leg Press', pattern: 'squat' },

  // ── Lunge ─────────────────────────────────────────────────────────────────
  { name: 'Bulgarian Split Squat', pattern: 'lunge', aliases: ['Bulgarian Split Squats'] },
  { name: 'Forward Dumbbell Lunge', pattern: 'lunge' },
  { name: 'Backward Dumbbell Lunge', pattern: 'lunge' },
  {
    name: 'Lateral Lunge', pattern: 'lunge', aliases: ['Side Lunge'],
    links: { Adductors: 1, Quadriceps: 1, Glutes: 2 },
    reason: 'The trailing leg\'s adductors carry the lever, and the working knee bends like a single-leg squat',
  },

  // ── Hip hinge ─────────────────────────────────────────────────────────────
  { name: 'Deadlift', pattern: 'hingeKneeBent', aliases: ['Conventional Deadlift'] },
  {
    name: 'Single-Leg RDL', pattern: 'hingeStraightKnee',
    links: { Glutes: 1, Hamstrings: 1, Erectors: 3 },
    reason: 'Unilateral load: the lumbar moment is far below a bilateral hinge, so the erectors only brace',
  },
  { name: 'Kettlebell Swing', pattern: 'hingeStraightKnee', aliases: ['KB Swing', 'KB Swings', 'Kettlebell Swings'] },
  { name: 'Back Extension (flat-back)', pattern: 'hingeStraightKnee' },
  {
    name: 'Back Extension (round-back)', pattern: 'hingeStraightKnee',
    links: { Erectors: 1, Glutes: 2, Hamstrings: 2 },
    reason: 'The spine moves through its range, so the erectors are the prime mover',
  },

  // ── Hip extension, knee flexion and extension, calves ─────────────────────
  { name: 'Hip Thrust', pattern: 'hipExtensionBentKnee', aliases: ['Hip Thrusts'] },
  { name: 'Glute Bridge', pattern: 'hipExtensionBentKnee', aliases: ['Glute Bridges'] },
  { name: 'Leg Curl', pattern: 'kneeFlexion', aliases: ['Leg Curls'] },
  {
    name: 'Nordic Hamstring Curl', pattern: 'kneeFlexion', aliases: ['Nordic Curl', 'Nordics'],
    links: { Hamstrings: 1, Calves: 3, Glutes: 3 },
    reason: 'Bodyweight knee flexion with the hip held extended: the glutes brace',
  },
  { name: 'Leg Extension', pattern: 'kneeExtension', aliases: ['Leg Extensions'] },
  { name: 'Calf Raises', pattern: 'plantarFlexion', aliases: ['Calf Raise'] },
  { name: 'Standing Calf Raise', pattern: 'plantarFlexion', aliases: ['Standing Calf Raises'] },
  { name: 'Single-Leg Calf Raise', pattern: 'plantarFlexion' },

  // ── Push ──────────────────────────────────────────────────────────────────
  { name: 'Bench Press', pattern: 'horizontalPush', aliases: ['Barbell Bench Press', 'Flat Bench Press'] },
  { name: 'Chest Press', pattern: 'horizontalPush' },
  { name: 'Push-ups', pattern: 'horizontalPush', aliases: ['Press-ups'] },
  { name: 'Clapping Push-up', pattern: 'horizontalPush', aliases: ['Clapping Push-ups'] },
  { name: 'Dips', pattern: 'horizontalPush', aliases: ['Dip'] },
  { name: 'Overhead Press', pattern: 'verticalPush', aliases: ['Military Press', 'OHP'] },
  { name: 'Dumbbell Shoulder Press', pattern: 'verticalPush' },
  { name: 'Skull Crusher', pattern: 'elbowExtension', aliases: ['Skull Crushers'] },
  { name: 'Tricep Extensions', pattern: 'elbowExtension', aliases: ['Tricep Extension'] },
  { name: 'Incline Dumbbell Tricep Extension', pattern: 'elbowExtension' },
  { name: 'Machine Arm Extension', pattern: 'elbowExtension', aliases: ['Arm Extension'] },
  { name: 'Tricep Push Out (Cable Pushdown)', pattern: 'elbowExtension' },
  {
    name: 'Bench Dip', pattern: 'elbowExtension', aliases: ['Bench Dips'],
    links: { Triceps: 1, 'Anterior Deltoid': 2, Chest: 3 },
    reason: 'Hands behind the hips: the shoulder extends, so the elbow does the work and the chest only stabilises',
  },
  { name: 'Dumbbell Lateral Raise', pattern: 'shoulderAbduction' },
  { name: 'Cable Shrugs (4 Positions)', pattern: 'scapularElevation' },

  // ── Pull ──────────────────────────────────────────────────────────────────
  { name: 'Pull-ups', pattern: 'verticalPull', aliases: ['Pull up'] },
  { name: 'Chin-up', pattern: 'verticalPull', aliases: ['Chin-ups'] },
  { name: 'Lat Pulldown', pattern: 'verticalPull', aliases: ['Lat Pulldowns'] },
  { name: 'Rows', pattern: 'horizontalPull', aliases: ['Barbell Row', 'Row'] },
  { name: 'Low Row', pattern: 'horizontalPull' },
  { name: 'Single-Arm DB Row', pattern: 'horizontalPull', aliases: ['One Arm Dumbbell Row'] },
  { name: 'Bicep Curls', pattern: 'elbowFlexion', aliases: ['Barbell Curl', 'Bicep Curl'] },
  { name: 'Standing Dumbbell Curl', pattern: 'elbowFlexion' },
  { name: 'Incline/Seated/Drag Curl', pattern: 'elbowFlexion' },
  { name: 'Machine Curl', pattern: 'elbowFlexion', aliases: ['Machine Curls'] },
  {
    name: 'Crossbody Pronated Curl', pattern: 'elbowFlexion',
    links: { Biceps: 1, Forearms: 2 },
    reason: 'Pronated grip: the brachioradialis becomes a prime elbow flexor',
  },
  { name: 'Reverse Fly', pattern: 'horizontalAbduction', aliases: ['Rear Delt Fly', 'Reverse Flyes'] },
  { name: 'Band Pull-Apart', pattern: 'horizontalAbduction' },
  {
    name: 'Face Pulls', pattern: 'horizontalAbduction', aliases: ['Face Pull'],
    links: { 'Posterior Deltoid': 1, 'Rotator Cuff': 2, Rhomboids: 2, 'Upper Back / Traps': 2 },
    reason: 'Ends in external rotation, which loads the rotator cuff beyond a plain reverse fly',
  },
  { name: 'Barbell Ring Outs', pattern: 'wristAndGrip' },

  // ── Trunk, Olympic ────────────────────────────────────────────────────────
  { name: 'Hanging Leg Raises', pattern: 'hipFlexionTrunk', aliases: ['Hanging Leg Raise'] },
  { name: 'Decline Sit Ups', pattern: 'hipFlexionTrunk' },
  { name: 'Dead Bug', pattern: 'antiExtension' },
  { name: 'Cable Woodchop', pattern: 'rotation', aliases: ['Cable Woodchops'] },
  { name: 'Pallof Press', pattern: 'rotation', aliases: ['Pallof Presses'] },
  {
    name: 'Copenhagen Plank', pattern: 'lateralFlexion', aliases: ['Copenhagen Planks'],
    links: { Adductors: 1, Obliques: 2 },
    reason: 'The top leg\'s adductors hold the body up; Copenhagen training grew adductor longus ~18 % (Alonso-Fernández 2022)',
  },
  { name: 'Power Clean', pattern: 'olympic', aliases: ['Power Cleans'] },
  { name: 'Hang Power Clean', pattern: 'olympic', aliases: ['Hang Clean'] },
  {
    name: 'Snatch', pattern: 'olympic', aliases: ['Snatches'],
    links: { Glutes: 1, Quadriceps: 1, Hamstrings: 2, 'Upper Back / Traps': 2, Erectors: 2, 'Anterior Deltoid': 3 },
    reason: 'The overhead receive is an isometric hold, not a press',
  },
  {
    name: 'Clean and Jerk', pattern: 'olympic', aliases: ['Clean & Jerk'],
    links: { Glutes: 1, Quadriceps: 1, Hamstrings: 2, 'Upper Back / Traps': 2, Erectors: 2, 'Anterior Deltoid': 2, Triceps: 2 },
    reason: 'The jerk adds a dynamic overhead drive',
  },
]

/**
 * The standing check (RFC 0074 §5): everything wrong with a catalogue, as
 * sentences. Empty means sound. It protects the committed file, not the live
 * table — the provenance columns cover edits made against the database.
 */
export function catalogueProblems(entries: CatalogueEntry[]): string[] {
  const problems: string[] = []
  const owner = new Map<string, string>()
  const claim = (spelling: string, by: string) => {
    const k = key(spelling)
    const prior = owner.get(k)
    if (prior !== undefined) problems.push(`"${spelling}" (${by}) collides with ${prior}`)
    else owner.set(k, by)
  }

  for (const e of entries) {
    claim(e.name, e.name)
    for (const a of e.aliases ?? []) claim(a, `an alias of ${e.name}`)

    if (e.links && !e.reason?.trim()) problems.push(`${e.name} departs from ${e.pattern} without a reason`)
    if (!e.links && e.reason) problems.push(`${e.name} gives a reason but no links of its own`)

    const pattern = MOVEMENT_PATTERNS[e.pattern].links as LinkSet
    if (e.links && JSON.stringify(Object.entries(e.links).sort()) === JSON.stringify(Object.entries(pattern).sort())) {
      problems.push(`${e.name} overrides ${e.pattern} with the same links`)
    }

    const links = linksFor(e)
    if (!Object.values(links).includes(1)) problems.push(`${e.name} has no prime mover`)
    // The class of error RFC 0074 was opened for: the lats do not cross the
    // elbow, so no curl may credit them, override or not.
    if (e.pattern === 'elbowFlexion' && links.Lats) problems.push(`${e.name} is a curl with a Lats link`)
  }
  return problems
}
