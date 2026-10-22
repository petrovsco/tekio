// The app's door to the API (RFC 0094 step 4): the typed client, sending the
// signed-in token, and the one place an answer becomes a value or a throw. The
// domain files in ./db/ call it as each domain moves off the direct database
// queries, so the app writes through the same routes the phone apps and the
// agent will.
import { createTekioClient } from '@tekio/client'
import { KnownError } from '@tekio/core'
import { accessToken } from './session'

export const api = createTekioClient({
  baseUrl: typeof location === 'undefined' ? '' : location.origin,
  token: accessToken,
})

interface Answer<T> {
  data?: T
  error?: unknown
  response: Response
}

/** An entry the API refused for what it holds comes back as a 400 carrying the
 *  reason, and throws as the `KnownError` the database layer would have thrown,
 *  so the toast reads the same. Anything else is a failure worth reporting. */
function refusal({ error, response }: Answer<unknown>): Error {
  const reason = (error as { error?: unknown } | undefined)?.error
  if (response.status === 400 && typeof reason === 'string') return new KnownError(reason)
  const path = response.url ? new URL(response.url).pathname : 'the API'
  return new Error(`${path} answered ${response.status}`)
}

/** The answer's body, or a throw. */
export async function body<T>(call: Promise<Answer<T>>): Promise<T> {
  const answer = await call
  if (!answer.response.ok || answer.data === undefined) throw refusal(answer)
  return answer.data
}

/** Nothing to return: a 204, or a throw. */
export async function done(call: Promise<Answer<unknown>>): Promise<void> {
  const answer = await call
  if (!answer.response.ok) throw refusal(answer)
}
