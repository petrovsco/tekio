// A tab left open across a deploy still holds the old index, so the next
// destination change asks for a lazy chunk whose hash the new deploy no longer
// has. Vercel's catch-all rewrite answers with index.html, the browser refuses
// it as a module, and React.lazy throws. An expired gate cookie fails the same
// way, with the login page in place of the chunk. Either way a fresh load is
// the fix, so do it for the reader — once: if the reload lands on the same
// failure, let it through to the error boundary rather than loop.
//
// Home prefetches its four sheets together, so a stale tab fails all four at
// once. The first failure starts the reload; the rest land while it is under
// way and are swallowed too, or they surface as errors on a page that is
// already going away (error reports #2–#6, RFC 0103).
//
// A swallowed failure does not reject: Vite resolves that import() to
// undefined. Code that reads the module would then throw on the page that is
// going away, so every dynamic import passes through whileReloading, which
// waits for the reload instead (error report #23: tapping Weights on such a
// page threw "can't access property WeightsTab").
// tekio.rfcs/rfcs/done/0075-white-screen-after-deploy.md

const KEY = 'tekio:chunk-reload'
const WINDOW_MS = 10_000

function reloadedRecently(): boolean {
  try {
    return Date.now() - Number(sessionStorage.getItem(KEY) ?? 0) < WINDOW_MS
  } catch {
    return false
  }
}

export function reloadOnStaleChunk() {
  let reloading = false
  window.addEventListener('vite:preloadError', event => {
    if (reloading) return event.preventDefault()
    if (reloadedRecently()) return
    event.preventDefault()
    reloading = true
    try { sessionStorage.setItem(KEY, String(Date.now())) } catch { /* private mode: reload anyway */ }
    window.location.reload()
  })
}

/** A dynamic import's module, or, when reloadOnStaleChunk swallowed its
 *  failure and Vite resolved it to undefined, a promise that never settles:
 *  the page is reloading, so there is nothing to render or run. */
export function whileReloading<T>(mod: T | undefined): Promise<T> {
  return mod === undefined ? new Promise<T>(() => {}) : Promise.resolve(mod)
}
