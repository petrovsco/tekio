import { describe, it, expect } from 'vitest'
import {
  invalidReason, isHeld, issueTitle, issueBody, heldBody,
  markedCount, statusFromIssue,
} from './issue.mjs'

const row = (payload = {}, extra = {}) => ({
  id: 'x',
  signature: '00ab12cd34ef56',
  count: 3,
  first_seen: '2026-10-11T04:00:00Z',
  last_seen: '2026-10-11T06:00:00Z',
  status: 'new',
  link: null,
  payload: {
    version: '2.2.15',
    build: 'staging',
    screen: 'Weights',
    source: 'write',
    name: 'TypeError',
    message: "Cannot read properties of undefined (reading 'sets')",
    stack: 'TypeError: x\n    at Ab (/assets/index-AbCdEf12.js:1:2)',
    userAgent: 'Mozilla/5.0 (Linux; Android 16; Pixel 10)',
    trail: ['screen:Weights', 'addWeightEntry'],
    at: '2026-10-11T06:00:00Z',
    ...payload,
  },
  ...extra,
})

describe('an error report as a public issue', () => {
  it('shows the error, version, screen, stack and trail, never the browser', () => {
    const body = issueBody(row())
    expect(body).toContain('2.2.15 (staging)')
    expect(body).toContain('| Screen | Weights |')
    expect(body).toContain("reading 'sets'")
    expect(body).toContain('at Ab')
    expect(body).toContain('addWeightEntry')
    expect(body).toContain('3 times')
    expect(body).not.toContain('Mozilla')
    expect(body).not.toContain('Pixel')
  })

  it('keeps free text inside a fence nothing in it can close', () => {
    const body = issueBody(row({ message: 'x\n````\n# @someone [link](https://evil.example)' }))
    const block = body.split('### Error\n')[1]
    expect(block.startsWith('`````text\n')).toBe(true)
    expect(block).toContain('\n`````')
  })

  it('makes a title of plain characters, with no mention or markdown', () => {
    const t = issueTitle(row({ message: 'boom @someone `code` **bold**\nsecond line' }).payload)
    expect(t).not.toMatch(/[@`*\n]/)
    expect(t.startsWith('Error: TypeError: boom')).toBe(true)
    expect(issueTitle(row({ message: 'y'.repeat(500) }).payload).length).toBeLessThanOrEqual(117)
  })

  it('remembers the count it showed, so a repeat is noticed', () => {
    expect(markedCount(issueBody(row()))).toBe(3)
    expect(markedCount('no marker')).toBeNull()
  })
})

describe('what is not filed in public', () => {
  it('turns away a row the app could not have built', () => {
    expect(invalidReason(row())).toBeNull()
    expect(invalidReason(row({ version: 'latest' }))).toBe('version')
    expect(invalidReason(row({ screen: '<img src=x>' }))).toBe('screen')
    expect(invalidReason(row({ source: 'elsewhere' }))).toBe('source')
    expect(invalidReason({ payload: null })).toBe('no payload')
  })

  it('holds back a fault that could show a way in', () => {
    expect(isHeld(row().payload)).toBe(false)
    expect(isHeld(row({ code: '42501', message: 'new row violates row-level security policy' }).payload)).toBe(true)
    expect(isHeld(row({ message: 'JWT expired' }).payload)).toBe(true)
    expect(isHeld(row({ message: 'bad header eyJhbGciOiJIUzI1NiJ9.abc' }).payload)).toBe(true)
  })

  it('says only the signature of a held report', () => {
    const body = heldBody(row({ message: 'JWT expired' }))
    expect(body).toContain('00ab12cd34ef56')
    expect(body).not.toContain('JWT')
  })
})

describe('the table follows the issue', () => {
  it('maps the issue state to a status', () => {
    expect(statusFromIssue({ state: 'closed', state_reason: 'completed' })).toBe('fixed')
    expect(statusFromIssue({ state: 'closed', state_reason: 'not_planned' })).toBe('wontfix')
    expect(statusFromIssue({ state: 'open', labels: [{ name: 'fixing' }] })).toBe('fixing')
    expect(statusFromIssue({ state: 'open', labels: [{ name: 'error-report' }] })).toBe('triaged')
  })
})
