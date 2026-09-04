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

/** 10 — weekly hard-set floor per muscle, pooled across every rep range (1–5 / 6–15 / 16–30+) at full
 * value: hypertrophy per hard set is load-independent from ~30–40 % 1RM up (Schoenfeld 2017, Lopez 2021,
 * Lasevicius 2018; set = unit, Baz-Valle 2018) and it is the volume-hungriest quality (Pelland 2026,
 * Androulakis-Korakakis 2020). Power-tagged sets are NOT hard sets — they count in byQuality.power only
 * (Pareja-Blanco 2017, Jukic 2023). Says nothing about strength's load, endurance's rep range or
 * power's velocity — the per-quality maps do. Value grounded in
 * docs/roadmap/done/010-home-fused-reads.md#grounding (D10); the pooling in
 * docs/grounding/039-adaptations-read.md#grounding (S3). */
export const WEEKLY_SET_FLOOR = 10

// 14 — MUSCLE_WINDOW_DAYS: rolling window for the per-muscle hard-set fill (target = WEEKLY_SET_FLOOR × 14 / 7 = 20).
// Honest band 8–21 d. Lower edge: volume-equated, 1×/wk per muscle matches 2–5×/wk in trained men (Schoenfeld 2019,
// Grgic 2018, Brigatto 2019, Gomes 2019), so a muscle 7 d silent is not under-dosed and the window must exceed one
// weekly rhythm. Upper edge: strength holds ~3–4 wk without training (McMaster 2013, Mujika 2001, Hwang 2017) and the
// earliest measured tissue loss in trained lifters is at 14 d (Hortobágyi 1993, type II fibre area −6.4 %). 14 is a
// convention inside that band — whole weeks, one missed weekly dose = half fill, one rhythm with QUALITY_STALENESS_DAYS.
// Not an MPS window: the per-session signal ends in 28–48 h (Tang 2008, Phillips 1997). The sum is frequency-blind by
// design; recency lives in daysSince / RECOVER_DAYS. See docs/grounding/039-adaptations-read.md#grounding
export const MUSCLE_WINDOW_DAYS = 14

/** 20 — WEEKLY_SET_FLOOR × MUSCLE_WINDOW_DAYS / 7: the hard-set target the muscle map fills against. Rate
 * grounded in 010 D10, pooling in 039 S3, window in 039 S12. The program's CYCLE plays no part — Home and the
 * Adaptations reads never hang on the program (039 §6.6). */
export const MUSCLE_SET_TARGET = WEEKLY_SET_FLOOR * MUSCLE_WINDOW_DAYS / 7

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
// real data is in docs/roadmap/done/014-doctrine-ledger-execution.md.
