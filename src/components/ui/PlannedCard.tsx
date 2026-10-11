import { useMemo, useState, type ReactNode } from 'react'
import { today, daysBetween, fmtDate } from '../../lib/utils'
import { Card } from './Card'
import { FIELD_LABEL } from './Input'
import { DelBtn, ACT_CHIP } from './Button'
import { Icon } from './Icon'
import { MicroLabel, MICRO_LABEL } from './Badges'

/** How many days an unlogged plan stays listed as not logged before it drops
 *  off the screen. Display only: a plan never counts, whatever its age. */
const EXPIRED_SHOWN_DAYS = 7

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
 * earlier days' unlogged plans get one quiet line. Each tab supplies its plans,
 * how one reads, and when one counts as logged.
 */
export function PlannedCard<P extends Plan>({ plans, isLogged, foldKey, title, details, onLog, onEdit, onRemove, onAdd }: {
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
  onLog: (plan: P) => void
  onEdit: (plan: P) => void
  onRemove: (plan: P) => void
  /** Opens the plan sheet, for a new plan. */
  onAdd: () => void
}) {
  const { todays, doneToday, later, expired } = useMemo(() => {
    const t = today()
    const byDay = (a: P, b: P) => a.date.localeCompare(b.date)
    const open = plans.filter(p => !isLogged(p))
    return {
      todays: open.filter(p => p.date === t),
      doneToday: plans.some(p => p.date === t && isLogged(p)),
      later: open.filter(p => p.date > t).sort(byDay),
      expired: open.filter(p => p.date < t && daysBetween(p.date, t) <= EXPIRED_SHOWN_DAYS).sort(byDay),
    }
  }, [plans, isLogged])

  const [folded, setFolded] = useState(() => readFolded(foldKey))
  const toggle = () => setFolded(f => { writeFolded(foldKey, !f); return !f })
  const summary = todays.length > 0
    ? `${todays.length} today`
    : later.length > 0 ? `${later.length} later` : 'nothing planned'

  const row = (p: P, when?: string) => (
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
        <button
          aria-label="Edit plan"
          onClick={() => onEdit(p)}
          className="w-7 h-7 flex items-center justify-center text-ink-3 hover:text-ink rounded-[2px] cursor-pointer transition-colors"
        >
          <Icon name="edit" size={13} />
        </button>
        <DelBtn label="Remove plan" onClick={() => onRemove(p)} />
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
          {later.map(p => row(p, fmtDate(p.date)))}
        </div>
      )}
      {expired.length > 0 && (
        <p className="mt-2 text-[10px] text-ink-3 leading-snug">
          Not logged: {expired.map(p => `${title(p)} (${fmtDate(p.date, { midSentence: true })})`).join(', ')}
        </p>
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
 *  and ticks the plan; Unlink keeps the numbers and forgets the plan. */
export function FromPlanStrip({ name, onUnlink }: { name: string; onUnlink: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 mb-2.5 border border-dashed border-planned bg-planned-tint rounded-[3px]">
      <span className="text-[11px] text-ink-2">From today's plan: <span className="font-bold text-ink">{name}</span></span>
      <button className="text-[11px] text-ink-3 hover:text-ink cursor-pointer" onClick={onUnlink}>Unlink</button>
    </div>
  )
}
