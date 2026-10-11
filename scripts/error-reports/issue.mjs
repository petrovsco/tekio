// Error reports, stage 2 (tekio.rfcs/rfcs/0103-error-reports-to-agent-fixes.md):
// what one row of `error_reports` looks like as a public GitHub issue.
//
// Pure functions only; file-issues.mjs does the talking. Two things shape every
// line here:
//
// - The issue is public, and the row was written by anyone holding the anon
//   key, which ships in the bundle. So nothing from the payload is trusted:
//   free text goes inside code fences longer than any backtick run in it (no
//   markdown, no links, no @mentions render there), the title keeps only
//   plain characters, and the fields shown in the table are checked against
//   their shape first. A row that does not look like a report the app built
//   is not filed at all.
// - The browser line (`userAgent`) is never shown: it is the closest thing in
//   a report to identifying a device, so it stays in the table.

export const LABEL = 'error-report'
export const HELD_LABEL = 'held'
/** The routine (stage 3) adds this when it opens a fix PR. */
export const FIXING_LABEL = 'fixing'

const SOURCES = new Set(['render', 'window', 'promise', 'write'])

/** Why a row is not a report the app could have built, or null when it is. */
export function invalidReason(row) {
  const p = row?.payload
  if (!p || typeof p !== 'object') return 'no payload'
  if (typeof p.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(p.version)) return 'version'
  if (typeof p.build !== 'string' || !/^[a-z]{1,20}$/.test(p.build)) return 'build'
  if (typeof p.screen !== 'string' || !/^[A-Za-z][A-Za-z0-9 _-]{0,39}$/.test(p.screen)) return 'screen'
  if (!SOURCES.has(p.source)) return 'source'
  if (typeof p.name !== 'string' || p.name.length === 0 || p.name.length > 100) return 'name'
  if (typeof p.message !== 'string') return 'message'
  if (p.trail !== undefined && !(Array.isArray(p.trail) && p.trail.every(t => typeof t === 'string'))) return 'trail'
  return null
}

// A fault that could show a way in (a refused permission, a key or token in a
// message) is not filed in public. It gets a bare issue naming only its
// signature, so somebody is told, and is worked from the table.
const SENSITIVE = /row[- ]level security|permission denied|\bjwt\b|api[ _-]?key|secret|password|bearer|service[_ ]role|\btoken\b|eyJ[A-Za-z0-9_-]{10,}/i
const SENSITIVE_CODES = new Set(['42501', 'PGRST301', 'PGRST302', '28000', '28P01'])

export function isHeld(payload) {
  if (SENSITIVE_CODES.has(payload.code)) return true
  const text = [payload.name, payload.message, payload.code, payload.stack, payload.componentStack]
    .filter(s => typeof s === 'string')
    .join('\n')
  return SENSITIVE.test(text)
}

/** Plain characters only: no markdown, no mentions, no line breaks. */
function plain(s, max) {
  const out = String(s)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^A-Za-z0-9 .,:;()'"/_=+\-[\]{}<>!?]/g, '')
    .replace(/</g, '‹')
    .replace(/>/g, '›')
    .replace(/\s+/g, ' ')
    .trim()
  return out.length > max ? `${out.slice(0, max - 1)}…` : out
}

export function issueTitle(payload) {
  return `Error: ${plain(`${payload.name}: ${payload.message}`, 110)}`
}

export const HELD_TITLE = 'Error report held for a private look'

/** A fence longer than any run of backticks inside the text, so nothing in it
 *  can close the block early. */
function fenced(text) {
  const s = String(text)
  const longest = Math.max(0, ...(s.match(/`+/g) ?? []).map(r => r.length))
  const fence = '`'.repeat(Math.max(3, longest + 1))
  return `${fence}text\n${s}\n${fence}`
}

function day(iso) {
  return typeof iso === 'string' ? iso.slice(0, 10) : '?'
}

/** The hidden line that says which count the issue last showed. */
export function marker(row) {
  return `<!-- tekio-error-report signature=${row.signature} count=${row.count} -->`
}

export function markedCount(body) {
  const m = /<!-- tekio-error-report signature=\S+ count=(\d+) -->/.exec(body ?? '')
  return m ? Number(m[1]) : null
}

export function issueBody(row) {
  const p = row.payload
  const error = `${p.name}${p.code ? ` (${p.code})` : ''}: ${p.message}`
  const parts = [
    'Sent by the app on its own, with no personal data in it (RFC 0103). Filed from the `error_reports` table.',
    '',
    '| | |',
    '|---|---|',
    `| Seen | ${row.count} ${row.count === 1 ? 'time' : 'times'}, first ${day(row.first_seen)}, last ${day(row.last_seen)} |`,
    `| Version | ${p.version} (${p.build}) |`,
    `| Screen | ${p.screen} |`,
    `| Source | ${p.source} |`,
    `| Signature | ${row.signature.replace(/[^A-Za-z0-9]/g, '')} |`,
    '',
    '### Error',
    fenced(error),
  ]
  if (p.stack) parts.push('', '### Stack', fenced(p.stack))
  if (p.componentStack) parts.push('', '### Component stack', fenced(p.componentStack))
  if (Array.isArray(p.trail) && p.trail.length) parts.push('', '### Last actions, oldest first', fenced(p.trail.join('\n')))
  parts.push('', marker(row))
  return parts.join('\n')
}

export function heldBody(row) {
  return [
    'An error report that may show a way into the app or its data. It is not filed in public:',
    'it is worked from the `error_reports` table, by this signature.',
    '',
    `Signature: ${row.signature.replace(/[^A-Za-z0-9]/g, '')}`,
  ].join('\n')
}

export function repeatComment(row, before) {
  const p = row.payload
  return `Seen again: ${row.count} times now (${before ?? '?'} when last updated), latest in ${p.version} (${p.build}) on ${day(row.last_seen)}.`
}

export function reopenComment(row) {
  const p = row.payload
  return `Came back after it was fixed: seen in ${p.version} (${p.build}) on ${day(row.last_seen)}, ${row.count} times in all.`
}

/** The table's status for an issue the filer already made. */
export function statusFromIssue(issue) {
  if (issue.state === 'closed') return issue.state_reason === 'not_planned' ? 'wontfix' : 'fixed'
  const labels = (issue.labels ?? []).map(l => (typeof l === 'string' ? l : l.name))
  return labels.includes(FIXING_LABEL) ? 'fixing' : 'triaged'
}
