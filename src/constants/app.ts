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
/** 56 / 14 — donation-service eligibility rules, convention only (FDA 21 CFR
 * 630.15; the plasma interval is national convention, 72 h-14 d across
 * Europe), NOT physiology. Calendar countdown only - must not feed the
 * readiness gate. See docs/roadmap/done/010-home-fused-reads.md#grounding */
export const DONATION_ELIGIBILITY_DAYS: Record<string, number> = {
  'Full Blood': 56,
  Plasma: 14,
}

export const SPORT_TYPES_DEFAULT = ['Tennis', 'Swimming', 'Volleyball']

// ── Fused Home read (systemic × local) ──────────────────────────────────────
// The grounded constants behind src/lib/fusedRead.ts. Each carries its scout
// verdict; the blocks live in docs/roadmap/done/010-home-fused-reads.md#grounding.

/** 48 h (RECOVER_DAYS = 2) — floor of the 48–72 h post-session recovery window
 * for a trained adult; dose-dependent, high-volume/failure sessions need 72 h+,
 * see docs/roadmap/done/010-home-fused-reads.md#grounding */
export const RECOVER_DAYS = 2

/** 33 — convention only (industry red/yellow boundary; Whoop red ≤33): no
 * literature supports an absolute cutoff — the grounded method is
 * baseline-relative (7d rolling < baseline − 0.5×SD, Vesterinen 2016), see
 * docs/roadmap/done/010-home-fused-reads.md#grounding */
export const PUSH_THRESHOLD = 33

/** staleness: vo2max 14 d, endurance 14 d, anaerobic 28 d — detraining onset in
 * trained adults (Coyle 1984; Houmard 1992; Madsen 1993; Simoneau 1987;
 * Mujika & Padilla 2000), see docs/roadmap/done/010-home-fused-reads.md#grounding */
export const QUALITY_STALENESS_DAYS = {
  vo2max: 14,
  endurance: 14,
  anaerobic_capacity: 28,
} as const

/** 60 — 10 fractional sets/muscle/week × 6-wk cycle; 10–20/wk is the
 * meta-analytic effective band (Schoenfeld 2017, Pelland 2026, Baz-Valle 2022).
 * With a half-volume deload week the honest cycle band is 50–60, see
 * docs/roadmap/done/010-home-fused-reads.md#grounding */
export const CYCLE_SET_TARGET = 60

/** 48 h acute, 21 d aerobic tail (range 14–28 d) — whole blood only, aerobic
 * qualities only; plasma = 0 d. Endpoint contested (Ziegler 14 d / Judd 21 d /
 * Meurrens 28 d). Never a global hold past 48 h. See
 * docs/roadmap/done/010-home-fused-reads.md#grounding */
export const DONATION_SUPPRESSION = { acuteHours: 48, aerobicTailDays: 21 } as const

// ── Recovery / Readiness axis ───────────────────────────────────────────────
// Recovery sits parallel to the adaptations (it is NOT another adaptation).
//
// RECOVERY_WEIGHTS / RECOVERY_TARGETS / RECOVERY_ICONS were removed 2026-08-31
// with RecoveryCard (roadmap 014 step 3, 018 unit 4). They rolled five weekly
// adherence targets — sleep .45 / mobility .15 / sauna .15 / cold .15 /
// habits .10 — into one "readiness %". The fused Home replaced that with
// `systemicReadiness()` in src/lib/fusedRead.ts: last night's sleep score
// blended with a baseline-relative HRV sub-score. So the weights were not
// reweighted, they were retired — the number they produced measured adherence
// to a recovery routine, not recovery state. The before/after comparison on
// real data is in docs/roadmap/014-doctrine-ledger-execution.md.
