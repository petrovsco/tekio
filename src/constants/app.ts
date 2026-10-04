import type { CardioFormat } from '../types'

export const USER_ID = 'a0000000-0000-0000-0000-000000000001'

// A cardio type is the modality. Custom is the one with no modality (EMOM,
// slam/jump conditioning) — the row's notes say what it was. HIIT is never a
// type here: it is a `format` on any of these (roadmap 054).
export const CARDIO_TYPES = ['Running', 'Cycling', 'Swimming', 'Indoor Rowing', 'Custom'] as const

/** Flips a display→column map. Derived rather than written out a second time:
 *  two hand-kept copies of one mapping are a pair that can drift, and adding a
 *  type meant remembering to edit both. Typed `Record<string, string>` on the
 *  way back because the columns are wider than the app's own list — the
 *  `activity_type` check constraint permits ten values against the five below
 *  (walking, hiking, elliptical, jump_rope, other), so a reader still needs its
 *  `?? r.activity_type` fallback for a row the app did not write. */
const invert = (map: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]))

export const CARDIO_TYPE_MAP: Record<typeof CARDIO_TYPES[number], string> = {
  Running: 'running',
  Cycling: 'cycling',
  Swimming: 'swimming',
  'Indoor Rowing': 'rowing',
  Custom: 'custom',
}
export const CARDIO_TYPE_REVERSE = invert(CARDIO_TYPE_MAP)

/** The two values `cardio_sessions.format` takes; a form leaves it unset when
 *  the session was neither in particular. */
export const CARDIO_FORMATS: { value: CardioFormat; label: string }[] = [
  { value: 'steady', label: 'Steady' },
  { value: 'intervals', label: 'Intervals' },
]

export const DONATION_TYPES = ['Full Blood', 'Plasma'] as const

export const DONATION_TYPE_MAP: Record<typeof DONATION_TYPES[number], string> = {
  'Full Blood': 'full_blood',
  Plasma: 'plasma',
}
export const DONATION_TYPE_REVERSE = invert(DONATION_TYPE_MAP)
/** 56 / 14 — donation-service eligibility rules, convention only (FDA 21 CFR
 * 630.15; the plasma interval is national convention, 72 h-14 d across
 * Europe), NOT physiology. Calendar countdown only - must not feed the
 * readiness gate. See tekio.rfcs/rfcs/done/0010-home-fused-reads.md#grounding */
export const DONATION_ELIGIBILITY_DAYS: Record<string, number> = {
  'Full Blood': 56,
  Plasma: 14,
}

// ── Fused Home read (systemic × local) ──────────────────────────────────────
// The grounded constants behind src/lib/fusedRead.ts. Each carries its scout
// verdict; the blocks live in tekio.rfcs/rfcs/done/0010-home-fused-reads.md#grounding.

/** 48 h (RECOVER_DAYS = 2) — floor of the 48–72 h post-session recovery window
 * for a trained adult; dose-dependent, high-volume/failure sessions need 72 h+,
 * see tekio.rfcs/rfcs/done/0010-home-fused-reads.md#grounding */
export const RECOVER_DAYS = 2

/** −0.5 / −1 SD — partially supported: the trialled three-tier rule cuts the
 * 7-day rolling LnRMSSD against the person's own baseline — within 0.5 SD the
 * session runs as planned, 0.5–1 SD it runs lighter, beyond 1 SD it is active
 * recovery (DeBlauw 2021; Nuuttila 2022 the same shape). One-sided here, a
 * recorded departure: HRV above baseline never lowers the band. Each value is
 * the bottom edge of the band above it — z < −1 low, −1 ≤ z < −0.5 moderate,
 * z ≥ −0.5 ok. See tekio.rfcs/rfcs/0085-push-gate-own-baseline.md#grounding
 * and tekio.rfcs/grounding/0085-readiness-inputs.md#grounding */
export const HRV_BAND_Z = { moderate: -0.5, low: -1 } as const

/** staleness: vo2max 14 d, endurance 14 d, anaerobic 28 d — detraining onset in
 * trained adults (Coyle 1984; Houmard 1992; Madsen 1993; Simoneau 1987;
 * Mujika & Padilla 2000), see tekio.rfcs/rfcs/done/0010-home-fused-reads.md#grounding */
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
 * tekio.rfcs/rfcs/done/0010-home-fused-reads.md#grounding (D10); the pooling in
 * tekio.rfcs/grounding/039-adaptations-read.md#grounding (S3). */
export const WEEKLY_SET_FLOOR = 10

// 14 — MUSCLE_WINDOW_DAYS: rolling window for the per-muscle hard-set fill (target = WEEKLY_SET_FLOOR × 14 / 7 = 20).
// Honest band 8–21 d. Lower edge: volume-equated, 1×/wk per muscle matches 2–5×/wk in trained men (Schoenfeld 2019,
// Grgic 2018, Brigatto 2019, Gomes 2019), so a muscle 7 d silent is not under-dosed and the window must exceed one
// weekly rhythm. Upper edge: strength holds ~3–4 wk without training (McMaster 2013, Mujika 2001, Hwang 2017) and the
// earliest measured tissue loss in trained lifters is at 14 d (Hortobágyi 1993, type II fibre area −6.4 %). 14 is a
// convention inside that band — whole weeks, one missed weekly dose = half fill, one rhythm with QUALITY_STALENESS_DAYS.
// Not an MPS window: the per-session signal ends in 28–48 h (Tang 2008, Phillips 1997). The sum is frequency-blind by
// design; recency lives in daysSince / RECOVER_DAYS. See tekio.rfcs/grounding/039-adaptations-read.md#grounding
export const MUSCLE_WINDOW_DAYS = 14

/** 20 — WEEKLY_SET_FLOOR × MUSCLE_WINDOW_DAYS / 7: the hard-set target the muscle map fills against. Rate
 * grounded in 010 D10, pooling in 039 S3, window in 039 S12. A rolling window, never a training cycle (039 §6.6). */
export const MUSCLE_SET_TARGET = WEEKLY_SET_FLOOR * MUSCLE_WINDOW_DAYS / 7

/** 48 h acute, 21 d aerobic tail (range 14–28 d) — whole blood only, aerobic
 * qualities only; plasma = 0 d. Endpoint contested (Ziegler 14 d / Judd 21 d /
 * Meurrens 28 d). Never a global hold past 48 h. See
 * tekio.rfcs/rfcs/done/0010-home-fused-reads.md#grounding */
export const DONATION_SUPPRESSION = { acuteHours: 48, aerobicTailDays: 21 } as const

// ── Recovery / Readiness axis ───────────────────────────────────────────────
// Recovery sits parallel to the adaptations (it is NOT another adaptation).
//
// RECOVERY_WEIGHTS / RECOVERY_TARGETS / RECOVERY_ICONS were removed 2026-08-31
// with RecoveryCard (roadmap 014 step 3, 018 unit 4). They rolled five weekly
// adherence targets — sleep .45 / mobility .15 / sauna .15 / cold .15 /
// habits .10 — into one "readiness %". The fused Home replaced that with
// `systemicReadiness()` in src/lib/fusedRead.ts: a baseline-relative HRV read
// (since 0085 HRV alone; the device sleep score left the number). So the weights were not
// reweighted, they were retired — the number they produced measured adherence
// to a recovery routine, not recovery state. The before/after comparison on
// real data is in tekio.rfcs/rfcs/done/0014-doctrine-ledger-execution.md.
