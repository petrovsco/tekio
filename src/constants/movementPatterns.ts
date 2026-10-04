// RFC 0074: every lifting exercise inherits its muscle links from one movement
// pattern, and the patterns are what got grounded — not the rows. The sources
// do not speak per exercise: "rows and curls train the biceps alike" is a claim
// about movements, so this is the level the evidence exists at.
//
// Levels are LEVEL_WEIGHT's (src/lib/utils.ts): 1 = prime mover, one weighted
// set; 2 = synergist, half a set; 3 = works but does not grow from this, zero.
// A level-3 link is kept on purpose — it records the claim "this muscle was
// considered and ruled out", which is what stops it being re-added by hand.
//
// See tekio.rfcs/grounding/0074-exercise-catalogue.md#pattern-link-sets for the
// sources, the verdict of each pattern and the ten forks (inventory D46–D55).

/** The leaf muscle groups of `muscle_groups`, by name. */
export const MUSCLES = [
  'Quadriceps', 'Hamstrings', 'Glutes', 'Adductors', 'Calves', 'Hip Flexors',
  'Chest', 'Anterior Deltoid', 'Lateral Deltoid', 'Posterior Deltoid', 'Rotator Cuff',
  'Lats', 'Upper Back / Traps', 'Rhomboids',
  'Biceps', 'Triceps', 'Forearms',
  'Rectus Abdominis', 'Obliques', 'Erectors',
] as const

type Muscle = (typeof MUSCLES)[number]
type LinkLevel = 1 | 2 | 3
export type LinkSet = Partial<Record<Muscle, LinkLevel>>

export interface MovementPattern {
  name: string
  links: LinkSet
  /** The scout run's verdict for this pattern's link set. */
  verdict: 'supported' | 'partially supported' | 'convention'
}

/** 31 patterns — the table in the grounding file, in its order. */
export const MOVEMENT_PATTERNS = {
  // ── Lower body (run L) ────────────────────────────────────────────────────
  // Hamstrings did not grow in squat or hip-thrust trials (Kubo 2019,
  // Plotkin 2023); glute max grew +15 % from leg press (Kinoshita 2026).
  squat: {
    name: 'Squat',
    links: { Quadriceps: 1, Glutes: 1, Adductors: 2, Hamstrings: 3, Erectors: 3 },
    verdict: 'supported',
  },
  lunge: {
    name: 'Lunge',
    links: { Quadriceps: 1, Glutes: 1, Adductors: 2, Hamstrings: 3 },
    verdict: 'convention',
  },
  hingeStraightKnee: {
    name: 'Hip Hinge — Straight Knee',
    links: { Hamstrings: 1, Glutes: 1, Erectors: 2 },
    verdict: 'partially supported',
  },
  hingeKneeBent: {
    name: 'Hip Hinge — Deadlift',
    links: { Glutes: 1, Hamstrings: 1, Quadriceps: 2, Erectors: 2, Lats: 3, 'Upper Back / Traps': 3 },
    verdict: 'partially supported',
  },
  hipExtensionBentKnee: {
    name: 'Hip Extension — Bent Knee',
    links: { Glutes: 1, Hamstrings: 3 },
    verdict: 'supported',
  },
  kneeFlexion: {
    name: 'Knee Flexion',
    links: { Hamstrings: 1, Calves: 3 },
    verdict: 'supported',
  },
  kneeExtension: {
    name: 'Knee Extension',
    links: { Quadriceps: 1 },
    verdict: 'supported',
  },
  hipAbduction: {
    name: 'Hip Abduction',
    links: { Glutes: 1 },
    verdict: 'convention',
  },
  hipAdduction: {
    name: 'Hip Adduction',
    links: { Adductors: 1 },
    verdict: 'convention',
  },
  plantarFlexion: {
    name: 'Plantar Flexion',
    links: { Calves: 1 },
    verdict: 'supported',
  },

  // ── Upper push and shoulder isolation (run P) ─────────────────────────────
  horizontalPush: {
    name: 'Horizontal Push',
    links: { Chest: 1, 'Anterior Deltoid': 2, Triceps: 2, 'Lateral Deltoid': 3 },
    verdict: 'supported',
  },
  verticalPush: {
    name: 'Vertical Push',
    links: { 'Anterior Deltoid': 1, 'Lateral Deltoid': 2, Triceps: 2, 'Upper Back / Traps': 2 },
    verdict: 'partially supported',
  },
  elbowExtension: {
    name: 'Elbow Extension',
    links: { Triceps: 1 },
    verdict: 'supported',
  },
  shoulderAbduction: {
    name: 'Shoulder Abduction',
    links: { 'Lateral Deltoid': 1, 'Anterior Deltoid': 2, 'Upper Back / Traps': 3 },
    verdict: 'partially supported',
  },
  uprightRow: {
    name: 'Upright Row',
    links: { 'Lateral Deltoid': 1, 'Anterior Deltoid': 2, 'Upper Back / Traps': 2, Biceps: 3 },
    verdict: 'partially supported',
  },
  horizontalAdduction: {
    name: 'Horizontal Adduction',
    links: { Chest: 1, 'Anterior Deltoid': 2, Triceps: 3, Biceps: 3 },
    verdict: 'partially supported',
  },
  shoulderFlexion: {
    name: 'Shoulder Flexion',
    links: { 'Anterior Deltoid': 1, Chest: 3, 'Lateral Deltoid': 3, 'Upper Back / Traps': 3 },
    verdict: 'convention',
  },
  scapularElevation: {
    name: 'Scapular Elevation',
    links: { 'Upper Back / Traps': 1, Forearms: 3 },
    verdict: 'convention',
  },

  // ── Upper pull (run U) ────────────────────────────────────────────────────
  verticalPull: {
    name: 'Vertical Pull',
    links: { Lats: 1, Biceps: 2, Rhomboids: 2, 'Upper Back / Traps': 2, 'Posterior Deltoid': 3, Forearms: 3 },
    verdict: 'partially supported',
  },
  horizontalPull: {
    name: 'Horizontal Pull',
    links: { Lats: 1, Rhomboids: 1, 'Upper Back / Traps': 1, Biceps: 2, 'Posterior Deltoid': 2, Forearms: 3 },
    verdict: 'partially supported',
  },
  // No back link of any kind: the lats do not cross the elbow. A Lats link on
  // a curl is the error RFC 0074 was opened for.
  elbowFlexion: {
    name: 'Elbow Flexion',
    links: { Biceps: 1, Forearms: 3 },
    verdict: 'supported',
  },
  horizontalAbduction: {
    name: 'Shoulder Horizontal Abduction',
    links: { 'Posterior Deltoid': 1, Rhomboids: 2, 'Upper Back / Traps': 2, 'Rotator Cuff': 3 },
    verdict: 'partially supported',
  },
  straightArmExtension: {
    name: 'Shoulder Extension — Straight Arm',
    links: { Lats: 1, Triceps: 3, 'Posterior Deltoid': 3 },
    verdict: 'partially supported',
  },
  wristAndGrip: {
    name: 'Wrist and Grip',
    links: { Forearms: 1 },
    verdict: 'convention',
  },

  // ── Trunk, carries, Olympic lifts (run T) ─────────────────────────────────
  // The bracing rule (D53): level 1 goes to the muscle resisting the pattern's
  // external moment, even held still; a muscle only stiffening the trunk is 3.
  spinalFlexion: {
    name: 'Spinal Flexion',
    links: { 'Rectus Abdominis': 1, Obliques: 2, 'Hip Flexors': 3 },
    verdict: 'partially supported',
  },
  hipFlexionTrunk: {
    name: 'Hip Flexion — Trunk',
    links: { 'Hip Flexors': 1, 'Rectus Abdominis': 1, Obliques: 2 },
    verdict: 'partially supported',
  },
  antiExtension: {
    name: 'Anti-Extension',
    links: { 'Rectus Abdominis': 1, Obliques: 2 },
    verdict: 'partially supported',
  },
  rotation: {
    name: 'Rotation',
    links: { Obliques: 1, 'Rectus Abdominis': 3 },
    verdict: 'convention',
  },
  lateralFlexion: {
    name: 'Lateral Flexion',
    links: { Obliques: 1, Erectors: 3, Glutes: 3 },
    verdict: 'convention',
  },
  carry: {
    name: 'Carry',
    links: { Forearms: 1, 'Upper Back / Traps': 2, Obliques: 3, Erectors: 3, Lats: 3 },
    verdict: 'convention',
  },
  olympic: {
    name: 'Olympic Lift',
    links: { Glutes: 1, Quadriceps: 1, Hamstrings: 2, 'Upper Back / Traps': 2, Erectors: 2 },
    verdict: 'convention',
  },
} as const satisfies Record<string, MovementPattern>

export type PatternKey = keyof typeof MOVEMENT_PATTERNS
