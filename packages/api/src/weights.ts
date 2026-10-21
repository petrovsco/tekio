// The weights capture routes (RFC 0094 step 2d): log a lift, change its sets,
// take it out. The shapes are checked here; what a set may hold (whole reps, no
// negative load, a hold in whole seconds) is checked by the same rules the web
// app uses, in @tekio/db, and a refusal comes back as a 400 with its reason.
import { createRoute, z } from '@hono/zod-openapi'
import { MOVEMENT_PATTERNS, type PatternKey } from '@tekio/core/catalogue'
import { DateQuery, ErrorBody, json, failures } from './schemas'

const LiftSetBody = z.object({
  weight: z.number().openapi({ description: 'Load in kg; 0 for bodyweight.' }),
  reps: z.number().openapi({ description: 'Whole reps; 1 for a hold.' }),
  seconds: z.number().optional().openapi({ description: 'How long a hold lasted, in whole seconds (RFC 0107).' }),
}).openapi('LiftSet')

const WeightEntryBody = z.object({
  id: z.string(),
  date: z.string(),
  exercise: z.string().openapi({ description: 'The name the lift is filed under, which may differ from the one typed.' }),
  sets: z.array(LiftSetBody),
  supersetId: z.string().optional(),
}).openapi('WeightEntry')

const PATTERNS = Object.keys(MOVEMENT_PATTERNS) as [PatternKey, ...PatternKey[]]

const IdParam = z.object({ id: z.string().min(1).openapi({ description: 'The logged lift.' }) })

const notFound = { 404: json('No such lift of yours.', ErrorBody) }

export const logWeightRoute = createRoute({
  method: 'post', path: '/weights', security: [{ bearer: [] }],
  summary: 'Log a lift: one exercise and its sets on a day.',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: z.object({
            date: DateQuery,
            exercise: z.string().trim().min(1).openapi({ description: 'As typed: an alias or a catalogue spelling resolves to its lift.' }),
            sets: z.array(LiftSetBody),
            supersetId: z.uuid().optional().openapi({ description: 'Shared by the lifts done as one superset.' }),
            pattern: z.enum(PATTERNS).optional().openapi({ description: "The movement, for a lift the catalogue doesn't know." }),
          }),
        },
      },
    },
  },
  responses: {
    201: json('The lift as logged.', z.object({
      entry: WeightEntryBody,
      linked: z.boolean().openapi({ description: 'True when this created the exercise and its muscle links.' }),
    })),
    ...failures,
  },
})

export const editWeightRoute = createRoute({
  method: 'patch', path: '/weights/{id}', security: [{ bearer: [] }],
  summary: "Replace a logged lift's sets, and move it to another day if `date` is given.",
  request: {
    params: IdParam,
    body: {
      required: true,
      content: { 'application/json': { schema: z.object({ sets: z.array(LiftSetBody), date: DateQuery.optional() }) } },
    },
  },
  responses: { 204: { description: 'Saved.' }, ...failures, ...notFound },
})

export const deleteWeightRoute = createRoute({
  method: 'delete', path: '/weights/{id}', security: [{ bearer: [] }],
  summary: 'Take a logged lift out, with its sets.',
  request: { params: IdParam },
  responses: { 204: { description: 'Deleted.' }, ...failures, ...notFound },
})
