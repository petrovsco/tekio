// The three reads' routes (RFC 0094 step 2c). Every read takes `date`, the
// person's own calendar day: the server's clock sits in some other time zone
// and cannot know it, so the client always says.
import { createRoute, z } from '@hono/zod-openapi'
import { MUSCLE_QUALITIES } from '@tekio/core'
import { DateQuery, json, failures } from './schemas'
import { HomeBody, AdaptationsBody, ReadinessBody, HomeViewBody } from './readShapes'

export const homeRoute = createRoute({
  method: 'get', path: '/read/home', security: [{ bearer: [] }], operationId: 'getHomeRead',
  summary: 'Home: what is missing, and whether today can push.',
  request: { query: z.object({ date: DateQuery }) },
  responses: { 200: json('The Home read.', HomeBody), ...failures },
})

export const adaptationsRoute = createRoute({
  method: 'get', path: '/read/adaptations', security: [{ bearer: [] }], operationId: 'getAdaptationsRead',
  summary: 'Adaptations: one muscle-linked quality, explained.',
  request: {
    query: z.object({
      date: DateQuery,
      quality: z.enum(MUSCLE_QUALITIES).openapi({ description: 'The muscle-linked quality to map.' }),
    }),
  },
  responses: { 200: json('The Adaptations read.', AdaptationsBody), ...failures },
})

export const readinessRoute = createRoute({
  method: 'get', path: '/read/readiness', security: [{ bearer: [] }], operationId: 'getReadinessRead',
  summary: "Readiness: today's reading and the days behind it.",
  request: { query: z.object({ date: DateQuery }) },
  responses: { 200: json('The readiness read.', ReadinessBody), ...failures },
})

// What Home prints of its read (RFC 0096), so the phone apps draw the web's
// own sentences. `lastNight` is the person's own, as `date` is: "last night"
// turns over at 04:00 on their clock, not the server's.
export const homeViewRoute = createRoute({
  method: 'get', path: '/view/home', security: [{ bearer: [] }], operationId: 'getHomeView',
  summary: 'Home as it is printed: the verdict, the readiness card, the map’s callouts and the tiles.',
  request: {
    query: z.object({
      date: DateQuery,
      lastNight: DateQuery.openapi({ description: 'The wake date the person’s clock calls last night: `date`, or the day before until 04:00.' }),
    }),
  },
  responses: { 200: json('The Home view.', HomeViewBody), ...failures },
})
