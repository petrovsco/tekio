#!/usr/bin/env node
// Roadmap 023 item 4 — the startup timing run. `npm run perf:startup`.
//
// The bundle budget measures bytes; this measures the thing the bytes are a
// proxy for — how long until Home actually answers. Doctrine §6 asks for the
// read "within five seconds", so the number worth watching is not
// DOMContentLoaded but the moment the gap sentence is on screen, which is after
// bootstrap() has loaded every domain from Supabase.
//
// It serves the real production build (`vite preview`) rather than the dev
// server, because dev-server module graphs say nothing about what ships.
//
// Writes its result into scripts/perf-baseline.json so the next run has
// something to compare against — a timing run whose number is only ever printed
// to a terminal is not a measurement, it is a vibe.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { readdirSync } from 'node:fs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const baselinePath = join(root, 'scripts', 'perf-baseline.json')
const PORT = 4178
const RUNS = 3

if (!existsSync(join(root, 'dist', 'index.html'))) {
  console.error('No dist/. Run `npm run build` first — this measures the production build, not the dev server.')
  process.exit(2)
}

/** Playwright's own chromium download. Not the branded Chrome channel, which
 *  needs sudo to install and is why the Playwright MCP server is unusable here. */
function findChromium() {
  const base = join(process.env.HOME ?? '', '.cache', 'ms-playwright')
  if (!existsSync(base)) return null
  const dir = readdirSync(base).filter(d => d.startsWith('chromium-')).sort().pop()
  if (!dir) return null
  const exe = join(base, dir, 'chrome-linux64', 'chrome')
  return existsSync(exe) ? exe : null
}

const executablePath = findChromium()
if (!executablePath) {
  console.error('No Playwright chromium in ~/.cache/ms-playwright. Install it with `npx playwright install chromium`.')
  process.exit(2)
}

let chromium
try {
  ({ chromium } = await import('playwright-core'))
} catch {
  console.error('playwright-core is not installed. `npm i -D playwright-core`.')
  process.exit(2)
}

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
  { cwd: root, stdio: 'ignore' })
const stop = () => { try { server.kill() } catch { /* already gone */ } }
process.on('exit', stop)
process.on('SIGINT', () => { stop(); process.exit(130) })

const url = `http://127.0.0.1:${PORT}/`
await new Promise(r => setTimeout(r, 3000))

const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] })
const samples = []

for (let i = 0; i < RUNS; i++) {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } })
  const t0 = Date.now()
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  const domContentLoaded = Date.now() - t0

  // Home's answer is on screen once the "what is missing" card has rendered its
  // ranked list — that is after bootstrap() has returned from every table.
  await page.waitForSelector('text=/WHAT IS MISSING/i', { timeout: 30000 })
  const firstRead = Date.now() - t0

  samples.push({ domContentLoaded, firstRead })
  await page.close()
}

await browser.close()
stop()

const median = xs => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const dcl = median(samples.map(s => s.domContentLoaded))
const read = median(samples.map(s => s.firstRead))

const prev = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : {}
const before = prev.startup

console.log(`${RUNS} runs against the production build on :${PORT} (median):\n`)
console.log(`  DOMContentLoaded   ${dcl} ms`)
console.log(`  Home read on screen ${read} ms   (doctrine §6 asks for five seconds: ${read < 5000 ? 'inside' : 'OUTSIDE'})`)
console.log(`\n  samples: ${samples.map(s => `${s.domContentLoaded}/${s.firstRead}`).join('  ')} ms (dcl/read)`)
if (before) {
  console.log(`\n  previous run ${before.measuredAt}: ${before.domContentLoadedMs} ms / ${before.firstReadMs} ms`)
  console.log(`  change: ${read - before.firstReadMs >= 0 ? '+' : ''}${read - before.firstReadMs} ms to the read`)
}

writeFileSync(baselinePath, JSON.stringify({
  ...prev,
  startup: {
    domContentLoadedMs: dcl,
    firstReadMs: read,
    runs: RUNS,
    samples,
    measuredAt: new Date().toISOString().slice(0, 10),
    note: 'Median of ' + RUNS + ' loads of `vite preview` at 390x900. Wall-clock on one machine ' +
      'against the live Supabase project, so it moves with the network — read the trend, not the digit.',
  },
}, null, 2) + '\n')
console.log(`\nWritten to ${baselinePath.replace(root + '/', '')}.`)
