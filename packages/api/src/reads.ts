// The three reads' routes (RFC 0094 step 2c). Every read takes `date`, the
// person's own calendar day: the server's clock sits in some other time zone
// and cannot know it, so the client always says.
import { createRoute, z } from '@hono/zod-openapi'
import { MUSCLE_QUALITIES } from '@tekio/core'
import { DateQuery, json, failures } from './schemas'
import { HomeBody, AdaptationsBody, ReadinessBody } from './readShapes'

export const homeRoute = createRoute({
  method: 'get', path: '/read/home', security: [{ bearer: [] }],
  summary: 'Home: what is missing, and whether today can push.',
  request: { query: z.object({ date: DateQuery }) },
  responses: { 200: json('The Home read.', HomeBody), ...failures },
})

export const adaptationsRoute = createRoute({
  method: 'get', path: '/read/adaptations', security: [{ bearer: [] }],
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
  method: 'get', path: '/read/readiness', security: [{ bearer: [] }],
  summary: "Readiness: today's reading and the days behind it.",
  request: { query: z.object({ date: DateQuery }) },
  responses: { 200: json('The readiness read.', ReadinessBody), ...failures },
})
