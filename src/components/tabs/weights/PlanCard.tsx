import { useAppStore } from '../../../store/app'
import { PlannedCard, PlanChips } from '../../ui/PlannedCard'
import type { PlannedExercise } from '../../../types'
import { fmtSet } from '@tekio/core'

/**
 * The day's planned exercises (RFC 0098), above the log form. A plan is a
 * prefill, never a log: "Log" hands its exercise and targets to the form, and
 * only saving the form makes it work. Each Log hands over that one plan, even
 * one planned in a superset: the form's switcher is where lifts are paired.
 */
export function PlanCard({ onForm, onLog, onEdit, onAdd }: {
  /** The plans already on the log form: they leave the card while there. */
  onForm: ReadonlySet<string>
  onLog: (plan: PlannedExercise) => void
  onEdit: (plan: PlannedExercise) => void
  /** Opens the plan sheet, for a new plan. */
  onAdd: () => void
}) {
  const plans = useAppStore(s => s.plans)
  const removePlan = useAppStore(s => s.removePlan)
  const withToast = useAppStore(s => s.withToast)

  return (
    <PlannedCard
      plans={plans}
      isLogged={isLogged}
      onForm={p => onForm.has(p.id)}
      foldKey="tekio.planCard.folded"
      title={p => p.exercise}
      details={p => <PlanChips items={p.targets.map(fmtSet)} />}
      onLog={onLog}
      onEdit={onEdit}
      onRemove={p => withToast(() => removePlan(p.id), 'Plan removed')}
      onAdd={onAdd}
    />
  )
}

const isLogged = (p: PlannedExercise) => !!p.loggedAs
