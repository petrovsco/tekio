// Finds the headless Chromium these scripts drive.
//
// The Playwright MCP server needs a branded Chrome install (and sudo), which is
// not available here, so the mark scripts drive playwright-core directly against
// the Chromium that Playwright already downloaded into ~/.cache. Both paths are
// discovered rather than hardcoded, because the npx cache directory name is a
// hash that changes when the package is reinstalled.
//
// Override either with MARK_PLAYWRIGHT / MARK_CHROME if the guesses are wrong.

import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const findPlaywright = () => {
  if (process.env.MARK_PLAYWRIGHT) return process.env.MARK_PLAYWRIGHT
  const local = join(process.cwd(), 'node_modules/playwright-core/index.mjs')
  if (existsSync(local)) return local
  const npx = join(homedir(), '.npm/_npx')
  if (existsSync(npx)) {
    for (const dir of readdirSync(npx)) {
      const p = join(npx, dir, 'node_modules/playwright-core/index.mjs')
      if (existsSync(p)) return p
    }
  }
  throw new Error('playwright-core not found — set MARK_PLAYWRIGHT to its index.mjs')
}

const findChrome = () => {
  if (process.env.MARK_CHROME) return process.env.MARK_CHROME
  const root = join(homedir(), '.cache/ms-playwright')
  if (existsSync(root)) {
    for (const dir of readdirSync(root)) {
      if (!dir.startsWith('chromium-')) continue
      const p = join(root, dir, 'chrome-linux64/chrome')
      if (existsSync(p)) return p
    }
  }
  throw new Error('chromium not found — set MARK_CHROME to the executable')
}

export async function launch() {
  const { chromium } = await import(findPlaywright())
  return chromium.launch({ executablePath: findChrome(), args: ['--no-sandbox'] })
}
