import { useMemo, useState, type ReactNode } from 'react'
import { today, daysBetween } from '@tekio/core'
import { fmtDate } from '../../lib/utils'
import { MISSED_PLAN_KEPT_DAYS } from '../../constants/app'
import { Card } from './Card'
import { FIELD_LABEL } from './Input'
import { DelBtn, ACT_CHIP } from './Button'
import { Icon } from './Icon'
import { MicroLabel, MICRO_LABEL, SSBadge } from './Badges'
import { groupRuns, groupName } from '../../lib/supersets'


/** What every plan has, whatever it plans: a lift (RFC 0098) or a cardio,
 *  sport or mobility session (RFC 0104). */
interface Plan {
  id: string
  date: string
  plannedBy: 'user' | 'agent'
}

/** The fold is remembered per device and per card: a blocked or empty storage
 *  just opens the card. */
const readFolded = (key: string): boolean => {
  try { return localStorage.getItem(key) === '1' } catch { return false }
}
const writeFolded = (key: string, v: boolean) => {
  try { localStorage.setItem(key, v ? '1' : '0') } catch { /* stays open next time */ }
}

/**
 * The yellow Planned card a capture tab carries above its log form. A plan is
 * a prefill, never a log: "Log" hands it to the form, and only saving the form
 * makes it work. Later days are listed so a plan made ahead can be checked;
 * a missed plan stays a week, to be moved to another day or removed, and is
 * then deleted. Each tab supplies its plans, how one reads, and when one counts
 * as logged.
 */
export function PlannedCard<P extends Plan>({ plans, isLogged, foldKey, title, details, groupOf, onLog, onEdit, onRemove, onAdd }: {
  plans: P[]
  /** A logged plan has become work: it leaves the card, and the tab's history
   *  shows it like any other entry. */
  isLogged: (plan: P) => boolean
  /** localStorage key for the fold. */
  foldKey: string
  /** The plan's name, on its row and in the not-logged line. */
  title: (plan: P) => string
  /** Its targets, under the name. */
  details: (plan: P) => ReactNode
  /** The superset or circuit a plan belongs to (RFC 0106): plans sharing one
   *  are drawn as one block. */
  groupOf?: (plan: P) => string | undefined
  onLog: (plan: P) => void
  /** Opens the plan sheet on this plan; on a missed one, that is a reschedule. */
  onEdit: (plan: P) => void
  onRemove: (plan: P) => void
  /** Opens the plan sheet, for a new plan. */
  onAdd: () => void
}) {
  const { todays, doneToday, later, missed } = useMemo(() => {
    const t = today()
    const byDay = (a: P, b: P) => a.date.localeCompare(b.date)
    const open = plans.filter(p => !isLogged(p))
    return {
      todays: open.filter(p => p.date === t),
      doneToday: plans.some(p => p.date === t && isLogged(p)),
      later: open.filter(p => p.date > t).sort(byDay),
      missed: open.filter(p => p.date < t && daysBetween(p.date, t) <= MISSED_PLAN_KEPT_DAYS).sort(byDay),
    }
  }, [plans, isLogged])

  const [folded, setFolded] = useState(() => readFolded(foldKey))
  const toggle = () => setFolded(f => { writeFolded(foldKey, !f); return !f })
  const summary = todays.length > 0
    ? `${todays.length} today`
    : later.length > 0 ? `${later.length} later`
    : missed.length > 0 ? `${missed.length} missed` : 'nothing planned'

  const row = (p: P, when?: string, isMissed = false) => (
    <div key={p.id} className="flex items-start justify-between gap-2 py-2 border-b border-hairline last:border-0">
      <div className="min-w-0">
        <p className="text-xs font-bold flex items-center gap-1.5 flex-wrap text-ink">
          {title(p)}
          {p.plannedBy === 'agent' && <MicroLabel>Agent</MicroLabel>}
        </p>
        {details(p)}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {when && <span className="text-[11px] text-ink-3 tabular-nums">{when}</span>}
        {!when && (
          <button className={ACT_CHIP} onClick={() => onLog(p)}>Log</button>
        )}
        {isMissed ? (
          <button className={ACT_CHIP} onClick={() => onEdit(p)}>Reschedule</button>
        ) : (
          <button
            aria-label="Edit plan"
            onClick={() => onEdit(p)}
            className="w-7 h-7 flex items-center justify-center text-ink-3 hover:text-ink rounded-[2px] cursor-pointer transition-colors"
          >
            <Icon name="edit" size={13} />
          </button>
        )}
        <DelBtn label="Remove plan" onClick={() => onRemove(p)} />
      </div>
    </div>
  )

  // A group is drawn where its first plan stands, its plans as rows inside.
  const rows = (ps: P[], when?: (p: P) => string, isMissed = false) =>
    groupRuns(ps, p => groupOf?.(p)).map(run => run.length === 1
      ? row(run[0], when?.(run[0]), isMissed)
      : (
        <div key={run[0].id} className="my-1.5 border border-planned rounded-[3px] px-2.5 pt-2">
          <div className="flex items-center gap-1.5">
            <SSBadge />
            <span className={MICRO_LABEL}>{groupName(run.length)}</span>
          </div>
          {run.map(p => row(p, when?.(p), isMissed))}
        </div>
      ))

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
        ? rows(todays)
        : <p className="text-[11px] text-ink-3 py-1">{doneToday ? 'All of today\'s plan is logged.' : 'Nothing planned today.'}</p>}
      {later.length > 0 && (
        <div className="mt-3">
          <span className={MICRO_LABEL}>Later</span>
          {rows(later, p => fmtDate(p.date))}
        </div>
      )}
      {missed.length > 0 && (
        <div className="mt-3">
          <span className={MICRO_LABEL}>Missed</span>
          {rows(missed, p => fmtDate(p.date), true)}
        </div>
      )}
      <button onClick={onAdd} className="mt-2 text-[11px] font-semibold text-ink underline underline-offset-2 cursor-pointer">
        + Add to plan
      </button>
      </>}
    </Card>
  )
}

/** Targets drawn dashed in the planned yellow (design-system §1): these have
 *  not happened. */
export function PlanChips({ items }: { items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {items.map((s, i) => (
        <span key={i} className="px-1.5 py-0.5 rounded-[2px] border border-dashed border-planned bg-white text-[10px] text-ink-2 tabular-nums">
          {s}
        </span>
      ))}
    </div>
  )
}

/** The strip over a log form filled from a plan: saving the form logs the work
 *  and ticks the plan; Unlink keeps the numbers and forgets the plan. A form
 *  can put its own control in Unlink's place (`action`). One line always: a
 *  long name is cut short rather than pushing the control onto a second. */
export function FromPlanStrip({ name, onUnlink, action }: { name: string; onUnlink?: () => void; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 mb-2.5 border border-dashed border-planned bg-planned-tint rounded-[3px]">
      <span className="min-w-0 truncate text-[11px] leading-snug text-ink-2">From today's plan: <span className="font-bold text-ink">{name}</span></span>
      <span className="shrink-0 flex items-center whitespace-nowrap text-[11px] leading-snug">
        {action ?? <button className="text-[11px] text-ink-3 hover:text-ink cursor-pointer" onClick={onUnlink}>Unlink</button>}
      </span>
    </div>
  )
}
