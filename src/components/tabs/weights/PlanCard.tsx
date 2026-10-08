import { useMemo, useState } from 'react'
import { useAppStore } from '../../../store/app'
import { today, daysBetween, fmtDate, DATE_DAY_MONTH } from '../../../lib/utils'
import { Card } from '../../ui/Card'
import { FIELD_LABEL } from '../../ui/Input'
import { DelBtn, ACT_CHIP } from '../../ui/Button'
import { Icon } from '../../ui/Icon'
import { MicroLabel, MICRO_LABEL } from '../../ui/Badges'
import type { PlannedExercise } from '../../../types'

/** Where the fold is remembered: a per-device convenience, so a blocked or
 *  empty storage just opens the card. */
const FOLD_KEY = 'tekio.planCard.folded'
const readFolded = (): boolean => {
  try { return localStorage.getItem(FOLD_KEY) === '1' } catch { return false }
}
const writeFolded = (v: boolean) => {
  try { localStorage.setItem(FOLD_KEY, v ? '1' : '0') } catch { /* stays open next time */ }
}

/** How many days an unlogged plan stays listed as not logged before it drops
 *  off the screen. Display only: a plan never counts, whatever its age. */
const EXPIRED_SHOWN_DAYS = 7

/** Targets, drawn dashed in the planned yellow (design-system §1): these sets
 *  have not happened. */
function TargetSets({ plan }: { plan: PlannedExercise }) {
  if (plan.targets.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {plan.targets.map((s, i) => (
        <span key={i} className="px-1.5 py-0.5 rounded-[2px] border border-dashed border-planned bg-white text-[10px] text-ink-2 tabular-nums">
          {s.weight}kg×{s.reps}
        </span>
      ))}
    </div>
  )
}

/**
 * The day's planned exercises (RFC 0098), above the log form. A plan is a
 * prefill, never a log: "Log" hands its exercise and targets to the form, and
 * only saving the form makes it work. Later days are listed so a plan made
 * ahead can be checked; earlier days' unlogged plans get one quiet line.
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

  const { todays, doneToday, later, expired } = useMemo(() => {
    const t = today()
    const byDay = (a: PlannedExercise, b: PlannedExercise) => a.date.localeCompare(b.date)
    // A logged plan has become work: it leaves the card, and the log form's
    // history below shows it like any other entry.
    const open = plans.filter(p => !p.loggedAs)
    return {
      todays: open.filter(p => p.date === t),
      doneToday: plans.some(p => p.date === t && p.loggedAs),
      later: open.filter(p => p.date > t).sort(byDay),
      expired: open.filter(p => p.date < t && daysBetween(p.date, t) <= EXPIRED_SHOWN_DAYS).sort(byDay),
    }
  }, [plans])

  const [folded, setFolded] = useState(readFolded)
  const toggle = () => setFolded(f => { writeFolded(!f); return !f })
  const summary = todays.length > 0
    ? `${todays.length} today`
    : later.length > 0 ? `${later.length} later` : 'nothing planned'

  const remove = (id: string) => withToast(() => removePlan(id), 'Plan removed')

  const row = (p: PlannedExercise, when?: string) => (
    <div key={p.id} className="flex items-start justify-between gap-2 py-2 border-b border-hairline last:border-0">
      <div className="min-w-0">
        <p className="text-xs font-bold flex items-center gap-1.5 flex-wrap text-ink">
          {p.exercise}
          {p.plannedBy === 'agent' && <MicroLabel>Agent</MicroLabel>}
        </p>
        <TargetSets plan={p} />
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {when && <span className="text-[11px] text-ink-3 tabular-nums">{when}</span>}
        {!when && (
          <button className={ACT_CHIP} onClick={() => onLog(p)}>Log</button>
        )}
        <button
          aria-label="Edit plan"
          onClick={() => onEdit(p)}
          className="w-7 h-7 flex items-center justify-center text-ink-3 hover:text-ink rounded-[2px] cursor-pointer transition-colors"
        >
          <Icon name="edit" size={13} />
        </button>
        <DelBtn label="Remove plan" onClick={() => remove(p.id)} />
      </div>
    </div>
  )

  return (
    <Card className="!bg-planned-tint !border-planned">
      <button
        onClick={toggle}
        aria-expanded={!folded}
        className={`w-full flex items-center justify-between cursor-pointer ${folded ? '' : 'mb-2'}`}
      >
        <span className={FIELD_LABEL}>Planned</span>
        <span className="flex items-center gap-1 text-[11px] text-ink-2">
          {folded && summary}
          <Icon name={folded ? 'chevronDown' : 'chevronUp'} size={14} />
        </span>
      </button>
      {!folded && <>
      <span className={MICRO_LABEL}>Today</span>
      {todays.length > 0
        ? todays.map(p => row(p))
        : <p className="text-[11px] text-ink-3 py-1">{doneToday ? 'All of today\'s plan is logged.' : 'Nothing planned today.'}</p>}
      {later.length > 0 && (
        <div className="mt-3">
          <span className={MICRO_LABEL}>Later</span>
          {later.map(p => row(p, fmtDate(p.date, DATE_DAY_MONTH)))}
        </div>
      )}
      {expired.length > 0 && (
        <p className="mt-2 text-[10px] text-ink-3 leading-snug">
          Not logged: {expired.map(p => `${p.exercise} (${fmtDate(p.date, DATE_DAY_MONTH)})`).join(', ')}
        </p>
      )}
      <button onClick={onAdd} className="mt-2 text-[11px] font-semibold text-ink underline underline-offset-2 cursor-pointer">
        + Add to plan
      </button>
      </>}
    </Card>
  )
}
