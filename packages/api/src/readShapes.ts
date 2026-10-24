// The three reads' answers, field by field (RFC 0094), so a client generated
// from /api/openapi.json is typed all the way down. Each schema is declared as
// a `z.ZodType` of the core type it describes, so the build fails when a read
// gains a field the description lacks or changes one's type; the API tests
// check the other direction, that nothing a read returns goes undescribed.
import { z } from '@hono/zod-openapi'
import {
  MUSCLE_QUALITIES, READINESS_METHODS, type Adaptation, type AdaptationSummary, type MuscleStatusRow,
  type MuscleState, type QualityState, type SystemicReadiness, type DonationStatus, type FusedVerdict,
  type ReadinessTrend, type TargetShape, type HomeRead, type AdaptationsRead, type ReadinessRead,
  type Gauge, type HomeView, type GateColumn, type MapCallout, type QualityTile, type FoldTile, type ZoneFill,
} from '@tekio/core'

export const ADAPTATIONS = [
  'power', 'strength', 'hypertrophy', 'muscular_endurance', 'anaerobic_capacity', 'vo2max', 'endurance',
] as const satisfies readonly Adaptation[]

const days = (what: string) => z.number().nullable().openapi({ description: `Days since ${what}; null = never.` })
const Range = z.object({ low: z.number(), high: z.number() })
const GaugeShape: z.ZodType<Gauge> = z.object({
  side: z.enum(['below', 'inside', 'above']),
  at: z.number().openapi({ description: "The dot's place along the track, 0 to 1." }),
}).openapi('Gauge')

const MuscleStateShape: z.ZodType<MuscleState> = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  leaf: z.boolean().openapi({ description: 'No other group names this one as its parent.' }),
  sets: z.number().openapi({ description: 'Level-weighted hard sets in the window.' }),
  daysSince: days('the last stimulus'),
  recovering: z.boolean().openapi({ description: 'Inside the recovery window after a real dose.' }),
  fillFraction: z.number().openapi({ description: 'Sets over the window target, uncapped: what the map colours by.' }),
}).openapi('MuscleState')

const QualityStateShape: z.ZodType<QualityState> = z.object({
  key: z.enum(['vo2max', 'endurance', 'anaerobic_capacity']),
  daysSince: days('the last qualifying session'),
  windowDays: z.number(),
  stale: z.boolean().openapi({ description: 'Past its detraining window, or never trained: reads as missing.' }),
}).openapi('QualityState')

const MuscleStatusRowShape: z.ZodType<MuscleStatusRow> = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  sets: z.number(),
  aggSets: z.number().openapi({ description: 'The same, with the immediate children.' }),
  target: z.number(),
  status: z.enum(['on_track', 'needs_work', 'untouched']),
  fillFraction: z.number(),
  get children() { return z.array(MuscleStatusRowShape) },
}).openapi('MuscleStatusRow')

const Unit = z.enum(['sets', 'sessions', 'minutes'])

const AdaptationSummaryShape: z.ZodType<AdaptationSummary> = z.object({
  key: z.enum(ADAPTATIONS),
  volume: z.number().openapi({ description: 'Volume over the window, in `unit`.' }),
  unit: Unit,
  muscles: z.array(MuscleStatusRowShape),
  onTrack: z.number(),
  worked: z.number(),
  totalMuscles: z.number(),
  target: z.number().openapi({ description: 'Whole-body target over the window; 0 for a per-muscle quality.' }),
  met: z.boolean(),
}).openapi('AdaptationSummary')

const Coverage = z.record(z.enum(ADAPTATIONS), AdaptationSummaryShape)

const Band = z.enum(['low', 'moderate', 'ok'])
const Method = z.enum(READINESS_METHODS)

const SystemicReadinessShape: z.ZodType<SystemicReadiness> = z.object({
  readiness: z.number().nullable().openapi({ description: '0 to 100, 50 being the person’s own normal.' }),
  band: Band.nullable(),
  method: Method.nullable().openapi({ description: 'The method the verdict came from.' }),
  chosen: Method.nullable().openapi({ description: 'The method the person reads from.' }),
  picked: z.boolean().openapi({ description: 'Chosen in Profile, rather than picked automatically.' }),
  connected: z.boolean().openapi({ description: 'A watch or ring delivered HRV in the last 3 days.' }),
  awaitingInput: z.boolean(),
  progress: z.object({ have: z.number(), need: z.number() }).nullable()
    .openapi({ description: 'Readings toward the first verdict, while there is none.' }),
  z: z.number().nullable(),
  recent: z.number().nullable(),
  normal: Range.nullable(),
  gauge: GaugeShape.nullable(),
  notes: z.object({ restingHrAbove: z.number().nullable(), shortNight: z.number().nullable() }),
  sleepScore: z.number().nullable(),
  sleepScoreDate: z.string().nullable(),
  hrv: z.number().nullable(),
  hrvDate: z.string().nullable(),
}).openapi('SystemicReadiness')

const DonationStatusShape: z.ZodType<DonationStatus> = z.object({
  daysSince: days('the last full-blood donation'),
  acuteHold: z.boolean(),
  aerobicSuppressed: z.boolean(),
  eligibleInDays: z.number(),
}).openapi('DonationStatus')

const VerdictShape: z.ZodType<FusedVerdict> = z.object({
  mode: z.enum(['push', 'steady', 'hold']),
  cause: z.enum(['readiness', 'donation']).nullable(),
}).openapi('Verdict')

const TrendShape: z.ZodType<ReadinessTrend> = z.object({
  days: z.array(z.object({
    date: z.string(), single: z.number().nullable(), read: z.number().nullable(), printed: z.number().nullable(),
  })),
  normal: Range.nullable(),
  full: z.boolean(),
}).openapi('ReadinessTrend')

const TargetShapeShape: z.ZodType<TargetShape> = z.object({ unit: Unit, weekly: z.number() })

export const HomeBody: z.ZodType<HomeRead> = z.object({
  date: z.string(),
  muscles: z.array(MuscleStateShape),
  gaps: z.array(MuscleStateShape).openapi({ description: 'The muscles short of the map’s top band, largest gap first.' }),
  qualities: z.array(QualityStateShape),
  coverage: Coverage,
  readiness: SystemicReadinessShape,
  donation: DonationStatusShape,
  verdict: VerdictShape,
}).openapi('HomeRead')

export const AdaptationsBody: z.ZodType<AdaptationsRead> = z.object({
  date: z.string(),
  coverage: Coverage,
  quality: z.enum(MUSCLE_QUALITIES),
  shape: TargetShapeShape,
  muscles: z.array(MuscleStateShape),
  gaps: z.array(MuscleStateShape),
  qualities: z.array(QualityStateShape),
  liftingSets: z.number(),
  cardioSessions: z.number(),
  atThreshold: z.number(),
}).openapi('AdaptationsRead')

export const ReadinessBody: z.ZodType<ReadinessRead> = z.object({
  date: z.string(),
  readiness: SystemicReadinessShape,
  donation: DonationStatusShape,
  verdict: VerdictShape,
  trend: TrendShape.nullable(),
}).openapi('ReadinessRead')

// ── What Home prints (RFC 0096) ─────────────────────────────────────────────

const GateColumnShape: z.ZodType<GateColumn> = z.object({
  label: z.string(),
  value: z.string(),
  bar: z.enum(['fill', 'gauge']).openapi({ description: 'An amount out of 100 as a fill, or a reading as a dot on the person’s own normal.' }),
  pct: z.number().optional().openapi({ description: 'The fill’s amount, out of 100.' }),
  gauge: GaugeShape.nullable().optional()
    .openapi({ description: 'The gauge’s reading; null or absent draws the empty track.' }),
  tone: z.enum(['ink', 'mid', 'accent', 'off']),
  ask: z.boolean().optional().openapi({ description: 'A typed reading still to give today: the value reads as a prompt.' }),
  note: z.string().optional(),
}).openapi('GateColumn')

const ZoneFillShape: z.ZodType<ZoneFill> = z.object({
  muscle: z.string().openapi({ description: 'The zone, by the muscle the body map names it after.' }),
  step: (z.number().int().min(0).max(3) as unknown as z.ZodType<0 | 1 | 2 | 3>).nullable()
    .openapi({ description: '0 to 3 on the stimulus ramp; null on a day with no data at all.' }),
  recovering: z.boolean().openapi({ description: 'Drawn with the recovery hatch.' }),
  pick: z.string().openapi({ description: 'The muscle a tap on the zone opens.' }),
}).openapi('ZoneFill')

const MapCalloutShape: z.ZodType<MapCallout> = z.object({
  muscle: z.string(),
  rank: z.number().nullable().openapi({ description: '1 to 4, or null for the lighter unnumbered fifth.' }),
  label: z.string(),
  sub: z.string(),
}).openapi('MapCallout')

const QualityTileShape: z.ZodType<QualityTile> = z.object({
  key: z.enum(['vo2max', 'anaerobic_capacity', 'endurance']),
  name: z.string(),
  note: z.string(),
  // Described as a whole number from 0 to 3, which the core's type spells out
  // as a union: a generated Kotlin client cannot take an enum of numbers.
  step: (z.number().int().min(0).max(3) as unknown as z.ZodType<0 | 1 | 2 | 3>).nullable()
    .openapi({ description: '0 to 3 on the stimulus ramp; null is white.' }),
  edge: z.enum(['blank', 'accent', 'ramp', 'ink']),
}).openapi('QualityTile')

const FoldTileShape: z.ZodType<FoldTile> = z.object({
  kind: z.enum(['weight', 'blood']),
  label: z.string(),
  value: z.string(),
  note: z.string(),
  accent: z.boolean(),
}).openapi('FoldTile')

export const HomeViewBody: z.ZodType<HomeView> = z.object({
  date: z.string(),
  windowDays: z.number().int(),
  zeroData: z.boolean(),
  readinessLabel: z.string(),
  verdict: z.object({ text: z.string(), sub: z.string() }),
  readiness: z.object({
    gated: z.boolean().openapi({ description: 'A held day: the card inverts to ink.' }),
    method: z.string().nullable(),
    band: z.string(),
    columns: z.array(GateColumnShape),
    note: z.string().nullable(),
    hint: z.string().nullable(),
  }),
  banner: z.string().nullable(),
  map: z.object({ muscles: z.array(MuscleStateShape), zones: z.array(ZoneFillShape), callouts: z.array(MapCalloutShape) }),
  qualities: z.object({
    untouched: z.string().nullable().openapi({ description: 'The untouched names, printed in the accent.' }),
    short: z.string().nullable(),
    line: z.string().nullable().openapi({ description: 'The whole line, when neither half applies.' }),
  }),
  wholeBody: z.array(QualityTileShape),
  folds: z.array(FoldTileShape),
}).openapi('HomeView')
