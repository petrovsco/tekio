import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../../ui/Icon'

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

/** Close target padded well beyond the glyph (design-system §8). Not exported:
 *  every sheet reaches it through `SheetHeader`, which is the finding behind
 *  the finding — a close control never appears except in a sheet's header. */
function SheetClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      aria-label="Close"
      className="min-w-[44px] min-h-[44px] -my-3 -mr-2 flex items-center justify-end cursor-pointer"
    >
      <Icon name="close" size={18} className="text-ink-2" />
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

/** The header every sheet opens with: what this is, and the way out.
 *
 *  `eyebrow` is the 9px section label *without* `uppercase` — its text is
 *  already capitals in the source, which is why it is not `FIELD_LABEL`
 *  (roadmap 048 B10 left these for this entry). A header of one line centres
 *  against the close target; a stacked one aligns to its top. Both are what
 *  the five hand-written copies already did. */
export function SheetHeader({
  eyebrow, title, sub, onClose, className = '',
}: {
  eyebrow?: string
  title?: string
  sub?: ReactNode
  onClose: () => void
  className?: string
}) {
  const stacked = [eyebrow, title, sub].filter(Boolean).length > 1
  return (
    <div className={`flex ${stacked ? 'items-start' : 'items-center'} justify-between gap-3 ${className}`}>
      <div>
        {eyebrow && <div className="text-[9px] font-bold tracking-[0.14em] text-ink-3">{eyebrow}</div>}
        {title && (
          <h3 className={`text-[19px] font-bold tracking-[-0.02em] leading-tight ${eyebrow ? 'mt-0.5' : ''}`}>
            {title}
          </h3>
        )}
        {sub && <p className="text-xs text-ink-2 mt-0.5">{sub}</p>}
      </div>
      <SheetClose onClose={onClose} />
    </div>
  )
}

/** One capture's own heading: what it captures, and where it stands this week. */
export function CaptureLabel({ label, meta }: { label: string; meta: ReactNode }) {
  return (
    <div className="flex items-baseline gap-1.5 mb-1.5">
      <span className="text-[10px] font-bold tracking-[0.1em]">{label}</span>
      <span className="text-[9px] text-ink-3">{meta}</span>
    </div>
  )
}

/** Recent entries, tap to edit — the fold carries the correction path with it,
 *  not just the capture. The old tabs were where a mistyped entry got fixed,
 *  and a wrong donation date gates the day for 48 h. */
export function Recent<T extends { id: string }>({
  entries, label, onEdit,
}: {
  entries: T[]
  label: (e: T) => ReactNode
  onEdit: (e: T) => void
}) {
  if (entries.length === 0) return null
  return (
    <div className="flex gap-1.5 flex-wrap mt-2">
      {entries.map(e => (
        <button
          key={e.id}
          onClick={() => onEdit(e)}
          className="text-[9px] text-ink-2 border border-line rounded-[3px] px-1.5 py-[3px] cursor-pointer"
        >
          {label(e)}
        </button>
      ))}
    </div>
  )
}

/** A number stepped to today's value, then committed once: the big numeral,
 *  ± chips, the solid confirm, and whatever the caller shows underneath.
 *
 *  Sleep and bodyweight are the two of these. Neither logs on tap — they are
 *  corrections to a value that already exists, so the outline chips only move
 *  the numeral and the solid chip is the write (design-system §8). */
export function StepperCapture({
  label, meta, initial, unit, steps, logLabel, onLog, recent, note, className = '',
}: {
  label?: string
  meta?: ReactNode
  /** Prefill; both callers pass the newest entry on record. Read once. */
  initial: number
  unit: string
  /** Signed increments in the value's own unit, smallest first in magnitude. */
  steps: number[]
  logLabel: (shown: string) => string
  onLog: (value: number) => void | Promise<void>
  recent?: ReactNode
  note?: ReactNode
  className?: string
}) {
  const [value, setValue] = useState(() => initial)
  // The value stays on the grid of its own smallest step — half-hours for
  // sleep, tenths of a kilo for bodyweight — so the rounding is not a separate
  // decision. Scaling by 1/step keeps the arithmetic on integers, which
  // `value * 10 / 10` does and `value + 0.1` does not.
  const scale = 1 / Math.min(...steps.map(Math.abs))
  const shown = value.toFixed(1)

  return (
    <div className={className}>
      {label && <CaptureLabel label={label} meta={meta} />}
      <div className="flex items-baseline gap-1">
        <span className="text-[25px] font-bold tracking-[-0.02em]">{shown}</span>
        <span className="text-[11px] text-ink-2">{unit}</span>
      </div>
      <div className="flex gap-1.5 mt-2">
        {steps.map(step => (
          <Chip key={step} onClick={() => setValue(v => Math.max(0, Math.round((v + step) * scale) / scale))}>
            {step > 0 ? `+ ${step}` : `− ${Math.abs(step)}`}
          </Chip>
        ))}
      </div>
      <div className="mt-2.5">
        <Chip solid onClick={() => onLog(value)}>{logLabel(shown)}</Chip>
      </div>
      {recent}
      {note && <div className="text-[9px] text-ink-3 mt-1.5">{note}</div>}
    </div>
  )
}
