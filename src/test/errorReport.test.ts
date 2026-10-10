import { describe, it, expect, vi, beforeEach } from 'vitest'

// RFC 0103, stage 1: an unexpected error is sent on its own, built from a
// whitelist, and the expected is never sent.

vi.mock('../lib/supabase', () => ({ supabase: {} }))
const send = vi.fn(async () => {})
vi.mock('../lib/db/errorReports', () => ({
  sendErrorReport: (...a: unknown[]) => send(...(a as [])),
  sendErrorReportNote: vi.fn(async () => {}),
}))

const { buildReport, reportError, breadcrumb, setScreen, KnownError } = await import('../lib/errorReport')

const PAYLOAD_KEYS = [
  'version', 'build', 'screen', 'source', 'name', 'message', 'code', 'stack',
  'componentStack', 'userAgent', 'trail', 'at',
]

beforeEach(() => send.mockClear())

describe('the payload', () => {
  it('carries only whitelisted fields', () => {
    const { payload } = buildReport(new TypeError('x is undefined'), 'render', { componentStack: '\n  at HomeTab' })
    for (const key of Object.keys(payload)) expect(PAYLOAD_KEYS).toContain(key)
    expect(payload.name).toBe('TypeError')
    expect(payload.source).toBe('render')
    expect(payload.version).toBe(__APP_VERSION__)
  })

  it('leaves a database error\'s details and hint behind, where Postgres puts the row\'s values', () => {
    // Invented values: a set of 97.5 kg × 8 that the database refused.
    const dbError = Object.assign(new Error('new row violates check constraint "session_sets_reps_check"'), {
      name: 'PostgrestError',
      code: '23514',
      details: 'Failing row contains (abc, 97.5, 8.5).',
      hint: 'weight 97.5',
    })
    const { payload } = buildReport(dbError, 'write')
    const sent = JSON.stringify(payload)
    expect(payload.code).toBe('23514')
    expect(sent).not.toContain('97.5')
    expect(sent).not.toContain('Failing row')
  })

  it('names a thrown non-error by its type, never its value', () => {
    const { payload } = buildReport('82 kg', 'promise')
    expect(JSON.stringify(payload)).not.toContain('82')
    expect(payload.message).toBe('thrown string')
  })

  it('keeps the last ten screens and actions, by name', () => {
    setScreen('Weights')
    for (let i = 0; i < 12; i++) breadcrumb(`addWeightEntry`)
    const { payload } = buildReport(new Error('boom'), 'window')
    expect(payload.trail).toHaveLength(10)
    expect(payload.screen).toBe('Weights')
  })
})

describe('the signature', () => {
  const thrower = (msg: string) => { try { throw new Error(msg) } catch (e) { return e } }

  it('is the same for the same fault, so repeats count on one row', () => {
    // One throw site, as a fault seen twice would have.
    const [a, b] = ['row 3 failed', 'row 4 failed'].map(thrower)
    expect(buildReport(a, 'write').signature).toBe(buildReport(b, 'write').signature)
  })

  it('differs for a different fault', () => {
    expect(buildReport(new Error('a'), 'write').signature)
      .not.toBe(buildReport(new RangeError('b'), 'write').signature)
  })
})

describe('what is sent', () => {
  it('sends an unexpected error with no tap', () => {
    const report = reportError(new Error('unexpected'), 'write')
    expect(report).not.toBeNull()
    expect(send).toHaveBeenCalledWith(report)
  })

  it('never sends a validation error the app already shows', () => {
    expect(reportError(new KnownError('Reps must be a whole number.'), 'write')).toBeNull()
    expect(send).not.toHaveBeenCalled()
  })

  it('never sends a network that is not there', () => {
    expect(reportError(new TypeError('Failed to fetch'), 'write')).toBeNull()
    expect(send).not.toHaveBeenCalled()
  })

  it('stops sending a fault stuck in a loop after five', () => {
    for (let i = 0; i < 8; i++) reportError(new Error('loop'), 'render')
    expect(send).toHaveBeenCalledTimes(5)
  })
})

describe('a failed write', () => {
  it('is reported, and its toast offers a note against that report', async () => {
    const { useAppStore } = await import('../store/app')
    const ok = await useAppStore.getState().withToast(async () => { throw new Error('insert refused') }, 'Saved.')
    expect(ok).toBe(false)
    expect(useAppStore.getState().toast).toBe('Failed to save.')
    expect(useAppStore.getState().toastReport?.payload.source).toBe('write')
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('that the form already explains is not', async () => {
    const { useAppStore } = await import('../store/app')
    await useAppStore.getState().withToast(async () => { throw new KnownError('An exercise needs at least one set.') }, 'Saved.')
    expect(useAppStore.getState().toastReport).toBeNull()
    expect(send).not.toHaveBeenCalled()
  })

  it('leaves the action that ran on the trail, by name', async () => {
    const { useAppStore } = await import('../store/app')
    useAppStore.getState().openEditModal({ kind: 'weight', id: 'x' } as never)
    const { payload } = buildReport(new Error('after'), 'window')
    expect(payload.trail[payload.trail.length - 1]).toBe('openEditModal')
  })
})
