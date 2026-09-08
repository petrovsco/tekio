#!/usr/bin/env node
// Roadmap 023 item 4 — the bundle budget. `npm run perf`.
//
// The point of this script is that it is a *measurement*, not an opinion. 023
// exists because "is this slow?" asked of a model produces plausible noise,
// while the thing that actually matters here is a number anyone can reproduce.
//
// What it measures is what the browser fetches before it can paint: the files
// `dist/index.html` references directly — the entry chunk, its modulepreloads,
// and the stylesheet. Lazy chunks are deliberately excluded; a 387 kB chart
// bundle that only loads when you open a chart costs the first paint nothing,
// and counting it would push the app toward keeping charts eager.
//
// Usage:
//   node scripts/perf-budget.mjs            check against the baseline
//   node scripts/perf-budget.mjs --update   re-baseline, deliberately
//   node scripts/perf-budget.mjs --json     machine-readable output
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const baselinePath = join(root, 'scripts', 'perf-baseline.json')

const args = new Set(process.argv.slice(2))
const update = args.has('--update')
const asJson = args.has('--json')

/** Allowed growth before the budget fails. A few kB of ordinary feature work
 *  should not trip it; a re-added library should. 5 % of ~324 kB is ~16 kB,
 *  which is about one medium dependency. */
const TOLERANCE = 0.05

if (!existsSync(dist)) {
  console.error('No dist/. Run `npm run build` first — this script measures the real build output.')
  process.exit(2)
}

const html = readFileSync(join(dist, 'index.html'), 'utf8')

// Everything index.html pulls before paint: the entry module, anything it
// preloads, and the stylesheet.
const refs = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(m => m[1])
if (refs.length === 0) {
  console.error('index.html references no /assets/ files — has the build layout changed?')
  process.exit(2)
}

const files = refs.map(ref => {
  const path = join(dist, ref.replace(/^\//, ''))
  const raw = readFileSync(path)
  return { ref, bytes: raw.length, gzip: gzipSync(raw).length }
}).sort((a, b) => b.bytes - a.bytes)

const total = files.reduce((s, f) => s + f.bytes, 0)
const totalGzip = files.reduce((s, f) => s + f.gzip, 0)

/** Divided by 1000, not 1024, so these numbers are the same ones `vite build`
 *  prints — a budget you have to mentally convert gets ignored. */
const kb = n => (n / 1000).toFixed(2) + ' kB'
const now = { firstPaintBytes: total, firstPaintGzip: totalGzip, files: files.map(f => ({ ref: f.ref, bytes: f.bytes })) }

if (update) {
  const prev = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : {}
  const next = {
    ...prev,
    bundle: { ...now, measuredAt: new Date().toISOString().slice(0, 10) },
  }
  writeFileSync(baselinePath, JSON.stringify(next, null, 2) + '\n')
  console.log(`Baseline updated: first paint ${kb(total)} (${kb(totalGzip)} gzipped), ${files.length} files.`)
  console.log(`Wrote ${baselinePath.replace(root + '/', '')} — commit it in the same change as the code that moved the number.`)
  process.exit(0)
}

if (!existsSync(baselinePath)) {
  console.error(`No baseline at ${baselinePath.replace(root + '/', '')}. Create one with \`npm run perf:update\`.`)
  process.exit(2)
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'))
if (!baseline.bundle?.firstPaintBytes) {
  console.error('Baseline file has no `bundle.firstPaintBytes`. Re-create it with `npm run perf:update`.')
  process.exit(2)
}

const base = baseline.bundle.firstPaintBytes
const budget = Math.round(base * (1 + TOLERANCE))
const delta = total - base
const pct = ((delta / base) * 100).toFixed(1)
const over = total > budget

if (asJson) {
  console.log(JSON.stringify({ ...now, baseline: base, budget, delta, over }, null, 2))
} else {
  console.log('First paint — what index.html fetches before it can draw:\n')
  for (const f of files) console.log(`  ${kb(f.bytes).padStart(11)}  ${kb(f.gzip).padStart(10)} gz  ${f.ref}`)
  console.log(`\n  ${kb(total).padStart(11)}  ${kb(totalGzip).padStart(10)} gz  total`)
  console.log(`\n  baseline ${kb(base)} (${baseline.bundle.measuredAt ?? 'undated'})`)
  console.log(`  budget   ${kb(budget)}  (baseline + ${(TOLERANCE * 100).toFixed(0)} %)`)
  console.log(`  now      ${kb(total)}  ${delta >= 0 ? '+' : ''}${kb(delta)} (${delta >= 0 ? '+' : ''}${pct} %)`)
  if (baseline.startup?.domContentLoadedMs != null) {
    console.log(`\n  last startup run: ${baseline.startup.domContentLoadedMs} ms to DOMContentLoaded, ` +
      `${baseline.startup.firstReadMs} ms to the Home read (${baseline.startup.measuredAt}) — \`npm run perf:startup\` to re-measure`)
  }
}

if (over) {
  console.error(`\nOVER BUDGET by ${kb(total - budget)}.`)
  console.error('Either find what got added to the first-paint chunk, or, if the growth is')
  console.error('intended, re-baseline with `npm run perf:update` and say why in the commit.')
  process.exit(1)
}

if (!asJson) console.log(delta < 0 ? '\nUnder baseline. Consider re-baselining to lock the win in.' : '\nWithin budget.')
