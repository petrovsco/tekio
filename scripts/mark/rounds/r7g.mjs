// Round 7g — the real G4, and the tilt.
//
//   node scripts/mark/rounds/r7g.mjs /tmp/r7g.html /tmp/r7g-tabs.html /tmp/r7g-big.html
//   node scripts/mark/shoot.mjs /tmp/r7g.html /tmp/r7g.png
//   node scripts/mark/shoot.mjs /tmp/r7g-tabs.html /tmp/r7g-tabs.png --size 1010x460
//   node scripts/mark/shoot.mjs /tmp/r7g-big.html /tmp/r7g-big.png --size 900x520 --scale 2
//
// Two corrections in one round.
//
// The first is mine. The sheet Peter picked from was a draft of 7e that was
// reorganised before it was committed, so its row ids do not survive in the
// repo. His G4 reads "G2 with the dash drawn by the same brush as the arm",
// and his G2 is titled "Outer circle locked, apertures" — the *wrapped arm*
// pinned to a circle (7e's G2), not the band (7e's G8). v2.0.52 shipped the
// band version, on my judgement that a wrapped arm nicks at app-icon size.
// That was a construction I preferred, not the drawing he chose. This round
// draws the arm he actually picked and lets the nick be a thing he sees.
//
// The second is his: same G4, tilted the way G3 is. G3's note says "the root
// at 1 o'clock, so the weight is not stacked" — the ring turns, the macron
// does not, because a tilted macron is no longer a macron. That is the only
// change T2 makes. T3 adds G3's *other* change (six larger holes) in case the
// direction carried it; T4 turns further, to show which side of 1 o'clock the
// right answer is on.
//
// Everything else is 7e's G2 exactly: outer radius 39, root width 15 easing to
// 5.2 with exponent 0.85, sweep 366°, eight apertures at half the local width.

import { writeFileSync } from 'node:fs'
import { armRound, bar, disc, polar, sheet, tabStrip, INK, PAPER } from '../lib.mjs'

const C = { x: 50, y: 56 }
const OUTER = 39
const WB = 15
const SWEEP = 366
const DASH = { cx: 50, cy: 8.5, w: 42, h: 3 }

/** 7e's SOFT: the width law every G row uses. */
const SOFT = t => 5.2 + (WB - 5.2) * Math.pow(1 - t, 0.85)

/** 7e's `locked`: the centreline rides out as fast as the arm thins, so the
 *  outer edge is one true circle and the whole taper lands in the counter. */
const LOCK = t => OUTER - SOFT(t) / 2

const at = (root, t) => polar(C.x, C.y, LOCK(t), root + SWEEP * t)
const line = (root, n = 220) => Array.from({ length: n + 1 }, (_, i) => at(root, i / n))

/** 7e's aperture spacing: pushed off both ends of the sweep. */
const TS = n => Array.from({ length: n }, (_, i) => (i + 0.6) / (n + 0.8))
const apertures = (root, { frac = 0.5, n = 8 } = {}) =>
  TS(n).map(t => disc(at(root, t), (SOFT(t) * frac) / 2, PAPER)).join('')

/** The flat macron, for the reference row only. */
const dash = () => bar(DASH.cx, DASH.cy, DASH.w, DASH.h, true, INK)

/** G4's macron: the same brush as the arm — thick left, thin right, bowed. */
const brush = () =>
  armRound(
    Array.from({ length: 40 }, (_, i) => {
      const t = i / 39
      return { x: 29 + 42 * t, y: DASH.cy + Math.sin(t * Math.PI) * -0.9 }
    }),
    t => 4.2 - 1.8 * t,
  )

const ring = (root, opts) => armRound(line(root), SOFT) + apertures(root, opts)

const c = []
const add = (id, name, note, body) => c.push({ id, name, note, body })

add('G2', 'The base, unchanged',
  "7e's G2: outer circle locked, whole taper inside, eight punched apertures. Flat macron.",
  ring(-95) + dash())

add('T1', 'G4 — the row Peter picked',
  'G2 with the macron drawn by the same brush: thick left, thin right, bowed. Root at 12.',
  ring(-95) + brush())

add('T2', 'G4 tilted — root at 1 o\'clock',
  'The ask: G3\'s turn applied to G4. The ring rotates 35°, the macron does not.',
  ring(-60) + brush())

add('T3', 'Tilted, six larger holes',
  'T2 plus G3\'s other change — six apertures at 0.58 of the width instead of eight at 0.50.',
  ring(-60, { n: 6, frac: 0.58 }) + brush())

add('T4', 'Tilted further — root at 1:30',
  'T2 turned another 15°, so the step in the counter clears the macron entirely.',
  ring(-45) + brush())

const [out, tabs, big] = process.argv.slice(2)
writeFileSync(out, sheet({
  title: 'Tekiō mark · round 7g',
  sub: 'the wrapped-arm G4, and how far the ring turns',
  concepts: c,
}))
writeFileSync(tabs, tabStrip({ title: 'Round 7g at 16px', concepts: c }))

// The nick lives at app-icon size, so it gets a row of its own at 180 and 330.
writeFileSync(big, `<meta charset="utf-8">
<style>
  :root { --ink:#1a1a1a; --paper:#faf9f7 }
  body { margin:0; background:#fff; font:12px/1.4 ui-sans-serif,system-ui,sans-serif; color:#1a1a1a }
  h1 { font-size:15px; margin:16px 20px 8px }
  .r { display:flex; align-items:center; gap:26px; padding:10px 20px }
  .c { display:flex; flex-direction:column; align-items:center; gap:6px }
  b { font-size:12px } i { font-style:normal; color:#8f8f8f; font-size:10px }
</style>
<h1>Round 7g at app-icon size — 180px, on paper</h1>
<div class="r">${c.map(x => `<div class="c">
  <svg viewBox="0 0 100 100" width="180" height="180" style="background:#faf9f7">${x.body}</svg>
  <b>${x.id}</b></div>`).join('')}</div>
`)
console.log('wrote', out, tabs, big)
