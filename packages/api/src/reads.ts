// The three reads' routes (RFC 0094 step 2c). Every read takes `date`, the
// person's own calendar day: the server's clock sits in some other time zone
// and cannot know it, so the client always says.
import { createRoute, z } from '@hono/zod-openapi'
import { MUSCLE_QUALITIES } from '@tekio/core'
import { DateQuery, json, failures } from './schemas'

// The reads' answers are described by their top-level fields for now; each
// field's full shape lands before a client is generated from this (RFC 0094).
const Field = z.unknown()

const HomeBody = z.object({
  date: z.string(), muscles: Field, gaps: Field, qualities: Field, coverage: Field,
  readiness: Field, donation: Field, verdict: Field,
}).openapi('HomeRead')

const AdaptationsBody = z.object({
  date: z.string(), coverage: Field, quality: z.string(), shape: Field, muscles: Field, gaps: Field,
  qualities: Field, liftingSets: Field, cardioSessions: Field, atThreshold: Field,
}).openapi('AdaptationsRead')

const ReadinessBody = z.object({
  date: z.string(), readiness: Field, donation: Field, verdict: Field, trend: Field,
}).openapi('ReadinessRead')

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
