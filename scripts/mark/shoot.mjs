// Screenshots a contact sheet.
//
//   node scripts/mark/shoot.mjs sheet.html out.png                  whole page
//   node scripts/mark/shoot.mjs sheet.html top.png --rows 0,5       rows 0..5 only
//   node scripts/mark/shoot.mjs tabs.html tabs.png --size 1210x560  fixed viewport
//
// Crop into sections when sending: a file over about 1 MB is rejected by the
// file transport, and a full eleven-row sheet is well over that.

import { readFileSync } from 'node:fs'
import { launch } from './browser.mjs'

const [file, out, ...rest] = process.argv.slice(2)
if (!file || !out) {
  console.error('usage: shoot.mjs <file.html> <out.png> [--rows a,b] [--sel .row] [--size WxH] [--scale N]')
  process.exit(1)
}
const flag = (name, dflt) => {
  const i = rest.indexOf('--' + name)
  return i === -1 ? dflt : rest[i + 1]
}

const [w, h] = flag('size', '980x1200').split('x').map(Number)
const scale = Number(flag('scale', 4))
const sel = flag('sel', '.row')
const rows = flag('rows', null)

const browser = await launch()
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale })
// setContent rather than a URL: the sheets are self-contained, so no local
// web server is needed. (file:// is what the Playwright MCP refuses, not this.)
await page.setContent(readFileSync(file, 'utf8'), { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(900)

if (rows) {
  const idx = rows.split(',').map(Number)
  const all = page.locator(sel)
  const b1 = await all.nth(idx[0]).boundingBox()
  const b2 = await all.nth(idx[idx.length - 1]).boundingBox()
  await page.screenshot({
    path: out,
    fullPage: true,
    clip: { x: 0, y: b1.y - 4, width: w, height: b2.y + b2.height - b1.y + 8 },
  })
} else {
  await page.screenshot({ path: out, fullPage: !flag('size', null) })
}

console.log('wrote', out)
await browser.close()
