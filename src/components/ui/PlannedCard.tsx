import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import { today } from '@tekio/core'
import { fmtDate } from '../../lib/utils'
import { Card } from './Card'
import { FIELD_LABEL } from './Input'
import { DelBtn, ACT_CHIP } from './Button'
import { Icon } from './Icon'
import { MicroLabel, MICRO_LABEL, SSBadge } from './Badges'
import { groupRuns, groupName } from '../../lib/supersets'
import { whileReloading } from '../../lib/staleChunk'
import type { WeekAdd } from './WeekSheet'
import { WeekStrip } from './WeekStrip'
import { useWeekItems } from '../../hooks/useWeekItems'
import type { WeekKind } from '../../lib/week'
import { usePrefs } from '../../store/prefs'
import { startOfWeek, addDays } from '../../lib/utils'

// The week (RFC 0114) opens on intent, so its chunk and the plan preview it
// reads stay off the tab until the door is tapped (P1).
const WeekSheet = lazy(() => import('./WeekSheet').then(whileReloading))


/** What every plan has, whatever it plans: a lift (RFC 0098) or a cardio,
 *  sport or mobility session (RFC 0104). */
interface Plan {
  id: string
  date: string
  plannedBy: 'user' | 'agent'
}

/** The fold is remembered per device and per card: a blocked or empty storage
 *  just opens the card. */
/** Where another kind's plans are logged, for the "Also that day" line. */
const TAB_OF: Record<WeekKind, string> = { lifts: 'Weights', cardio: 'Cardio', sport: 'Cardio', mobility: 'Mobility' }

const readFolded = (key: string): boolean => {
  try { return localStorage.getItem(key) === '1' } catch { return false }
}
const writeFolded = (key: string, v: boolean) => {
  try { localStorage.setItem(key, v ? '1' : '0') } catch { /* stays open next time */ }
}

/**
 * The yellow Planned card a capture tab carries above its log form. A plan is
 * a prefill, never a log: "Log" hands it to the form, and only saving the form
 * makes it work. The week strip picks the day the card lists (RFC 0114); a
 * missed plan's day stays a chip below it until the week ends, to move
 * the plan to another day or remove it, and is then deleted. Each tab supplies its plans, how one reads, and when one counts
 * as logged.
 */
export function PlannedCard<P extends Plan>({ plans, isLogged, onForm, foldKey, title, details, groupOf, onLog, onLogGroup, onEdit, onRemove, onAdd, weekAdds, kinds }: {
  plans: P[]
  /** A logged plan has become work: it leaves the card, and the tab's history
   *  shows it like any other entry. */
  isLogged: (plan: P) => boolean
  /** A plan already on the tab's log form leaves the card while it is there,
   *  so it shows in one place; taking it off the form brings it back. */
  onForm?: (plan: P) => boolean
  /** localStorage key for the fold. */
  foldKey: string
  /** The plan's name, on its row and in the not-logged line. */
  title: (plan: P) => string
  /** Its targets, under the name. */
  details: (plan: P) => ReactNode
  /** The superset or circuit a plan belongs to (RFC 0106): plans sharing one
   *  are drawn as one block. */
  groupOf?: (plan: P) => string | undefined
  /** Log on a row hands that plan alone to the form, even inside a block. */
  onLog: (plan: P) => void
  /** The block's own button hands the whole group to the form. */
  onLogGroup?: (plans: P[]) => void
  /** Opens the plan sheet on this plan; on a missed one, that is a reschedule. */
  onEdit: (plan: P) => void
  onRemove: (plan: P) => void
  /** Opens the plan sheet, for a new plan; on the picked day when it is not today. */
  onAdd: (date?: string) => void
  /** What the week's days can add from this tab (RFC 0114). */
  weekAdds: WeekAdd[]
  /** The kinds this tab plans, for the strip's marks (RFC 0114). */
  kinds: WeekKind[]
}) {
  // The week strip (RFC 0114, option A): the card lists the picked day, today
  // until another is tapped.
  const t = today()
  const weekStartDay = usePrefs(s => s.weekStartDay)
  const thisWeek = startOfWeek(t, weekStartDay)
  const [weekStart, setWeekStart] = useState(thisWeek)
  const [day, setDay] = useState(t)
  const items = useWeekItems()
  const page = (by: number) => {
    const next = addDays(weekStart, by)
    setWeekStart(next)
    // The week of today lands on today; another on its first day.
    setDay(next === thisWeek ? t : next)
  }

  const { todays, doneToday, formToday, later, missed, dayOpen, dayLogged } = useMemo(() => {
    const byDay = (a: P, b: P) => a.date.localeCompare(b.date)
    const open = plans.filter(p => !isLogged(p) && !onForm?.(p))
    return {
      todays: open.filter(p => p.date === t),
      doneToday: plans.some(p => p.date === t && isLogged(p)),
      formToday: plans.some(p => p.date === t && !isLogged(p) && onForm?.(p)),
      later: open.filter(p => p.date > t).sort(byDay),
      missed: open.filter(p => p.date < t && p.date >= thisWeek).sort(byDay),
      dayOpen: open.filter(p => p.date === day),
      dayLogged: plans.some(p => p.date === day && isLogged(p)),
    }
  }, [plans, isLogged, onForm, day, t, thisWeek])
  // A missed day off the picked one, as a chip that picks it.
  const missedDays = [...new Set(missed.map(p => p.date))].filter(d => d !== day)
  const pick = (d: string) => { setWeekStart(startOfWeek(d, weekStartDay)); setDay(d) }
  const elsewhere = items.filter(i => i.date === day && !kinds.includes(i.kind) && !i.logged)

  const [folded, setFolded] = useState(() => readFolded(foldKey))
  const toggle = () => setFolded(f => { writeFolded(foldKey, !f); return !f })
  const [week, setWeek] = useState(false)
  const adds = weekAdds.map(a => ({ ...a, onAdd: (d: string) => { setWeek(false); a.onAdd(d) } }))
  const summary = todays.length > 0
    ? `${todays.length} today`
    : later.length > 0 ? `${later.length} later`
    : missed.length > 0 ? `${missed.length} missed` : 'nothing planned'

  const row = (p: P, when?: string, isMissed = false, canLog = !when) => (
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
        {canLog && (
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
  // Today's block can be logged whole; Log on one row overrides the plan.
  const rows = (ps: P[], when?: (p: P) => string, isMissed = false, canLog = !when) =>
    groupRuns(ps, p => groupOf?.(p)).map(run => run.length === 1
      ? row(run[0], when?.(run[0]), isMissed, canLog)
      : (
        <div key={run[0].id} className="my-1.5 border border-planned rounded-[3px] px-2.5 pt-2">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <SSBadge />
              <span className={MICRO_LABEL}>{groupName(run.length)}</span>
            </span>
            {canLog && onLogGroup && (
              <button className={ACT_CHIP} onClick={() => onLogGroup(run)}>Log {groupName(run.length).toLowerCase()}</button>
            )}
          </div>
          {run.map(p => row(p, when?.(p), isMissed, canLog))}
        </div>
      ))

  return (
    <Card className="!bg-planned-tint !border-planned">
      <div className={`flex items-center gap-3 ${folded ? '' : 'mb-2'}`}>
        <button
          onClick={toggle}
          aria-expanded={!folded}
          className="flex-1 min-w-0 flex items-center justify-between cursor-pointer"
        >
          <span className={FIELD_LABEL}>Planned</span>
          <span className="text-[11px] text-ink-2">{folded && summary}</span>
        </button>
        <button onClick={() => setWeek(true)} className="flex items-center gap-1 text-[11px] font-semibold text-ink cursor-pointer">
          <Icon name="list" size={13} /> Week
        </button>
        <button onClick={toggle} aria-label={folded ? 'Open the plan' : 'Fold the plan'} className="text-ink-2 cursor-pointer">
          <Icon name={folded ? 'chevronDown' : 'chevronUp'} size={14} />
        </button>
      </div>
      {week && (
        <Suspense fallback={null}>
          <WeekSheet adds={adds} onClose={() => setWeek(false)} />
        </Suspense>
      )}
      {!folded && <>
      <WeekStrip start={weekStart} thisWeek={thisWeek} selected={day} kinds={kinds} items={items} onSelect={setDay} onPage={page} />
      <div className="border-t border-planned/40 pt-2">
      <span className={MICRO_LABEL}>{day === t ? 'Today' : fmtDate(day, { weekday: true, relative: false })}</span>
      {day === t
        ? todays.length > 0
          ? rows(todays)
          : <p className="text-[11px] text-ink-3 py-1">{formToday ? 'The rest of today\'s plan is on the log form.' : doneToday ? 'All of today\'s plan is logged.' : 'Nothing planned today.'}</p>
        : dayOpen.length > 0
          ? rows(dayOpen, undefined, day < t, false)
          : <p className="text-[11px] text-ink-3 py-1">{dayLogged ? 'All of that day\'s plan is logged.' : 'Nothing planned that day.'}</p>}
      {elsewhere.length > 0 && (
        <p className="text-[11px] text-ink-2 mt-1.5">
          Also that day: {elsewhere.map((o, i) => (
            <span key={o.id}>{i > 0 && ', '}<span className="font-semibold text-ink">{o.title}</span>{o.title !== TAB_OF[o.kind] && ` on ${TAB_OF[o.kind]}`}</span>
          ))}
        </p>
      )}
      {/* Missed plans are not listed here (RFC 0114): each missed day is a
          chip that opens it, where its plans can be rescheduled or removed. */}
      {missedDays.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="text-[11px] text-ink-2 mr-0.5">Missed</span>
          {missedDays.map(d => (
            <button key={d} className={ACT_CHIP} onClick={() => pick(d)}>{fmtDate(d, { weekday: true, relative: false, year: 'never' })}</button>
          ))}
        </div>
      )}
      {/* A plan's day is today or later: from a past day, the door plans today. */}
      <button onClick={() => onAdd(day > t ? day : undefined)} className="mt-2 text-[11px] font-semibold text-ink underline underline-offset-2 cursor-pointer">
        + Add to {day > t ? fmtDate(day, { weekday: true, relative: false, year: 'never' }) : 'today'}
      </button>
      </div>
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
