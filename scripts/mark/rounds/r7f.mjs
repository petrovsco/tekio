// Round 7f — the circle drawn with the same brush as the dash.
//
//   node scripts/mark/rounds/r7f.mjs /tmp/r7f.html /tmp/r7f-tabs.html /tmp/r7f-big.html
//   node scripts/mark/shoot.mjs /tmp/r7f.html /tmp/r7f-a.png --rows 0,2
//   node scripts/mark/shoot.mjs /tmp/r7f.html /tmp/r7f-b.png --rows 3,4
//   node scripts/mark/shoot.mjs /tmp/r7f-tabs.html /tmp/r7f-tabs.png --size 1010x400
//   node scripts/mark/shoot.mjs /tmp/r7f-big.html /tmp/r7f-big.png --size 840x1300 --scale 2
//
// Peter's direction, 2026-09-08: of 7e's sheet he kept two — G2, the locked
// outer circle with punched suckers, and G4, the same ring with the brushed
// macron. The macron is the part he wants to grow: if the *dash* is written
// with a brush, the *circle* should be written with the same tool. Five
// proposals, not a library — the size ladder is drawn once a direction is
// picked.
//
// The macron is frozen. Every row carries G4's identical dash, so the only
// variable on the sheet is what the circle is drawn with.
//
// ---------- the finding this round is built on ----------
//
// The obvious move is to give the ring a brush *rhythm* — land loaded, open and
// thin, drive through the bottom, release — because that changing rate is what
// separates a written stroke from a generated one. It was drawn, and it fails,
// for a reason worth keeping:
//
//   With the outer edge locked to a circle, every change of pressure lands in
//   the COUNTER. The counter is the bowl of the letter, so the eye reads it as
//   the shape, not as evidence of a hand. A rhythm there is not handwriting,
//   it is a lumpy hole — two rows read as a potato and a leaf.
//
// So the width law over a locked circle has to be as smooth as the bowl needs
// to be: one slow swell and one slow thinning, no second thought. What makes it
// *calligraphic* is then not the rate of change but WHERE the weight sits and
// how the two edges relate — which is exactly what distinguishes a pen from a
// brush, and gives this sheet its two families:
//
//   · L1, L2 — a broad nib: a flat pen edge held at one angle, so width follows
//     the direction of travel. Two thick lobes, two hairlines, 180° apart. The
//     diagonal stress of a humanist O, and the most literally calligraphic
//     shape available.
//   · L3, L4 — a brush: width follows pressure, so there is one heavy zone and
//     one dry one. That is an ensō — and, by construction, an arm with a
//     direction of travel, which is what the octopus needs.
//
// L5 asks the remaining question: whether the letter itself should lean.
//
// ---------- three shapes this round drew, looked at, and cut ----------
//
//   · A chisel head — the flat cut a real brush leaves when it lands — becomes
//     an ARROWHEAD the moment it sits on a ring. Two rows read as the browser
//     reload icon at every size. A brush head on a circle has to be round,
//     however untrue that is to the reference.
//   · A short lap, the dry tail crossing the loaded head over ~5°, reads as a
//     bite out of the counter. Ink cannot show one stroke crossing another —
//     they merge — so all that survives of the lap is the step, and a step is a
//     defect. The tail has to swell back into its own head over a long arc.
//   · The open ensō confirms 7d at 16px: the gap stops being a gap and becomes
//     a gauge with a needle. It is the honest reference and it is not a letter.

import { writeFileSync } from 'node:fs'
import { armRound, band, d2r, disc, polar, sheet, smoothClosed, tabStrip, INK, PAPER } from '../lib.mjs'

const C = { x: 50, y: 56 }
const OUTER = 39                       // ink reaches this far from C
const PEAK = 15.5                      // the heaviest the stroke ever gets
const THIN = 5.4                       // and the lightest — see the floor below
const HAND = 150                       // 8 o'clock: under the thick end of the dash
const N = 6

// The thin floor is 5.4 rather than a dry hairline on purpose: a 5-unit stroke
// is 0.8 device pixels at 16px, which goes grey but stays a stroke. Under that
// the ring breaks, and 7d established that a broken ring is not a letter.

// ---------- the frozen part ----------

/** G4's dash, unchanged: one brush stroke, thick left, thin right, bowed. */
const MACRON = armRound(
  Array.from({ length: 40 }, (_, i) => {
    const t = i / 39
    return { x: 29 + 42 * t, y: 8.5 - Math.sin(t * Math.PI) * 0.9 }
  }),
  t => 4.2 - 1.8 * t,
)

// ---------- width laws ----------

/**
 * A hairline that is a soft turn rather than a corner. |sin| has a V at its
 * zero; a real nib rolls through the thin point over a few degrees, and the V
 * is also what makes Catmull-Rom kick on the inner contour.
 */
const softAbs = (s, e = 0.16) => (Math.hypot(s, e) - e) / (Math.hypot(1, e) - e)

/**
 * Broad nib: width follows the angle between travel and the nib edge, so the
 * stroke is thickest 90° from the hairlines. `axis` is where the hairlines
 * fall — −120° puts them at 11 and 5 o'clock and the weight at 2 and 8, which
 * is the diagonal stress of a humanist O. Vertical stress (thin at 12 and 6)
 * is the Didone O and reads engraved, not written.
 *
 * `bias` makes the two lobes unequal, which is what a hand does and a machine
 * does not: negative loads the 8 o'clock lobe, under the heavy end of the dash.
 * It stays smooth and periodic, so the counter stays a clean bowl.
 */
const nib = ({ peak, thin, axis, bias = 0 }) => {
  const amp = (peak - thin) / (1 + Math.abs(bias))
  return t => {
    const psi = d2r(360 * t - axis)
    return thin + amp * softAbs(Math.sin(psi)) * (1 + bias * Math.sin(psi))
  }
}

/**
 * A brush: one loaded zone and one dry one, with nothing in between changing
 * its mind. A raised cosine, narrowed by `p` so the heavy arc is shorter than
 * the light one, and skewed by `skew` so the fall and the rise take different
 * amounts of arc — the asymmetry a hand leaves and a cosine does not.
 *
 * Periodic and smooth by construction: no head to butt, no tail to lap, no seam
 * at any size. `skew` must stay under 1/2π or the warp stops being monotone and
 * the width doubles back on itself.
 */
const cycle = ({ peak, thin, p = 1.15, skew = 0.13, at = HAND }) => t => {
  const u = ((t - at / 360) % 1 + 1) % 1
  const k = u + skew * Math.sin(2 * Math.PI * u)
  return thin + (peak - thin) * Math.pow((1 + Math.cos(2 * Math.PI * k)) / 2, p)
}

// ---------- geometry ----------

/**
 * A band whose outer edge is NOT a circle. `band()` locks it, which is what
 * holds the letter at 16px; this is the row that asks what a locked edge costs.
 * It keeps the property a wrapped ribbon cannot have — closed by construction,
 * so no caps, no seam and no cusp — while letting the silhouette wander the way
 * a drawn one does.
 */
const offBand = (rOut, wAt, { n = 360, fill = INK } = {}) => {
  const outer = [], inner = []
  for (let i = 0; i < n; i++) {
    const t = i / n
    outer.push(polar(C.x, C.y, rOut(t), 360 * t))
    inner.push(polar(C.x, C.y, rOut(t) - wAt(t), 360 * t))
  }
  return `<path d="${smoothClosed(outer)}${smoothClosed(inner)}" fill="${fill}" fill-rule="evenodd"/>`
}

/** n positions spaced 0→1, packed towards the tip by `warp`. */
const run = (n, warp = 0.1) =>
  Array.from({ length: n }, (_, i) => {
    const u = (i + 0.5) / n
    return u + warp * Math.sin(Math.PI * u)
  })

/**
 * Apertures punched inside the stroke: no rim of their own, the stroke is the
 * rim, so neither edge of the ring is broken. Each hole is sized from the local
 * stroke width, so the run fades as the stroke lightens.
 *
 * The run stops before the thin end because 7d's floor is real: an aperture
 * under about 3 units on this grid closes up and the sucker is just a dot. It
 * packs towards the tip because the holes are widest at the root, so crowding
 * them there merges them into a slot.
 */
const holes = (wAtDeg, rOutDeg, { from, to, n = N, frac = 0.44, warp = 0.1 }) =>
  run(n, warp).map(u => {
    const deg = from + (to - from) * u
    const w = wAtDeg(deg)
    return disc(polar(C.x, C.y, rOutDeg(deg) - w / 2, deg), (w * frac) / 2, PAPER)
  }).join('')

const byDeg = fn => deg => fn(((deg / 360) % 1 + 1) % 1)
const flat = () => OUTER

const c = []
const add = (id, name, note, body) => c.push({ id, name, note, body: body + MACRON })

// ---------- L1 · the pen ----------

// The literal calligraphic O: a flat nib at one angle, two equal lobes, two
// hairlines on the 11–5 diagonal. The counter comes out as a clean tilted oval,
// which is what makes it read as written rather than as a ring with a notch.
{
  const wAt = nib({ peak: PEAK, thin: THIN, axis: -120 })
  add('L1', 'Broad nib, diagonal stress',
    'A pen edge held at one angle: weight at 2 and 8 o’clock, hairline at 11 and 5. The most literally calligraphic circle available.',
    band(C.x, C.y, OUTER, wAt, { n: 720 }) +
    holes(byDeg(wAt), flat, { from: 96, to: 208 }))
}

// ---------- L2 · the pen, held by a hand ----------

// L1 with the two lobes made unequal. A hand does not weight both halves of an
// O the same, and the heavier lobe gives the suckers somewhere to start from —
// so the mark keeps the pen's hairlines and gains the creature's direction.
{
  const wAt = nib({ peak: PEAK, thin: THIN, axis: -120, bias: -0.34 })
  add('L2', 'Uneven nib — the pen in a hand',
    'L1 with the 8 o’clock lobe loaded heavier than the 2 o’clock one, so the letter has a near side and the suckers have a root.',
    band(C.x, C.y, OUTER, wAt, { n: 720 }) +
    holes(byDeg(wAt), flat, { from: 92, to: 214, n: 7 }))
}

// ---------- L3 · the brush ----------

// One heavy zone, one dry one, and nothing in between. The stroke loads at 8
// o'clock — under the thick end of the dash — and lightens clockwise up the
// left and over the top, releasing at 1 o'clock under the dash's thin end. Ring
// and dash then run on the same diagonal and read as one hand's two strokes.
{
  const wAt = cycle({ peak: PEAK, thin: THIN })
  add('L3', 'Brush, loaded under the writing hand',
    'One loaded zone and one dry one: heaviest at 8 o’clock, released at 1 — the same diagonal the dash runs on.',
    band(C.x, C.y, OUTER, wAt, { n: 720 }) +
    holes(byDeg(wAt), flat, { from: HAND + 14, to: HAND + 136, n: 7 }))
}

// ---------- L4 · the brush, outer edge let go ----------

// L3 with the silhouette allowed to wander 1.5%. A hand does not close a true
// circle, and at 330px that is the whole difference between drawn and
// generated. 1.5% and no more: the silhouette is what holds the letter at 16px,
// and this row exists to show what letting go of it costs there.
{
  const wAt = cycle({ peak: PEAK, thin: THIN })
  const rOut = t => OUTER * (1 + 0.015 * Math.sin(2 * Math.PI * t + 1.1) + 0.008 * Math.sin(4 * Math.PI * t + 2.4))
  add('L4', 'Brush, off-round outer edge',
    'L3 with nothing held to a circle — the outer edge wanders 1.5%, the way a drawn one does. Closed by construction, so still no seam.',
    offBand(rOut, wAt) +
    holes(byDeg(wAt), byDeg(rOut), { from: HAND + 14, to: HAND + 136, n: 7 }))
}

// ---------- L5 · the letter leaning ----------

// The last calligraphic lever: italic. A written O leans, because the hand that
// wrote it was moving across the page. The whole mark is sheared 6°, dash
// included, so the two strokes lean together. It costs the true circle — at
// 16px this is an oval — which is precisely the question.
{
  const wAt = nib({ peak: PEAK, thin: THIN, axis: -120, bias: -0.34 })
  add('L5', 'The same letter, leaning',
    'L2 sheared 6°, dash and all: the O of someone writing at speed rather than an O set in type.',
    `<g transform="translate(${C.x} ${C.y}) skewX(-6) translate(${-C.x} ${-C.y})">` +
    band(C.x, C.y, OUTER, wAt, { n: 720 }) +
    holes(byDeg(wAt), flat, { from: 92, to: 214, n: 7 }) +
    '</g>')
}

// ---------- output ----------

const [outSheet, outTabs, outBig] = process.argv.slice(2)

writeFileSync(outSheet, sheet({
  title: 'Round 7f — a calligraphic circle for the brushed macron',
  sub: '128 / 48 / 16 px · the dash is identical on every row',
  concepts: c,
  sizes: [128, 48, 16],
  dark: [128, 16],
}))
console.log('wrote', outSheet, c.length, 'concepts')

if (outTabs) {
  writeFileSync(outTabs, tabStrip({ title: 'Round 7f — at true 16px', concepts: c }))
  console.log('wrote', outTabs)
}

// The hairlines, the lobe bias and the out-of-roundness are all sub-pixel on a
// contact sheet. 330px is the app-icon size and the only place to judge them.
if (outBig) {
  writeFileSync(outBig, `<meta charset="utf-8">
<style>
  :root { --ink:#1a1a1a; --paper:#faf9f7 }
  body { margin:0; background:#fff; font:13px/1.4 ui-sans-serif,system-ui,sans-serif }
  .row { display:flex; gap:20px; padding:16px 20px; align-items:center; border-top:1px solid #ececea }
  .id { width:40px; font-weight:700 }
  .box { padding:16px; border-radius:10px; background:#faf9f7 }
  .dk { background:#1f1f1f; --ink:#ffffff; --paper:#1f1f1f }
</style>
${c.map(x => `<div class="row"><div class="id">${x.id}</div>
  <div class="box"><svg viewBox="0 0 100 100" width="330" height="330">${x.body}</svg></div>
  <div class="box dk"><svg viewBox="0 0 100 100" width="330" height="330">${x.body}</svg></div>
</div>`).join('')}
`)
  console.log('wrote', outBig)
}
