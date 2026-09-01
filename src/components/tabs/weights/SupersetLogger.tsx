import { useState } from 'react'
import { isDeloadDate, uid } from '../../../lib/utils'
import { Card, SecTitle } from '../../ui/Card'
import { Btn } from '../../ui/Button'
import { SSBadge, DeloadBadge } from '../../ui/Badges'
import { FIELD } from '../../ui/Input'
import type { WeightEntry, LiftSet } from '../../../types'

interface SetStr { weight: string; reps: string }

function padArr(arr: SetStr[], n: number): SetStr[] {
  if (arr.length >= n) return arr
  return [...arr, ...Array(n - arr.length).fill(0).map(() => ({ weight: '', reps: '' }))]
}

interface SupersetLoggerProps {
  exercises: [string, string]
  weights: WeightEntry[]
  date: string
  programStartDate?: string
  isDeload: boolean
  initialSets0?: LiftSet[]
  initialSets1?: LiftSet[]
  onSave: (entries: Array<Omit<WeightEntry, 'id'>>) => void
  onCancel: () => void
}

export function SupersetLogger({ exercises, weights, date, programStartDate, isDeload, initialSets0, initialSets1, onSave, onCancel }: SupersetLoggerProps) {
  const lastPerf = (n: string): WeightEntry | undefined =>
    [...weights]
      .filter(d => d.exercise.toLowerCase() === n.toLowerCase() && !isDeloadDate(programStartDate, d.date))
      .sort((a, b) => b.date.localeCompare(a.date))[0]

  const lp0 = lastPerf(exercises[0])
  const lp1 = lastPerf(exercises[1])

  const toStr = (sets: LiftSet[]): SetStr[] => sets.map(s => ({ weight: String(s.weight), reps: String(s.reps) }))
  const mkSets = (lp: WeightEntry | undefined, initial?: LiftSet[]): SetStr[] => {
    if (initial) return toStr(initial)
    if (lp?.sets) return toStr(lp.sets)
    return [{ weight: '', reps: '' }]
  }

  const s0raw = mkSets(lp0, initialSets0)
  const s1raw = mkSets(lp1, initialSets1)
  const maxInit = Math.max(s0raw.length, s1raw.length)

  const [sets0, setSets0] = useState<SetStr[]>(padArr(s0raw, maxInit))
  const [sets1, setSets1] = useState<SetStr[]>(padArr(s1raw, maxInit))
  const [revealed, setRevealed] = useState(maxInit || 1)

  const updateSet = (setter: React.Dispatch<React.SetStateAction<SetStr[]>>, i: number, field: keyof SetStr, val: string) => {
    setter(prev => {
      const next = prev.length > i ? [...prev] : [...prev, ...Array(i - prev.length + 1).fill(0).map(() => ({ weight: '', reps: '' }))]
      next[i] = { ...next[i], [field]: val }
      return next
    })
  }

  const revealNext = () => {
    const n = revealed + 1
    setSets0(p => p.length >= n ? p : [...p, { weight: p[p.length - 1]?.weight || '', reps: '' }])
    setSets1(p => p.length >= n ? p : [...p, { weight: '', reps: '' }])
    setRevealed(n)
  }

  const save = () => {
    const ssId = uid()
    const vs0 = sets0.slice(0, revealed).filter(s => s.weight && s.reps).map(s => ({ weight: +s.weight, reps: +s.reps }))
    const vs1 = sets1.slice(0, revealed).filter(s => s.weight && s.reps).map(s => ({ weight: +s.weight, reps: +s.reps }))
    const entries: Array<Omit<WeightEntry, 'id'>> = []
    if (vs0.length) entries.push({ date, exercise: exercises[0], sets: vs0, supersetId: ssId })
    if (vs1.length) entries.push({ date, exercise: exercises[1], sets: vs1, supersetId: ssId })
    if (entries.length) onSave(entries)
  }

  // The 2px border is the emphasis weight (design-system §6) — this panel takes
  // over the capture slot, so it earns it. Colour cannot say so (§1).
  return (
    <Card className="border-2 border-ink">
      <div className="flex items-center gap-2 mb-3">
        <SSBadge />
        <SecTitle className="mb-0">Superset logger</SecTitle>
        {isDeload && <span className="ml-auto"><DeloadBadge /></span>}
      </div>

      {/* Header row */}
      <div className="grid gap-2 mb-1.5" style={{ gridTemplateColumns: '28px minmax(0,1fr) minmax(0,1fr)' }}>
        <div />
        {exercises.map((ex, i) => (
          <div key={i} className="text-center text-[11px] font-bold text-ink bg-hairline rounded-[3px] py-1.5 px-1 truncate">{ex}</div>
        ))}
      </div>

      {lp0 && <p className="text-[10px] text-ink-3 mb-0.5 pl-9">Last: {lp0.sets.map(s => `${s.weight}×${s.reps}`).join(' · ')}</p>}
      {lp1 && <p className="text-[10px] text-ink-3 mb-2 pl-9">Last: {lp1.sets.map(s => `${s.weight}×${s.reps}`).join(' · ')}</p>}

      {Array.from({ length: Math.min(revealed, Math.max(sets0.length, sets1.length)) }, (_, i) => (
        <div key={i} className="grid gap-2 mb-2 items-start" style={{ gridTemplateColumns: '28px minmax(0,1fr) minmax(0,1fr)' }}>
          <span className="text-[11px] text-ink-3 text-center pt-2.5">S{i + 1}</span>
          {([
            [sets0, setSets0] as const,
            [sets1, setSets1] as const,
          ]).map(([sets, setter], col) => (
            <div key={col} className="flex flex-col gap-1">
              <input
                value={sets[i]?.weight || ''}
                onChange={e => updateSet(setter, i, 'weight', e.target.value)}
                type="number" placeholder="kg" min="0" step="0.5"
                className={FIELD}
              />
              <input
                value={sets[i]?.reps || ''}
                onChange={e => updateSet(setter, i, 'reps', e.target.value)}
                type="number" placeholder="reps" min="1"
                className={FIELD}
              />
            </div>
          ))}
        </div>
      ))}

      <div className="flex gap-2 mt-2">
        {revealed < 8 && (
          <Btn variant="secondary" small onClick={revealNext}>+ Set</Btn>
        )}
        <Btn onClick={save} className="flex-1">Save superset</Btn>
        <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
      </div>
    </Card>
  )
}
