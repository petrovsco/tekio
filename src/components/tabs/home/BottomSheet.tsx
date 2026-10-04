import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../../ui/Icon'
import { useKeyboardInset, revealFocusedField } from '../../../hooks/useKeyboardInset'

// The SIGNAL bottom sheet (design-system §§2, 8): T2 capture and drill-ins
// open over a scrim so the T1 read never reflows (P1). The old ui/Modal stays
// on the old language for the unrestyled tabs — this is its Home counterpart.
// From `sm` up it is a centred card instead, the same breakpoint and geometry
// as ui/Modal: a sheet stretched edge to edge on a desktop reads as one long
// line per row, and the grab handle means nothing without a thumb.
//
// On a phone the handle drags (RFC 0100): the panel follows the finger, a
// release past a quarter of its height (or a flick) closes it, and a drag up
// opens it full screen — only when its content is taller than the panel, since
// otherwise full screen would add nothing but white space.

interface BottomSheetProps {
  onClose: () => void
  label: string
  children: ReactNode
  /** Pinned under the scroll area, so the action it holds is always on screen. */
  footer?: ReactNode
}

/** Past this much travel up, a release opens the sheet full screen. */
const OPEN_FULL_PX = 48
/** A release this fast downward closes, whatever the distance (px per ms). */
const FLICK_SPEED = 0.6
const CLOSE_MS = 180

export function BottomSheet({ onClose, label, children, footer }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ y0: number; t: number; y: number; t0: number } | null>(null)
  const keyboard = useKeyboardInset()
  const [dy, setDy] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [full, setFull] = useState(false)
  const [closing, setClosing] = useState(false)
  // Whether the content already fits, read when a drag starts.
  const [fits, setFits] = useState(true)

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

  const close = () => {
    setClosing(true)
    window.setTimeout(onClose, CLOSE_MS)
  }

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { y0: e.clientY, y: e.clientY, t: e.timeStamp, t0: e.timeStamp }
    const scroller = scrollRef.current
    setFits(!scroller || scroller.scrollHeight <= scroller.clientHeight + 1)
    setDragging(true)
  }
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    d.y = e.clientY
    d.t = e.timeStamp
    setDy(e.clientY - d.y0)
  }
  const onUp = () => {
    const d = drag.current
    drag.current = null
    setDragging(false)
    if (!d) return
    const moved = d.y - d.y0
    const speed = moved / Math.max(1, d.t - d.t0)
    const panelH = panelRef.current?.offsetHeight ?? 0
    setDy(0)
    const flick = moved > 12 && speed > FLICK_SPEED
    if (full) {
      // Full screen steps down to the resting size first; only a long drag
      // or a flick goes straight to closed.
      if (flick || moved > panelH / 2) close()
      else if (moved > OPEN_FULL_PX) setFull(false)
    } else if (flick || moved > panelH / 4) {
      close()
    } else if (moved < -OPEN_FULL_PX && !fits) {
      setFull(true)
    }
  }

  // While dragging down the panel slides; dragging up stretches it, and a
  // panel whose content already fits only gives a little before springing back.
  const down = Math.max(0, dy)
  const up = Math.max(0, -dy)
  const stretch = fits ? Math.min(24, up / 4) : up
  const panelHeight = full ? 'calc(100dvh - env(safe-area-inset-top))' : undefined
  // `min(…, 100%)`: the container shrinks above an open keyboard, and so does the panel.
  const maxHeight = full ? undefined : `min(calc(85dvh + ${stretch}px), 100%)`
  const transform = closing ? 'translateY(100%)' : `translateY(${down}px)`
  const fade = closing ? 0 : 1 - Math.min(0.7, down / 600)

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4"
      style={{ bottom: keyboard }}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className={`absolute inset-0 bg-[rgba(26,26,26,0.34)] ${dragging ? '' : 'transition-opacity duration-200'}`}
        style={{ opacity: fade }}
        onClick={close}
      />
      <div
        ref={panelRef}
        className={`relative w-full min-w-0 sm:max-w-[480px] bg-white text-ink border-t sm:border-2 border-ink sm:rounded-[6px] sm:!max-h-[85vh] sm:!h-auto sm:!transform-none flex flex-col overflow-hidden ${
          full ? 'rounded-none' : 'rounded-t-[6px]'
        } ${dragging ? '' : 'transition-[transform,max-height,height] duration-200 ease-out motion-reduce:transition-none'}`}
        style={{ height: full ? `min(${panelHeight}, 100%)` : undefined, maxHeight, transform }}
        onFocus={revealFocusedField}
      >
        {/* The handle's touch zone is the full width and 28 px tall; the bar
            inside it is only the visual. */}
        <div
          className="sm:hidden shrink-0 h-[28px] flex items-center justify-center touch-none cursor-grab"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          aria-hidden
        >
          <div className="w-[34px] h-[3px] bg-chrome rounded-[2px]" />
        </div>
        <div
          ref={scrollRef}
          className="overflow-y-auto overflow-x-hidden overscroll-contain px-4 sm:pt-4 min-h-0 grow"
          // safe-area-inset-bottom has no utility class in this app — inline it.
          style={{ paddingBottom: footer ? '12px' : 'calc(16px + env(safe-area-inset-bottom))' }}
        >
          {children}
        </div>
        {footer && (
          <div
            className="shrink-0 px-4 pt-2.5 border-t border-line bg-white"
            style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
          >
            {footer}
          </div>
        )}
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
      className="min-w-[44px] min-h-[44px] -my-3 flex items-center justify-end cursor-pointer"
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
