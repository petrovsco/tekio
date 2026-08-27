import { useState } from 'react'
import {
  cycleInfo, getGrouped, isDeloadDate, isTodayDone,
  programMode, resolveTodayDay, isDayDoneInWeek, startOfWeek, today, weekdayOf, variantGroups,
} from '../../../lib/utils'
import type { GroupedExercise } from '../../../lib/utils'
import { BLOCK_META } from '../../../constants/program'
import { ExPlan } from './ExPlan'
import { deloadSets } from '../../../lib/utils'
import { SSBadge } from '../../ui/Badges'
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
            <div key={gi} className="mt-3 border border-ss-b rounded-xl p-2.5 bg-ss-l">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <SSBadge />
                  <span className="text-xs text-ss font-semibold">Superset</span>
                </div>
                {isDeload ? (
                  <button onClick={() => h.onPickSupersetDeload(g.exercises, lastPerf)} className="text-[11px] font-semibold text-white bg-dl-tx rounded-full px-2.5 py-1">
                    Deload ↓
                  </button>
                ) : (
                  <button onClick={() => h.onPickSuperset(g.exercises)} className="text-[11px] font-semibold text-white bg-ss rounded-full px-2.5 py-1">
                    Log Together ↓
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
    <div className="mt-3 border border-border rounded-xl p-2.5 bg-bg/40">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-sm">{meta.icon}</span>
        <span className="text-xs font-semibold text-primary">{block.name}</span>
        {block.scheduledTime && <span className="text-[10px] text-muted">· {block.scheduledTime}</span>}
        {block.durationMinutes && <span className="text-[10px] text-muted">· {block.durationMinutes}m</span>}
        {logTab && <span className="ml-auto text-[10px] text-accent">Log in {logTab}</span>}
      </div>
      <div className="flex flex-wrap gap-1">
        {block.exercises.map((ex, ei) => (
          <span key={ei} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-surface border border-border text-primary">
            {ex.exercise}
            {ex.durationText && <span className="text-muted">· {ex.durationText}</span>}
          </span>
        ))}
        {block.exercises.length === 0 && <span className="text-[11px] text-muted italic">—</span>}
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
    <div className="bg-surface px-3.5 pt-3.5 pb-3.5">
      {sections.map((sec, si) => (
        <div key={si}>
          {showSectionNames && sec.name && (
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mt-3 first:mt-0">{sec.name}</p>
          )}
          <WeightGroups groups={sec.groups} program={program} weights={weights} isDeload={isDeload} {...h} />
        </div>
      ))}
      {info.map((b, bi) => <BlockInfo key={bi} block={b} />)}
      {sections.length === 0 && info.length === 0 && (
        <p className="text-xs text-muted italic">Rest day</p>
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
    <div className="rounded-2xl overflow-hidden border mb-1 bg-[#f8fafc] border-border">
      <div className="px-3.5 py-3 border-b border-border">
        <span className="text-xs font-bold text-primary">🗓️ This week's sessions</span>
        {trackable > 0 && <span className="text-xs text-muted ml-2">{doneCount}/{trackable} lifting days done</span>}
        <p className="text-[11px] text-muted mt-0.5">Days aren't pinned yet — pick whichever fits today.</p>
      </div>

      <div className="bg-surface">
        {days.map((d, i) => {
          const done = doneFlags[i]
          const isSel = i === selected
          const icons = (d.blocks ?? []).map(b => BLOCK_META[b.blockType].icon).join(' ')
          return (
            <div key={i} className="border-b border-bg last:border-0">
              <button onClick={() => setSelected(isSel ? -1 : i)} className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-left ${isSel ? 'bg-accent-l' : ''}`}>
                <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${done ? 'bg-success text-white' : 'bg-bg text-muted'}`}>
                  {done ? '✓' : i + 1}
                </span>
                <span className={`text-xs flex-1 ${isSel ? 'font-semibold text-accent' : 'text-primary'} truncate`}>{d.name}</span>
                {icons && <span className="text-xs">{icons}</span>}
                <span className="text-[10px] text-muted">{isSel ? '▲' : '▼'}</span>
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
  const { isDeload } = cycleInfo(program)
  const mode = programMode(program)

  if (mode === 'flexible') {
    return <WeeklyChecklist program={program} weights={weights} isDeload={isDeload} {...h} />
  }

  const wd = weekdayOf()
  const day = resolveTodayDay(program, today(), variantWeekdays)
  const todaysVariant = mode === 'weekday' ? variantGroups(program).find(g => g.weekday === wd) : undefined
  const variantOn = variantWeekdays?.has(wd) ?? false

  const variantToggle = todaysVariant && onToggleVariant && (
    <div className="flex items-center gap-1.5 px-3.5 py-2 bg-surface border-b border-bg">
      <span className="text-[11px] text-muted shrink-0">This {wd}:</span>
      <button
        onClick={() => onToggleVariant(wd, false)}
        className={`flex-1 py-1 rounded-lg text-[11px] font-semibold border ${!variantOn ? 'border-accent bg-accent-l text-accent' : 'border-border bg-surface text-muted'}`}
      >
        {todaysVariant.base?.name ?? 'Base'}
      </button>
      <button
        onClick={() => onToggleVariant(wd, true)}
        className={`flex-1 py-1 rounded-lg text-[11px] font-semibold border ${variantOn ? 'border-ss bg-ss-l text-ss' : 'border-border bg-surface text-muted'}`}
      >
        {todaysVariant.variant.name}
      </button>
    </div>
  )

  if (!day) {
    // Weekday mode with nothing scheduled today → a quiet rest-day banner.
    return (
      <div className="rounded-2xl overflow-hidden border border-border bg-[#f8fafc] mb-1">
        {variantToggle}
        <div className="px-3.5 py-3">
          <span className="text-xs font-bold text-primary">🛌 Rest day</span>
          <span className="text-xs text-muted ml-2">Nothing scheduled for {wd}</span>
        </div>
      </div>
    )
  }

  const done = isTodayDone(weights, day)
  const headerLabel = isDeload ? '⚠️ Deload Week' : done ? `✅ ${day.name} — Done` : `📋 ${day.name}`
  const headerColor = isDeload ? 'text-dl-tx' : done ? 'text-success' : 'text-primary'
  const headerBg = isDeload ? 'bg-dl-bg border-dl-bd' : done ? 'bg-green-50 border-green-200' : 'bg-[#f8fafc] border-border'

  return (
    <div className={`rounded-2xl overflow-hidden border mb-1 ${headerBg}`}>
      <button onClick={() => setOpen(o => !o)} className={`w-full flex items-center justify-between px-3.5 py-3 border-b ${headerBg}`}>
        <span className={`text-xs font-bold ${headerColor}`}>{headerLabel}</span>
        <span className="text-xs text-muted">{open ? '▲' : '▼'}</span>
      </button>
      {variantToggle}
      {open && <DayLog day={day} program={program} weights={weights} isDeload={isDeload} {...h} />}
    </div>
  )
}

// Export helper so WeightsTab can use it
export { deloadSets }
