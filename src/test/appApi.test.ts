// The app's door to the API (RFC 0094 step 4): an answer becomes a value, a
// refusal for what the entry holds becomes the KnownError the toast reads, and
// anything else throws as a failure worth reporting.
import { describe, it, expect } from 'vitest'
import { KnownError } from '@tekio/core'
import { body, done } from '../lib/api'

const answer = (status: number, json?: unknown) => {
  const response = new Response(json === undefined ? null : JSON.stringify(json), { status })
  Object.defineProperty(response, 'url', { value: 'http://localhost/api/bodyweight' })
  return Promise.resolve(status < 300 ? { data: json, response } : { error: json, response })
}

describe('the app reading an API answer', () => {
  it('returns the body of a success', async () => {
    await expect(body(answer(201, { id: 'x', date: '2026-10-22', weight: 80 }))).resolves.toEqual({ id: 'x', date: '2026-10-22', weight: 80 })
    await expect(done(answer(204))).resolves.toBeUndefined()
  })

  it('throws a 400 with a reason as a KnownError carrying it', async () => {
    const thrown = await body(answer(400, { error: 'A set needs at least one rep.' })).then(() => null, (e: unknown) => e as Error)
    expect(thrown).toBeInstanceOf(KnownError)
    expect(thrown?.message).toBe('A set needs at least one rep.')
  })

  it('throws anything else as a plain error naming the route and status', async () => {
    const thrown = await done(answer(500, { error: 'boom' })).then(() => null, (e: unknown) => e as Error)
    expect(thrown).not.toBeInstanceOf(KnownError)
    expect(thrown?.message).toBe('/api/bodyweight answered 500')
  })
})
