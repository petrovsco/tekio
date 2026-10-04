// RFC 0074: a name the catalogue does not know gets one question on Weights —
// which movement is it? — and inherits that pattern's links. Two taps: a body
// area, then a plain name with a lift it is like. Every pattern appears exactly
// once (src/test/exerciseCatalogue.test.ts holds it to that).

import type { PatternKey } from './movementPatterns'

interface MovementChoice {
  pattern: PatternKey
  label: string
  /** A common lift of the same movement, so the label needs no anatomy. */
  like: string
}

export interface MovementArea {
  label: string
  choices: MovementChoice[]
}

export const MOVEMENT_AREAS: MovementArea[] = [
  {
    label: 'Legs',
    choices: [
      { pattern: 'squat', label: 'Squat', like: 'back squat, leg press' },
      { pattern: 'lunge', label: 'Lunge', like: 'split squat, step-up' },
      { pattern: 'hingeKneeBent', label: 'Deadlift', like: 'deadlift, trap-bar pull' },
      { pattern: 'hingeStraightKnee', label: 'Straight-leg hinge', like: 'Romanian deadlift, good morning' },
      { pattern: 'hipExtensionBentKnee', label: 'Hip thrust', like: 'hip thrust, glute bridge' },
      { pattern: 'kneeFlexion', label: 'Leg curl', like: 'lying or seated leg curl' },
      { pattern: 'kneeExtension', label: 'Leg extension', like: 'machine leg extension' },
      { pattern: 'hipAbduction', label: 'Outer thigh', like: 'hip abduction machine' },
      { pattern: 'hipAdduction', label: 'Inner thigh', like: 'hip adduction machine' },
      { pattern: 'plantarFlexion', label: 'Calf raise', like: 'standing or seated calf raise' },
      { pattern: 'olympic', label: 'Clean or snatch', like: 'power clean, hang clean, snatch' },
    ],
  },
  {
    label: 'Push',
    choices: [
      { pattern: 'horizontalPush', label: 'Chest press', like: 'bench press, push-up, dip' },
      { pattern: 'verticalPush', label: 'Overhead press', like: 'military press, Arnold press' },
      { pattern: 'horizontalAdduction', label: 'Fly', like: 'cable fly, pec deck' },
      { pattern: 'shoulderAbduction', label: 'Side raise', like: 'dumbbell lateral raise' },
      { pattern: 'shoulderFlexion', label: 'Front raise', like: 'plate or dumbbell front raise' },
      { pattern: 'uprightRow', label: 'Upright row', like: 'barbell or cable upright row' },
    ],
  },
  {
    label: 'Pull',
    choices: [
      { pattern: 'verticalPull', label: 'Pull-down', like: 'pull-up, lat pulldown' },
      { pattern: 'horizontalPull', label: 'Row', like: 'barbell row, seated cable row' },
      { pattern: 'horizontalAbduction', label: 'Rear-delt fly', like: 'reverse fly, face pull' },
      { pattern: 'straightArmExtension', label: 'Straight-arm pull', like: 'straight-arm pulldown, pullover' },
      { pattern: 'scapularElevation', label: 'Shrug', like: 'barbell or dumbbell shrug' },
    ],
  },
  {
    label: 'Arms',
    choices: [
      { pattern: 'elbowFlexion', label: 'Curl', like: 'biceps curl, hammer curl' },
      { pattern: 'elbowExtension', label: 'Triceps', like: 'pushdown, skull crusher' },
      { pattern: 'wristAndGrip', label: 'Wrist or grip', like: 'wrist curl, gripper' },
    ],
  },
  {
    label: 'Core',
    choices: [
      { pattern: 'spinalFlexion', label: 'Crunch', like: 'crunch, cable crunch' },
      { pattern: 'hipFlexionTrunk', label: 'Leg raise or sit-up', like: 'hanging leg raise, sit-up' },
      { pattern: 'antiExtension', label: 'Plank', like: 'plank, ab wheel, dead bug' },
      { pattern: 'rotation', label: 'Twist', like: 'woodchop, Pallof press' },
      { pattern: 'lateralFlexion', label: 'Side bend', like: 'side plank, side bend' },
      { pattern: 'carry', label: 'Carry', like: "farmer's walk" },
    ],
  },
]
