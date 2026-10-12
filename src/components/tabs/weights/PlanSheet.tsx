import { useState } from 'react'
import { useAppStore } from '../../../store/app'
import { today } from '../../../lib/utils'
import { BottomSheet } from '../home/BottomSheet'
import { Inp, SelEl, FIELD_LABEL } from '../../ui/Input'
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
  const plans = useAppStore(s => s.plans)

  const [ex, setEx] = useState(plan?.exercise ?? '')
  // A missed plan opens on today: editing it is a reschedule, and a plan's day
  // is today or later.
  const missed = !!plan && plan.date < today()
  const [date, setDate] = useState(plan && !missed ? plan.date : today())
  const [sets, setSets] = useState<SetStr[]>(plan?.targets.length ? toSetStr(plan.targets) : [{ weight: '', reps: '' }])
  const [revealed, setRevealed] = useState(plan?.targets.length || 1)

  // Superset with (RFC 0106): another open lift of the same day, or one this
  // plan is already grouped with. Moving a grouped plan to another day takes
  // its group along, so its partners stay on offer whatever the date.
  const partners = plans.filter(p => p.id !== plan?.id && !p.loggedAs
    && (p.date === date || (!!plan?.supersetId && p.supersetId === plan.supersetId)))
  const initialPartner = plan?.supersetId
    ? partners.find(p => p.supersetId === plan.supersetId)?.id ?? ''
    : ''
  const [partner, setPartner] = useState(initialPartner)
  const partnerOk = partner === '' || partners.some(p => p.id === partner)

  const valid = partnerOk && ex.trim() !== '' && date >= today() && !setsProblem(sets, revealed)

  const save = async () => {
    if (!valid) return
    const patch = { date, exercise: ex.trim(), targets: parseSets(sets, revealed) }
    const regroup = partner === initialPartner ? undefined : partner || null
    const ok = await withToast(
      () => (plan ? editPlan(plan.id, patch, regroup) : addPlan(patch, partner || undefined)),
      missed ? 'Rescheduled' : plan ? 'Plan updated' : 'Planned',
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
      label={missed ? 'Reschedule plan' : plan ? 'Edit plan' : 'Add to plan'}
      footer={
        <div className="flex gap-2">
          <Btn onClick={save} disabled={!valid} className="flex-1">Save plan</Btn>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        </div>
      }
    >
      <div className="flex flex-col gap-2.5">
        <div>
          <div className="text-[10px] font-bold tracking-[0.1em]">{missed ? 'RESCHEDULE' : plan ? 'EDIT PLAN' : 'ADD TO PLAN'}</div>
          <p className="text-[11px] text-ink-2 mt-0.5">
            {missed ? 'Missed. Pick a new day.' : plan ? 'Changes the plan, not your log.' : 'For today or a later day.'} Nothing counts until you log it.
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
        {(partners.length > 0 || partner !== '') && (
          <SelEl
            label="Superset with"
            value={partner}
            onChange={e => setPartner(e.target.value)}
            options={[
              { value: '', label: 'None' },
              ...partners.map(p => ({ value: p.id, label: p.exercise })),
            ]}
          />
        )}
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
