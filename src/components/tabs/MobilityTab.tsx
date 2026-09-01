import { useState } from 'react'
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts'
import { useAppStore } from '../../store/app'
import { usePrefs } from '../../store/prefs'
import { today, startOfWeek, weeklyMuscleVolume, WEEKLY_STRETCH_TARGET_MIN } from '../../lib/utils'
import { Card, SecTitle, EmptyMsg } from '../ui/Card'
import { Inp, SelEl } from '../ui/Input'
import { Btn, DelBtn, EditBtn } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { Icon } from '../ui/Icon'
import { SmartInput } from '../ui/SmartInput'
import { HistoryList } from '../ui/HistoryList'
import { CHART, CHART_AXIS, CHART_LINE, CHART_TOOLTIP } from '../ui/chart'
import type { MobilityExercise } from '../../types'

/** One header row of labels over the repeating exercise rows, the same shape
 *  SetsGrid uses — a label per field would repeat eight times (§8). */
const EX_COLS = 'minmax(0,1fr) 64px minmax(0,1fr)'

function emptyExercise(): MobilityExercise {
  return { name: '', duration: 0, notes: '', muscleGroups: [] }
}

export function MobilityTab() {
  const [date, setDate] = useState(today())
  const [exercises, setExercises] = useState<MobilityExercise[]>([emptyExercise()])
  const [revealedEx, setRevealedEx] = useState(1)
  const [muscleOpen, setMuscleOpen] = useState<number | null>(null)
  const [selEx, setSelEx] = useState('')
  const { mobility, muscleGroups, addMobilityEntry, removeMobilityEntry, openEditModal, setToast } = useAppStore()
  const { weekStartDay } = usePrefs()

  const allExNames = [...new Set(mobility.flatMap(m => m.exercises.map(e => e.name)))].sort()

  // Canonical muscle tags per exercise name (for auto-fill when re-logging).
  const tagsByName = new Map<string, string[]>()
  for (const m of mobility) {
    for (const e of m.exercises) {
      if (e.muscleGroups && e.muscleGroups.length > 0) tagsByName.set(e.name.toLowerCase(), e.muscleGroups)
    }
  }

  const updateEx = (i: number, field: keyof MobilityExercise, value: string | number) => {
    setExercises(prev => prev.map((e, j) => {
      if (j !== i) return e
      const next = { ...e, [field]: value }
      // Auto-fill known muscle tags the first time a name is entered.
      if (field === 'name' && (!e.muscleGroups || e.muscleGroups.length === 0)) {
        const known = tagsByName.get(String(value).trim().toLowerCase())
        if (known) next.muscleGroups = [...known]
      }
      return next
    }))
  }

  const toggleMuscle = (i: number, group: string) => {
    setExercises(prev => prev.map((e, j) => {
      if (j !== i) return e
      const cur = e.muscleGroups ?? []
      return { ...e, muscleGroups: cur.includes(group) ? cur.filter(g => g !== group) : [...cur, group] }
    }))
  }

  const add = async () => {
    const valid = exercises.filter(e => e.name.trim() && e.duration > 0)
    if (valid.length === 0) return
    try {
      await addMobilityEntry({ date, exercises: valid, duration: valid.reduce((s, e) => s + e.duration, 0) })
      setExercises([emptyExercise()])
      setRevealedEx(1)
      setMuscleOpen(null)
      setToast('Session logged!')
    } catch {
      setToast('Failed to save.')
    }
  }

  const chartEx = selEx || allExNames[0] || ''
  const chartData = mobility
    .filter(m => m.exercises.some(e => e.name === chartEx))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(m => ({
      date: m.date.slice(5),
      duration: m.exercises.find(e => e.name === chartEx)?.duration ?? 0,
    }))

  const sortedMobility = [...mobility].sort((a, b) => b.date.localeCompare(a.date))

  // ── Weekly per-muscle-group volume ──────────────────────────────────────────
  const weekStart = startOfWeek(today(), weekStartDay)
  const weekVol = weeklyMuscleVolume(mobility, weekStart)
  const taggedGroups = [...new Set(mobility.flatMap(m => m.exercises.flatMap(e => e.muscleGroups ?? [])))]
  const volRows = taggedGroups
    .map(group => ({ group, minutes: weekVol[group] ?? 0 }))
    .sort((a, b) => {
      const am = a.minutes >= WEEKLY_STRETCH_TARGET_MIN ? 1 : 0
      const bm = b.minutes >= WEEKLY_STRETCH_TARGET_MIN ? 1 : 0
      return am - bm || a.minutes - b.minutes || a.group.localeCompare(b.group)
    })

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SecTitle>Log session</SecTitle>
        <div className="mb-3">
          <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: EX_COLS }}>
          {['Exercise', 'Min', 'Notes'].map(h => (
            <p key={h} className="text-[9px] font-bold uppercase tracking-[0.10em] text-ink-3">{h}</p>
          ))}
        </div>

        {exercises.slice(0, revealedEx).map((ex, i) => {
          const selected = ex.muscleGroups ?? []
          return (
            <div key={i} className="mb-2.5 last:mb-0">
              <div className="grid gap-1.5 items-center" style={{ gridTemplateColumns: EX_COLS }}>
                <SmartInput
                  value={ex.name}
                  onChange={v => updateEx(i, 'name', v)}
                  suggestions={allExNames}
                  placeholder={`Exercise ${i + 1}`}
                />
                <Inp
                  type="number"
                  value={ex.duration || ''}
                  onChange={e => updateEx(i, 'duration', +e.target.value)}
                  placeholder="10"
                  min="1"
                />
                <Inp
                  value={ex.notes}
                  onChange={e => updateEx(i, 'notes', e.target.value)}
                  placeholder="Notes"
                />
              </div>
              <div className="mt-1.5">
                {/* Opening the tag panel changes nothing on its own, so it is the
                    quiet ghost tone, and the chevron replaces the 🏷 emoji (§7). */}
                <button
                  onClick={() => setMuscleOpen(o => (o === i ? null : i))}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-2 hover:text-ink cursor-pointer transition-colors"
                >
                  Muscles{selected.length > 0 ? ` (${selected.length})` : ''}
                  <Icon name={muscleOpen === i ? 'chevronUp' : 'chevronDown'} size={11} />
                </button>
                {selected.length > 0 && muscleOpen !== i && (
                  <span className="text-[11px] text-ink-3 ml-2">{selected.join(', ')}</span>
                )}
                {muscleOpen === i && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5 p-2 rounded-[3px] bg-hairline border border-line">
                    {muscleGroups.map(g => (
                      <Chip key={g.id} small active={selected.includes(g.name)} onClick={() => toggleMuscle(i, g.name)}>
                        {g.name}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        <div className="flex gap-2 mt-3">
          {revealedEx < 8 && (
            <Btn
              variant="secondary"
              onClick={() => {
                if (revealedEx >= exercises.length) setExercises(p => [...p, emptyExercise()])
                setRevealedEx(r => r + 1)
              }}
            >
              + Add exercise
            </Btn>
          )}
          <Btn onClick={add} className="flex-1">Log session</Btn>
        </div>
      </Card>

      {volRows.length > 0 && (
        <Card>
          <SecTitle>This week's stretch volume</SecTitle>
          <p className="text-[10px] text-ink-3 mb-2.5">
            Target: {WEEKLY_STRETCH_TARGET_MIN} min per muscle group / week
          </p>
          <div className="flex flex-col gap-2">
            {volRows.map(({ group, minutes }) => {
              const met = minutes >= WEEKLY_STRETCH_TARGET_MIN
              const pct = Math.min(minutes / WEEKLY_STRETCH_TARGET_MIN, 1) * 100
              return (
                <div key={group}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 text-xs text-ink min-w-0">
                      {met && <Icon name="check" size={11} className="text-ink-2 shrink-0" />}
                      <span className="truncate">{group}</span>
                    </span>
                    <span className="text-[11px] text-ink-2 tabular-nums shrink-0">
                      {minutes} / {WEEKLY_STRETCH_TARGET_MIN} min
                    </span>
                  </div>
                  {/* The bar is the stimulus ramp (§4): ink once the target is
                      met, the ramp's mid step while there is still a gap. Green
                      would be a second palette, which §1 does not allow. */}
                  <div className="h-1.5 rounded-[2px] bg-hairline overflow-hidden">
                    <div
                      className={`h-full rounded-[2px] ${met ? 'bg-ink' : 'bg-ink-3'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {allExNames.length > 0 && (
        <Card>
          <SecTitle>Progress — {chartEx}</SecTitle>
          <div className="mb-3">
            <SelEl
              value={chartEx}
              onChange={e => setSelEx(e.target.value)}
              options={allExNames.map(n => ({ value: n, label: n }))}
            />
          </div>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={chartData} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="date" {...CHART_AXIS} />
                <YAxis width={28} {...CHART_AXIS} />
                <Tooltip {...CHART_TOOLTIP} formatter={(v: number) => [`${v} min`, 'Duration']} />
                <Line
                  {...CHART_LINE}
                  dataKey="duration"
                  stroke={CHART.line}
                  activeDot={{ r: 3, fill: CHART.line, stroke: 'none' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyMsg>Not enough data to chart</EmptyMsg>
          )}
        </Card>
      )}

      <Card>
        <SecTitle>History</SecTitle>
        <HistoryList
          items={sortedMobility}
          getDate={m => m.date}
          emptyMessage="No sessions yet"
          renderItem={m => (
            <div key={m.id} className="py-2 border-b border-hairline last:border-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-ink tabular-nums">{m.date}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[11px] text-ink-3 tabular-nums">{m.duration} min total</span>
                  <EditBtn onClick={() => openEditModal({ type: 'mobility', record: m })} />
                  <DelBtn onClick={() => removeMobilityEntry(m.id)} />
                </div>
              </div>
              {m.exercises.map((e, i) => (
                <p key={i} className="text-[11px] text-ink-2 mt-0.5">
                  {e.name} — <span className="tabular-nums">{e.duration} min</span>
                  {e.notes ? ` (${e.notes})` : ''}
                  {e.muscleGroups && e.muscleGroups.length > 0 && (
                    // The tags are a stated fact about the row, not an urgency,
                    // so they read as quiet meta rather than in the accent (§1).
                    <span className="text-ink-3"> · {e.muscleGroups.join(', ')}</span>
                  )}
                </p>
              ))}
            </div>
          )}
        />
      </Card>
    </div>
  )
}
