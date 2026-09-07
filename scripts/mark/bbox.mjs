// Measures where a mark's ink actually reaches, in viewBox units.
//
//   node scripts/mark/bbox.mjs public/favicon.svg
//   node scripts/mark/bbox.mjs round.svg --viewbox 100
//
// Do this before shipping any mark, and do not eyeball it instead. A square
// rotated inside its own viewBox does not fit at its own width, and the
// clipping that causes is invisible at 16px and obvious at 180px — that is
// exactly how the 2026-09 vessel mark nearly shipped with two corners sliced
// flat (roadmap 038).

import { readFileSync } from 'node:fs'
import { launch } from './browser.mjs'

const file = process.argv[2]
const vbIdx = process.argv.indexOf('--viewbox')
const VB = vbIdx === -1 ? 24 : Number(process.argv[vbIdx + 1])
if (!file) {
  console.error('usage: bbox.mjs <file.svg> [--viewbox N]   (N defaults to 24)')
  process.exit(1)
}

const browser = await launch()
const page = await browser.newPage({ viewport: { width: 500, height: 500 } })
await page.setContent('<body style="margin:0"></body>')

const res = await page.evaluate(async ({ svgText, VB }) => {
  const N = 480 // render big, so one viewBox unit is many device pixels
  const img = new Image()
  await new Promise((ok, err) => {
    img.onload = ok
    img.onerror = err
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText)
  })
  const cv = document.createElement('canvas')
  cv.width = N; cv.height = N
  const ctx = cv.getContext('2d')
  ctx.clearRect(0, 0, N, N)
  ctx.drawImage(img, 0, 0, N, N)
  const d = ctx.getImageData(0, 0, N, N).data
  let minX = N, minY = N, maxX = -1, maxY = -1
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (d[(y * N + x) * 4 + 3] > 8) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  const u = N / VB
  return {
    left: +(minX / u).toFixed(2),
    top: +(minY / u).toFixed(2),
    right: +((maxX + 1) / u).toFixed(2),
    bottom: +((maxY + 1) / u).toFixed(2),
  }
}, { svgText: readFileSync(file, 'utf8'), VB })

const margin = {
  left: res.left,
  top: res.top,
  right: +(VB - res.right).toFixed(2),
  bottom: +(VB - res.bottom).toFixed(2),
}
console.log(`ink bounds in viewBox units (0–${VB}):`)
console.log(JSON.stringify(res, null, 2))
console.log('margins:', JSON.stringify(margin))

const touching = Object.entries(margin).filter(([, v]) => v <= 0.05).map(([k]) => k)
console.log(touching.length ? 'CLIPPED / touching: ' + touching.join(', ') : 'clear of all four edges')
console.log(`centre offset: x ${(((res.left + res.right) / 2) - VB / 2).toFixed(2)}, ` +
  `y ${(((res.top + res.bottom) / 2) - VB / 2).toFixed(2)}`)

await browser.close()
