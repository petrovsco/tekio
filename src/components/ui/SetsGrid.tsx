import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties, ReactNode } from 'react'
import { MICRO_LABEL } from './Badges'
import { DelBtn } from './Button'
import { Icon } from './Icon'
import { FIELD } from './Input'
import { setsProblem, toLiftSet, fmtSet, rowFilled, type SetStr } from '@tekio/core'

interface SetsGridProps {
  sets: SetStr[]
  revealed: number
  onUpdate: (i: number, field: 'weight' | 'reps', val: string) => void
  onRemove: (i: number) => void
  onRevealNext: () => void
  /** Sets already in the log (RFC 0106): each row is saved the moment it is
   *  ticked. Absent, the grid is a plain form saved as a whole. */
  saved?: boolean[]
  onToggle?: (i: number) => void
  /** Rows whose tick is still being written: Done spins until it lands. */
  pending?: boolean[]
  /** A hold (RFC 0107): the columns read added load and seconds. */
  timed?: boolean
  /** Drag a set to another place (RFC 0112), by the grip in its # cell. A
   *  ticked set is in the log and stays where it is; the others move around it. */
  onMove?: (from: number, to: number) => void
}

/**
 * Reusable sets grid (weight × reps rows, or added load × seconds for a hold)
 * used in WeightsTab, the plan sheet and EditModal.
 */
export function SetsGrid({ sets, revealed, onUpdate, onRemove, onRevealNext, saved, onToggle, pending, timed = false, onMove }: SetsGridProps) {
  const visible = sets.slice(0, revealed)
  const problem = setsProblem(sets, revealed, timed)
  const movable = !!onMove && visible.length > 1
  const cols = [movable ? '36px' : '28px', 'minmax(0,1fr)', 'minmax(0,1fr)', ...(onToggle ? ['32px'] : []), '28px'].join(' ')
  // The same hold as Settings' section order: a short press-and-hold on touch,
  // so a scroll that starts on the grip still scrolls.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )
  const ids = visible.map((_, i) => `set-${i}`)
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!onMove || !over || active.id === over.id) return
    onMove(ids.indexOf(active.id as string), ids.indexOf(over.id as string))
  }

  return (
    <div>
      <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: cols }}>
        {['#', timed ? 'Added kg' : 'Weight kg', timed ? 'Seconds' : 'Reps', ...(onToggle ? ['Done'] : []), ''].map((h, i) => (
          <p key={i} className={MICRO_LABEL}>{h}</p>
        ))}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {visible.map((s, i) => {
            const done = !!saved?.[i]
            const unfilled = !rowFilled(s, timed)
            const saving = !!pending?.[i]
            return (
              <SetRow key={i} id={ids[i]} cols={cols} n={i + 1} grip={movable && !done}>
                <input
                  value={s.weight}
                  onChange={e => onUpdate(i, 'weight', e.target.value)}
                  readOnly={done}
                  type="number"
                  placeholder={timed ? '0' : '60'}
                  min="0"
                  step="0.5"
                  className={FIELD}
                />
                <input
                  value={s.reps}
                  onChange={e => onUpdate(i, 'reps', e.target.value)}
                  readOnly={done}
                  type="number"
                  inputMode="numeric"
                  placeholder={timed ? '30' : '10'}
                  min="1"
                  step="1"
                  className={FIELD}
                />
                {onToggle && (
                  <button
                    type="button"
                    aria-pressed={done}
                    aria-busy={saving}
                    aria-label={saving ? `Set ${i + 1} saving` : done ? `Set ${i + 1} saved. Tap to take it out of the log` : `Save set ${i + 1}`}
                    // Never disabled: a tap on a row not filled in yet says what is
                    // missing rather than doing nothing. The ::before reaches the
                    // touch area out to 44 px over the gaps around the box, which
                    // stays the size it is drawn.
                    aria-disabled={!done && unfilled}
                    onClick={() => onToggle(i)}
                    className={`relative before:absolute before:-inset-1.5 w-8 h-8 flex items-center justify-center rounded-[3px] border transition-colors ${
                      done ? 'bg-ink border-ink text-white cursor-pointer'
                      : unfilled ? 'bg-white border-line text-ink-3 opacity-40 cursor-default'
                      : 'bg-white border-line text-ink-3 hover:border-ink hover:text-ink cursor-pointer'}`}
                  >
                    {saving ? <Icon name="spinner" size={14} className="animate-spin" /> : <Icon name="check" size={14} />}
                  </button>
                )}
                <div>
                  {visible.length > 1 && !done && <DelBtn noConfirm onClick={() => onRemove(i)} />}
                </div>
              </SetRow>
            )
          })}
        </SortableContext>
      </DndContext>

      {problem && <p role="alert" className="text-[11px] font-semibold text-signal mb-1">{problem}</p>}

      <button onClick={onRevealNext} className="text-[11px] font-semibold text-ink underline underline-offset-2 mt-1 cursor-pointer">
        {revealed < sets.length
          ? `+ Set ${revealed + 1} (${fmtSet(toLiftSet(sets[revealed], timed))})`
          : '+ Add set'}
      </button>
    </div>
  )
}

/** One row. With a grip, its # cell is the handle; a ticked row has none and
 *  is not picked up, though the others pass over it. */
function SetRow({ id, cols, n, grip, children }: { id: string; cols: string; n: number; grip: boolean; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: { draggable: !grip, droppable: false },
  })
  const style: CSSProperties = {
    gridTemplateColumns: cols,
    transform: CSS.Translate.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 1 : undefined,
  }
  return (
    <div ref={setNodeRef} style={style} className={`grid gap-1.5 mb-1.5 items-center ${isDragging ? 'bg-white' : ''}`}>
      {grip ? (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Move set ${n}`}
          className="h-8 flex items-center justify-center gap-0.5 text-ink-3 hover:text-ink cursor-grab active:cursor-grabbing touch-none select-none transition-colors"
        >
          <Icon name="drag" size={12} />
          <span className="text-[11px]">{n}</span>
        </button>
      ) : (
        <span className="text-[11px] text-ink-3 text-center">{n}</span>
      )}
      {children}
    </div>
  )
}
