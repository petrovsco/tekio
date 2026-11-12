import { useCallback } from 'react'
import { useAppStore } from '../../../store/app'
import { PlannedCard, PlanChips } from '../../ui/PlannedCard'
import { planTitle, planChips } from './planText'
import { sessionPlanLogged } from '../../../lib/week'
import type { PlannedKind, PlannedSession } from '../../../types'

const KIND_LABEL: Record<PlannedKind, string> = { cardio: 'Cardio', sport: 'Sport', mobility: 'Mobility' }

/**
 * Planned sessions (RFC 0104) on Cardio or Mobility: the Weights card's frame,
 * filled with this tab's kinds. A plan leaves the card when it is logged from
 * it, or, for cardio and sport, when a session of the same type or sport lands
 * on its day by any route, a Garmin sync included: that work happened.
 */
export function SessionPlanCard({ kinds, onLog, onEdit, onAdd }: {
  kinds: PlannedKind[]
  onLog: (plan: PlannedSession) => void
  onEdit: (plan: PlannedSession) => void
  /** Opens the plan sheet, for a new plan; from the week, on that day and kind. */
  onAdd: (date?: string, kind?: PlannedKind) => void
}) {
  const all = useAppStore(s => s.sessionPlans)
  const cardio = useAppStore(s => s.cardio)
  const sports = useAppStore(s => s.sports)
  const mobility = useAppStore(s => s.mobility)
  const removeSessionPlan = useAppStore(s => s.removeSessionPlan)
  const withToast = useAppStore(s => s.withToast)

  const plans = all.filter(p => kinds.includes(p.kind))

  const isLogged = useCallback(
    (p: PlannedSession) => sessionPlanLogged(p, { cardio, sports, mobility }),
    [cardio, sports, mobility],
  )

  return (
    <PlannedCard
      plans={plans}
      isLogged={isLogged}
      foldKey={`tekio.planCard.${kinds.join('-')}.folded`}
      title={planTitle}
      details={p => <>
        <PlanChips items={planChips(p)} />
        {p.notes && <p className="text-[11px] text-ink-2 mt-1">{p.notes}</p>}
      </>}
      onLog={onLog}
      onEdit={onEdit}
      onRemove={p => withToast(() => removeSessionPlan(p.id), 'Plan removed')}
      onAdd={d => onAdd(d)}
      kinds={kinds}
      weekAdds={kinds.map(k => ({ label: KIND_LABEL[k], onAdd: (d: string) => onAdd(d, k) }))}
    />
  )
}
