import { useEffect, type RefObject } from 'react'

/**
 * Keeps the page behind an open sheet or modal from scrolling.
 *
 * With a mouse, `overflow: hidden` on the body does it. On a touch screen it
 * cannot: a page that stops being scrollable makes Android Chrome bring its
 * hidden toolbar back, the viewport shrinks, and an open sheet jumps up under
 * the finger — opening a sheet from the bottom of a scrolled Home did exactly
 * that. So on touch the page stays scrollable and the dialog swallows the
 * drags itself: a touchmove inside it scrolls only a box in it that can
 * scroll, and never the page (those boxes carry `overscroll-contain`, so their
 * edges do not hand the scroll on).
 */
export function useScrollLock(root: RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    if (!active) return
    if (!window.matchMedia('(pointer: coarse)').matches) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
    const el = root.current
    if (!el) return
    const onMove = (e: TouchEvent) => {
      if (!scrollsInside(e.target, el)) e.preventDefault()
    }
    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, [root, active])
}

/** Whether a box between `target` and `root` can scroll vertically. */
function scrollsInside(target: EventTarget | null, root: HTMLElement): boolean {
  for (let n = target instanceof Element ? target : null; n && n !== root; n = n.parentElement) {
    const { overflowY } = getComputedStyle(n)
    if ((overflowY === 'auto' || overflowY === 'scroll') && n.scrollHeight > n.clientHeight + 1) return true
  }
  return false
}
