// The training between two days (RFC 0099): what an assistant reads to see
// what was done and what is planned, without the whole opening load. Logged
// lifts, cardio, sport and mobility, and the plans of both kinds, each list
// newest first, as the app keeps them.
import { createRoute, z } from '@hono/zod-openapi'
import { DateQuery, json, failures } from './schemas'
import { CardioEntry, SportEntry, MobilityEntry } from './capture'
import { WeightEntryBody } from './weights'
import { PlannedExercise, PlannedSession } from './plans'

const HistoryBody = z.object({
  weights: z.array(WeightEntryBody).openapi({ description: 'Logged lifts, one entry per exercise a day.' }),
  cardio: z.array(CardioEntry),
  sports: z.array(SportEntry),
  mobility: z.array(MobilityEntry),
  plans: z.array(PlannedExercise).openapi({ description: 'Planned lifts: targets, not results. They count for nothing until logged.' }),
  sessionPlans: z.array(PlannedSession).openapi({ description: 'Planned cardio, sport and mobility sessions.' }),
}).openapi('History')

export const historyRoute = createRoute({
  method: 'get', path: '/history', security: [{ bearer: [] }],
  summary: 'The training logged and planned from `from` to `to`, both days included.',
  request: { query: z.object({ from: DateQuery, to: DateQuery }) },
  responses: { 200: json('What was logged and planned in those days.', HistoryBody), ...failures },
})
