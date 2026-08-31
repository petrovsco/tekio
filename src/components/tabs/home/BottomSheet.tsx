import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// The SIGNAL bottom sheet (design-system §§2, 8): T2 capture and drill-ins
// open over a scrim so the T1 read never reflows (P1). The old ui/Modal stays
// on the old language for the unrestyled tabs — this is its Home counterpart.

interface BottomSheetProps {
  onClose: () => void
  label: string
  children: ReactNode
}

export function BottomSheet({ onClose, label, children }: BottomSheetProps) {
  useEffect(() => {
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
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 bg-[rgba(26,26,26,0.34)]" onClick={onClose} />
      <div
        className="absolute bottom-0 left-0 right-0 bg-white text-ink border-t-2 border-ink rounded-t-[6px] max-h-[85vh] overflow-y-auto overflow-x-hidden px-4 pt-[10px]"
        // safe-area-inset-bottom has no utility class in this app — inline it.
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
      >
        <div className="w-[34px] h-[3px] bg-chrome rounded-[2px] mx-auto mb-[10px]" />
        {children}
      </div>
    </div>,
    document.body,
  )
}

/** Close target padded well beyond the glyph (design-system §8). */
export function SheetClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      aria-label="Close"
      className="min-w-[44px] min-h-[44px] -my-3 -mr-2 flex items-center justify-end cursor-pointer"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  )
}

interface ChipProps {
  /** Outline logs on tap; solid is the confirm that commits an entry (§8). */
  solid?: boolean
  onClick: () => void
  children: ReactNode
}

export function Chip({ solid, onClick, children }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] font-semibold rounded-[3px] border border-ink px-[10px] py-[5px] cursor-pointer ${
        solid ? 'bg-ink text-white' : 'bg-white text-ink'
      }`}
    >
      {children}
    </button>
  )
}
