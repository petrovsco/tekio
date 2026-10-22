// The planned items' routes (RFC 0094 step 2d): lifts (RFC 0098, grouped into
// supersets by RFC 0106) and cardio, sport and mobility sessions (RFC 0104). A
// plan counts for nothing until it is logged through its own capture route;
// `logged` then points the plan at the entry it became.
import { createRoute, z } from '@hono/zod-openapi'
import { CARDIO_TYPES } from '@tekio/core'
import { DateQuery, ErrorBody, json, failures } from './schemas'
import { routes, IdParam, Minutes } from './capture'
import { LiftSetBody } from './weights'

const PlannedBy = z.enum(['user', 'agent']).default('user')
  .openapi({ description: 'Who wrote the plan: the person, or an agent on their behalf.' })
const Logged = { loggedAs: z.string().optional().openapi({ description: 'The entry this plan became, once logged.' }) }

const PlanLiftBody = z.object({
  date: DateQuery,
  exercise: z.string().trim().min(1),
  targets: z.array(LiftSetBody).min(1).openapi({ description: 'What to aim at, not results.' }),
  supersetId: z.uuid().nullable().optional()
    .openapi({ description: 'Shared by the lifts of one superset; null takes a plan out of one.' }),
  plannedBy: PlannedBy,
})
export const PlannedExercise = PlanLiftBody.omit({ supersetId: true }).extend({
  id: z.string(), date: z.string(), supersetId: z.string().optional(), ...Logged,
}).openapi('PlannedExercise')

const PlanSessionBody = z.object({
  date: DateQuery,
  kind: z.enum(['cardio', 'sport', 'mobility']),
  name: z.string().openapi({ description: `The cardio type (${CARDIO_TYPES.join(', ')}) or the sport; empty for mobility.` }),
  duration: Minutes.optional(),
  distance: z.number().positive().optional().openapi({ description: 'Kilometres.' }),
  format: z.enum(['steady', 'intervals']).optional(),
  boutSeconds: z.number().int().positive().optional(),
  stretches: z.array(z.object({ name: z.string().trim().min(1), duration: z.number().nonnegative() })).optional()
    .openapi({ description: 'The stretches of a mobility plan, minutes each.' }),
  notes: z.string().optional(),
  plannedBy: PlannedBy,
})
export const PlannedSession = PlanSessionBody.extend({ id: z.string(), date: z.string(), ...Logged }).openapi('PlannedSession')

export const planLiftRoutes = routes('/plans/lifts', 'lift', PlanLiftBody, PlannedExercise, { verb: 'Plan', done: 'planned' })
export const planSessionRoutes = routes('/plans/sessions', 'session', PlanSessionBody, PlannedSession, { verb: 'Plan', done: 'planned' })

const security = [{ bearer: [] }]
const missing = { 404: json('No such planned item of yours.', ErrorBody) }
const LoggedBody = z.object({ entryId: z.string().min(1).openapi({ description: 'The logged entry the plan became.' }) })

export const groupLiftsRoute = createRoute({
  method: 'patch', path: '/plans/lifts', security,
  summary: 'Put planned lifts into one superset, or move them to another day.',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: z.object({
            ids: z.array(z.string().min(1)).min(1),
            supersetId: z.uuid().optional(),
            date: DateQuery.optional(),
          }),
        },
      },
    },
  },
  responses: { 204: { description: 'Saved.' }, ...failures, ...missing },
})

export const liftLoggedRoute = createRoute({
  method: 'put', path: '/plans/lifts/{id}/logged', security,
  summary: 'Point a planned lift at the logged lift it became.',
  request: { params: IdParam, body: { required: true, content: { 'application/json': { schema: LoggedBody } } } },
  responses: { 204: { description: 'Saved.' }, ...failures, ...missing },
})

export const sessionLoggedRoute = createRoute({
  method: 'put', path: '/plans/sessions/{id}/logged', security,
  summary: 'Point a planned session at the logged session it became.',
  request: { params: IdParam, body: { required: true, content: { 'application/json': { schema: LoggedBody } } } },
  responses: { 204: { description: 'Saved.' }, ...failures, ...missing },
})

export const pruneMissedRoute = createRoute({
  method: 'delete', path: '/plans/missed', security,
  summary: 'Delete the plans dated before `before` that were never logged: missed, and kept a while to be moved or removed.',
  request: { query: z.object({ before: DateQuery }) },
  responses: { 204: { description: 'Deleted.' }, ...failures },
})
