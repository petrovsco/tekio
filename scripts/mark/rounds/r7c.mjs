// Round 7c — "the O is the gap the arms leave". Kept as the worked example of
// how a round is written; run it to see the shape of a sheet.
//
//   node scripts/mark/rounds/r7c.mjs /tmp/r7c.html /tmp/r7c-dash.html
//   node scripts/mark/shoot.mjs /tmp/r7c.html /tmp/top.png --rows 0,5
//
// Why the first attempt (7a's D1) failed: eight arcs spanning 46° on a 43° step
// overlapped each other, and every tip curled inward into the counter, so the
// ring had no gaps and the hole filled in. Here span < step, the tips stay on
// the ring or flick outward, and the counter is a clean 41-unit circle.

import { writeFileSync } from 'node:fs'
import { arm, bar, arcCurl, wrap, INK, PAPER, sheet, f, d2r } from '../lib.mjs'

const C = { x: 50, y: 56 }
const R = 26                                   // arm centreline radius
const DASH = { cx: 50, cy: 10.5, w: 40, h: 5 } // bottom edge y = 13
const dash = (h = DASH.h, w = DASH.w) => bar(DASH.cx, DASH.cy, w, h)

const ringArm = (a0, span, o = {}) => {
  const { r = R, wb = 11, wt = 2.2, rEnd = 1, tightenAt = 0.55, exp = 1.15 } = o
  return arm(arcCurl({ cx: C.x, cy: C.y, R: r, th0: a0, th1: a0 + span, tightenAt, rEnd }), wb, wt, exp)
}

// n arms evenly spaced, each spanning `span` degrees — the gap is step − span.
const fan = (n, span, o = {}) => {
  const step = 360 / n
  const start = o.start ?? -90 - span / 2
  return Array.from({ length: n }, (_, i) => ringArm(start + i * step, span, o)).join('')
}

// Suckers punched out of the inner edge of a fan.
const suckFan = (n, span, o = {}) => {
  const { r = R, wb = 11, wt = 2.2, k = 3, dot = 1.5, exp = 1.15 } = o
  const step = 360 / n
  const start = o.start ?? -90 - span / 2
  let s = ''
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < k; j++) {
      const t = (j + 0.5) / (k + 0.8)
      const th = d2r(start + i * step + span * t)
      const w = wt + (wb - wt) * Math.pow(1 - t, exp)
      const rr = r - w / 2 + dot + 0.8
      s += `<circle cx="${f(C.x + rr * Math.cos(th))}" cy="${f(C.y + rr * Math.sin(th))}" r="${f(dot)}" fill="${PAPER}"/>`
    }
  }
  return s
}

const wavyArm = (a0, span, o = {}) => {
  const { r = R, amp = 2.6, waves = 1.5, wb = 11, wt = 2.2, n = 100 } = o
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n
    const th = d2r(a0 + span * t)
    const rr = r + amp * Math.sin(t * Math.PI * 2 * waves)
    return { x: C.x + rr * Math.cos(th), y: C.y + rr * Math.sin(th) }
  })
  return arm(pts, wb, wt)
}

const suckLine = (pts, ts, rOf) => ts.map(t => {
  const q = pts[Math.round(t * (pts.length - 1))]
  return `<circle cx="${f(q.x)}" cy="${f(q.y)}" r="${f(rOf(t))}" fill="${PAPER}"/>`
}).join('')

const c = []
const add = (id, name, note, body) => c.push({ id, name, note, body })

add('D2', 'Eight arms, real gaps',
  'D1 rebuilt: span 36° on a 45° step, so no two arms touch and the hole survives.',
  fan(8, 36) + dash())

add('D3', 'Six arms, tips flick outward',
  'Longer arms, and the last third swings away from the centre instead of into it.',
  fan(6, 50, { rEnd: 1.2, tightenAt: 0.6, wb: 12 }) + dash())

add('D4', 'Six arms, suckers on the inner edge',
  'The counter is rimmed with suckers — the octopus signal without a head.',
  fan(6, 50, { wb: 12 }) + suckFan(6, 50, { wb: 12 }) + dash())

add('D5', 'Eight arms with suckers',
  'The same idea at eight. Tests whether the dots survive being that small.',
  fan(8, 36) + suckFan(8, 36, { k: 2, dot: 1.3 }) + dash())

add('D6', 'Five fat arms',
  'Fewest arms, most weight in each. Widest gaps of the set.',
  fan(5, 54, { wb: 14, wt: 2.8 }) + dash())

add('D7', 'One tentacle, 1.1 turns',
  'A single arm spiralling in. The overlap is the point — but a spiral is an ammonite, not an O.',
  arm(wrap({ cx: C.x, cy: C.y, r0: 30, r1: 18, th0: -80, th1: 310 }), 13, 2) + dash())

add('D8', 'Two arms from the top',
  'Both arms leave the dash, sweep down opposite sides and cross at the bottom.',
  arm(arcCurl({ cx: C.x, cy: C.y, R, th0: -96, th1: 108, tightenAt: 0.7, rEnd: 0.72 }), 13, 2.4) +
  arm(arcCurl({ cx: C.x, cy: C.y, R, th0: -84, th1: -276, tightenAt: 0.7, rEnd: 0.72 }), 13, 2.4) +
  dash())

add('D9', 'One tentacle wrapped full circle',
  'The O is one arm: thick where it starts, tapering all the way round, suckers punched along it.',
  (() => {
    const pts = wrap({ cx: C.x, cy: C.y, r0: R, th0: -95, th1: 250 })
    return arm(pts, 14, 3) + suckLine(pts, [0.08, 0.2, 0.32, 0.44, 0.56, 0.68, 0.8], t => 2.6 - 1.7 * t)
  })() + dash())

add('D10', 'Seven arms, alternating length',
  'Long, short, long — breaks the symmetry so it reads as a creature, not a gear.',
  Array.from({ length: 7 }, (_, i) =>
    ringArm(-90 - 25 + i * (360 / 7), i % 2 ? 30 : 46, { wb: i % 2 ? 10 : 12 })).join('') + dash())

add('D11', 'Six arms with a head bump',
  'A small mantle fills the top gap, so the ring has somewhere to hang from.',
  fan(6, 50, { start: -90 - 50 / 2 + 30 }) +
  `<ellipse cx="50" cy="28.5" rx="13" ry="9.5" fill="${INK}"/>` + dash())

add('D12', 'Six wavy arms',
  'Each centreline undulates across the ring — the outline never repeats itself.',
  Array.from({ length: 6 }, (_, i) => wavyArm(-90 - 25 + i * 60, 50, { wb: 11.5 })).join('') + dash())

writeFileSync(process.argv[2], sheet({
  title: 'Round 7c — the O is the gap the arms leave',
  sub: 'family D rebuilt, thinner dash (5 units, was 7)',
  concepts: c,
}))
console.log('wrote', process.argv[2], c.length, 'concepts')

// ---------- what the dash weight costs ----------
if (process.argv[3]) {
  const dashRow = [9, 7, 6, 5, 4].map(h => ({
    id: `h${h}`,
    name: h === 5 ? 'used above' : h === 7 ? "D1's weight" : h === 9 ? 'family B' : '',
    body: fan(6, 50, { wb: 12 }) + suckFan(6, 50, { wb: 12 }) + dash(h),
  }))
  const svg = (b, s) => `<svg viewBox="0 0 100 100" width="${s}" height="${s}">${b}</svg>`
  const strip = list => list.map(x => `
    <div class="col"><div class="art">${[128, 32, 16].map(s => svg(x.body, s)).join('')}</div>
    <i><b>${x.id}</b> ${x.name}</i></div>`).join('')

  writeFileSync(process.argv[3], `<meta charset="utf-8">
<style>
  :root { --ink:#1a1a1a; --paper:#faf9f7 }
  body { margin:0; background:#fff; font:13px/1.4 ui-sans-serif,system-ui,sans-serif; color:#1a1a1a }
  h1 { font-size:15px; margin:18px 20px 2px } h1 span { font-weight:400; color:#8f8f8f }
  p { margin:0 20px 12px; color:#8f8f8f; font-size:11.5px; max-width:720px }
  .band { display:flex; gap:26px; padding:16px 20px; align-items:flex-end }
  .light { background:#faf9f7 } .dark { background:#1f1f1f; --ink:#fff; --paper:#1f1f1f }
  .col { display:flex; flex-direction:column; align-items:center; gap:6px }
  .art { display:flex; align-items:flex-end; gap:14px; height:132px }
  i { font-style:normal; font-size:10px; color:#8f8f8f }
  .lab { font-size:11px; color:#8f8f8f; margin:14px 20px 0 }
</style>
<h1>What the thinner dash costs <span>&nbsp;· same mark, macron at 9 / 7 / 6 / 5 / 4 units</span></h1>
<p>Each column shows 128, 32 and 16 px. Below about 6 units the bar is under one
device pixel at 16 px, so the browser paints it grey instead of black — it does not
disappear, it goes quiet.</p>
<div class="lab">Light</div><div class="band light">${strip(dashRow)}</div>
<div class="lab">Dark</div><div class="band dark">${strip(dashRow)}</div>
`)
  console.log('wrote', process.argv[3])
}
