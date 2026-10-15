import { useAppStore } from '../../../store/app'
import { PlannedCard, PlanChips } from '../../ui/PlannedCard'
import type { PlannedExercise } from '../../../types'
import { fmtSet } from '../../../lib/sets'

/**
 * The day's planned exercises (RFC 0098), above the log form. A plan is a
 * prefill, never a log: "Log" hands its exercise and targets to the form, and
 * only saving the form makes it work.
 */
export function PlanCard({ onLog, onEdit, onAdd }: {
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
      foldKey="tekio.planCard.folded"
      title={p => p.exercise}
      details={p => <PlanChips items={p.targets.map(fmtSet)} />}
      groupOf={p => p.supersetId}
      onLog={onLog}
      onEdit={onEdit}
      onRemove={p => withToast(() => removePlan(p.id), 'Plan removed')}
      onAdd={onAdd}
    />
  )
}

const isLogged = (p: PlannedExercise) => !!p.loggedAs
