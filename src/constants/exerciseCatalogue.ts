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
  // ── The rest of the catalogue: common lifts not logged yet (Peter's ~250) ─
  // Squat
  { name: 'Front Squat', pattern: 'squat', aliases: ['Barbell Front Squat'] },
  { name: 'Hack Squat', pattern: 'squat', aliases: ['Machine Hack Squat'] },
  { name: 'Smith Machine Squat', pattern: 'squat', aliases: ['Smith Squat'] },
  { name: 'Box Squat', pattern: 'squat' },
  { name: 'Pause Squat', pattern: 'squat', aliases: ['Paused Squat'] },
  { name: 'Safety Bar Squat', pattern: 'squat', aliases: ['SSB Squat'] },
  { name: 'Zercher Squat', pattern: 'squat' },
  { name: 'Belt Squat', pattern: 'squat' },
  { name: 'Pendulum Squat', pattern: 'squat' },
  { name: 'Dumbbell Squat', pattern: 'squat' },
  { name: 'Single-Leg Leg Press', pattern: 'squat' },
  { name: 'Heel-Elevated Squat', pattern: 'squat', aliases: ['Cyclist Squat'] },
  { name: 'Landmine Squat', pattern: 'squat' },
  // Lunge
  { name: 'Walking Lunge', pattern: 'lunge', aliases: ['Walking Lunges'] },
  { name: 'Reverse Lunge', pattern: 'lunge', aliases: ['Reverse Lunges'] },
  { name: 'Barbell Lunge', pattern: 'lunge' },
  { name: 'Split Squat', pattern: 'lunge', aliases: ['Split Squats'] },
  { name: 'Front-Foot-Elevated Split Squat', pattern: 'lunge' },
  { name: 'Step-up', pattern: 'lunge', aliases: ['Step-ups', 'Dumbbell Step-up'] },
  { name: 'Curtsy Lunge', pattern: 'lunge' },
  { name: 'Pistol Squat', pattern: 'lunge', aliases: ['Single-Leg Squat'] },
  { name: 'Skater Squat', pattern: 'lunge' },
  { name: 'Smith Machine Lunge', pattern: 'lunge' },
  // Hinge
  {
    name: 'Sumo Deadlift', pattern: 'hingeKneeBent', aliases: ['Sumo Deadlifts'],
    links: { Glutes: 1, Hamstrings: 1, Quadriceps: 2, Adductors: 2, Erectors: 2, Lats: 3, 'Upper Back / Traps': 3 },
    reason: 'The wide stance puts the adductors to work as hip extensors',
  },
  { name: 'Trap Bar Deadlift', pattern: 'hingeKneeBent', aliases: ['Hex Bar Deadlift'] },
  { name: 'Deficit Deadlift', pattern: 'hingeKneeBent' },
  { name: 'Rack Pull', pattern: 'hingeKneeBent', aliases: ['Rack Pulls', 'Block Pull'] },
  { name: 'Dumbbell Deadlift', pattern: 'hingeKneeBent' },
  { name: 'Romanian Deadlift', pattern: 'hingeStraightKnee', aliases: ['RDL', 'Barbell RDL'] },
  { name: 'Dumbbell Romanian Deadlift', pattern: 'hingeStraightKnee', aliases: ['DB RDL', 'Dumbbell RDL'] },
  { name: 'Stiff-Leg Deadlift', pattern: 'hingeStraightKnee', aliases: ['Stiff-Legged Deadlift', 'SLDL'] },
  { name: 'Good Morning', pattern: 'hingeStraightKnee', aliases: ['Good Mornings'] },
  { name: 'Cable Pull-Through', pattern: 'hingeStraightKnee', aliases: ['Pull-Through'] },
  { name: 'Reverse Hyperextension', pattern: 'hingeStraightKnee', aliases: ['Reverse Hyper'] },
  { name: '45° Back Extension', pattern: 'hingeStraightKnee', aliases: ['Hyperextension', 'Hyperextensions', '45 Degree Hyperextension'] },
  {
    name: 'Single-Leg Dumbbell RDL', pattern: 'hingeStraightKnee',
    links: { Glutes: 1, Hamstrings: 1, Erectors: 3 },
    reason: 'Unilateral load: the lumbar moment is far below a bilateral hinge, so the erectors only brace',
  },
  // Hip extension, bent knee
  { name: 'Barbell Glute Bridge', pattern: 'hipExtensionBentKnee' },
  { name: 'Single-Leg Hip Thrust', pattern: 'hipExtensionBentKnee' },
  { name: 'Machine Hip Thrust', pattern: 'hipExtensionBentKnee', aliases: ['Glute Drive'] },
  { name: 'Smith Machine Hip Thrust', pattern: 'hipExtensionBentKnee' },
  { name: 'Cable Glute Kickback', pattern: 'hipExtensionBentKnee', aliases: ['Glute Kickback', 'Cable Kickback'] },
  { name: 'Frog Pump', pattern: 'hipExtensionBentKnee', aliases: ['Frog Pumps'] },
  // Knee flexion
  { name: 'Seated Leg Curl', pattern: 'kneeFlexion', aliases: ['Seated Hamstring Curl'] },
  { name: 'Lying Leg Curl', pattern: 'kneeFlexion', aliases: ['Prone Leg Curl', 'Lying Hamstring Curl'] },
  { name: 'Single-Leg Leg Curl', pattern: 'kneeFlexion', aliases: ['Standing Leg Curl'] },
  {
    name: 'Glute-Ham Raise', pattern: 'kneeFlexion', aliases: ['GHR'],
    links: { Hamstrings: 1, Calves: 3, Glutes: 3 },
    reason: 'Knee flexion against bodyweight with the hip held extended: the glutes brace',
  },
  { name: 'Slider Leg Curl', pattern: 'kneeFlexion', aliases: ['Swiss Ball Leg Curl', 'Stability Ball Leg Curl'] },
  // Knee extension
  { name: 'Single-Leg Extension', pattern: 'kneeExtension', aliases: ['Single-Leg Leg Extension'] },
  { name: 'Sissy Squat', pattern: 'kneeExtension', aliases: ['Sissy Squats'] },
  { name: 'Reverse Nordic', pattern: 'kneeExtension', aliases: ['Reverse Nordics'] },
  // Abduction, adduction
  { name: 'Hip Abduction Machine', pattern: 'hipAbduction', aliases: ['Hip Abduction', 'Abductor Machine', 'Seated Hip Abduction'] },
  { name: 'Cable Hip Abduction', pattern: 'hipAbduction', aliases: ['Standing Cable Abduction'] },
  { name: 'Banded Lateral Walk', pattern: 'hipAbduction', aliases: ['Monster Walk', 'Band Walk'] },
  { name: 'Hip Adduction Machine', pattern: 'hipAdduction', aliases: ['Hip Adduction', 'Adductor Machine', 'Seated Hip Adduction'] },
  { name: 'Cable Hip Adduction', pattern: 'hipAdduction' },
  // Calves
  { name: 'Seated Calf Raise', pattern: 'plantarFlexion', aliases: ['Seated Calf Raises'] },
  { name: 'Leg Press Calf Raise', pattern: 'plantarFlexion', aliases: ['Calf Press'] },
  { name: 'Donkey Calf Raise', pattern: 'plantarFlexion' },
  { name: 'Smith Machine Calf Raise', pattern: 'plantarFlexion' },

  // Horizontal push
  { name: 'Incline Bench Press', pattern: 'horizontalPush', aliases: ['Incline Barbell Press', 'Incline Press'] },
  { name: 'Dumbbell Bench Press', pattern: 'horizontalPush', aliases: ['DB Bench Press', 'Dumbbell Press', 'Flat Dumbbell Press'] },
  { name: 'Incline Dumbbell Press', pattern: 'horizontalPush', aliases: ['Incline DB Press', 'Incline Dumbbell Bench Press'] },
  { name: 'Decline Bench Press', pattern: 'horizontalPush', aliases: ['Decline Press'] },
  { name: 'Close-Grip Bench Press', pattern: 'horizontalPush', aliases: ['CGBP', 'Close Grip Bench'] },
  { name: 'Floor Press', pattern: 'horizontalPush' },
  { name: 'Smith Machine Bench Press', pattern: 'horizontalPush', aliases: ['Smith Bench Press'] },
  { name: 'Incline Smith Machine Press', pattern: 'horizontalPush', aliases: ['Incline Smith Press'] },
  { name: 'Machine Chest Press', pattern: 'horizontalPush', aliases: ['Seated Chest Press'] },
  { name: 'Incline Machine Press', pattern: 'horizontalPush', aliases: ['Incline Chest Press'] },
  { name: 'Cable Chest Press', pattern: 'horizontalPush' },
  { name: 'Landmine Chest Press', pattern: 'horizontalPush' },
  { name: 'Weighted Dips', pattern: 'horizontalPush', aliases: ['Weighted Dip'] },
  { name: 'Machine Dip', pattern: 'horizontalPush', aliases: ['Assisted Dip', 'Seated Dip Machine'] },
  { name: 'Incline Push-up', pattern: 'horizontalPush', aliases: ['Incline Push-ups'] },
  { name: 'Decline Push-up', pattern: 'horizontalPush', aliases: ['Decline Push-ups'] },
  { name: 'Diamond Push-up', pattern: 'horizontalPush', aliases: ['Diamond Push-ups', 'Close-Grip Push-up'] },
  { name: 'Deficit Push-up', pattern: 'horizontalPush', aliases: ['Deficit Push-ups'] },
  { name: 'Weighted Push-up', pattern: 'horizontalPush', aliases: ['Weighted Push-ups'] },
  { name: 'Ring Push-up', pattern: 'horizontalPush', aliases: ['Ring Push-ups'] },
  { name: 'Ring Dip', pattern: 'horizontalPush', aliases: ['Ring Dips'] },
  // Vertical push
  { name: 'Seated Dumbbell Shoulder Press', pattern: 'verticalPush', aliases: ['Seated DB Shoulder Press', 'Seated Dumbbell Press'] },
  { name: 'Arnold Press', pattern: 'verticalPush', aliases: ['Arnold Presses'] },
  { name: 'Machine Shoulder Press', pattern: 'verticalPush', aliases: ['Shoulder Press Machine', 'Shoulder Press'] },
  { name: 'Seated Barbell Press', pattern: 'verticalPush', aliases: ['Seated Overhead Press'] },
  { name: 'Push Press', pattern: 'verticalPush', aliases: ['Push Presses'] },
  { name: 'Z Press', pattern: 'verticalPush' },
  { name: 'Smith Machine Shoulder Press', pattern: 'verticalPush', aliases: ['Smith Shoulder Press'] },
  { name: 'Landmine Press', pattern: 'verticalPush', aliases: ['Single-Arm Landmine Press'] },
  { name: 'Single-Arm Dumbbell Press', pattern: 'verticalPush', aliases: ['Single-Arm Shoulder Press'] },
  { name: 'Handstand Push-up', pattern: 'verticalPush', aliases: ['Handstand Push-ups', 'HSPU'] },
  { name: 'Pike Push-up', pattern: 'verticalPush', aliases: ['Pike Push-ups'] },
  // Elbow extension
  { name: 'Rope Pushdown', pattern: 'elbowExtension', aliases: ['Rope Tricep Pushdown', 'Rope Pressdown'] },
  { name: 'Straight-Bar Pushdown', pattern: 'elbowExtension', aliases: ['Tricep Pushdown', 'Triceps Pushdown', 'Cable Pushdown', 'V-Bar Pushdown'] },
  { name: 'Single-Arm Cable Pushdown', pattern: 'elbowExtension', aliases: ['Single-Arm Pushdown'] },
  { name: 'Overhead Cable Tricep Extension', pattern: 'elbowExtension', aliases: ['Overhead Cable Extension', 'Cable Overhead Extension'] },
  { name: 'Overhead Dumbbell Tricep Extension', pattern: 'elbowExtension', aliases: ['Overhead Tricep Extension', 'Dumbbell Overhead Extension', 'French Press'] },
  { name: 'EZ-Bar Skull Crusher', pattern: 'elbowExtension', aliases: ['Lying Tricep Extension'] },
  { name: 'Dumbbell Skull Crusher', pattern: 'elbowExtension' },
  { name: 'Tricep Kickback', pattern: 'elbowExtension', aliases: ['Tricep Kickbacks', 'Dumbbell Kickback', 'Cable Kickback Triceps'] },
  { name: 'JM Press', pattern: 'elbowExtension' },
  { name: 'PJR Pullover', pattern: 'elbowExtension', aliases: ['PJR Pullovers'] },
  { name: 'Tate Press', pattern: 'elbowExtension' },
  { name: 'Machine Tricep Extension', pattern: 'elbowExtension', aliases: ['Tricep Extension Machine'] },
  // Shoulder abduction
  { name: 'Cable Lateral Raise', pattern: 'shoulderAbduction', aliases: ['Cable Lateral Raises', 'Cable Side Raise'] },
  { name: 'Machine Lateral Raise', pattern: 'shoulderAbduction', aliases: ['Lateral Raise Machine'] },
  { name: 'Lean-Away Lateral Raise', pattern: 'shoulderAbduction' },
  { name: 'Seated Lateral Raise', pattern: 'shoulderAbduction' },
  { name: 'Y-Raise', pattern: 'shoulderAbduction', aliases: ['Y Raises', 'Incline Y-Raise'] },
  // Upright row
  { name: 'Barbell Upright Row', pattern: 'uprightRow', aliases: ['Upright Row', 'Upright Rows'] },
  { name: 'Dumbbell Upright Row', pattern: 'uprightRow' },
  { name: 'Cable Upright Row', pattern: 'uprightRow' },
  // Horizontal adduction
  { name: 'Pec Deck', pattern: 'horizontalAdduction', aliases: ['Pec Fly', 'Machine Fly', 'Pec Deck Fly', 'Butterfly'] },
  { name: 'Cable Fly', pattern: 'horizontalAdduction', aliases: ['Cable Flyes', 'Cable Crossover', 'Cable Crossovers'] },
  { name: 'Low-to-High Cable Fly', pattern: 'horizontalAdduction', aliases: ['Low Cable Fly'] },
  { name: 'High-to-Low Cable Fly', pattern: 'horizontalAdduction' },
  { name: 'Dumbbell Fly', pattern: 'horizontalAdduction', aliases: ['Dumbbell Flyes', 'DB Fly', 'Chest Fly'] },
  { name: 'Incline Dumbbell Fly', pattern: 'horizontalAdduction', aliases: ['Incline Fly', 'Incline Dumbbell Flyes'] },
  // Shoulder flexion
  { name: 'Dumbbell Front Raise', pattern: 'shoulderFlexion', aliases: ['Front Raise', 'Front Raises'] },
  { name: 'Plate Front Raise', pattern: 'shoulderFlexion', aliases: ['Plate Raise'] },
  { name: 'Cable Front Raise', pattern: 'shoulderFlexion' },
  // Scapular elevation
  { name: 'Barbell Shrug', pattern: 'scapularElevation', aliases: ['Shrug', 'Shrugs', 'Barbell Shrugs'] },
  { name: 'Dumbbell Shrug', pattern: 'scapularElevation', aliases: ['Dumbbell Shrugs', 'DB Shrug'] },
  { name: 'Trap Bar Shrug', pattern: 'scapularElevation', aliases: ['Trap Bar Shrugs'] },
  { name: 'Machine Shrug', pattern: 'scapularElevation' },

  // Vertical pull
  { name: 'Wide-Grip Pull-up', pattern: 'verticalPull', aliases: ['Wide Grip Pull-ups'] },
  { name: 'Neutral-Grip Pull-up', pattern: 'verticalPull', aliases: ['Neutral Grip Pull-ups', 'Hammer Grip Pull-up'] },
  { name: 'Weighted Pull-up', pattern: 'verticalPull', aliases: ['Weighted Pull-ups'] },
  { name: 'Weighted Chin-up', pattern: 'verticalPull', aliases: ['Weighted Chin-ups'] },
  { name: 'Assisted Pull-up', pattern: 'verticalPull', aliases: ['Assisted Pull-ups', 'Machine Assisted Pull-up'] },
  { name: 'Close-Grip Lat Pulldown', pattern: 'verticalPull', aliases: ['Close Grip Pulldown', 'V-Bar Pulldown'] },
  { name: 'Wide-Grip Lat Pulldown', pattern: 'verticalPull', aliases: ['Wide Grip Pulldown'] },
  { name: 'Neutral-Grip Lat Pulldown', pattern: 'verticalPull', aliases: ['Neutral Grip Pulldown'] },
  { name: 'Underhand Lat Pulldown', pattern: 'verticalPull', aliases: ['Reverse Grip Pulldown', 'Supinated Pulldown'] },
  { name: 'Single-Arm Lat Pulldown', pattern: 'verticalPull', aliases: ['Single-Arm Pulldown'] },
  { name: 'Machine Pulldown', pattern: 'verticalPull', aliases: ['Pulldown Machine'] },
  // Horizontal pull
  { name: 'Barbell Bent-Over Row', pattern: 'horizontalPull', aliases: ['Bent-Over Row', 'Bent Over Barbell Row'] },
  { name: 'Pendlay Row', pattern: 'horizontalPull', aliases: ['Pendlay Rows'] },
  { name: 'Yates Row', pattern: 'horizontalPull', aliases: ['Underhand Barbell Row'] },
  { name: 'T-Bar Row', pattern: 'horizontalPull', aliases: ['T-Bar Rows'] },
  { name: 'Seated Cable Row', pattern: 'horizontalPull', aliases: ['Cable Row', 'Seated Row'] },
  { name: 'Single-Arm Cable Row', pattern: 'horizontalPull' },
  { name: 'Chest-Supported Dumbbell Row', pattern: 'horizontalPull', aliases: ['Incline Dumbbell Row', 'Chest Supported Row'] },
  { name: 'Machine Row', pattern: 'horizontalPull', aliases: ['Seated Machine Row', 'Machine Rows'] },
  { name: 'Chest-Supported T-Bar Row', pattern: 'horizontalPull' },
  { name: 'Seal Row', pattern: 'horizontalPull', aliases: ['Seal Rows'] },
  { name: 'Meadows Row', pattern: 'horizontalPull' },
  { name: 'Kroc Row', pattern: 'horizontalPull', aliases: ['Kroc Rows'] },
  { name: 'Landmine Row', pattern: 'horizontalPull' },
  { name: 'Inverted Row', pattern: 'horizontalPull', aliases: ['Inverted Rows', 'Bodyweight Row', 'Australian Pull-up'] },
  { name: 'Ring Row', pattern: 'horizontalPull', aliases: ['Ring Rows', 'TRX Row'] },
  { name: 'Dumbbell Row', pattern: 'horizontalPull', aliases: ['Dumbbell Rows', 'Bent-Over Dumbbell Row'] },
  // Elbow flexion
  { name: 'EZ-Bar Curl', pattern: 'elbowFlexion', aliases: ['EZ Curl'] },
  { name: 'Preacher Curl', pattern: 'elbowFlexion', aliases: ['Preacher Curls', 'EZ-Bar Preacher Curl'] },
  { name: 'Dumbbell Preacher Curl', pattern: 'elbowFlexion' },
  { name: 'Machine Preacher Curl', pattern: 'elbowFlexion' },
  { name: 'Cable Curl', pattern: 'elbowFlexion', aliases: ['Cable Curls', 'Cable Bicep Curl'] },
  { name: 'Bayesian Cable Curl', pattern: 'elbowFlexion', aliases: ['Bayesian Curl'] },
  { name: 'Incline Dumbbell Curl', pattern: 'elbowFlexion', aliases: ['Incline Curl', 'Incline Curls'] },
  { name: 'Concentration Curl', pattern: 'elbowFlexion', aliases: ['Concentration Curls'] },
  { name: 'Spider Curl', pattern: 'elbowFlexion', aliases: ['Spider Curls'] },
  { name: 'Drag Curl', pattern: 'elbowFlexion', aliases: ['Drag Curls'] },
  {
    name: 'Hammer Curl', pattern: 'elbowFlexion', aliases: ['Hammer Curls', 'Dumbbell Hammer Curl'],
    links: { Biceps: 1, Forearms: 2 },
    reason: 'Neutral grip: the brachioradialis becomes a prime elbow flexor',
  },
  {
    name: 'Cable Rope Hammer Curl', pattern: 'elbowFlexion', aliases: ['Rope Hammer Curl'],
    links: { Biceps: 1, Forearms: 2 },
    reason: 'Neutral grip: the brachioradialis becomes a prime elbow flexor',
  },
  {
    name: 'Reverse Curl', pattern: 'elbowFlexion', aliases: ['Reverse Curls', 'Reverse Grip Curl', 'EZ-Bar Reverse Curl'],
    links: { Biceps: 1, Forearms: 2 },
    reason: 'Pronated grip: the brachioradialis becomes a prime elbow flexor',
  },
  {
    name: 'Zottman Curl', pattern: 'elbowFlexion', aliases: ['Zottman Curls'],
    links: { Biceps: 1, Forearms: 2 },
    reason: 'The lowering half is pronated: the brachioradialis works as a prime flexor',
  },
  // Horizontal abduction
  { name: 'Rear Delt Machine', pattern: 'horizontalAbduction', aliases: ['Reverse Pec Deck', 'Rear Delt Fly Machine'] },
  { name: 'Cable Reverse Fly', pattern: 'horizontalAbduction', aliases: ['Cable Rear Delt Fly', 'Cable Rear Delt Raise'] },
  { name: 'Bent-Over Rear Delt Raise', pattern: 'horizontalAbduction', aliases: ['Rear Delt Raise', 'Bent-Over Reverse Fly'] },
  { name: 'Chest-Supported Reverse Fly', pattern: 'horizontalAbduction', aliases: ['Incline Reverse Fly'] },
  { name: 'Rear Delt Row', pattern: 'horizontalAbduction', aliases: ['Wide-Grip Rear Delt Row'] },
  // Straight-arm shoulder extension
  { name: 'Straight-Arm Pulldown', pattern: 'straightArmExtension', aliases: ['Straight-Arm Lat Pulldown', 'Lat Prayer'] },
  { name: 'Cable Pullover', pattern: 'straightArmExtension', aliases: ['Rope Pullover'] },
  { name: 'Machine Pullover', pattern: 'straightArmExtension' },
  {
    name: 'Dumbbell Pullover', pattern: 'straightArmExtension', aliases: ['DB Pullover', 'Barbell Pullover'],
    links: { Chest: 1, Lats: 2, Triceps: 3 },
    reason: 'Lying with a free weight, the pec out-works the lats in the EMG (Muyor 2022)',
  },
  // Wrist and grip
  { name: 'Wrist Curl', pattern: 'wristAndGrip', aliases: ['Wrist Curls', 'Barbell Wrist Curl'] },
  { name: 'Reverse Wrist Curl', pattern: 'wristAndGrip', aliases: ['Reverse Wrist Curls', 'Wrist Extension'] },
  { name: 'Plate Pinch', pattern: 'wristAndGrip', aliases: ['Plate Pinches'] },
  { name: 'Wrist Roller', pattern: 'wristAndGrip' },

  // Spinal flexion
  { name: 'Crunch', pattern: 'spinalFlexion', aliases: ['Crunches'] },
  { name: 'Cable Crunch', pattern: 'spinalFlexion', aliases: ['Cable Crunches', 'Kneeling Cable Crunch'] },
  { name: 'Machine Crunch', pattern: 'spinalFlexion', aliases: ['Ab Crunch Machine'] },
  { name: 'Weighted Crunch', pattern: 'spinalFlexion', aliases: ['Decline Crunch'] },
  { name: 'Reverse Crunch', pattern: 'spinalFlexion', aliases: ['Reverse Crunches'] },
  // Hip-flexion trunk
  { name: 'Sit-up', pattern: 'hipFlexionTrunk', aliases: ['Sit-ups', 'Weighted Sit-up'] },
  { name: 'Captain\'s Chair Leg Raise', pattern: 'hipFlexionTrunk', aliases: ['Captains Chair', 'Knee Raise', 'Hanging Knee Raise'] },
  { name: 'Lying Leg Raise', pattern: 'hipFlexionTrunk', aliases: ['Lying Leg Raises', 'Leg Raise', 'Leg Raises'] },
  { name: 'Toes-to-Bar', pattern: 'hipFlexionTrunk', aliases: ['T2B'] },
  { name: 'V-up', pattern: 'hipFlexionTrunk', aliases: ['V-ups', 'V Sit-up'] },
  // Anti-extension
  { name: 'Plank', pattern: 'antiExtension', aliases: ['Planks', 'Front Plank', 'Weighted Plank'] },
  { name: 'Ab Wheel Rollout', pattern: 'antiExtension', aliases: ['Ab Wheel', 'Ab Rollout', 'Barbell Rollout'] },
  { name: 'Body Saw', pattern: 'antiExtension' },
  { name: 'Hollow Hold', pattern: 'antiExtension', aliases: ['Hollow Body Hold'] },
  { name: 'Stir the Pot', pattern: 'antiExtension' },
  // Rotation
  { name: 'Russian Twist', pattern: 'rotation', aliases: ['Russian Twists'] },
  { name: 'Landmine Rotation', pattern: 'rotation', aliases: ['Landmine Twist'] },
  { name: 'Cable Rotation', pattern: 'rotation', aliases: ['Cable Torso Rotation', 'Standing Cable Twist'] },
  { name: 'Half-Kneeling Pallof Press', pattern: 'rotation' },
  // Lateral flexion
  { name: 'Side Plank', pattern: 'lateralFlexion', aliases: ['Side Planks'] },
  { name: 'Dumbbell Side Bend', pattern: 'lateralFlexion', aliases: ['Side Bend', 'Side Bends'] },
  { name: 'Cable Side Bend', pattern: 'lateralFlexion' },
  // Carry
  { name: 'Farmer\'s Walk', pattern: 'carry', aliases: ['Farmer Carry', 'Farmer\'s Carry'] },
  { name: 'Trap Bar Carry', pattern: 'carry' },
  {
    name: 'Suitcase Carry', pattern: 'carry', aliases: ['Suitcase Carries', 'Single-Arm Farmer\'s Walk'],
    links: { Forearms: 1, Obliques: 1, 'Upper Back / Traps': 2 },
    reason: 'A load in one hand: the opposite obliques resist the side bend',
  },
  // Olympic
  { name: 'Clean', pattern: 'olympic', aliases: ['Squat Clean', 'Full Clean'] },
  { name: 'Clean Pull', pattern: 'olympic', aliases: ['Clean Pulls'] },
  { name: 'High Pull', pattern: 'olympic', aliases: ['Clean High Pull', 'Snatch High Pull'] },
  { name: 'Snatch Pull', pattern: 'olympic', aliases: ['Snatch Pulls'] },
  {
    name: 'Power Snatch', pattern: 'olympic', aliases: ['Hang Snatch', 'Hang Power Snatch'],
    links: { Glutes: 1, Quadriceps: 1, Hamstrings: 2, 'Upper Back / Traps': 2, Erectors: 2, 'Anterior Deltoid': 3 },
    reason: 'The overhead receive is an isometric hold, not a press',
  },
  { name: 'Dumbbell Snatch', pattern: 'olympic', aliases: ['Single-Arm Dumbbell Snatch'], links: { Glutes: 1, Quadriceps: 1, Hamstrings: 2, 'Upper Back / Traps': 2, Erectors: 2, 'Anterior Deltoid': 3 }, reason: 'The overhead receive is an isometric hold, not a press' },
  { name: 'Kettlebell Clean', pattern: 'olympic', aliases: ['KB Clean'] },
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
