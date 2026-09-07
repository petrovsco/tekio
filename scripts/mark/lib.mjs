// Drawing helpers for the brand mark rounds.
//
// The one idea worth keeping: arms are *generated*, not hand-drawn. Sample a
// centreline, offset it left and right by a half-width that tapers along the
// length, then run a closed Catmull-Rom spline through the resulting outline.
// Guessing bezier handles by hand is what made the early rounds collapse into
// blobs; this keeps a curl clean at 16px and at 512px from the same numbers.
//
// Everything is drawn on a 0–100 grid and coloured with two CSS variables, so a
// single body string renders correctly on a light and a dark ground.

export const f = n => Number(n.toFixed(2))
export const d2r = d => (d * Math.PI) / 180

export const INK = 'var(--ink)'
export const PAPER = 'var(--paper)'

// ---------- curves ----------

/** Closed Catmull-Rom through `p`, emitted as cubic beziers. */
export function smoothClosed(p) {
  const n = p.length
  const at = i => p[((i % n) + n) % n]
  let d = `M${f(p[0].x)},${f(p[0].y)}`
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2)
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    d += `C${f(c1.x)},${f(c1.y)} ${f(c2.x)},${f(c2.y)} ${f(p2.x)},${f(p2.y)}`
  }
  return d + 'Z'
}

/**
 * A tapering ribbon around a centreline: the outline of an arm.
 * Width eases as w(t) = wTip + (wBase − wTip)·(1−t)^exp.
 *
 * The two interpolated points across the flat base are not decoration — without
 * them Catmull-Rom overshoots the right-angle corner where the outline turns
 * back on itself, and the arm grows a spur at its root.
 */
export function ribbon(pts, wBase, wTip, exp = 1.15) {
  const n = pts.length
  const L = [], R = []
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(n - 1, i + 1)]
    let tx = b.x - a.x, ty = b.y - a.y
    const m = Math.hypot(tx, ty) || 1
    tx /= m; ty /= m
    const nx = -ty, ny = tx
    const t = i / (n - 1)
    const w = (wTip + (wBase - wTip) * Math.pow(1 - t, exp)) / 2
    L.push({ x: pts[i].x + nx * w, y: pts[i].y + ny * w })
    R.push({ x: pts[i].x - nx * w, y: pts[i].y - ny * w })
  }
  const base = []
  for (let k = 1; k <= 2; k++) {
    const u = k / 3
    base.push({ x: R[0].x + (L[0].x - R[0].x) * u, y: R[0].y + (L[0].y - R[0].y) * u })
  }
  return smoothClosed(L.concat(R.slice().reverse()).concat(base))
}

/**
 * An arc that holds its radius, then tightens into a curl near the tip —
 * an octopus arm wrapping and then hooking. `rEnd` is the tip radius as a
 * fraction of R: 1 keeps the tip on the circle, below 1 hooks it inward,
 * above 1 flicks it outward.
 */
export function arcCurl({ cx, cy, R, th0, th1, tightenAt = 0.55, rEnd = 0.4, n = 110 }) {
  const a = d2r(th0), b = d2r(th1)
  const pts = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const th = a + (b - a) * t
    let k = 0
    if (t > tightenAt) {
      const u = (t - tightenAt) / (1 - tightenAt)
      k = u * u * (3 - 2 * u)
    }
    const r = R * (1 - k * (1 - rEnd))
    pts.push({ x: cx + r * Math.cos(th), y: cy + r * Math.sin(th) })
  }
  return pts
}

/** A centreline that spirals: the radius sweeps r0 → r1 as the angle turns. */
export const wrap = ({ cx, cy, r0, r1 = r0, th0, th1, n = 170 }) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n
    const th = d2r(th0 + (th1 - th0) * t)
    const r = r0 + (r1 - r0) * t
    return { x: cx + r * Math.cos(th), y: cy + r * Math.sin(th) }
  })

/** Cubic bezier sampled into a point array, for hand-placed centrelines. */
export function bez(p0, p1, p2, p3, n = 70) {
  const pts = []
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t
    pts.push({
      x: u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      y: u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    })
  }
  return pts
}

export const along = (pts, t) => pts[Math.round(t * (pts.length - 1))]
export const polar = (cx, cy, r, deg) => ({ x: cx + r * Math.cos(d2r(deg)), y: cy + r * Math.sin(d2r(deg)) })

// ---------- shapes ----------

export const arm = (pts, wb, wt, exp) => `<path d="${ribbon(pts, wb, wt, exp)}" fill="${INK}"/>`

/** The macron. `h` is its whole thickness; rx rounds the ends into a dash. */
export const bar = (cx, cy, w, h, round = true) =>
  `<rect x="${f(cx - w / 2)}" y="${f(cy - h / 2)}" width="${f(w)}" height="${f(h)}" ` +
  `rx="${round ? f(h / 2) : 0}" fill="${INK}"/>`

/** A macron drawn with the same brush as the arms: thick left, thin right. */
export const brushBar = (x0, x1, y, wl, wr) =>
  arm([...Array(40)].map((_, i) => {
    const t = i / 39
    return { x: x0 + (x1 - x0) * t, y: y + Math.sin(t * Math.PI) * -1.4 }
  }), wl, wr, 1)

export const eyes = (cx, cy, dx, r) =>
  `<circle cx="${f(cx - dx)}" cy="${f(cy)}" r="${f(r)}" fill="${PAPER}"/>` +
  `<circle cx="${f(cx + dx)}" cy="${f(cy)}" r="${f(r)}" fill="${PAPER}"/>`

/**
 * One octopus sucker, face-on: a solid rim with the aperture punched out of it.
 * `hole` is the aperture as a fraction of the outer radius — on a real sucker
 * the opening is roughly half the rim, which is what makes it read as a sucker
 * rather than as a dot or a wheel.
 *
 * `squash` foreshortens it into an ellipse (1 = face-on, ~0.6 = seen at an
 * angle) and `deg` turns the short axis, so a ring of suckers can lean into
 * the curve it sits on.
 *
 * Be honest about the size at which this stops working: below roughly 3 units
 * on the 100 grid the aperture closes up and the sucker is just a dot. That is
 * a large-size detail, and any mark built from suckers still has to read at
 * 16px as whatever the dots add up to.
 */
const ell = (x, y, rx, ry, fill, deg) =>
  `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"` +
  (deg ? ` transform="rotate(${f(deg)} ${f(x)} ${f(y)})"` : '') + '/>'

export const sucker = ({ x, y, r, hole = 0.5, squash = 1, deg = 0 }) =>
  ell(x, y, r, r * squash, INK, deg) + ell(x, y, r * hole, r * hole * squash, PAPER, deg)

/**
 * A list of suckers drawn as one group. `mode` is what overlap means:
 *
 * - `flat` paints every rim, then every aperture. Suckers that touch or overlap
 *   merge into one silhouette and no rim ever fills in a neighbour's hole.
 * - `stack` paints each sucker complete before starting the next, so a later
 *   one crops the one beneath it and the ring reads as a chain running in a
 *   direction rather than as a set of equals.
 *
 * The difference is invisible while they are apart and decides the whole read
 * once they are not.
 */
export const suckers = (list, mode = 'flat') =>
  mode === 'stack'
    ? list.map(s => sucker(s)).join('')
    : list.map(s => ell(s.x, s.y, s.r, s.r * (s.squash ?? 1), INK, s.deg)).join('') +
      list.map(s => ell(s.x, s.y, s.r * (s.hole ?? 0.5), s.r * (s.hole ?? 0.5) * (s.squash ?? 1), PAPER, s.deg)).join('')

/**
 * A sucker seen as a dent in a solid ink field: the rim shows as a paper gap
 * and the aperture stays dark, which is what an embossed sucker actually looks
 * like. Only useful on ink; on paper it is a bullseye.
 */
export const dent = ({ x, y, r, rim = 0.58 }) =>
  ell(x, y, r, r, PAPER) + ell(x, y, r * rim, r * rim, INK)

// ---------- contact sheet ----------

/**
 * The review artefact: every concept at every size it will really be used at,
 * on a light and a dark ground. 16 is the size that decides a favicon; the
 * large ones only say whether the idea is nice.
 */
export function sheet({ title, sub, concepts, sizes = [128, 64, 32, 24, 16], dark = [128, 32, 16] }) {
  const svg = (body, size) => `<svg viewBox="0 0 100 100" width="${size}" height="${size}">${body}</svg>`
  const rows = concepts.map(c => `
    <div class="row">
      <div class="meta"><b>${c.id}</b> ${c.name}<span>${c.note}</span></div>
      <div class="strip light">${sizes.map(s => `<div class="cell"><div class="art">${svg(c.body, s)}</div><i>${s}</i></div>`).join('')}</div>
      <div class="strip dark">${dark.map(s => `<div class="cell"><div class="art">${svg(c.body, s)}</div><i>${s}</i></div>`).join('')}</div>
    </div>`).join('')

  return `<meta charset="utf-8">
<style>
  :root { --ink:#1a1a1a; --paper:#faf9f7 }
  body { margin:0; background:#fff; font:13px/1.4 ui-sans-serif,system-ui,sans-serif; color:#1a1a1a }
  h1 { font-size:15px; margin:18px 20px 4px; letter-spacing:.02em }
  h1 span { font-weight:400; color:#8f8f8f }
  .row { display:grid; grid-template-columns:230px 1fr 240px; gap:14px; align-items:center;
         padding:12px 20px; border-top:1px solid #ececea }
  .meta b { font-size:13px }
  .meta span { display:block; color:#8f8f8f; font-size:11.5px; margin-top:3px }
  .strip { display:flex; align-items:center; gap:16px; padding:12px 14px; border-radius:8px }
  .light { background:#faf9f7 }
  .dark  { background:#1f1f1f; --ink:#ffffff; --paper:#1f1f1f }
  .cell { display:flex; flex-direction:column; align-items:center; gap:5px }
  .art { display:flex; align-items:center; justify-content:center; height:130px }
  i { font-style:normal; font-size:9.5px; color:#8f8f8f }
</style>
<h1>${title} <span>&nbsp;· ${sub}</span></h1>
${rows}
`
}

/** A mock browser tab strip — the finalists at true 16px, where it is decided. */
export function tabStrip({ title, concepts }) {
  const tab = (x, active) => `
    <div class="tab${active ? ' on' : ''}">
      <svg viewBox="0 0 100 100" width="16" height="16">${x.body}</svg>
      <span>Tekiō</span><em>×</em>
    </div>`
  const strip = () =>
    `<div class="bar">${concepts.map((x, i) => tab(x, i === 0)).join('')}</div><div class="page"></div>` +
    `<div class="ids">${concepts.map(x => `<div>${x.id}</div>`).join('')}</div>`

  return `<meta charset="utf-8">
<style>
  :root { --ink:#1a1a1a; --paper:#faf9f7 }
  body { margin:0; background:#fff; font:13px/1.4 ui-sans-serif,system-ui,sans-serif }
  h1 { font-size:15px; margin:18px 20px 10px }
  .lab { font-size:11px; color:#8f8f8f; margin:16px 20px 4px }
  .bar { display:flex; gap:2px; padding:8px 10px 0; background:#dee1e6 }
  .tab { display:flex; align-items:center; gap:8px; width:190px; padding:8px 10px;
         background:#f1f3f4; border-radius:8px 8px 0 0; font-size:12px; color:#3c4043 }
  .tab.on { background:#fff }
  .tab span { flex:1; white-space:nowrap }
  .tab em { font-style:normal; color:#9aa0a6 }
  .page { height:26px; background:#fff; border-bottom:1px solid #dee1e6 }
  .dk { --ink:#ffffff; --paper:#292a2d }
  .dk .bar { background:#202124 } .dk .tab { background:#292a2d; color:#e8eaed }
  .dk .tab.on { background:#35363a }
  .dk .page { background:#292a2d; border-color:#202124 }
  .ids { display:flex; gap:2px; padding:4px 10px 0; font-size:10px; color:#8f8f8f }
  .ids div { width:190px; padding-left:10px }
</style>
<h1>${title}</h1>
<div class="lab">Light tab bar</div><div>${strip()}</div>
<div class="lab">Dark tab bar</div><div class="dk">${strip()}</div>
`
}
