export const USER_ID = 'a0000000-0000-0000-0000-000000000001'

export const CYCLE = 6

/**
 * Deload week within the cycle (1-based) — the last week of every cycle.
 * Ungrounded; see docs/grounding-inventory.md §5.
 */
export const DELOAD_WEEK = CYCLE

/**
 * Deload dose: reps are scaled to 70% of the last session, load unchanged.
 * `reps`-only is what the app applies and what `programs.deload_strategy`
 * persists. Ungrounded; see docs/grounding-inventory.md §5.
 */
export const DELOAD_REP_FACTOR = 0.7

export const WATER_GOAL_ML = 2500

export const CARDIO_TYPES = ['Running', 'Cycling', 'Swimming', 'Indoor Rowing'] as const
export type CardioDisplayType = typeof CARDIO_TYPES[number]

export const CARDIO_TYPE_MAP: Record<string, string> = {
  Running: 'running',
  Cycling: 'cycling',
  Swimming: 'swimming',
  'Indoor Rowing': 'rowing',
}
export const CARDIO_TYPE_REVERSE: Record<string, string> = {
  running: 'Running',
  cycling: 'Cycling',
  swimming: 'Swimming',
  rowing: 'Indoor Rowing',
}
export const CARDIO_ICONS: Record<string, string> = {
  Running: '🏃',
  Cycling: '🚴',
  Swimming: '🏊',
  'Indoor Rowing': '🚣',
}

export const DONATION_TYPES = ['Full Blood', 'Plasma'] as const
export type DonationDisplayType = typeof DONATION_TYPES[number]

export const DONATION_TYPE_MAP: Record<string, string> = {
  'Full Blood': 'full_blood',
  Plasma: 'plasma',
}
export const DONATION_TYPE_REVERSE: Record<string, string> = {
  full_blood: 'Full Blood',
  plasma: 'Plasma',
}
export const DONATION_ICONS: Record<string, string> = {
  'Full Blood': '🩸',
  Plasma: '💉',
}
export const DONATION_ELIGIBILITY_DAYS: Record<string, number> = {
  'Full Blood': 56,
  Plasma: 14,
}

export const SPORT_TYPES_DEFAULT = ['Tennis', 'Swimming', 'Volleyball']

// ── Recovery / Readiness axis ───────────────────────────────────────────────
// Recovery sits parallel to the nine adaptations (it is NOT a 10th adaptation).
// The RecoveryCard rolls these weekly targets into a single readiness %.

export const RECOVERY_ICONS = {
  sleep: '😴',
  mobility: '🧘',
  sauna: '🧖',
  cold: '🧊',
  habits: '✅',
} as const

/** Weekly targets per modality; a modality's sub-score = achieved / target (capped at 1). */
export const RECOVERY_TARGETS = {
  /** Target average sleep hours per night. */
  sleepHours: 8,
  /** Target mobility minutes per week. */
  mobilityMinutes: 30,
  /** Target sauna sessions per week. */
  saunaSessions: 2,
  /** Target cold-exposure sessions per week. */
  coldSessions: 2,
  /** Target recovery-tagged manual habit bouts per week. */
  recoveryHabitSets: 5,
} as const

/** Weights blending the per-modality sub-scores into the readiness roll-up (sum ≈ 1). */
export const RECOVERY_WEIGHTS = {
  sleep: 0.45,
  mobility: 0.15,
  sauna: 0.15,
  cold: 0.15,
  habits: 0.1,
} as const
