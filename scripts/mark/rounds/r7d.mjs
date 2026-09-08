// Round 7d — eight octopus suckers arranged into the Ō, with a really thin dash.
//
//   node scripts/mark/rounds/r7d.mjs /tmp/r7d.html /tmp/r7d-sweeps.html /tmp/r7d-tabs.html
//   node scripts/mark/shoot.mjs /tmp/r7d.html /tmp/r7d-top.png --rows 0,4
//   node scripts/mark/shoot.mjs /tmp/r7d.html /tmp/r7d-bot.png --rows 5,9
//   node scripts/mark/shoot.mjs /tmp/r7d-tabs.html /tmp/r7d-tabs.png --size 1010x820
//
// The family is settled (7c: the O is what the arms leave). What is open is the
// sucker treatment. Two questions have to be answered separately, because they
// pull against each other:
//
//   large — is it recognisably a *sucker*, a rim with the aperture punched out,
//           rather than a dot or a washer?
//   16px  — do eight dots still add up to an O?
//
// The aperture closes below roughly 3 units on this grid, so at 16px every
// concept here is dots and the small read is decided by whether the dots close
// the ring. That is why the touching / bridged / solid variants are in the set.

import { writeFileSync } from 'node:fs'
import { arm, bar, wrap, suckers, dent, polar, INK, d2r } from '../lib.mjs'

const C = { x: 50, y: 56 }
const OUT = 39                                  // ink reaches this far from C
const DASH = { cx: 50, cy: 8.5, w: 42, h: 3 }   // "really thin": 3, was 5 in 7c
const dash = (h = DASH.h, w = DASH.w) => bar(DASH.cx, DASH.cy, w, h)

const N = 8
const STEP = 360 / N
const BASE = 90                                 // sucker 0 sits at the bottom
const SIN = Math.sin(d2r(STEP / 2))             // half-chord factor for 8 on a ring

/** The eight angles, walking up both sides from the bottom. */
const angles = (start = BASE) => Array.from({ length: N }, (_, i) => start + i * STEP)

/**
 * Eight suckers on a ring. `amp` grades the radius by height — positive means
 * biggest at the bottom, shrinking towards the top, the way suckers shrink
 * along a real arm. `ring` may be a number or a function of each sucker's
 * radius, so a graded ring can hold its outer edge on one circle instead of
 * wobbling.
 */
const ringOf = ({ ring, r, amp = 0, hole = 0.5, squash = 1, lean = false, start = BASE }) =>
  angles(start).map(th => {
    const rr = r + amp * Math.sin(d2r(th))
    const R = typeof ring === 'function' ? ring(rr) : ring
    const p = polar(C.x, C.y, R, th)
    return { x: p.x, y: p.y, r: rr, hole, squash, deg: lean ? th - 90 : 0 }
  })

const c = []
const add = (id, name, note, body) => c.push({ id, name, note, body })

// ---------- E1 · the plain statement ----------
// Eight equal suckers, even spacing, aperture at half the rim. Everything else
// in the round is a departure from this one, so it has to be drawn.
add('E1', 'Eight equal, evenly spaced',
  'The idea stated plainly: one size, one spacing, aperture at half the rim.',
  suckers(ringOf({ ring: OUT - 8.6, r: 8.6 })) + dash())

// ---------- E2 · break the dial ----------
// Even spacing plus one size is a combination lock. Grading the size by height
// is the cheapest thing that stops it, and it is also what a real arm does.
add('E2', 'Graded, biggest at the bottom',
  'Size follows height, so the ring stops being a dial and starts being an arm.',
  suckers(ringOf({ ring: rr => OUT - rr, r: 8.6, amp: 2.4 })) + dash())

// ---------- E3 · the hedge: close the ring ----------
// At r = R·sin(180/n) the rims meet exactly. Painted flat — every rim, then
// every aperture — so the silhouette merges while all eight holes survive.
add('E3', 'Just touching',
  'Rims meet, so at 16px it is a solid ring and at 128px it is still eight suckers.',
  suckers(ringOf({ ring: OUT / (1 + SIN), r: (OUT * SIN) / (1 + SIN) })) + dash())

// ---------- E4 · a chain, not a set ----------
// The same ring drawn stacked: each sucker is painted complete before the next,
// so it crops the one beneath. That gives the ring a direction of travel.
add('E4', 'Overlapping chain',
  'Each sucker crops the one before it, so the ring runs in a direction.',
  suckers(ringOf({ ring: 27, r: 12 }), 'stack') + dash())

// ---------- E5 · what the animal actually has ----------
// Octopus vulgaris has two rows of suckers. Eight of them, four to a row,
// staggered by half a step.
add('E5', 'Two staggered rows',
  'Four out, four in, offset half a step — a real arm has two rows, not one.',
  suckers(angles(BASE).map((th, i) => {
    const p = polar(C.x, C.y, i % 2 ? 26.5 : 32, th)
    return { x: p.x, y: p.y, r: i % 2 ? 8.4 : 7 }
  })) + dash())

// ---------- E6 · the other hedge: bridge them ----------
// A band narrower than the suckers, hidden under them and showing only in the
// gaps. The O closes at 16px without the suckers merging at 128px.
add('E6', 'On a bridging arm',
  'A thin arm runs under the ring and shows only between the suckers.',
  `<circle cx="${C.x}" cy="${C.y}" r="30.4" fill="none" stroke="${INK}" stroke-width="7.4"/>` +
  suckers(ringOf({ ring: 30.4, r: 8.6 })) + dash())

// ---------- E7 · lean into the curve ----------
// Foreshortened radially and turned so the short axis points out of the ring:
// the arm is curling away from the viewer. It costs radial thickness, which
// buys a bigger counter — the one variation that helps 16px for free.
add('E7', 'Foreshortened, leaning',
  'Squashed along the radius and rotated to the curve, as if the arm turns away.',
  suckers(ringOf({ ring: OUT - 9.6 * 0.66, r: 9.6, squash: 0.66, lean: true })) + dash())

// ---------- E8 · both defences at once ----------
// The likely winner if either hedge is needed: graded (E2) *and* dense enough to
// touch near the base (E3), so it closes at the bottom and opens at the top.
add('E8', 'Graded and touching',
  'Grading plus contact: dense at the base like a real arm, open at the top.',
  suckers(ringOf({ ring: 28, r: 10.6, amp: 1.7 })) + dash())

// ---------- E9 · the bridge back to 7c's winner ----------
// One tapering arm wrapped full circle, with the suckers riding proud of its
// inner edge so their rims break into the counter.
add('E9', 'One tapering arm, suckers proud',
  "7c's winner rebuilt with real suckers overhanging the inner edge of the arm.",
  // 7c's D9 geometry unchanged — constant radius, seam at the top, taper all the
  // way round — so the only variable is the suckers. Two things it cost to
  // learn: easing the radius inward turns the mark into a spiral, which 7c
  // already killed as an ammonite and an @; and moving the seam to the bottom
  // does not help, it just puts the blunt base where the eye lands first.
  (() => {
    const R = 31, wb = 15, wt = 3.2, exp = 1.15, TH0 = -95, SWEEP = 345
    const wAt = t => wt + (wb - wt) * Math.pow(1 - t, exp)
    const list = Array.from({ length: N }, (_, i) => {
      const t = (i + 0.6) / (N + 0.8)
      const p = polar(C.x, C.y, R - 2, TH0 + SWEEP * t)
      return { x: p.x, y: p.y, r: wAt(t) / 2 + 2.6 }
    })
    return arm(wrap({ cx: C.x, cy: C.y, r0: R, th0: TH0, th1: TH0 + SWEEP }), wb, wt, exp) + suckers(list)
  })() + dash())

// ---------- E10 · the far hedge ----------
// The O is a solid annulus and the suckers are dents pressed into it.
// Unbreakable at 16px, and the least octopus of the ten — the honest far end.
add('E10', 'Dented into a solid ring',
  'The ring is solid and the suckers are pressed into it, so the O cannot break.',
  `<path d="M11,56A39,39 0 1,0 89,56A39,39 0 1,0 11,56ZM30,56A20,20 0 1,1 70,56A20,20 0 1,1 30,56Z" ` +
  `fill="${INK}" fill-rule="evenodd"/>` +
  angles(BASE).map(th => dent({ ...polar(C.x, C.y, 29, th), r: 7.4 })).join('') + dash())

writeFileSync(process.argv[2], contactSheet())
console.log('wrote', process.argv[2], c.length, 'concepts')

/** sheet() from the library, plus 24px — the size an Android tab actually uses. */
function contactSheet() {
  const svg = (body, size) => `<svg viewBox="0 0 100 100" width="${size}" height="${size}">${body}</svg>`
  const light = [128, 64, 32, 24, 16]
  const dark = light
  const rows = c.map(x => `
    <div class="row">
      <div class="meta"><b>${x.id}</b> ${x.name}<span>${x.note}</span></div>
      <div class="strip light">${light.map(s => `<div class="cell"><div class="art">${svg(x.body, s)}</div><i>${s}</i></div>`).join('')}</div>
      <div class="strip dark">${dark.map(s => `<div class="cell"><div class="art">${svg(x.body, s)}</div><i>${s}</i></div>`).join('')}</div>
    </div>`).join('')

  return `<meta charset="utf-8">
<style>
  :root { --ink:#1a1a1a; --paper:#faf9f7 }
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
<h1>Round 7d — eight suckers forming the Ō <span>&nbsp;· dash 3 units · 128 / 64 / 32 / 24 / 16 px</span></h1>
${rows}
`
}

// ---------- the two sweeps ----------
// One variable moved across one concept, which is the only way to see where a
// threshold sits. These answer questions the ten concepts cannot.
if (process.argv[3]) {
  const ap = [0.3, 0.4, 0.5, 0.62, 0.72].map(h => ({
    id: h.toFixed(2),
    name: h === 0.5 ? 'used above' : '',
    body: suckers(ringOf({ ring: OUT - 8.6, r: 8.6, hole: h })) + dash(),
  }))
  const dh = [5, 4, 3, 2.5, 2].map(h => ({
    id: `${h}u`,
    name: h === 3 ? 'used above' : h === 5 ? "7c's dash" : '',
    body: suckers(ringOf({ ring: rr => OUT - rr, r: 8.6, amp: 2.4 })) + dash(h),
  }))

  const svg = (b, s) => `<svg viewBox="0 0 100 100" width="${s}" height="${s}">${b}</svg>`
  const band = list => list.map(x => `
    <div class="col"><div class="art">${[128, 48, 24, 16].map(s => svg(x.body, s)).join('')}</div>
    <i><b>${x.id}</b> ${x.name}</i></div>`).join('')

  writeFileSync(process.argv[3], `<meta charset="utf-8">
<style>
  :root { --ink:#1a1a1a; --paper:#faf9f7 }
  body { margin:0; background:#fff; font:13px/1.4 ui-sans-serif,system-ui,sans-serif; color:#1a1a1a }
  h1 { font-size:15px; margin:20px 20px 2px } h1 span { font-weight:400; color:#8f8f8f }
  p { margin:0 20px 10px; color:#8f8f8f; font-size:11.5px; max-width:760px }
  .band { display:flex; gap:22px; padding:14px 20px; align-items:flex-end }
  .light { background:#faf9f7 } .dark { background:#1f1f1f; --ink:#fff; --paper:#1f1f1f }
  .col { display:flex; flex-direction:column; align-items:center; gap:6px }
  .art { display:flex; align-items:flex-end; gap:12px; height:134px }
  i { font-style:normal; font-size:10px; color:#8f8f8f }
  .lab { font-size:11px; color:#8f8f8f; margin:12px 20px 0 }
</style>
<h1>Sweep 1 — where a sucker stops being a sucker <span>&nbsp;· E1, aperture at 0.30 / 0.40 / 0.50 / 0.62 / 0.72 of the rim</span></h1>
<p>Each column is 128, 48, 24 and 16 px. Too small an aperture is a dot with a
speck in it; too large and the rim is a wire and the thing is a washer.</p>
<div class="lab">Light</div><div class="band light">${band(ap)}</div>
<div class="lab">Dark</div><div class="band dark">${band(ap)}</div>
<h1>Sweep 2 — how thin the dash can go <span>&nbsp;· E2, macron at 5 / 4 / 3 / 2.5 / 2 units</span></h1>
<p>Below about 6 units the bar is under one device pixel at 16 px, so it is
painted grey rather than black: it goes quiet, it does not vanish. The question
is where quiet becomes absent.</p>
<div class="lab">Light</div><div class="band light">${band(dh)}</div>
<div class="lab">Dark</div><div class="band dark">${band(dh)}</div>
`)
  console.log('wrote', process.argv[3])
}

// ---------- the tab strip ----------
// The only view that decides anything: true 16px in real browser chrome.
if (process.argv[4]) {
  const tab = (x, active) => `
    <div class="tab${active ? ' on' : ''}">
      <svg viewBox="0 0 100 100" width="16" height="16">${x.body}</svg>
      <span>Tekiō</span><em>×</em>
    </div>`
  const strip = list =>
    `<div class="bar">${list.map((x, i) => tab(x, i === 0)).join('')}</div><div class="page"></div>` +
    `<div class="ids">${list.map(x => `<div>${x.id} · ${x.name}</div>`).join('')}</div>`

  writeFileSync(process.argv[4], `<meta charset="utf-8">
<style>
  :root { --ink:#1a1a1a; --paper:#faf9f7 }
  body { margin:0; background:#fff; font:13px/1.4 ui-sans-serif,system-ui,sans-serif }
  h1 { font-size:15px; margin:18px 20px 8px }
  .lab { font-size:11px; color:#8f8f8f; margin:14px 20px 4px }
  .bar { display:flex; gap:2px; padding:8px 10px 0; background:#dee1e6 }
  .tab { display:flex; align-items:center; gap:8px; width:176px; padding:8px 10px;
         background:#f1f3f4; border-radius:8px 8px 0 0; font-size:12px; color:#3c4043 }
  .tab.on { background:#fff }
  .tab span { flex:1; white-space:nowrap }
  .tab em { font-style:normal; color:#9aa0a6 }
  .page { height:20px; background:#fff; border-bottom:1px solid #dee1e6 }
  .dk { --ink:#ffffff; --paper:#292a2d }
  .dk .bar { background:#202124 } .dk .tab { background:#292a2d; color:#e8eaed }
  .dk .tab.on { background:#35363a }
  .dk .page { background:#292a2d; border-color:#202124 }
  .ids { display:flex; gap:2px; padding:4px 10px 0; font-size:9.5px; color:#8f8f8f }
  .ids div { width:176px; padding-left:10px }
</style>
<h1>Round 7d at true 16px — where a favicon is actually decided</h1>
<div class="lab">Light tab bar · E1–E5</div><div>${strip(c.slice(0, 5))}</div>
<div class="lab">Dark tab bar · E1–E5</div><div class="dk">${strip(c.slice(0, 5))}</div>
<div class="lab">Light tab bar · E6–E10</div><div>${strip(c.slice(5))}</div>
<div class="lab">Dark tab bar · E6–E10</div><div class="dk">${strip(c.slice(5))}</div>
`)
  console.log('wrote', process.argv[4])
}
