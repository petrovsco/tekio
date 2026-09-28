// A tab left open across a deploy still holds the old index, so the next
// destination change asks for a lazy chunk whose hash the new deploy no longer
// has. Vercel's catch-all rewrite answers with index.html, the browser refuses
// it as a module, and React.lazy throws. An expired gate cookie fails the same
// way, with the login page in place of the chunk. Either way a fresh load is
// the fix, so do it for the reader — once: if the reload lands on the same
// failure, let it through to the error boundary rather than loop.
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
  window.addEventListener('vite:preloadError', event => {
    if (reloadedRecently()) return
    event.preventDefault()
    try { sessionStorage.setItem(KEY, String(Date.now())) } catch { /* private mode: reload anyway */ }
    window.location.reload()
  })
}
