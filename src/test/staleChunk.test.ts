import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Error reports #2–#6: a tab open across a deploy fails all four of Home's
// prefetched sheets at once. The first failure reloads the page; the other
// three must not escape as errors while that reload is under way.

function preloadError(): Event {
  const e = new Event('vite:preloadError', { cancelable: true })
  window.dispatchEvent(e)
  return e
}

describe('reloadOnStaleChunk', () => {
  const reload = vi.fn()
  const added: EventListener[] = []

  beforeEach(async () => {
    vi.resetModules()
    sessionStorage.clear()
    reload.mockClear()
    Object.defineProperty(window, 'location', { configurable: true, value: { ...window.location, reload } })
    const add = vi.spyOn(window, 'addEventListener')
    const { reloadOnStaleChunk } = await import('../lib/staleChunk')
    reloadOnStaleChunk()
    added.push(add.mock.calls[0][1] as EventListener)
    add.mockRestore()
  })

  afterEach(() => {
    for (const l of added.splice(0)) window.removeEventListener('vite:preloadError', l)
  })

  it('reloads once, and swallows every failure that lands before the reload', () => {
    const events = [preloadError(), preloadError(), preloadError(), preloadError()]
    expect(reload).toHaveBeenCalledTimes(1)
    expect(events.every(e => e.defaultPrevented)).toBe(true)
  })

  it('lets the failure through when the page it reloaded into fails again', () => {
    sessionStorage.setItem('tekio:chunk-reload', String(Date.now()))
    const e = preloadError()
    expect(reload).not.toHaveBeenCalled()
    expect(e.defaultPrevented).toBe(false)
  })
})

// Error report #23: once a failure is swallowed, Vite resolves that import()
// to undefined, and reading the module threw on the page being reloaded.
describe('whileReloading', () => {
  const settled = async (p: Promise<unknown>) => {
    let done = false
    p.then(() => { done = true }, () => { done = true })
    await new Promise(r => setTimeout(r, 0))
    return done
  }

  it('hands a loaded module straight on', async () => {
    const { whileReloading } = await import('../lib/staleChunk')
    const mod = { WeightsTab: () => null }
    await expect(Promise.resolve(mod).then(whileReloading)).resolves.toBe(mod)
  })

  it('waits for the reload instead of reading a swallowed import', async () => {
    const { whileReloading } = await import('../lib/staleChunk')
    const swallowed = Promise.resolve(undefined as { WeightsTab: () => null } | undefined)
    // The loader App.tsx used before: it rejects, and React shows the error.
    expect(await settled(swallowed.then(m => ({ default: m!.WeightsTab })))).toBe(true)
    const load = swallowed.then(whileReloading).then(m => ({ default: m.WeightsTab }))
    expect(await settled(load)).toBe(false)
  })
})
