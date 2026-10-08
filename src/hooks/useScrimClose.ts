import { useRef, type PointerEvent } from 'react'

/**
 * Close-on-scrim for a sheet or modal: a tap closes only when the press
 * began on the scrim itself. A press that began on a control inside the panel
 * (a − 0.1 chip, say) never closes it, even if the browser delivers the
 * click to the scrim — the panel can shift between the finger landing and
 * the click while a phone's toolbar or keyboard settles.
 *
 * `root` goes on the dialog's outer element (it sees every press first),
 * `scrim` on the scrim.
 */
export function useScrimClose(onClose: () => void) {
  const scrimRef = useRef<HTMLDivElement>(null)
  const pressedScrim = useRef(false)
  return {
    root: {
      onPointerDownCapture: (e: PointerEvent<HTMLElement>) => {
        pressedScrim.current = e.target === scrimRef.current
      },
    },
    scrim: {
      ref: scrimRef,
      onClick: () => {
        const ok = pressedScrim.current
        pressedScrim.current = false
        if (ok) onClose()
      },
    },
  }
}
