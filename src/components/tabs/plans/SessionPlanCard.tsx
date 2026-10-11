import { useCallback } from 'react'
import { useAppStore } from '../../../store/app'
import { PlannedCard, PlanChips } from '../../ui/PlannedCard'
import { planTitle, planChips } from './planText'
import type { PlannedKind, PlannedSession } from '../../../types'

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

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
  onAdd: () => void
}) {
  const all = useAppStore(s => s.sessionPlans)
  const cardio = useAppStore(s => s.cardio)
  const sports = useAppStore(s => s.sports)
  const mobility = useAppStore(s => s.mobility)
  const removeSessionPlan = useAppStore(s => s.removeSessionPlan)
  const withToast = useAppStore(s => s.withToast)

  const plans = all.filter(p => kinds.includes(p.kind))

  // A link to an entry since deleted is no link: the database nulls it, and
  // the plan is a plan again here as there.
  const isLogged = useCallback((p: PlannedSession): boolean => {
    if (p.kind === 'cardio') {
      return cardio.some(e => e.id === p.loggedAs || (e.date === p.date && same(e.type, p.name)))
    }
    if (p.kind === 'sport') {
      return sports.some(e => e.id === p.loggedAs || (e.date === p.date && same(e.sport, p.name)))
    }
    return !!p.loggedAs && mobility.some(e => e.id === p.loggedAs)
  }, [cardio, sports, mobility])

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
      onAdd={onAdd}
    />
  )
}
