import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Rendered outside the scroll area — always visible at the bottom of the panel. */
  footer?: ReactNode
}

/**
 * Generic modal shell.
 * - Renders into document.body via a portal
 * - Closes on Escape key or backdrop click
 * - Full-screen on mobile, centred card on sm+
 * - SIGNAL sheet geometry (design-system §2): 2px ink border, 6px radius,
 *   rgba(26,26,26,0.34) scrim. Home's own sheets use BottomSheet; this is the
 *   shell-wide equivalent for everything reached from a tab.
 * - Scrollable content area; header/footer stay fixed
 */
export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return

    // Prevent body from scrolling (including horizontal) while modal is open
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)

    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', handler)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[rgba(26,26,26,0.34)]" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full min-w-0 sm:max-w-md max-h-[92vh] bg-white text-ink rounded-t-[6px] sm:rounded-[6px] border-2 border-ink flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-hairline flex-shrink-0">
          <h2 className="text-[17px] font-bold tracking-[-0.01em]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-11 h-11 -my-2 -mr-3 flex items-center justify-end text-ink-2 hover:text-ink cursor-pointer transition-colors"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Scrollable body — overflow-x-hidden prevents any child from widening the panel */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 p-4">
          {children}
        </div>

        {/* Footer — outside scroll area so it's always visible on all browsers */}
        {footer && (
          <div className="flex-shrink-0 px-4 pb-4 pt-3 border-t border-hairline bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
