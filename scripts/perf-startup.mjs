#!/usr/bin/env node
// Roadmap 023 item 4 — the startup timing run. `npm run perf:startup`.
//
// The bundle budget measures bytes; this measures the thing the bytes are a
// proxy for — how long until Home actually answers. Doctrine §6 asks for the
// read "within five seconds", so the number worth watching is not
// DOMContentLoaded but the moment the gap sentence is on screen, which is after
// bootstrap() has loaded every domain from Supabase.
//
// Home answers only a signed-in person (RFC 0003), and opens through the API
// (RFC 0094 step 4), which `vite preview` does not serve, so every run times a
// deployed build, in a browser profile kept under ~/.cache/tekio-perf, one per
// address, signed in once by hand:
//
//   npm run perf:startup -- --sign-in --url <address>
//
// opens that profile in a window: pass the staging gate if there is one, ask
// for the email link and paste the link into the same window. Close it once
// Home shows. Then:
//
//   npm run perf:startup -- --url <address>    e.g. https://stg-app.tekio.fyi/
//
// Each run writes its result into scripts/perf-baseline.json so the next run
// has something to compare against — a timing run whose number is only ever
// printed to a terminal is not a measurement, it is a vibe.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const baselinePath = join(root, 'scripts', 'perf-baseline.json')

const args = process.argv.slice(2)
const flag = name => args.includes(name)
const urlArg = args[args.indexOf('--url') + 1]
const url = flag('--url') ? urlArg : null
if (!/^https?:\/\//.test(url ?? '')) {
  console.error('Needs --url <address>, e.g. --url https://stg-app.tekio.fyi/: the app opens through the API, which `vite preview` does not serve.')
  process.exit(2)
}
const RUNS = 3

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
    await context.close()
    console.error(signedOut
      ? `Signed out, or stopped at the gate, at ${address}. Run once with --sign-in --url ${url}.`
      : `Home did not answer within 30 s at ${address}.`)
    process.exit(1)
  }
  const firstRead = Date.now() - t0
  await page.close()
  return { domContentLoaded, firstRead }
}

const median = xs => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)]
// One load first, uncounted: it refreshes an expired token and warms the
// function, so the median does not pay for either.
await load(url)

const s = []
for (let i = 0; i < RUNS; i++) s.push(await load(url))
await context.close()

const dcl = median(s.map(x => x.domContentLoaded))
const read = median(s.map(x => x.firstRead))
console.log(`${RUNS} runs against ${url} (median):\n`)
console.log(`  DOMContentLoaded    ${dcl} ms`)
console.log(`  Home read on screen ${read} ms   (doctrine §6 asks for five seconds: ${read < 5000 ? 'inside' : 'OUTSIDE'})`)
console.log(`  samples: ${s.map(x => `${x.domContentLoaded}/${x.firstRead}`).join('  ')} ms (dcl/read)\n`)

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
    url,
    note: 'Median of ' + RUNS + ' loads of a deployed build at 390x900, signed in. Wall-clock on one machine ' +
      'against the live API and database, so it moves with the network — read the trend, not the digit.',
  },
}, null, 2) + '\n')
console.log(`\nWritten to ${baselinePath.replace(root + '/', '')}.`)
