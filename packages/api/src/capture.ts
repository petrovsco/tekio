// The capture routes for the logs that are one entry each (RFC 0094 step 2d):
// cardio, sport, sleep, sauna, cold, body weight, blood donations and mobility.
// Each gets the same three routes: log one, replace one, take one out. The body
// is the whole entry, as the app's edit form sends it, so a replace is a PUT.
// The morning's readiness inputs are one row a day, so they are put by day.
import { createRoute, z } from '@hono/zod-openapi'
import { CARDIO_TYPES, DONATION_TYPES, type QualityRating } from '@tekio/core'
import { DateQuery, ErrorBody, json, failures } from './schemas'

export const Minutes = z.number().positive().openapi({ description: 'Minutes.' })
const Bpm = z.number().int().positive().openapi({ description: 'Beats per minute.' })
// Checked as a whole number from 1 to 5, which is what the core's rating type
// spells out as a union.
const Rating = z.number().int().min(1).max(5).openapi({ description: '1 (poor) to 5 (great).' }) as unknown as z.ZodType<QualityRating>
const Notes = z.string().optional()

/** What the watch adds to a synced session; never sent by a client. */
const Garmin = {
  source: z.enum(['manual', 'garmin']).optional().openapi({ description: 'Typed, or pulled from the watch.' }),
  garminActivityId: z.number().optional(),
  maxHr: z.number().optional(),
  aerobicTe: z.number().optional(),
  anaerobicTe: z.number().optional(),
  trainingEffectLabel: z.string().optional(),
  trainingLoad: z.number().optional(),
  zoneDistribution: z.array(z.number()).optional().openapi({ description: 'Seconds in heart-rate zones 1 to 5.' }),
}

const CardioBody = z.object({
  date: DateQuery,
  type: z.enum(CARDIO_TYPES),
  duration: Minutes,
  distance: z.number().nonnegative().optional().openapi({ description: 'Kilometres.' }),
  avgHr: Bpm.optional(),
  notes: Notes,
  format: z.enum(['steady', 'intervals']).optional(),
  boutSeconds: z.number().int().positive().optional().openapi({ description: 'Work-bout length of an intervals session.' }),
})
export const CardioEntry = CardioBody.extend({ id: z.string(), date: z.string(), ...Garmin, elevationGain: z.number().optional() }).openapi('CardioEntry')

const SportBody = z.object({
  date: DateQuery,
  sport: z.string().trim().min(1).openapi({ description: 'A new name creates the sport.' }),
  withTrainer: z.boolean().default(false),
  quality: Rating.optional(),
  notes: z.string().default(''),
  duration: Minutes.optional(),
  avgHr: Bpm.optional(),
  competitorNames: z.array(z.string()).optional(),
  result: z.enum(['win', 'loss', 'tie']).optional(),
  teammateNames: z.array(z.string()).optional(),
  newSport: z.object({ hasCompetitor: z.boolean(), hasTeammate: z.boolean() }).optional()
    .openapi({ description: 'What a sport typed for the first time records; ignored for a known one.' }),
})
export const SportEntry = SportBody.omit({ newSport: true }).extend({
  id: z.string(), date: z.string(), quality: z.number().openapi({ description: '1 to 5; 0 while unrated.' }), ...Garmin,
}).openapi('SportEntry')

const SleepBody = z.object({
  date: DateQuery.openapi({ description: 'The day the night ended on.' }),
  hours: z.number().positive().max(24),
  quality: Rating.optional(),
  notes: Notes,
})
export const SleepEntry = SleepBody.extend({
  id: z.string(), date: z.string(),
  score: z.number().optional(), scoreQualifier: z.string().optional(),
  hrv: z.number().optional(), restingHr: z.number().optional(), source: Garmin.source,
}).openapi('SleepEntry')

const BoutBody = z.object({
  date: DateQuery,
  duration: Minutes,
  tempC: z.number().optional().openapi({ description: '°C, if tracked.' }),
  notes: Notes,
})
export const BoutEntry = BoutBody.extend({ id: z.string(), date: z.string() }).openapi('ExposureBout')

const BodyweightBody = z.object({
  date: DateQuery,
  weight: z.number().positive().openapi({ description: 'Kilograms. One reading a day: a second one replaces the first.' }),
})
export const BodyweightEntry = BodyweightBody.extend({ id: z.string(), date: z.string() }).openapi('BodyweightEntry')

const DonationBody = z.object({ date: DateQuery, type: z.enum(DONATION_TYPES), notes: z.string().default('') })
export const DonationEntry = DonationBody.extend({ id: z.string(), date: z.string() }).openapi('DonationEntry')

const MobilityBody = z.object({
  date: DateQuery,
  exercises: z.array(z.object({
    name: z.string().trim().min(1),
    duration: Minutes,
    notes: z.string().default(''),
    muscleGroups: z.array(z.string()).optional().openapi({ description: 'Muscle-group names the stretch targets.' }),
  })).min(1),
})
export const MobilityEntry = MobilityBody.extend({
  id: z.string(), date: z.string(), duration: z.number().openapi({ description: 'Minutes, the sum of the stretches.' }),
}).openapi('MobilityEntry')

export const IdParam = z.object({ id: z.string().min(1) })

/** Any one log's three routes, as the API registers them. */
export type CaptureRoutes = ReturnType<typeof routes<z.ZodObject, z.ZodType>>

/** Log one, replace one, take one out. `done` is how the summaries speak of
 *  one already there: a logged session, a planned lift. `name` names the
 *  operations a generated client calls: logCardio, replaceCardio, deleteCardio. */
export function routes<B extends z.ZodObject, E extends z.ZodType>(
  path: string, noun: string, body: B, entry: E, { name, verb = 'Log', done = 'logged' }: { name: string; verb?: string; done?: string },
) {
  const kept = done === 'planned' ? `Planned${name}` : name
  const security = [{ bearer: [] }]
  const content = { 'application/json': { schema: body } }
  const what = `${done} ${noun}`
  const notFound = { 404: json(`No such ${what} of yours.`, ErrorBody) }
  return {
    what,
    log: createRoute({
      method: 'post', path, security, operationId: `${verb.toLowerCase()}${name}`, summary: `${verb} a ${noun}.`,
      request: { body: { required: true, content } },
      responses: { 201: json(`The ${noun} as ${done}.`, entry), ...failures },
    }),
    replace: createRoute({
      method: 'put', path: `${path}/{id}`, security, operationId: `replace${kept}`, summary: `Replace a ${what} with the one sent.`,
      request: { params: IdParam, body: { required: true, content } },
      responses: { 204: { description: 'Saved.' }, ...failures, ...notFound },
    }),
    remove: createRoute({
      method: 'delete', path: `${path}/{id}`, security, operationId: `delete${kept}`, summary: `Take a ${what} out.`,
      request: { params: IdParam },
      responses: { 204: { description: 'Deleted.' }, ...failures, ...notFound },
    }),
  }
}

export const cardioRoutes = routes('/cardio', 'cardio session', CardioBody, CardioEntry, { name: 'Cardio' })
export const sportRoutes = routes('/sport', 'sport session', SportBody, SportEntry, { name: 'Sport' })
export const sleepRoutes = routes('/sleep', 'night', SleepBody, SleepEntry, { name: 'Sleep' })
export const saunaRoutes = routes('/sauna', 'sauna bout', BoutBody, BoutEntry, { name: 'Sauna' })
export const coldRoutes = routes('/cold', 'cold bout', BoutBody, BoutEntry, { name: 'Cold' })
export const bodyweightRoutes = routes('/bodyweight', 'weigh-in', BodyweightBody, BodyweightEntry, { name: 'Bodyweight' })
export const donationRoutes = routes('/donations', 'donation', DonationBody, DonationEntry, { name: 'Donation' })
export const mobilityRoutes = routes('/mobility', 'mobility session', MobilityBody, MobilityEntry, { name: 'Mobility' })

// ── The morning's readiness inputs (RFC 0092): one row a day ────────────────

const Answer = z.number().int().min(1).max(5)
const CheckIn = z.object({ energy: Answer, soreness: Answer, sleepQuality: Answer, stress: Answer, mood: Answer })
  .openapi('CheckInAnswers', { description: 'Five answers, 1 to 5.' })
export const ReadinessInput = z.object({
  id: z.string(), date: z.string(), morningHrv: z.number().optional(), checkIn: CheckIn.optional(),
}).openapi('ReadinessInput')
const DayParam = z.object({ date: DateQuery })
const saved = { 200: json("The day's inputs as saved.", ReadinessInput), ...failures }

export const morningHrvRoute = createRoute({
  method: 'put', path: '/readiness/{date}/morning-hrv', security: [{ bearer: [] }], operationId: 'putMorningHrv',
  summary: "Type the morning's HRV; a second one that day replaces it. The day's check-in is kept.",
  request: {
    params: DayParam,
    body: { required: true, content: { 'application/json': { schema: z.object({ ms: z.number().gt(0).lt(400).openapi({ description: 'rMSSD in ms, on waking.' }) }) } } },
  },
  responses: saved,
})

export const checkInRoute = createRoute({
  method: 'put', path: '/readiness/{date}/check-in', security: [{ bearer: [] }], operationId: 'putCheckIn',
  summary: "Answer the day's check-in; a second one that day replaces it. The morning HRV is kept.",
  request: { params: DayParam, body: { required: true, content: { 'application/json': { schema: CheckIn } } } },
  responses: saved,
})
