// The splash is plain markup in index.html so it paints before this bundle
// arrives (RFC 0078). Whatever ends the wait removes it: bootstrap settling,
// or a render error the boundary is about to show. Safe to call twice.
export function dismissSplash() {
  const el = document.getElementById('splash')
  if (!el || el.classList.contains('out')) return
  // Settled inside the first 250 ms, before the mark has appeared: fading an
  // empty page would only make the mark flash up mid-fade.
  const mark = el.querySelector('.m')
  if (mark && getComputedStyle(mark).opacity === '0') return el.remove()
  el.classList.add('out')
  const remove = () => el.remove()
  el.addEventListener('transitionend', remove, { once: true })
  // Reduced motion has no transition, and a background tab may never fire one.
  setTimeout(remove, 400)
}
