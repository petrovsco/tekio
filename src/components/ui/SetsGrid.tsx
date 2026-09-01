import { DelBtn } from './Button'
import { FIELD } from './Input'

export interface SetStr { weight: string; reps: string }

interface SetsGridProps {
  sets: SetStr[]
  revealed: number
  onUpdate: (i: number, field: 'weight' | 'reps', val: string) => void
  onRemove: (i: number) => void
  onRevealNext: () => void
}

/**
 * Reusable sets grid (weight × reps rows) used in WeightsTab and EditModal.
 */
export function SetsGrid({ sets, revealed, onUpdate, onRemove, onRevealNext }: SetsGridProps) {
  const visible = sets.slice(0, revealed)

  return (
    <div>
      <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: '28px minmax(0,1fr) minmax(0,1fr) 28px' }}>
        {['#', 'Weight kg', 'Reps', ''].map((h, i) => (
          <p key={i} className="text-[9px] font-bold uppercase tracking-[0.10em] text-ink-3">{h}</p>
        ))}
      </div>

      {visible.map((s, i) => (
        <div key={i} className="grid gap-1.5 mb-1.5 items-center" style={{ gridTemplateColumns: '28px minmax(0,1fr) minmax(0,1fr) 28px' }}>
          <span className="text-[11px] text-ink-3 text-center">{i + 1}</span>
          <input
            value={s.weight}
            onChange={e => onUpdate(i, 'weight', e.target.value)}
            type="number"
            placeholder="60"
            min="0"
            step="0.5"
            className={FIELD}
          />
          <input
            value={s.reps}
            onChange={e => onUpdate(i, 'reps', e.target.value)}
            type="number"
            placeholder="10"
            min="1"
            className={FIELD}
          />
          <div>
            {visible.length > 1 && <DelBtn noConfirm onClick={() => onRemove(i)} />}
          </div>
        </div>
      ))}

      <button onClick={onRevealNext} className="text-[11px] font-semibold text-ink underline underline-offset-2 mt-1 cursor-pointer">
        {revealed < sets.length
          ? `+ Set ${revealed + 1} (${sets[revealed].weight}kg × ${sets[revealed].reps})`
          : '+ Add set'}
      </button>
    </div>
  )
}
