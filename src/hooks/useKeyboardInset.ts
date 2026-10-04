import { useEffect, useState, type FocusEvent } from 'react'

/**
 * The phone keyboard's height over the page, in px — 0 when it is closed or
 * when the browser already shrinks the layout for it (Android Chrome, with
 * `interactive-widget=resizes-content` in index.html). A sheet lifts itself by
 * this much so the field being typed in stays above the keyboard (RFC 0100).
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)))
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])
  return inset
}

/** onFocus for a sheet's panel: once the keyboard has opened, bring the
 *  focused field into the middle of what is still visible. */
export function revealFocusedField(e: FocusEvent<HTMLElement>) {
  const el = e.target
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return
  window.setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
}
