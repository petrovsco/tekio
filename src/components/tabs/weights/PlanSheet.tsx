import { useState } from 'react'
import { useAppStore } from '../../../store/app'
import { today } from '../../../lib/utils'
import { BottomSheet } from '../home/BottomSheet'
import { Inp, FIELD_LABEL } from '../../ui/Input'
import { Btn } from '../../ui/Button'
import { SmartInput } from '../../ui/SmartInput'
import { SetsGrid } from '../../ui/SetsGrid'
import { toSetStr, parseSets, setsProblem, type SetStr } from '../../../lib/sets'
import type { ExerciseAlias, PlannedExercise } from '../../../types'

/**
 * Write or rewrite a plan (RFC 0098), in a sheet over Weights so the log form
 * underneath stays a log form. Saving logs nothing: a plan counts for nothing
 * until it is logged. The day is today or later — work on a past day either
 * happened, and is logged, or it did not.
 */
export function PlanSheet({ plan, suggestions, aliases, onClose }: {
  /** The plan to edit; absent writes a new one. */
  plan?: PlannedExercise
  suggestions: string[]
  aliases: ExerciseAlias[]
  onClose: () => void
}) {
  const addPlan = useAppStore(s => s.addPlan)
  const editPlan = useAppStore(s => s.editPlan)
  const withToast = useAppStore(s => s.withToast)

  const [ex, setEx] = useState(plan?.exercise ?? '')
  const [date, setDate] = useState(plan?.date ?? today())
  const [sets, setSets] = useState<SetStr[]>(plan?.targets.length ? toSetStr(plan.targets) : [{ weight: '', reps: '' }])
  const [revealed, setRevealed] = useState(plan?.targets.length || 1)

  const valid = ex.trim() !== '' && date >= today() && !setsProblem(sets, revealed)

  const save = async () => {
    if (!valid) return
    const patch = { date, exercise: ex.trim(), targets: parseSets(sets, revealed) }
    const ok = await withToast(
      () => (plan ? editPlan(plan.id, patch) : addPlan(patch)),
      plan ? 'Plan updated' : 'Planned',
    )
    if (ok) onClose()
  }

  const revealNext = () => {
    const n = revealed + 1
    if (n > sets.length) setSets(p => [...p, { weight: p[p.length - 1]?.weight || '', reps: '' }])
    setRevealed(n)
  }

  return (
    <BottomSheet
      onClose={onClose}
      label={plan ? 'Edit plan' : 'Add to plan'}
      footer={
        <div className="flex gap-2">
          <Btn onClick={save} disabled={!valid} className="flex-1">Save plan</Btn>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        </div>
      }
    >
      <div className="flex flex-col gap-2.5">
        <div>
          <div className="text-[10px] font-bold tracking-[0.1em]">{plan ? 'EDIT PLAN' : 'ADD TO PLAN'}</div>
          <p className="text-[11px] text-ink-2 mt-0.5">
            {plan ? 'Changes the plan, not your log.' : 'For today or a later day.'} Nothing counts until you log it.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <label className={FIELD_LABEL}>Exercise</label>
          <SmartInput
            value={ex}
            onChange={setEx}
            onPick={setEx}
            suggestions={suggestions}
            aliases={aliases}
            placeholder="e.g. Bench Press"
          />
        </div>
        <Inp label="Date" type="date" min={today()} value={date} onChange={e => setDate(e.target.value)} />
        <div>
          <div className={`${FIELD_LABEL} mb-1`}>Targets</div>
          <SetsGrid
            sets={sets}
            revealed={revealed}
            onUpdate={(i, f, v) => setSets(p => p.map((s, idx) => (idx === i ? { ...s, [f]: v } : s)))}
            onRemove={i => { setSets(p => p.filter((_, idx) => idx !== i)); setRevealed(r => Math.max(1, r - 1)) }}
            onRevealNext={revealNext}
          />
        </div>
      </div>
    </BottomSheet>
  )
}
