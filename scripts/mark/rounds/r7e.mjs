// Round 7e — E9 made smooth, and the accent tested on it.
//
//   node scripts/mark/rounds/r7e.mjs /tmp/r7e.html /tmp/r7e-tabs.html /tmp/r7e-big.html
//   node scripts/mark/shoot.mjs /tmp/r7e.html /tmp/r7e-a.png --rows 0,4
//   node scripts/mark/shoot.mjs /tmp/r7e.html /tmp/r7e-b.png --rows 5,9
//   node scripts/mark/shoot.mjs /tmp/r7e.html /tmp/r7e-c.png --rows 10,13
//   node scripts/mark/shoot.mjs /tmp/r7e-tabs.html /tmp/r7e-tabs.png --size 1010x460
//   node scripts/mark/shoot.mjs /tmp/r7e-big.html /tmp/r7e-big.png --size 840x1560 --scale 2
//
// Peter's direction, 2026-09-07: take 7d's E9 — the best octopus on that sheet
// — and make it smoother and less sharp, and try the app's accent on it.
//
// Row 0 is E9 unchanged, so every later row is measured against the thing it
// improves rather than against a memory of it. Five hard edges, cheapest first:
//
//   1. the base is a flat chop — ribbon() closes its outline with a straight
//      chord, and that chord lands at the top where the eye arrives first;
//   2. the taper sheds width fast and leaves a needle at the tip;
//   3. the suckers ride proud of the inner edge, so the counter is scalloped
//      and the scallops turn to noise below 32px;
//   4. the seam is a break, and 7d proved a broken ring is not a letter at
//      16px, so closing it is a smoothness fix *and* the small-size fix;
//   5. the outer edge still steps wherever the arm changes width — 15 units at
//      the root against 5 at the tip is a 5-unit drop in the silhouette.
//
// 5 is what the last two families are about. Pinning the centreline so it
// rides outward exactly as fast as the arm thins puts the whole taper on the
// inside and leaves a true circle outside (family D). That is how a
// calligraphic O is drawn. But a ribbon is an open shape with two ends, so
// wrapping one into a ring still leaves a cusp where the outline meets itself,
// and at 330px the cusp is a visible nick — see G6. Family E therefore stops
// wrapping an arm and draws the thing it was trying to become: a circle with a
// varying counter, closed by construction, with no seam to nick.
//
// The accent is design-system §1's `#c2410c`, and §1 also says colour carries
// exactly one meaning — action lives here. A brand mark is chrome, not a read,
// so it is not spending that channel; but the moment the icon sits beside the
// app, the accent is no longer unambiguous. The objection is recorded once,
// here, and the three accent rows are drawn anyway.

import { writeFileSync } from 'node:fs'
import { armRound, band, bar, d2r, disc, polar, ribbonAt, ACCENT, INK, PAPER } from '../lib.mjs'

const C = { x: 50, y: 56 }
const OUTER = 39                                // ink reaches this far from C
const WB = 15                                   // width at the root
const R = OUTER - WB / 2                        // 31.5 — constant-radius centreline
const ROOT = -95                                // the root sits at the top
const DASH = { cx: 50, cy: 8.5, w: 42, h: 3 }
const N = 8

const dash = (fill = INK) => bar(DASH.cx, DASH.cy, DASH.w, DASH.h, true, fill)

/** Width law for a wrapped arm: `wt` at the tip easing to `wb` at the root. */
const taper = (wb, wt, exp) => t => wt + (wb - wt) * Math.pow(1 - t, exp)

/** The law every row after F2 uses, so only one variable moves at a time. */
const SOFT = taper(WB, 5.2, 0.85)

const at = (sweep, rAt, t) => polar(C.x, C.y, rAt(t), ROOT + sweep * t)
const line = (sweep, rAt, n = 220) => Array.from({ length: n + 1 }, (_, i) => at(sweep, rAt, i / n))

const flat = () => R                            // constant radius: the outer edge steps

/**
 * The radius law that pins the outer edge to one circle: as the arm thins its
 * centreline rides outward by exactly half the width it lost. This moves
 * *outward* towards the tip — 7d killed easing inward, which curls the tip into
 * the centre and reads as an ammonite. The opposite motion makes a circle.
 */
const locked = wAt => t => OUTER - wAt(t) / 2

/**
 * The width law for a closed loop: taper down over the first stretch, then
 * swell back to full width over the last `run`, so the arm grows into its own
 * root instead of ending against it.
 */
const loop = (wb, wt, exp, run = 0.24) => t => {
  if (t <= 1 - run) {
    const u = t / (1 - run)
    return wt + (wb - wt) * Math.pow(1 - u, exp)
  }
  const u = (t - (1 - run)) / run
  return wt + (wb - wt) * (u * u * (3 - 2 * u))
}

/** Sucker positions along a wrapped arm, pushed off both ends. */
const TS = n => Array.from({ length: n }, (_, i) => (i + 0.6) / (n + 0.8))

/** Suckers as rims on top of the arm; `over` is the overhang past the edge. */
const rims = (sweep, rAt, wAt, { over, inset = 2, hole = 0.5, n = N }) => {
  const list = TS(n).map(t => {
    const p = polar(C.x, C.y, rAt(t) - inset, ROOT + sweep * t)
    return { x: p.x, y: p.y, r: wAt(t) / 2 + over }
  })
  return list.map(s => disc(s, s.r, INK)).join('') +
         list.map(s => disc(s, s.r * hole, PAPER)).join('')
}

/**
 * Suckers as apertures: no rim of their own, just the hole, sitting wholly
 * inside the band so both edges stay unbroken. The rim a sucker needs is the
 * arm itself. `frac` is the hole diameter as a fraction of the band width —
 * 0.5 sits in 7d's 0.45–0.55 window, measured against the band.
 */
const apertures = (sweep, rAt, wAt, { frac = 0.5, n = N, fill = PAPER, span } = {}) =>
  TS(n).map(u => {
    const t = span ? span[0] + (span[1] - span[0]) * u : u
    return disc(at(sweep, rAt, t), (wAt(t) * frac) / 2, fill)
  }).join('')

const c = []
const add = (id, name, note, body, darkAccent) => c.push({ id, name, note, body, darkAccent })

// ---------- row 0 · the thing being fixed ----------
{
  const wAt = taper(WB, 3.2, 1.15)
  add('E9', 'The reference — 7d unchanged',
    'Flat-cut base, suckers proud of the inner edge, 15° gap at the seam.',
    `<path d="${ribbonAt(line(345, flat, 170), wAt)}" fill="${INK}"/>` +
    rims(345, flat, wAt, { over: 2.6 }) + dash())
}

// ---------- family A · smooth the ends ----------

// F1 — one change only: a disc at each end of the centreline, so the straight
// chord at the base is swallowed and the needle at the tip is rounded off.
{
  const wAt = taper(WB, 3.2, 1.15)
  add('F1', 'Rounded caps',
    'The only change from E9: a disc at each end of the arm, so no cut edge is left.',
    armRound(line(345, flat), wAt) + rims(345, flat, wAt, { over: 2.6 }) + dash())
}

// F2 — exp 1.15 sheds width fast and leaves a needle; 0.85 with a fatter tip
// keeps the arm an arm to the end.
add('F2', 'Softer taper',
  'F1 plus a slower taper and a fatter tip: body all the way round, no needle.',
  armRound(line(345, flat), SOFT) + rims(345, flat, SOFT, { over: 2.2 }) + dash())

// ---------- family B · smooth the edge ----------

// F3 — the suckers stop being rims and become apertures inside the band, so
// both edges of the arm are unbroken curves. The arm is the rim.
add('F3', 'Suckers inside the band',
  'Holes punched in the arm instead of rims on top of it — both edges stay clean.',
  armRound(line(345, flat), SOFT) + apertures(345, flat, SOFT) + dash())

// ---------- family C · close the seam ----------

// F5 — swept past a full turn so the thin tip is swallowed by the thick root.
add('F5', 'Tip meets root',
  'Swept past a full turn: the ring closes and the seam becomes a shoulder, not a gap.',
  armRound(line(366, flat), SOFT) + rims(366, flat, SOFT, { over: 2.2 }) + dash())

// F7 — both fixes at once: closed silhouette, unbroken edges, apertures.
add('F7', 'Closed, and suckers inside',
  'F5 plus F3 — clean edges and a ring that never breaks. The step in the outline remains.',
  armRound(line(366, flat), SOFT) + apertures(366, flat, SOFT) + dash())

// ---------- family D · lock the outer edge to a circle ----------

// G2 — a true circle outside, the whole taper inside. One flaw left: the thin
// tip lies against the *outside* of the thick root, so the counter bulges out
// and then stops dead — a notch at 12 o'clock.
{
  const LOCK = locked(SOFT)
  add('G2', 'Outer circle locked, apertures',
    'A true circle outside, the whole taper inside. Leaves a notch where tip meets root.',
    armRound(line(366, LOCK), SOFT) + apertures(366, LOCK, SOFT) + dash())
}

// G6 — the arm swells back into its own root, so there is no seam to hide. The
// best a *wrapped ribbon* can do, and the row that proves it is not enough:
// at 330px there is a nick at the top, because a ribbon has two ends and
// closing one into a ring leaves a cusp where its outline meets itself.
{
  const wAt = loop(WB, 3.4, 0.95)
  const rAt = locked(wAt)
  add('G6', 'Swelled back into its own root',
    'No seam by design — but a wrapped ribbon still cusps where its outline meets itself.',
    armRound(line(360, rAt), wAt) + apertures(360, rAt, wAt, { span: [0.05, 0.76] }) + dash())
}

// ---------- family E · drawn as a band, not a wrapped arm ----------
// band() draws a true outer circle and a closed inner contour, so the
// silhouette is exact and there is no cusp anywhere. The width law is two
// harmonics of the angle, periodic by construction, so it cannot disagree with
// itself at the join. cos φ does the thick-to-thin; sin 2φ skews it, so the
// swell is asymmetric and the shape reads as an arm, not a calligraphic O.

const harm = ({ mid, a1, a2 }) => t => {
  const phi = d2r(360 * t - ROOT)
  return mid + a1 * Math.cos(phi) + a2 * Math.sin(2 * phi)
}

const wAtDeg = (h, th) => h(((th / 360) % 1 + 1) % 1)

/**
 * Suckers on a band, running from `from` to `to` degrees relative to the root.
 * They stop before the waist because 7d's floor is real: at 0.5 of the band an
 * aperture needs about 6 units of band to clear 3 on this grid. Suckers fading
 * out towards the thin end is what an arm does anyway.
 *
 * `warp` bunches them towards the *tip*, which is the direction a real arm
 * packs them and also the only direction that works here: the holes are widest
 * at the root, so crowding them there merges them into a slot. Even spacing is
 * 7d's dial, and a field spread symmetrically either side of the root reads as
 * a crown rather than as an arm with a direction of travel.
 */
const onBand = (h, { n = N, frac = 0.5, from = -26, to = 122, warp = 0.09, fill = PAPER } = {}) =>
  Array.from({ length: n }, (_, i) => {
    const u = (i + 0.5) / n
    const s = u + warp * Math.sin(Math.PI * u)
    const th = ROOT + from + (to - from) * s
    const w = wAtDeg(h, th)
    return disc(polar(C.x, C.y, OUTER - w / 2, th), (w * frac) / 2, fill)
  }).join('')

const H8 = harm({ mid: 9.6, a1: 5.0, a2: 1.4 })
const H9 = harm({ mid: 9.2, a1: 6.0, a2: 1.6 })

// G8 — the answer. A circle by construction, a smooth off-centre counter, and
// eight suckers running one way from the root, shrinking as the arm thins.
add('G8', 'Band, suckers running one way',
  'A true circle, a smooth counter, and a run of suckers with a direction. No edge anywhere.',
  band(C.x, C.y, OUTER, H8) + onBand(H8) + dash())

// G9 — the same with a deeper swell: thicker root, thinner waist, so the arm
// reads harder. The sucker run narrows with it, because the band clears the
// aperture floor over a shorter arc.
add('G9', 'Deeper swell',
  'G8 with more contrast between root and waist, so the arm reads harder.',
  band(C.x, C.y, OUTER, H9) + onBand(H9, { to: 104 }) + dash())

// G10 — six larger apertures survive one size further down than eight.
add('G10', 'Six larger apertures',
  'G8 with six holes instead of eight: each one bigger, so it reads a size lower.',
  band(C.x, C.y, OUTER, H8) + onBand(H8, { n: 6, frac: 0.56, to: 108 }) + dash())

// G11 — the macron is the last hard geometric thing on the mark. Drawn with
// the same brush as the arm and bowed slightly, it stops being a ruler laid on
// top of a creature.
{
  const brush = Array.from({ length: 40 }, (_, i) => {
    const t = i / 39
    return { x: 29 + 42 * t, y: DASH.cy + Math.sin(t * Math.PI) * -0.9 }
  })
  add('G11', 'Brushed macron',
    'G8 with the dash drawn by the same brush: thick left, thin right, bowed.',
    band(C.x, C.y, OUTER, H8) + onBand(H8) + armRound(brush, t => 4.2 - 1.8 * t))
}

// ---------- family F · the accent ----------
// All three sit on G8 so only the colour varies. The dark strip lifts the
// accent to #e2703f, because #c2410c on #1f1f1f is a dark orange on near-black
// and the shipped SVG already switches on prefers-color-scheme.

add('H1', 'Accent macron',
  'The mark in ink, the macron in the accent — colour on the part that is not the letter.',
  band(C.x, C.y, OUTER, H8) + onBand(H8) + dash(ACCENT), '#e2703f')

add('H2', 'Accent apertures',
  'The eight holes filled with the accent instead of paper.',
  band(C.x, C.y, OUTER, H8) + onBand(H8, { fill: ACCENT }) + dash(), '#e2703f')

// H3 — the accent as a stretch of the band itself, drawn as a second band
// clipped to a wedge so it sits inside the same silhouette rather than on it.
{
  const p0 = polar(C.x, C.y, 46, ROOT + 116), p1 = polar(C.x, C.y, 46, ROOT + 320)
  const wedge = `<path d="M${C.x},${C.y}L${p0.x.toFixed(2)},${p0.y.toFixed(2)}` +
    `A46,46 0 1,1 ${p1.x.toFixed(2)},${p1.y.toFixed(2)}Z"/>`
  add('H3', 'Accent arc',
    'The stretch of band past the last sucker in the accent, so the arm fades out in colour.',
    `<defs><clipPath id="h3wedge">${wedge}</clipPath></defs>` +
    band(C.x, C.y, OUTER, H8) +
    `<g clip-path="url(#h3wedge)">${band(C.x, C.y, OUTER, H8, { fill: ACCENT })}</g>` +
    onBand(H8) + dash(), '#e2703f')
}

// ---------- output ----------

const [outSheet, outTabs, outBig] = process.argv.slice(2)
writeFileSync(outSheet, contactSheet())
console.log('wrote', outSheet, c.length, 'concepts')

if (outTabs) {
  writeFileSync(outTabs, tabs(c.filter(x => ['E9', 'F3', 'F7', 'G8', 'G9', 'G10'].includes(x.id))))
  console.log('wrote', outTabs)
}

// The finalists big enough to see a hairline crack in — a seam invisible on
// the contact sheet is still a seam on a 180px app icon.
if (outBig) {
  const picks = c.filter(x => ['G6', 'G8', 'G9', 'G10'].includes(x.id))
  writeFileSync(outBig, `<meta charset="utf-8">
<style>
  :root { --ink:#1a1a1a; --paper:#faf9f7; --accent:#c2410c }
  body { margin:0; background:#fff; font:13px/1.4 ui-sans-serif,system-ui,sans-serif }
  .row { display:flex; gap:20px; padding:16px 20px; align-items:center; border-top:1px solid #ececea }
  .id { width:40px; font-weight:700 }
  .box { padding:16px; border-radius:10px; background:#faf9f7 }
  .dk { background:#1f1f1f; --ink:#ffffff; --paper:#1f1f1f }
</style>
${picks.map(x => `<div class="row"><div class="id">${x.id}</div>
  <div class="box"><svg viewBox="0 0 100 100" width="330" height="330">${x.body}</svg></div>
  <div class="box dk"><svg viewBox="0 0 100 100" width="330" height="330">${x.body}</svg></div>
</div>`).join('')}
`)
  console.log('wrote', outBig)
}

/** The sheet, with a third variable for the accent and a per-row dark override. */
function contactSheet() {
  const svg = (body, size) => `<svg viewBox="0 0 100 100" width="${size}" height="${size}">${body}</svg>`
  const sizes = [128, 64, 32, 24, 16]
  const cell = (x, s) => `<div class="cell"><div class="art">${svg(x.body, s)}</div><i>${s}</i></div>`
  const rows = c.map(x => `
    <div class="row">
      <div class="meta"><b>${x.id}</b> ${x.name}<span>${x.note}</span></div>
      <div class="strip light">${sizes.map(s => cell(x, s)).join('')}</div>
      <div class="strip dark"${x.darkAccent ? ` style="--accent:${x.darkAccent}"` : ''}>${sizes.map(s => cell(x, s)).join('')}</div>
    </div>`).join('')

  return `<meta charset="utf-8">
<style>
  :root { --ink:#1a1a1a; --paper:#faf9f7; --accent:#c2410c }
  body { margin:0; background:#fff; font:13px/1.4 ui-sans-serif,system-ui,sans-serif; color:#1a1a1a }
  h1 { font-size:15px; margin:18px 20px 4px; letter-spacing:.02em }
  h1 span { font-weight:400; color:#8f8f8f }
  .row { display:grid; grid-template-columns:224px 1fr 1fr; gap:14px; align-items:center;
         padding:12px 20px; border-top:1px solid #ececea }
  .meta b { font-size:13px }
  .meta span { display:block; color:#8f8f8f; font-size:11.5px; margin-top:3px }
  .strip { display:flex; align-items:center; gap:15px; padding:12px 14px; border-radius:8px }
  .light { background:#faf9f7 }
  .dark  { background:#1f1f1f; --ink:#ffffff; --paper:#1f1f1f }
  .cell { display:flex; flex-direction:column; align-items:center; gap:5px }
  .art { display:flex; align-items:center; justify-content:center; height:132px }
  i { font-style:normal; font-size:9.5px; color:#8f8f8f }
</style>
<h1>Round 7e — E9 smoothed <span>&nbsp;· 128 / 64 / 32 / 24 / 16 px · accent #c2410c, lifted to #e2703f on dark</span></h1>
${rows}
`
}

/** A tab strip at true 16px — the only size that decides a favicon. */
function tabs(picks) {
  const tab = (x, active) => `
    <div class="tab${active ? ' on' : ''}">
      <svg viewBox="0 0 100 100" width="16" height="16">${x.body}</svg>
      <span>Tekiō</span><em>×</em>
    </div>`
  const strip = () =>
    `<div class="bar">${picks.map((x, i) => tab(x, i === 0)).join('')}</div><div class="page"></div>` +
    `<div class="ids">${picks.map(x => `<div>${x.id}</div>`).join('')}</div>`

  return `<meta charset="utf-8">
<style>
  :root { --ink:#1a1a1a; --paper:#faf9f7; --accent:#c2410c }
  body { margin:0; background:#fff; font:13px/1.4 ui-sans-serif,system-ui,sans-serif }
  h1 { font-size:15px; margin:18px 20px 10px }
  .lab { font-size:11px; color:#8f8f8f; margin:16px 20px 4px }
  .bar { display:flex; gap:2px; padding:8px 10px 0; background:#dee1e6 }
  .tab { display:flex; align-items:center; gap:8px; width:156px; padding:8px 10px;
         background:#f1f3f4; border-radius:8px 8px 0 0; font-size:12px; color:#3c4043 }
  .tab.on { background:#fff }
  .tab span { flex:1; white-space:nowrap }
  .tab em { font-style:normal; color:#9aa0a6 }
  .page { height:26px; background:#fff; border-bottom:1px solid #dee1e6 }
  .dk { --ink:#ffffff; --paper:#292a2d; --accent:#e2703f }
  .dk .bar { background:#202124 } .dk .tab { background:#292a2d; color:#e8eaed }
  .dk .tab.on { background:#35363a }
  .dk .page { background:#292a2d; border-color:#202124 }
  .ids { display:flex; gap:2px; padding:4px 10px 0; font-size:10px; color:#8f8f8f }
  .ids div { width:156px; padding-left:10px }
</style>
<h1>Round 7e — finalists at true 16px</h1>
<div class="lab">Light tab bar</div><div>${strip()}</div>
<div class="lab">Dark tab bar</div><div class="dk">${strip()}</div>
`
}
