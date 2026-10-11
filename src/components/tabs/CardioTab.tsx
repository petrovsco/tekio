import { useRef, useState } from 'react'
import { useAppStore } from '../../store/app'
import { Card, SecTitle } from '../ui/Card'
import { FromPlanStrip } from '../ui/PlannedCard'
import { Toggle } from '../ui/Fields'
import { CardioLogForm } from './cardio/CardioLogForm'
import { SportLogForm } from './cardio/SportLogForm'
import { Progress } from './cardio/Progress'
import { SessionList } from './cardio/SessionList'
import { LENSES, type Lens } from './cardio/lens'
import { SessionPlanCard } from './plans/SessionPlanCard'
import { planTitle } from './plans/planText'
import { SessionPlanSheet } from './plans/SessionPlanSheet'
import type { PlannedKind, PlannedSession } from '../../types'

/** Cardio plans both kinds a cardio session can be (RFC 0104). */
const KINDS: PlannedKind[] = ['cardio', 'sport']

/**
 * Cardio is the single destination for endurance stimulus. Sports folded in
 * here (doctrine ledger, 2026-08-26): a sport session is a cardio session with
 * a name and a quality rating, so it is a second capture mode — not a second
 * section. The DB merge is deliberately a separate brief; these are still two
 * tables underneath.
 *
 * The mode used to switch the log form alone, so a sport form sat above a
 * running chart. It is now a lens over the whole screen (roadmap 076): every
 * card below reads the same choice.
 */
type LogMode = Exclude<Lens, 'all'>

const LOG_MODES: { value: LogMode; label: string }[] = [
  { value: 'cardio', label: 'Cardio' },
  { value: 'sport', label: 'Sport' },
]

export function CardioTab() {
  const [lens, setLens] = useState<Lens>('cardio')
  // Only asked under All, where the lens does not say which form to show.
  const [logMode, setLogMode] = useState<LogMode>('cardio')
  const mode = lens === 'all' ? logMode : lens
  const markSessionPlanLogged = useAppStore(s => s.markSessionPlanLogged)
  // The plan the form was filled from (RFC 0104): saving the form logs the
  // work and ticks the plan.
  const [fromPlan, setFromPlan] = useState<PlannedSession | null>(null)
  const [planSheet, setPlanSheet] = useState<{ plan?: PlannedSession } | null>(null)
  // Bumped when a plan is picked: the form remounts with the plan's targets.
  // Saving or unlinking leaves the form as it stands.
  const [formKey, setFormKey] = useState(0)
  const formRef = useRef<HTMLDivElement>(null)

  // The card lists every cardio and sport plan whatever the lens: a planned
  // game hidden behind a lens is a plan missed. Logging one moves the lens to
  // its kind, where its form is.
  const logFromPlan = (p: PlannedSession) => {
    const kind = p.kind === 'sport' ? 'sport' : 'cardio'
    if (lens !== 'all') setLens(kind)
    setLogMode(kind)
    setFromPlan(p)
    setFormKey(k => k + 1)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  // A plan of the other kind than the form showing is no plan for it.
  const plan = fromPlan?.kind === mode ? fromPlan : null
  const onLogged = async (entryId: string) => {
    if (plan) await markSessionPlanLogged(plan.id, plan.kind, entryId)
    setFromPlan(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <Toggle options={LENSES} value={lens} onPick={setLens} />

      <SessionPlanCard
        kinds={KINDS}
        onLog={logFromPlan}
        onEdit={p => setPlanSheet({ plan: p })}
        onAdd={() => setPlanSheet({})}
      />
      {planSheet && (
        <SessionPlanSheet
          plan={planSheet.plan}
          kinds={KINDS}
          defaultKind={mode}
          onClose={() => setPlanSheet(null)}
        />
      )}

      <div ref={formRef} className="scroll-mt-24"><Card>
        <SecTitle>Log session</SecTitle>
        {lens === 'all' && (
          <div className="mb-3">
            <Toggle options={LOG_MODES} value={logMode} onPick={setLogMode} />
          </div>
        )}
        {plan && <FromPlanStrip name={planTitle(plan)} onUnlink={() => setFromPlan(null)} />}
        {mode === 'cardio'
          ? <CardioLogForm key={formKey} plan={plan} onLogged={onLogged} />
          : <SportLogForm key={formKey} plan={plan} onLogged={onLogged} />}
      </Card></div>

      {/* Keyed by the lens: a chip or drill-down picked under Sport names
          nothing under Cardio, so each lens starts from its own All. */}
      <Progress key={`p-${lens}`} lens={lens} />

      <SessionList lens={lens} />
    </div>
  )
}
