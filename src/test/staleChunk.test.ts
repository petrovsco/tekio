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
