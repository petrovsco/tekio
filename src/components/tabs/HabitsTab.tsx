import { useState } from 'react'
import { useAppStore } from '../../store/app'
import { usePrefs } from '../../store/prefs'
import { habitProgress, today } from '../../lib/utils'
import type { HabitProgressContext } from '../../lib/utils'
import type { Habit, HabitCadence } from '../../types'
import { Card, SecTitle, EmptyMsg } from '../ui/Card'
import { Btn, DelBtn, EditBtn } from '../ui/Button'
import { HabitForm } from './habits/HabitForm'

const CADENCE_ORDER: HabitCadence[] = ['daily', 'weekly', 'monthly']
const CADENCE_LABEL: Record<HabitCadence, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

// ── Habit row ─────────────────────────────────────────────────────────────────

function HabitRow({ habit, ctx, weekStart }: { habit: Habit; ctx: HabitProgressContext; weekStart: 'monday' | 'sunday' }) {
  const { completeHabit, removeHabit, openEditModal, setToast } = useAppStore()
  const p = habitProgress(habit, ctx, today(), weekStart)
  const pct = Math.min(100, Math.round((p.current / p.target) * 100))
  const manual = habit.autoSource === 'none'
  const isCheck = manual && (habit.singleTick || habit.targetCount <= 1)

  const onComplete = async () => {
    try {
      if (isCheck) await completeHabit(habit.id, p.done ? 0 : habit.targetCount)
      else await completeHabit(habit.id, p.current + 1)
    } catch { setToast('Failed to update.') }
  }

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-hairline last:border-0">
      <span className="text-xl w-7 text-center shrink-0">{habit.icon || '·'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-ink truncate">{habit.name}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-hairline rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${p.done ? 'bg-ink' : 'bg-ink-3'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[11px] text-ink-2 font-medium shrink-0 tabular-nums">
            {isCheck
              ? (habit.targetCount > 1 ? `${fmt(habit.targetCount)}${habit.unit ? ` ${habit.unit}` : ''}` : '')
              : `${fmt(p.current)}/${fmt(p.target)}${habit.unit ? ` ${habit.unit}` : ''}`}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {manual ? (
          <button
            onClick={onComplete}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
              p.done ? 'border-line bg-hairline text-ink-2' : 'border-signal text-signal active:scale-95'
            }`}
          >
            {isCheck ? (p.done ? 'Done' : 'Mark done') : '+1'}
          </button>
        ) : (
          <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${p.done ? 'bg-hairline text-ink-2' : 'bg-hairline text-ink-3'}`}>
            auto
          </span>
        )}
        <EditBtn onClick={() => openEditModal({ type: 'habit', record: habit })} />
        <DelBtn onClick={() => removeHabit(habit.id)} />
      </div>
    </div>
  )
}

// ── Tab ───────────────────────────────────────────────────────────────────────

export function HabitsTab() {
  const { habits, weights, mobility, water, cardio, habitCompletions, exerciseMuscles, muscleGroups, exerciseNames } = useAppStore()
  const { weekStartDay } = usePrefs()
  const [showForm, setShowForm] = useState(false)
  const [cadence, setCadence] = useState<HabitCadence>('daily')

  const ctx: HabitProgressContext = {
    weights, mobility, water, cardio, habitCompletions, exerciseMuscles, muscleGroups, exerciseNames,
  }

  const byCadence = (c: HabitCadence) => habits.filter(h => h.active && h.cadence === c)
  const shown = byCadence(cadence)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-center justify-between">
          <SecTitle className="mb-0">Habits & Milestones</SecTitle>
          <Btn small variant={showForm ? 'secondary' : 'primary'} onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Close' : '+ New'}
          </Btn>
        </div>
        {showForm && (
          <div className="mt-3 pt-3 border-t border-hairline">
            <HabitForm onDone={() => setShowForm(false)} />
          </div>
        )}
      </Card>

      {habits.length === 0 ? (
        <Card><EmptyMsg>No habits yet — add one to start building a routine.</EmptyMsg></Card>
      ) : (
        <Card>
          <div className="flex gap-1.5 mb-3">
            {CADENCE_ORDER.map(c => {
              const count = byCadence(c).length
              const active = c === cadence
              return (
                <button
                  key={c}
                  onClick={() => setCadence(c)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    active ? 'border-ink bg-ink text-white' : 'border-line text-ink-2'
                  }`}
                >
                  {CADENCE_LABEL[c]}
                  {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
                </button>
              )
            })}
          </div>
          {shown.length === 0 ? (
            <EmptyMsg>No {CADENCE_LABEL[cadence].toLowerCase()} habits yet.</EmptyMsg>
          ) : (
            shown.map(h => (
              <HabitRow key={h.id} habit={h} ctx={ctx} weekStart={weekStartDay} />
            ))
          )}
        </Card>
      )}
    </div>
  )
}
