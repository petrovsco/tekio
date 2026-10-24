// What a person sets rather than logs (RFC 0094 step 4): the profile's
// settings and the menu's sections; and the two calls beside the logs, a Garmin
// sync on demand (RFC 0110) and an error report (RFC 0103).
import { createRoute, z } from '@hono/zod-openapi'
import { READINESS_METHODS } from '@tekio/core'
import { DateQuery, ErrorBody, json, failures } from './schemas'

const security = [{ bearer: [] }]

const ProfilePatch = z.object({
  weekStartDay: z.enum(['monday', 'sunday']).optional(),
  hrMax: z.object({
    value: z.number().int().positive().nullable().openapi({ description: 'Beats per minute; null goes back to the age estimate.' }),
    source: z.enum(['typed', 'tracker']),
  }).optional().openapi({ description: 'The HRmax the person set, and where it came from.' }),
  birthDate: DateQuery.nullable().optional().openapi({ description: 'For the age estimate of HRmax.' }),
  readinessMethod: z.enum(READINESS_METHODS).nullable().optional()
    .openapi({ description: 'How readiness is read; null picks the best one with data.' }),
}).openapi('ProfilePatch')

export const profileRoute = createRoute({
  method: 'patch', path: '/profile', security, operationId: 'updateProfile',
  summary: 'Change any of the profile’s settings; the ones not sent stay as they are.',
  request: { body: { required: true, content: { 'application/json': { schema: ProfilePatch } } } },
  responses: { 204: { description: 'Saved.' }, ...failures },
})

export const Section = z.object({
  sectionKey: z.string().min(1), showInMenu: z.boolean(), sortOrder: z.number().int().nonnegative(),
}).openapi('Section')

export const sectionsRoute = createRoute({
  method: 'put', path: '/sections', security, operationId: 'saveSections',
  summary: 'Save the menu’s sections in their new order.',
  request: { body: { required: true, content: { 'application/json': { schema: z.array(Section).min(1) } } } },
  responses: { 204: { description: 'Saved.' }, ...failures },
})

export const sectionShownRoute = createRoute({
  method: 'patch', path: '/sections/{key}', security, operationId: 'showSection',
  summary: 'Show a section in the menu, or hide it.',
  request: {
    params: z.object({ key: z.string().min(1) }),
    body: { required: true, content: { 'application/json': { schema: z.object({ showInMenu: z.boolean() }) } } },
  },
  responses: { 204: { description: 'Saved.' }, ...failures },
})

const SyncRun = z.object({
  id: z.number().int(),
  status: z.enum(['requested', 'ok', 'failed']),
  requestedAt: z.string(),
  finishedAt: z.string().optional(),
}).openapi('SyncRun')

export const lastSyncRoute = createRoute({
  method: 'get', path: '/sync/garmin', security, operationId: 'getLastGarminSync',
  summary: 'The newest Garmin sync that brought data in; null when there has been none.',
  responses: { 200: json('The run, or null.', z.union([SyncRun, z.null()])), ...failures },
})

export const requestSyncRoute = createRoute({
  method: 'post', path: '/sync/garmin', security, operationId: 'requestGarminSync',
  summary: 'Ask for a Garmin sync now. A run already open is returned rather than a second one started.',
  responses: { 200: json('The run asked for.', SyncRun), ...failures },
})

export const syncRunRoute = createRoute({
  method: 'get', path: '/sync/runs/{id}', security, operationId: 'getSyncRun',
  summary: 'One of the caller’s sync runs, to follow it to its end.',
  request: { params: z.object({ id: z.coerce.number().int().positive() }) },
  responses: { 200: json('The run.', SyncRun), ...failures, 404: json('No such run of yours.', ErrorBody) },
})

// What a report may carry, field by field: anything else sent is dropped here,
// so the whitelist the app builds from holds at the server too.
const ErrorPayload = z.object({
  version: z.string(), build: z.string(), screen: z.string(),
  source: z.enum(['render', 'window', 'promise', 'write']),
  name: z.string(), message: z.string(),
  code: z.string().optional(), stack: z.string().optional(), componentStack: z.string().optional(),
  userAgent: z.string(), trail: z.array(z.string()), at: z.string(),
})

export const errorReportRoute = createRoute({
  method: 'post', path: '/error-reports', operationId: 'sendErrorReport',
  summary: 'Report an error the app did not expect. Needs no sign-in: it can happen before one.',
  request: {
    body: { required: true, content: { 'application/json': { schema: z.object({ signature: z.string().min(1), payload: ErrorPayload }).openapi('ErrorReport') } } },
  },
  responses: { 204: { description: 'Received.' }, 400: json('A field is missing or malformed.', ErrorBody) },
})
