#!/usr/bin/env node
// Roadmap 023 item 4 — the startup timing run. `npm run perf:startup`.
//
// The bundle budget measures bytes; this measures the thing the bytes are a
// proxy for — how long until Home actually answers. Doctrine §6 asks for the
// read "within five seconds", so the number worth watching is not
// DOMContentLoaded but the moment the gap sentence is on screen, which is after
// bootstrap() has loaded every domain from Supabase.
//
// Home answers only a signed-in person (RFC 0003), so every run opens the app
// in a browser profile kept under ~/.cache/tekio-perf, one per address, signed
// in once by hand:
//
//   npm run perf:startup -- --sign-in [--url <address>]
//
// opens that profile in a window: pass the staging gate if there is one, ask
// for the email link and paste the link into the same window. Close it once
// Home shows. Then:
//
//   npm run perf:startup                       the production build here (`vite preview`)
//   npm run perf:startup -- --url <address>    a deployed build, e.g. staging
//   npm run perf:startup -- --url <address> --roads
//
// `--roads` times the two ways the app can open (RFC 0094 step 4), turn and
// turn about so the network's drift falls on both: straight from the database,
// and `?start=api`, one call to the API. `vite preview` serves no API, so it
// needs `--url`.
//
// A run of the local build writes its result into scripts/perf-baseline.json
// so the next run has something to compare against — a timing run whose number
// is only ever printed to a terminal is not a measurement, it is a vibe.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const baselinePath = join(root, 'scripts', 'perf-baseline.json')
const PORT = 4178

const args = process.argv.slice(2)
const flag = name => args.includes(name)
const urlArg = args[args.indexOf('--url') + 1]
const remote = flag('--url') ? urlArg : null
if (flag('--url') && !/^https?:\/\//.test(remote ?? '')) {
  console.error('--url needs an address, e.g. --url https://stg-app.tekio.fyi/')
  process.exit(2)
}
if (flag('--roads') && !remote) {
  console.error('--roads needs --url: `vite preview` serves no API to open through.')
  process.exit(2)
}
const RUNS = flag('--roads') ? 5 : 3

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

let stop = () => {}
if (!remote) {
  if (!existsSync(join(root, 'dist', 'index.html'))) {
    console.error('No dist/. Run `npm run build` first — this measures the production build, not the dev server.')
    process.exit(2)
  }
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
    { cwd: root, stdio: 'ignore' })
  stop = () => { try { server.kill() } catch { /* already gone */ } }
  process.on('exit', stop)
  process.on('SIGINT', () => { stop(); process.exit(130) })
  await new Promise(r => setTimeout(r, 3000))
}

const url = remote ?? `http://127.0.0.1:${PORT}/`
const profile = join(homedir(), '.cache', 'tekio-perf', new URL(url).host.replace(/[^a-z0-9.-]/gi, '_'))
mkdirSync(profile, { recursive: true })

if (flag('--sign-in')) {
  const context = await chromium.launchPersistentContext(profile, {
    executablePath, headless: false, viewport: { width: 390, height: 900 },
  })
  const page = context.pages()[0] ?? await context.newPage()
  await page.goto(url)
  console.log(`Sign in in the window that opened (${url}), then close it.`)
  await new Promise(r => context.on('close', r))
  stop()
  process.exit(0)
}

const context = await chromium.launchPersistentContext(profile, {
  executablePath, headless: true, viewport: { width: 390, height: 900 }, args: ['--no-sandbox'],
})

/** One load, timed: DOMContentLoaded, and Home's answer on screen — the "what
 *  is missing" card renders its ranked list only after bootstrap() returns. */
async function load(address) {
  const page = await context.newPage()
  const t0 = Date.now()
  await page.goto(address, { waitUntil: 'domcontentloaded' })
  const domContentLoaded = Date.now() - t0
  try {
    await page.waitForSelector('text=/WHAT IS MISSING/i', { timeout: 30000 })
  } catch {
    // The sign-in screen asks for an email; the staging gate, a password.
    const signedOut = await page.locator('input[type=email], input[type=password]').count()
    await context.close(); stop()
    console.error(signedOut
      ? `Signed out, or stopped at the gate, at ${address}. Run once with --sign-in${remote ? ` --url ${remote}` : ''}.`
      : `Home did not answer within 30 s at ${address}.`)
    process.exit(1)
  }
  const firstRead = Date.now() - t0
  await page.close()
  return { domContentLoaded, firstRead }
}

const median = xs => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const roads = flag('--roads')
  ? [['direct', url], ['api', url + (url.includes('?') ? '&' : '?') + 'start=api']]
  : [['direct', url]]

// One load of each road first, uncounted: it refreshes an expired token and
// warms the function, so neither road pays for that in the median.
for (const [, address] of roads) await load(address)

const samples = Object.fromEntries(roads.map(([name]) => [name, []]))
for (let i = 0; i < RUNS; i++) {
  for (const [name, address] of roads) samples[name].push(await load(address))
}

await context.close()
stop()

console.log(`${RUNS} runs against ${remote ?? `the production build on :${PORT}`} (median):\n`)
for (const [name] of roads) {
  const s = samples[name]
  const read = median(s.map(x => x.firstRead))
  const label = roads.length > 1 ? `${name.padEnd(7)} ` : ''
  console.log(`  ${label}DOMContentLoaded   ${median(s.map(x => x.domContentLoaded))} ms`)
  console.log(`  ${label}Home read on screen ${read} ms   (doctrine §6 asks for five seconds: ${read < 5000 ? 'inside' : 'OUTSIDE'})`)
  console.log(`  ${label}samples: ${s.map(x => `${x.domContentLoaded}/${x.firstRead}`).join('  ')} ms (dcl/read)\n`)
}

if (remote) process.exit(0)

const s = samples.direct
const dcl = median(s.map(x => x.domContentLoaded))
const read = median(s.map(x => x.firstRead))
const prev = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : {}
const before = prev.startup
if (before) {
  console.log(`  previous run ${before.measuredAt}: ${before.domContentLoadedMs} ms / ${before.firstReadMs} ms`)
  console.log(`  change: ${read - before.firstReadMs >= 0 ? '+' : ''}${read - before.firstReadMs} ms to the read`)
}

writeFileSync(baselinePath, JSON.stringify({
  ...prev,
  startup: {
    domContentLoadedMs: dcl,
    firstReadMs: read,
    runs: RUNS,
    samples: s,
    measuredAt: new Date().toISOString().slice(0, 10),
    note: 'Median of ' + RUNS + ' loads of `vite preview` at 390x900, signed in. Wall-clock on one machine ' +
      'against the live Supabase project, so it moves with the network — read the trend, not the digit.',
  },
}, null, 2) + '\n')
console.log(`\nWritten to ${baselinePath.replace(root + '/', '')}.`)
