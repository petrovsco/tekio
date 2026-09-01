import { useState } from 'react'
import {
  cycleInfo, getGrouped, isDeloadDate, isTodayDone,
  programMode, resolveTodayDay, isDayDoneInWeek, startOfWeek, today, weekdayOf, variantGroups,
} from '../../../lib/utils'
import type { GroupedExercise } from '../../../lib/utils'
import { BLOCK_META } from '../../../constants/program'
import { ExPlan } from './ExPlan'
import { deloadSets } from '../../../lib/utils'
import { SSBadge, DeloadBadge } from '../../ui/Badges'
import { Chip } from '../../ui/Chip'
import { Icon } from '../../ui/Icon'
import type { Program, ProgramDay, ProgramDayBlock, WeightEntry, LiftSet, BlockType, DayOfWeek } from '../../../types'

interface PickHandlers {
  onPickSingle: (ex: string) => void
  onPickSingleWithSets: (ex: string, sets: LiftSet[]) => void
  onPickSuperset: (exercises: [string, string]) => void
  onPickSupersetDeload: (exercises: [string, string], lastPerf: (n: string) => WeightEntry | undefined) => void
}

interface TodaysPlanProps extends PickHandlers {
  program: Program
  weights: WeightEntry[]
  variantWeekdays?: Set<DayOfWeek>
  onToggleVariant?: (dayOfWeek: DayOfWeek, variantActive: boolean) => void
}

const LOG_IN_TAB: Partial<Record<BlockType, string>> = {
  sport: 'Cardio',
  mobility: 'Mobility',
  conditioning: 'Cardio',
}

// SIGNAL surfaces for this page (design-system §§2, 5, 6). The banner used to
// recolour itself — amber on a deload week, green when done. Neither is a
// meaning colour is allowed to carry (§1), so the surface stays paper-white and
// the state is stated in a micro label instead.
const BANNER = 'rounded-[3px] overflow-hidden border border-line bg-white mb-1'
const MICRO = 'inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.10em] text-ink-3'
/** Nothing on this page commits an entry — every control prefills the log form. */
const ACT_CHIP =
  'inline-flex items-center gap-0.5 px-2.5 py-[3px] text-[11px] font-semibold text-ink bg-white border border-line rounded-[3px] hover:border-ink cursor-pointer transition-colors'

/** Weight-logging sections of a day (one per weight block; whole day if legacy). */
function weightSectionsFor(day: ProgramDay): { name?: string; groups: GroupedExercise[] }[] {
  const blocks = day.blocks ?? []
  if (blocks.length === 0) {
    return day.exercises.length > 0 ? [{ groups: getGrouped(day) }] : []
  }
  return blocks
    .filter(b => b.blockType === 'weight')
    .map(b => ({
      name: b.name,
      groups: getGrouped({ name: b.name, exercises: b.exercises.map(e => e.exercise), supersets: b.supersets }),
    }))
    .filter(s => s.groups.length > 0)
}

/** Non-weight blocks of a day (sport / mobility / conditioning / warmup / recovery). */
function infoBlocksFor(day: ProgramDay): ProgramDayBlock[] {
  return (day.blocks ?? []).filter(b => b.blockType !== 'weight')
}

// ── Weight groups (the loggable part) ─────────────────────────────────────────

function WeightGroups({ groups, program, weights, isDeload, ...h }: {
  groups: GroupedExercise[]
  program: Program
  weights: WeightEntry[]
  isDeload: boolean
} & PickHandlers) {
  const lastPerf = (n: string): WeightEntry | undefined =>
    [...weights]
      .filter(d => d.exercise.toLowerCase() === n.toLowerCase() && !isDeloadDate(program.startDate, d.date))
      .sort((a, b) => b.date.localeCompare(a.date))[0]

  return (
    <>
      {groups.map((g, gi) => {
        if (g.type === 'superset') {
          return (
            <div key={gi} className="mt-3 border border-line rounded-[3px] p-2.5 bg-paper">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <SSBadge />
                  <span className="text-[9px] font-bold uppercase tracking-[0.10em] text-ink-3">Superset</span>
                </div>
                {isDeload ? (
                  <button onClick={() => h.onPickSupersetDeload(g.exercises, lastPerf)} className={ACT_CHIP}>
                    Deload <Icon name="chevronDown" size={11} />
                  </button>
                ) : (
                  <button onClick={() => h.onPickSuperset(g.exercises)} className={ACT_CHIP}>
                    Log together <Icon name="chevronDown" size={11} />
                  </button>
                )}
              </div>
              {g.exercises.map((ex, ei) => (
                <ExPlan key={ei} ex={ex} last={lastPerf(ex)} isDeload={isDeload} programStartDate={program.startDate} onPick={h.onPickSingle} onPickWithSets={h.onPickSingleWithSets} />
              ))}
            </div>
          )
        }
        return (
          <ExPlan key={gi} ex={g.exercises[0]} last={lastPerf(g.exercises[0])} isDeload={isDeload} programStartDate={program.startDate} onPick={h.onPickSingle} onPickWithSets={h.onPickSingleWithSets} />
        )
      })}
    </>
  )
}

// ── Non-weight block summary (read-only) ──────────────────────────────────────

function BlockInfo({ block }: { block: ProgramDayBlock }) {
  const meta = BLOCK_META[block.blockType]
  const logTab = LOG_IN_TAB[block.blockType]
  return (
    <div className="mt-3 border border-line rounded-[3px] p-2.5 bg-paper">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon name={meta.iconName} size={13} className="text-ink-2 shrink-0" />
        <span className="text-xs font-bold text-ink">{block.name}</span>
        {block.scheduledTime && <span className="text-[10px] text-ink-3">· {block.scheduledTime}</span>}
        {block.durationMinutes && <span className="text-[10px] text-ink-3">· {block.durationMinutes}m</span>}
        {logTab && <span className={`${MICRO} ml-auto`}>Log in {logTab}</span>}
      </div>
      <div className="flex flex-wrap gap-1">
        {block.exercises.map((ex, ei) => (
          <span key={ei} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] text-[11px] bg-white border border-line text-ink">
            {ex.exercise}
            {ex.durationText && <span className="text-ink-3">· {ex.durationText}</span>}
          </span>
        ))}
        {block.exercises.length === 0 && <span className="text-[11px] text-ink-3">—</span>}
      </div>
    </div>
  )
}

// ── A single day's full plan (weight sections + info blocks) ───────────────────

function DayLog({ day, program, weights, isDeload, ...h }: {
  day: ProgramDay
  program: Program
  weights: WeightEntry[]
  isDeload: boolean
} & PickHandlers) {
  const sections = weightSectionsFor(day)
  const info = infoBlocksFor(day)
  const showSectionNames = sections.length > 1

  return (
    <div className="bg-white px-3 pt-3 pb-3">
      {sections.map((sec, si) => (
        <div key={si}>
          {showSectionNames && sec.name && (
            <p className="text-[9px] font-bold text-ink-3 uppercase tracking-[0.14em] mt-3 first:mt-0">{sec.name}</p>
          )}
          <WeightGroups groups={sec.groups} program={program} weights={weights} isDeload={isDeload} {...h} />
        </div>
      ))}
      {info.map((b, bi) => <BlockInfo key={bi} block={b} />)}
      {sections.length === 0 && info.length === 0 && (
        <p className="text-[11px] text-ink-3">Rest day</p>
      )}
    </div>
  )
}

// ── Weekly checklist (flexible / adjustment mode) ─────────────────────────────

function WeeklyChecklist({ program, weights, isDeload, ...h }: {
  program: Program
  weights: WeightEntry[]
  isDeload: boolean
} & PickHandlers) {
  const weekStart = startOfWeek(today())
  const days = program.days
  const doneFlags = days.map(d => isDayDoneInWeek(weights, d, weekStart))
  const trackable = days.filter(d => d.exercises.length > 0).length
  const doneCount = doneFlags.filter(Boolean).length

  const [selected, setSelected] = useState<number>(() => {
    const firstUndone = doneFlags.findIndex((done, i) => !done && days[i].exercises.length > 0)
    return firstUndone >= 0 ? firstUndone : 0
  })

  return (
    <div className={BANNER}>
      <div className="px-3 py-2.5 border-b border-hairline">
        <div className="flex items-center gap-1.5">
          <Icon name="program" size={13} className="text-ink-2 shrink-0" />
          <span className="text-[9px] font-bold text-ink uppercase tracking-[0.14em]">This week's sessions</span>
          {trackable > 0 && (
            <span className="ml-auto text-[11px] text-ink-2 tabular-nums">{doneCount}/{trackable} lifting days</span>
          )}
        </div>
        <p className="text-[11px] text-ink-3 mt-1">Days aren't pinned yet — pick whichever fits today.</p>
      </div>

      <div className="bg-white">
        {days.map((d, i) => {
          const done = doneFlags[i]
          const isSel = i === selected
          const blockIcons = (d.blocks ?? []).map(b => BLOCK_META[b.blockType].iconName)
          return (
            <div key={i} className="border-b border-hairline last:border-0">
              <button onClick={() => setSelected(isSel ? -1 : i)} className={`w-full flex items-center gap-2 px-3 py-2.5 text-left cursor-pointer ${isSel ? 'bg-hairline' : ''}`}>
                <span className={`shrink-0 w-5 h-5 rounded-[2px] flex items-center justify-center text-[10px] font-bold ${done ? 'bg-ink text-white' : 'border border-line text-ink-3'}`}>
                  {done ? <Icon name="check" size={11} /> : i + 1}
                </span>
                <span className={`text-xs flex-1 truncate ${isSel ? 'font-bold text-ink' : 'text-ink-2'}`}>{d.name}</span>
                {blockIcons.length > 0 && (
                  <span className="flex items-center gap-1 text-ink-3 shrink-0">
                    {blockIcons.map((n, bi) => <Icon key={bi} name={n} size={12} />)}
                  </span>
                )}
                <Icon name={isSel ? 'chevronUp' : 'chevronDown'} size={13} className="text-ink-3 shrink-0" />
              </button>
              {isSel && (
                <DayLog day={d} program={program} weights={weights} isDeload={isDeload} {...h} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Entry point ───────────────────────────────────────────────────────────────

export function TodaysPlan({ program, weights, variantWeekdays, onToggleVariant, ...h }: TodaysPlanProps) {
  const [open, setOpen] = useState(true)
  const { week, isDeload } = cycleInfo(program)
  const mode = programMode(program)

  if (mode === 'flexible') {
    return <WeeklyChecklist program={program} weights={weights} isDeload={isDeload} {...h} />
  }

  const wd = weekdayOf()
  const day = resolveTodayDay(program, today(), variantWeekdays)
  const todaysVariant = mode === 'weekday' ? variantGroups(program).find(g => g.weekday === wd) : undefined
  const variantOn = variantWeekdays?.has(wd) ?? false

  const variantToggle = todaysVariant && onToggleVariant && (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-white border-b border-hairline">
      <span className="text-[9px] font-bold uppercase tracking-[0.10em] text-ink-3 shrink-0">This {wd}</span>
      <Chip active={!variantOn} onClick={() => onToggleVariant(wd, false)} className="flex-1 truncate">
        {todaysVariant.base?.name ?? 'Base'}
      </Chip>
      <Chip active={variantOn} onClick={() => onToggleVariant(wd, true)} className="flex-1 truncate">
        {todaysVariant.variant.name}
      </Chip>
    </div>
  )

  if (!day) {
    // Weekday mode with nothing scheduled today → a quiet rest-day banner.
    return (
      <div className={BANNER}>
        {variantToggle}
        <div className="flex items-center gap-1.5 px-3 py-2.5">
          <Icon name="recovery" size={13} className="text-ink-2 shrink-0" />
          <span className="text-xs font-bold text-ink">Rest day</span>
          <span className="text-[11px] text-ink-3 ml-1.5">Nothing scheduled for {wd}</span>
        </div>
      </div>
    )
  }

  const done = isTodayDone(weights, day)

  return (
    <div className={BANNER}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-2 px-3 py-2.5 border-b border-hairline cursor-pointer">
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-ink truncate">{day.name}</span>
          {isDeload && <DeloadBadge week={week} />}
          {done && <span className={MICRO}><Icon name="check" size={11} />Done</span>}
        </span>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={13} className="text-ink-3 shrink-0" />
      </button>
      {variantToggle}
      {open && <DayLog day={day} program={program} weights={weights} isDeload={isDeload} {...h} />}
    </div>
  )
}

// Export helper so WeightsTab can use it
export { deloadSets }
