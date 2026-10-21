// What the routes share: the day every call names, the error body, and the
// failures every authenticated route can answer with.
import { z } from '@hono/zod-openapi'

export const DateQuery = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).openapi({
  description: "The person's own calendar day, YYYY-MM-DD.",
  example: '2026-10-20',
})

export const ErrorBody = z.object({ error: z.string() }).openapi('Error')

export const json = <S extends z.ZodType>(description: string, schema: S) =>
  ({ description, content: { 'application/json': { schema } } })

export const failures = {
  400: json('A parameter is missing or malformed.', ErrorBody),
  401: json('No valid access token.', ErrorBody),
}
