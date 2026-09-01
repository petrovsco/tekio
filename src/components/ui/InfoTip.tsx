import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'

interface InfoTipProps {
  children: ReactNode
  /** Accessible label / title for the trigger. */
  label?: string
  /** Optional colour for the panel's left edge — the only place a caller may
   *  pass a colour, and only when it is already a meaningful channel on the
   *  calling surface (e.g. an adaptation's own tint). */
  accent?: string
}

/**
 * A small tap-to-open info popover anchored to an ⓘ button. The panel is
 * rendered in a portal and shown as a centered overlay so it stays fully
 * visible on mobile and its clicks never bubble back into a surrounding
 * clickable card. Closes on outside tap or the ✕ button.
 */
export function InfoTip({ children, label = 'More info', accent }: InfoTipProps) {
  const [open, setOpen] = useState(false)
  const tint = accent ?? 'var(--color-ink)'

  // Swallow pointer/click events on the trigger so a parent card's handlers
  // don't fire alongside the toggle.
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onPointerDown={stop}
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }}
        className="w-5 h-5 flex items-center justify-center rounded-full border text-[11px] font-bold cursor-pointer transition-colors"
        style={
          open
            ? { backgroundColor: tint, borderColor: tint, color: '#fff' }
            : { color: tint, borderColor: tint }
        }
      >
        i
      </button>
      {open && createPortal(
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[rgba(26,26,26,0.34)]"
          onPointerDown={stop}
          onClick={(e) => { e.stopPropagation(); setOpen(false) }}
        >
          <div
            className="relative z-[151] w-full max-w-xs max-h-[80vh] overflow-y-auto rounded-[6px] border-2 border-ink bg-white text-ink p-4 text-left"
            style={accent ? { borderLeftWidth: 3, borderLeftColor: accent } : undefined}
            onPointerDown={stop}
            onClick={stop}
          >
            <button
              type="button"
              aria-label="Close"
              onPointerDown={stop}
              onClick={(e) => { e.stopPropagation(); setOpen(false) }}
              className="absolute top-1 right-1 w-9 h-9 flex items-center justify-center text-ink-2 hover:text-ink cursor-pointer"
            >
              <Icon name="close" size={14} />
            </button>
            {children}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
