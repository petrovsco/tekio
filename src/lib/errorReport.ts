// Error reports, stage 1 (tekio.rfcs/rfcs/0103-error-reports-to-agent-fixes.md).
//
// An unexpected error — a crash, a write the database refused, an error nothing
// caught — is sent on its own, with no tap. What is sent is built here from a
// whitelist and never by serialising state, so a logged value cannot ride
// along: version, build, screen, the error's name, message, code and stack,
// the browser, and the names of the last few screens and store actions. A note
// is the only free text and goes only when the user taps Send.
//
// The expected is never reported: a validation message the app already shows
// throws a `KnownError`, and a network that is not there is not a bug.
import { APP_ENV } from './env'
import { sendErrorReport, sendErrorReportNote } from './db/errorReports'

/** An error the app expects and already explains on screen. Never reported. */
export class KnownError extends Error {
  name = 'KnownError'
}

export type ReportSource = 'render' | 'window' | 'promise' | 'write'

interface ErrorPayload {
  version: string
  build: string
  screen: string
  source: ReportSource
  name: string
  message: string
  code?: string
  stack?: string
  componentStack?: string
  userAgent: string
  trail: string[]
  at: string
}

export interface ErrorReport {
  signature: string
  payload: ErrorPayload
}

// ── The trail ────────────────────────────────────────────────────────────────
// Names only. A store action is recorded by its key, never its arguments.

const TRAIL_SIZE = 10
const trail: string[] = []
let screen = 'Home'

export function breadcrumb(name: string) {
  trail.push(name)
  if (trail.length > TRAIL_SIZE) trail.shift()
}

export function setScreen(name: string) {
  screen = name
  breadcrumb(`screen:${name}`)
}

// ── Building a report ────────────────────────────────────────────────────────

const MESSAGE_MAX = 500
const STACK_LINES = 12
const SIGNATURE_FRAMES = 3

function clip(s: string | undefined, lines: number): string | undefined {
  if (!s) return undefined
  return s.split('\n').slice(0, lines).join('\n').slice(0, 4000)
}

/** A stack frame without what changes from build to build or page to page:
 *  the origin, the chunk hash, the query string. */
function normaliseFrame(line: string): string {
  return line
    .trim()
    .replace(/https?:\/\/[^/\s)]+/g, '')
    .replace(/-[A-Za-z0-9_-]{8}\.js/g, '.js')
    .replace(/\?[^:\s)]*/g, '')
}

function frames(stack: string | undefined): string[] {
  if (!stack) return []
  return stack
    .split('\n')
    // V8 starts with "Name: message"; Firefox and Safari list frames only.
    .filter(l => /^\s*at\s|@/.test(l))
    .slice(0, SIGNATURE_FRAMES)
    .map(normaliseFrame)
}

/** 53-bit string hash (cyrb53), as 14 hex digits. Not cryptographic: it only
 *  has to make one fault one row. */
function hash(str: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0')
}

/** Whatever was thrown, as the few fields a report may carry. A database
 *  error's `details` and `hint` are left behind on purpose: Postgres puts the
 *  failing row's values there. */
function describe(thrown: unknown): { name: string; message: string; code?: string; stack?: string } {
  if (thrown instanceof Error) {
    const code = (thrown as { code?: unknown }).code
    return {
      name: thrown.name || 'Error',
      message: thrown.message,
      code: typeof code === 'string' ? code : undefined,
      stack: thrown.stack,
    }
  }
  if (thrown && typeof thrown === 'object' && 'message' in thrown) {
    const o = thrown as { message?: unknown; code?: unknown }
    return {
      name: 'Error',
      message: String(o.message),
      code: typeof o.code === 'string' ? o.code : undefined,
    }
  }
  // A thrown string or number: its type, never its value.
  return { name: 'NonError', message: `thrown ${typeof thrown}` }
}

export function buildReport(
  thrown: unknown,
  source: ReportSource,
  extra: { componentStack?: string } = {},
): ErrorReport {
  const { name, message, code, stack } = describe(thrown)
  const payload: ErrorPayload = {
    version: __APP_VERSION__,
    build: APP_ENV,
    screen,
    source,
    name,
    message: message.slice(0, MESSAGE_MAX),
    code,
    stack: clip(stack, STACK_LINES),
    componentStack: clip(extra.componentStack, STACK_LINES),
    userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent,
    trail: [...trail],
    at: new Date().toISOString(),
  }
  // Digits are masked in the message so "row 3" and "row 4" are one fault.
  const key = [name, code ?? '', message.replace(/\d+/g, '#'), ...frames(stack)].join('|')
  return { signature: hash(key), payload }
}

// ── What is never reported ───────────────────────────────────────────────────

const NETWORK = /failed to fetch|networkerror|load failed|network request failed/i

function isExpected(thrown: unknown): boolean {
  if (thrown instanceof KnownError) return true
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  const { message } = describe(thrown)
  return NETWORK.test(message)
}

// ── Sending ──────────────────────────────────────────────────────────────────

/** A fault stuck in a loop would otherwise send itself a thousand times. */
const PER_SIGNATURE = 5
const sent = new Map<string, number>()

/**
 * Report an unexpected error. Returns the report, so the screen can say
 * "Reported" and offer a note against it, or null when nothing was sent.
 * Never throws, and a failed send is dropped: the reporter must not become a
 * second fault.
 */
export function reportError(
  thrown: unknown,
  source: ReportSource,
  extra?: { componentStack?: string },
): ErrorReport | null {
  try {
    if (isExpected(thrown)) return null
    const report = buildReport(thrown, source, extra)
    const n = sent.get(report.signature) ?? 0
    sent.set(report.signature, n + 1)
    if (n < PER_SIGNATURE) sendErrorReport(report).catch(() => {})
    return report
  } catch {
    return null
  }
}

/** The user's note, on the same row as the report it was written about. */
export function sendNote(report: ErrorReport, note: string): Promise<void> {
  return sendErrorReportNote(report, note)
}

/** Errors nothing else caught. Installed once, from main.tsx. Several sheets
 *  await a write with no catch, so a refused write lands here, and `onReport`
 *  is how the screen still says so and offers the note. */
export function reportUncaught(onReport: (report: ErrorReport) => void) {
  const handle = (thrown: unknown, source: ReportSource) => {
    const report = reportError(thrown, source)
    if (report) onReport(report)
  }
  // No `error` object means a cross-origin "Script error." with nothing in it.
  window.addEventListener('error', e => { if (e.error) handle(e.error, 'window') })
  window.addEventListener('unhandledrejection', e => { handle(e.reason, 'promise') })
}
