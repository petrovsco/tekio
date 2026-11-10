import { useMemo, useState } from 'react'
import { today } from '@tekio/core'
import { useAppStore } from '../../store/app'
import { usePrefs } from '../../store/prefs'
import { fmtDate, startOfWeek, addDays } from '../../lib/utils'
import { weekItems, weekDays, weekRange, moveTargets, openLiftsAhead, type WeekItem, type WeekKind } from '../../lib/week'
import { planPreview } from '../../lib/planPreview'
import { BottomSheet } from '../tabs/home/BottomSheet'
import { muscleShort } from '../tabs/home/GapMap'
import { MicroLabel, MICRO_LABEL } from './Badges'
import { ACT_CHIP } from './Button'
import { Icon } from './Icon'
import type { PlannedSession } from '../../types'
import type { SessionPlanPatch } from '../../lib/db/sessionPlans'

/** What a tab can add to a day from the week: its own kinds, in its own plan
 *  sheet, opened on that day. */
export interface WeekAdd {
  label: string
  onAdd: (date: string) => void
}

const KIND_LABEL: Record<WeekKind, string> = { lifts: 'Lifts', cardio: 'Cardio', sport: 'Sport', mobility: 'Mobility' }
const KIND_ORDER: WeekKind[] = ['lifts', 'cardio', 'sport', 'mobility']

const joinNames = (names: string[]): string =>
  names.length <= 1 ? names[0] ?? '' : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

const weekday = (d: string) => fmtDate(d, { weekday: true, relative: false }).split(' ')[0]
const dayNum = (d: string) => Number(d.slice(8))

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === 'left' ? 'M14.5 6 8.5 12l6 6' : 'M9.5 6l6 6-6 6'} />
    </svg>
  )
}

/**
 * The week of plans (RFC 0114): seven days of every kind, lifts, cardio, sport
 * and mobility, whichever tab plans them. A day opens to move its plans to
 * another day or to add one; today's plans are still logged from their card.
 * Over the days still to come, one line says what the week's plan would leave
 * short: the preview Home prints for today's plan (RFC 0098), over the week.
 */
export default function WeekSheet({ adds, onClose }: { adds: WeekAdd[]; onClose: () => void }) {
  const plans = useAppStore(s => s.plans)
  const sessions = useAppStore(s => s.sessionPlans)
  const cardio = useAppStore(s => s.cardio)
  const sports = useAppStore(s => s.sports)
  const mobility = useAppStore(s => s.mobility)
  const weights = useAppStore(s => s.weights)
  const exerciseMuscles = useAppStore(s => s.exerciseMuscles)
  const aliases = useAppStore(s => s.exerciseAliases)
  const muscleGroups = useAppStore(s => s.muscleGroups)
  const editPlan = useAppStore(s => s.editPlan)
  const editSessionPlan = useAppStore(s => s.editSessionPlan)
  const withToast = useAppStore(s => s.withToast)
  const weekStartDay = usePrefs(s => s.weekStartDay)

  const t = today()
  const thisWeek = startOfWeek(t, weekStartDay)
  const [start, setStart] = useState(thisWeek)
  const [open, setOpen] = useState<string | null>(null)
  const [moving, setMoving] = useState<string | null>(null)
  const days = weekDays(start)

  const items = useMemo(() => weekItems(plans, sessions, { cardio, sports, mobility }), [plans, sessions, cardio, sports, mobility])
  const inWeek = items.filter(i => i.date >= days[0] && i.date <= days[6])
  const byAgent = inWeek.filter(i => i.plannedBy === 'agent').length

  const preview = useMemo(() => {
    const ahead = openLiftsAhead(plans, days, t)
    return ahead.length ? planPreview({ plans: ahead, weights, exerciseMuscles, aliases, muscleGroups, date: t }) : null
    // `days` is derived from `start`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans, weights, exerciseMuscles, aliases, muscleGroups, start, t])
  const short = preview?.gapsAfter.slice(0, 3).map(g => muscleShort(g.name).toLowerCase()) ?? []

  const label = start === thisWeek ? `This week · ${weekRange(start)}`
    : start === addDays(thisWeek, 7) ? `Next week · ${weekRange(start)}`
    : weekRange(start)
  const page = (n: number) => { setStart(s => addDays(s, n)); setOpen(null); setMoving(null) }

  const move = async (it: WeekItem, to: string) => {
    const ok = await withToast(() => 'lift' in it.plan
      ? editPlan(it.id, { date: to, exercise: it.plan.lift.exercise, targets: it.plan.lift.targets })
      : editSessionPlan(it.id, sessionPatch(it.plan.session, to)),
    `Moved to ${fmtDate(to, { weekday: true, relative: false, year: 'never' })}`)
    if (ok) { setMoving(null); setOpen(to) }
  }

  return (
    <BottomSheet label="The week" onClose={onClose}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[17px] font-bold tracking-[-0.01em] text-ink">The week</h2>
        {byAgent > 0 && <span className="text-[11px] text-ink-3">{byAgent} planned by your agent</span>}
      </div>
      <div className="flex items-center justify-between">
        <button aria-label="Previous week" onClick={() => page(-7)} className="w-9 h-9 -ml-2 flex items-center justify-center text-ink-2 hover:text-ink cursor-pointer"><Chevron dir="left" /></button>
        <span className="text-xs font-semibold text-ink">{label}</span>
        <button aria-label="Next week" onClick={() => page(7)} className="w-9 h-9 -mr-2 flex items-center justify-center text-ink-2 hover:text-ink cursor-pointer"><Chevron dir="right" /></button>
      </div>

      {preview && (
        <p className="text-[11px] leading-[1.4] text-ink-2 mb-2 px-2.5 py-1.5 border border-dashed border-planned bg-planned-tint rounded-[3px] text-pretty">
          <span className="font-semibold text-ink">If you do the week's plan: </span>
          {short.length ? <>still short on <span className="font-semibold text-ink">{joinNames(short)}</span>.</> : 'no muscle is left short.'}
        </p>
      )}

      <div className="flex flex-col">
        {days.map(d => {
          const its = inWeek.filter(i => i.date === d)
          const isToday = d === t, past = d < t, isOpen = open === d
          const kinds = KIND_ORDER.filter(k => its.some(i => i.kind === k))
          return (
            <div key={d} className={isToday
              ? 'flex gap-2.5 py-2 px-2 -mx-2 my-0.5 border border-ink rounded-[3px] bg-white'
              : 'flex gap-2.5 py-2 border-b border-hairline last:border-0'}>
              <button
                onClick={() => { setOpen(isOpen ? null : d); setMoving(null) }}
                aria-expanded={isOpen}
                aria-label={`${fmtDate(d, { weekday: true, relative: false })}${isOpen ? ', close' : ', open'}`}
                className="w-9 shrink-0 text-left cursor-pointer self-start"
              >
                <span className={`block text-[9px] font-bold uppercase tracking-[0.10em] ${isToday ? 'text-ink' : 'text-ink-3'}`}>{isToday ? 'Today' : weekday(d)}</span>
                <span className={`block text-[17px] font-bold tabular-nums leading-tight ${past ? 'text-ink-3' : 'text-ink'}`}>{dayNum(d)}</span>
              </button>
              <div className="min-w-0 flex-1">
                {its.length === 0 && !isOpen && (
                  <button onClick={() => setOpen(d)} className="block text-[11px] text-ink-4 pt-[3px] cursor-pointer">Nothing planned</button>
                )}
                {kinds.map(k => {
                  const ks = its.filter(i => i.kind === k)
                  const allLogged = ks.every(i => i.logged)
                  const missed = past && !allLogged
                  return (
                    <div key={k} className={`mb-1 pl-2 border-l-2 ${allLogged ? 'border-ink' : missed ? 'border-ink-4' : 'border-planned'}`}>
                      <p className="flex items-center gap-1.5 flex-wrap">
                        <span className={MICRO_LABEL}>{KIND_LABEL[k]}</span>
                        {allLogged && <span className="flex items-center gap-0.5 text-[10px] text-ink-2"><Icon name="check" size={10} />logged</span>}
                        {missed && <span className="text-[10px] text-ink-2">missed</span>}
                        {ks.some(i => i.plannedBy === 'agent') && <MicroLabel>Agent</MicroLabel>}
                      </p>
                      {isOpen ? ks.map(i => (
                        <div key={i.id} className="py-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs min-w-0 ${i.logged ? 'text-ink-3' : 'text-ink'}`}>{i.summary}</span>
                            {!i.logged && moveTargets(days, d, t).length > 0 && (
                              <button className={`${ACT_CHIP} shrink-0`} aria-expanded={moving === i.id} onClick={() => setMoving(moving === i.id ? null : i.id)}>Move</button>
                            )}
                          </div>
                          {moving === i.id && (
                            <div className="flex flex-wrap items-center gap-1 mt-1.5">
                              <span className="text-[11px] text-ink-2 mr-0.5">To</span>
                              {moveTargets(days, d, t).map(to => (
                                <button key={to} className={ACT_CHIP} onClick={() => move(i, to)}>{to === t ? 'Today' : `${weekday(to)} ${dayNum(to)}`}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      )) : (
                        <button onClick={() => setOpen(d)} className={`block w-full text-left text-xs leading-[1.35] cursor-pointer ${allLogged || missed ? 'text-ink-3' : 'text-ink'}`}>
                          {ks.map(i => i.brief).join(' · ')}
                        </button>
                      )}
                    </div>
                  )
                })}
                {isOpen && !past && adds.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-ink-2">Add</span>
                    {adds.map(a => (
                      <button key={a.label} className={ACT_CHIP} onClick={() => a.onAdd(d)}>+ {a.label}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-[10px] text-ink-3 mt-2">Tap a day to move its plans or add one. Today's plans are logged from their card.</p>
    </BottomSheet>
  )
}

/** A session plan as written again on another day: everything it plans, kept. */
function sessionPatch(p: PlannedSession, date: string): SessionPlanPatch {
  return {
    kind: p.kind, date, name: p.name, duration: p.duration, distance: p.distance,
    format: p.format, boutSeconds: p.boutSeconds, stretches: p.stretches, notes: p.notes,
  }
}
