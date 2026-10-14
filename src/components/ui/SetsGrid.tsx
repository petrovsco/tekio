import { MICRO_LABEL } from './Badges'
import { DelBtn } from './Button'
import { Icon } from './Icon'
import { FIELD } from './Input'
import { setsProblem, toLiftSet, fmtSet, rowFilled, type SetStr } from '../../lib/sets'

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
}

/**
 * Reusable sets grid (weight × reps rows, or added load × seconds for a hold)
 * used in WeightsTab, the plan sheet and EditModal.
 */
export function SetsGrid({ sets, revealed, onUpdate, onRemove, onRevealNext, saved, onToggle, pending, timed = false }: SetsGridProps) {
  const visible = sets.slice(0, revealed)
  const problem = setsProblem(sets, revealed, timed)
  const cols = onToggle
    ? '28px minmax(0,1fr) minmax(0,1fr) 32px 28px'
    : '28px minmax(0,1fr) minmax(0,1fr) 28px'

  return (
    <div>
      <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: cols }}>
        {['#', timed ? 'Added kg' : 'Weight kg', timed ? 'Seconds' : 'Reps', ...(onToggle ? ['Done'] : []), ''].map((h, i) => (
          <p key={i} className={MICRO_LABEL}>{h}</p>
        ))}
      </div>

      {visible.map((s, i) => {
        const done = !!saved?.[i]
        const unfilled = !rowFilled(s, timed)
        const saving = !!pending?.[i]
        return (
        <div key={i} className="grid gap-1.5 mb-1.5 items-center" style={{ gridTemplateColumns: cols }}>
          <span className="text-[11px] text-ink-3 text-center">{i + 1}</span>
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
        </div>
        )
      })}

      {problem && <p role="alert" className="text-[11px] font-semibold text-signal mb-1">{problem}</p>}

      <button onClick={onRevealNext} className="text-[11px] font-semibold text-ink underline underline-offset-2 mt-1 cursor-pointer">
        {revealed < sets.length
          ? `+ Set ${revealed + 1} (${fmtSet(toLiftSet(sets[revealed], timed))})`
          : '+ Add set'}
      </button>
    </div>
  )
}
