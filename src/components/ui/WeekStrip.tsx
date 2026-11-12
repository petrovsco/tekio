import { today } from '@tekio/core'
import { fmtDate, addDays } from '../../lib/utils'
import { weekDays, weekRange, dayMark, type DayMark, type WeekItem, type WeekKind } from '../../lib/week'
import { Icon } from './Icon'

function Mark({ mark }: { mark: DayMark }) {
  if (mark === 'planned') return <span className="w-[7px] h-[7px] rounded-full bg-planned" />
  if (mark === 'logged') return <Icon name="check" size={11} className="text-ink" />
  if (mark === 'missed') return <span className="w-[7px] h-[7px] rounded-full border border-ink-2" />
  if (mark === 'other') return <span className="w-[5px] h-[5px] rounded-full bg-ink-4" />
  return null
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === 'left' ? 'M14.5 6 8.5 12l6 6' : 'M9.5 6l6 6-6 6'} />
    </svg>
  )
}

/**
 * The week's seven days across the Planned card (RFC 0114, option A): a mark
 * under each day says what this tab planned there, and a tap picks the day the
 * card lists. The arrows move a week at a time.
 */
export function WeekStrip({ start, thisWeek, selected, kinds, items, onSelect, onPage }: {
  start: string
  thisWeek: string
  selected: string
  kinds: WeekKind[]
  items: WeekItem[]
  onSelect: (date: string) => void
  onPage: (by: number) => void
}) {
  const t = today()
  const days = weekDays(start)
  const label = start === thisWeek ? `This week · ${weekRange(start)}`
    : start === addDays(thisWeek, 7) ? `Next week · ${weekRange(start)}`
    : weekRange(start)
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between">
        <button aria-label="Previous week" onClick={() => onPage(-7)} className="w-8 h-8 -ml-1.5 flex items-center justify-center text-ink-2 hover:text-ink cursor-pointer"><Chevron dir="left" /></button>
        <span className="text-xs font-semibold text-ink">{label}</span>
        <button aria-label="Next week" onClick={() => onPage(7)} className="w-8 h-8 -mr-1.5 flex items-center justify-center text-ink-2 hover:text-ink cursor-pointer"><Chevron dir="right" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(d => {
          const isSel = d === selected, isToday = d === t, past = d < t
          const weekday = fmtDate(d, { weekday: true, relative: false }).split(' ')[0]
          return (
            <button
              key={d}
              onClick={() => onSelect(d)}
              aria-pressed={isSel}
              aria-label={fmtDate(d, { weekday: true, relative: false })}
              className={`flex flex-col items-center pt-1 pb-1.5 rounded-[3px] border cursor-pointer ${isSel ? 'border-ink bg-white' : 'border-transparent'}`}
            >
              <span className={`text-[9px] font-bold uppercase tracking-[0.08em] ${isToday ? 'text-ink' : 'text-ink-3'}`}>{weekday.slice(0, 1)}</span>
              <span className={`text-[13px] font-bold tabular-nums ${past && !isSel ? 'text-ink-3' : 'text-ink'} ${isToday ? 'underline underline-offset-[3px] decoration-2' : ''}`}>{Number(d.slice(8))}</span>
              <span className="h-3 mt-0.5 flex items-center"><Mark mark={dayMark(items, d, kinds, t)} /></span>
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[10px] text-ink-3">
        <span className="flex items-center gap-1"><Mark mark="planned" />planned</span>
        <span className="flex items-center gap-1"><Mark mark="logged" />logged</span>
        <span className="flex items-center gap-1"><Mark mark="missed" />missed</span>
        <span className="flex items-center gap-1"><Mark mark="other" />other tab</span>
      </div>
    </div>
  )
}
