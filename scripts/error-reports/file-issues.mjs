#!/usr/bin/env node
// Error reports, stage 2 (tekio.rfcs/rfcs/0103-error-reports-to-agent-fixes.md):
// each new fault in `error_reports` becomes one issue in this repository, and
// the table follows what happens to it. Run hourly by
// .github/workflows/error-report-issues.yml.
//
//   new, no issue yet     → open an issue (or a bare "held" one, see issue.mjs),
//                           save its link, status triaged
//   new, issue already    → it came back after a fix: reopen the issue and say
//                           so, status triaged
//   triaged or fixing     → closed as done → fixed; closed as not planned →
//                           wontfix; labelled `fixing` → fixing; a count that
//                           grew → the issue's table updated, one comment
//   not a real report     → wontfix, never filed
//
// The Actions log of a public repo is public too, so it names signatures and
// what was done, never a report's contents.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GITHUB_TOKEN, GITHUB_REPOSITORY,
// DRY_RUN=true to change nothing. Node built-ins only.
import {
  LABEL, HELD_LABEL, HELD_TITLE,
  invalidReason, isHeld, issueTitle, issueBody, heldBody,
  markedCount, repeatComment, reopenComment, statusFromIssue,
} from './issue.mjs'

/** A burst of new faults, or somebody posting junk with the anon key, opens at
 *  most this many issues an hour; the rest wait for the next run. */
const MAX_NEW_PER_RUN = 5

const env = name => {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is not set`)
  return v
}
const DRY = process.env.DRY_RUN === 'true'
const SB = env('SUPABASE_URL').replace(/\/$/, '')
const SB_KEY = env('SUPABASE_SERVICE_ROLE_KEY')
const GH_TOKEN = env('GITHUB_TOKEN')
const REPO = env('GITHUB_REPOSITORY')

async function call(url, init, what) {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`${what}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`)
  return res.status === 204 ? null : res.json().catch(() => null)
}

const sb = (path, init = {}) => call(`${SB}/rest/v1/${path}`, {
  ...init,
  headers: {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
    ...init.headers,
  },
}, `supabase ${init.method ?? 'GET'} ${path.split('?')[0]}`)

const gh = (path, init = {}) => call(`https://api.github.com/repos/${REPO}${path}`, {
  ...init,
  headers: {
    Authorization: `Bearer ${GH_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'tekio-error-reports',
    ...init.headers,
  },
}, `github ${init.method ?? 'GET'} ${path.replace(/\d+/g, 'N')}`)

const log = (sig, what) => console.log(`${sig.slice(0, 14).padEnd(14)}  ${what}${DRY ? '  (dry run)' : ''}`)

async function setRow(row, fields) {
  if (DRY) return
  await sb(`error_reports?id=eq.${row.id}`, { method: 'PATCH', body: JSON.stringify(fields) })
}

const issueNumber = link => Number(/\/issues\/(\d+)$/.exec(link ?? '')?.[1]) || null

async function ensureLabels() {
  if (DRY) return
  for (const [name, color, description] of [
    [LABEL, 'b60205', 'Sent by the app on its own (RFC 0103)'],
    [HELD_LABEL, '5319e7', 'Worked from the error_reports table, not in public'],
    ['fixing', 'fbca04', 'A fix PR is open'],
  ]) {
    try {
      await gh('/labels', { method: 'POST', body: JSON.stringify({ name, color, description }) })
    } catch (e) {
      if (!String(e.message).includes('HTTP 422')) throw e // 422: it exists already
    }
  }
}

async function fileNew(row) {
  const held = isHeld(row.payload)
  if (DRY) return log(row.signature, held ? 'would open a held issue' : 'would open an issue')
  const issue = await gh('/issues', {
    method: 'POST',
    body: JSON.stringify(held
      ? { title: HELD_TITLE, body: heldBody(row), labels: [LABEL, HELD_LABEL] }
      : { title: issueTitle(row.payload), body: issueBody(row), labels: [LABEL] }),
  })
  await setRow(row, { link: issue.html_url, status: 'triaged' })
  log(row.signature, `opened #${issue.number}${held ? ' (held)' : ''}`)
}

async function reopen(row, n) {
  const issue = await gh(`/issues/${n}`)
  const held = issue.labels.some(l => l.name === HELD_LABEL)
  if (!DRY) {
    await gh(`/issues/${n}`, {
      method: 'PATCH',
      body: JSON.stringify(held ? { state: 'open' } : { state: 'open', body: issueBody(row) }),
    })
    if (!held) await gh(`/issues/${n}/comments`, { method: 'POST', body: JSON.stringify({ body: reopenComment(row) }) })
  }
  await setRow(row, { status: 'triaged' })
  log(row.signature, `reopened #${n}`)
}

async function follow(row, n) {
  const issue = await gh(`/issues/${n}`)
  const status = statusFromIssue(issue)
  if (status !== row.status) {
    await setRow(row, { status })
    log(row.signature, `#${n} ${row.status} → ${status}`)
  }
  if (issue.state !== 'open' || issue.labels.some(l => l.name === HELD_LABEL)) return
  const before = markedCount(issue.body)
  if (before === row.count) return
  if (!DRY) {
    await gh(`/issues/${n}`, { method: 'PATCH', body: JSON.stringify({ body: issueBody(row) }) })
    await gh(`/issues/${n}/comments`, { method: 'POST', body: JSON.stringify({ body: repeatComment(row, before) }) })
  }
  log(row.signature, `#${n} count ${before} → ${row.count}`)
}

async function main() {
  const rows = await sb(
    'error_reports?select=id,signature,payload,count,first_seen,last_seen,status,link' +
    '&status=in.(new,triaged,fixing)&order=first_seen.asc',
    { headers: { Prefer: '' } },
  )
  console.log(`${rows.length} open report(s)`)
  await ensureLabels()

  let opened = 0
  let failed = 0
  for (const row of rows) {
    try {
      const n = issueNumber(row.link)
      if (row.status === 'new' && !n) {
        const why = invalidReason(row)
        if (why) {
          await setRow(row, { status: 'wontfix' })
          log(row.signature, `not a report the app built (${why}): wontfix, not filed`)
        } else if (opened < MAX_NEW_PER_RUN) {
          await fileNew(row)
          opened++
        } else {
          log(row.signature, 'waits for the next run')
        }
      } else if (row.status === 'new') {
        await reopen(row, n)
      } else if (n) {
        await follow(row, n)
      }
    } catch (e) {
      // One bad row must not stop the rest; the run still ends red.
      failed++
      log(row.signature, `failed: ${e.message}`)
    }
  }
  if (failed) process.exitCode = 1
}

main().catch(e => {
  console.error(e.message)
  process.exitCode = 1
})
