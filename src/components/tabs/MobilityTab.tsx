import { useState } from 'react'
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts'
import { useAppStore } from '../../store/app'
import { usePrefs } from '../../store/prefs'
import { today, startOfWeek, weeklyMuscleVolume, WEEKLY_STRETCH_TARGET_MIN } from '../../lib/utils'
import { Card, SecTitle } from '../ui/Card'
import { Inp } from '../ui/Input'
import { Btn, DelBtn, EditBtn } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { SmartInput } from '../ui/SmartInput'
import { HistoryList } from '../ui/HistoryList'
import type { MobilityExercise } from '../../types'

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
        <SecTitle>Log Session</SecTitle>
        <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} className="mb-3" />

        {exercises.slice(0, revealedEx).map((ex, i) => {
          const selected = ex.muscleGroups ?? []
          return (
            <div key={i} className="mb-3 last:mb-0">
              <div className="grid grid-cols-[1fr_80px_1fr] gap-2 items-end">
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
                  placeholder="min"
                  min="1"
                />
                <Inp
                  value={ex.notes}
                  onChange={e => updateEx(i, 'notes', e.target.value)}
                  placeholder="Notes"
                />
              </div>
              <div className="mt-1.5">
                <button
                  onClick={() => setMuscleOpen(o => (o === i ? null : i))}
                  className="text-[11px] text-accent"
                >
                  🏷️ Muscles{selected.length > 0 ? ` (${selected.length})` : ''} {muscleOpen === i ? '▲' : '▼'}
                </button>
                {selected.length > 0 && muscleOpen !== i && (
                  <span className="text-[11px] text-muted ml-2">{selected.join(', ')}</span>
                )}
                {muscleOpen === i && (
                  <div className="flex flex-wrap gap-1 mt-1.5 p-2 rounded-lg bg-bg border border-border">
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

        <div className="flex gap-2 mt-2">
          {revealedEx < 8 && (
            <Btn
              variant="secondary"
              small
              onClick={() => {
                if (revealedEx >= exercises.length) setExercises(p => [...p, emptyExercise()])
                setRevealedEx(r => r + 1)
              }}
            >
              + Add Exercise
            </Btn>
          )}
          <Btn onClick={add} className="flex-1">Log Session</Btn>
        </div>
      </Card>

      {volRows.length > 0 && (
        <Card>
          <SecTitle>This Week's Stretch Volume</SecTitle>
          <p className="text-[11px] text-muted mb-3">Target: {WEEKLY_STRETCH_TARGET_MIN} min per muscle group / week</p>
          <div className="flex flex-col gap-2">
            {volRows.map(({ group, minutes }) => {
              const met = minutes >= WEEKLY_STRETCH_TARGET_MIN
              const pct = Math.min(minutes / WEEKLY_STRETCH_TARGET_MIN, 1) * 100
              return (
                <div key={group}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-primary">{met ? '✅ ' : ''}{group}</span>
                    <span className={`text-[11px] font-medium ${met ? 'text-success' : 'text-muted'}`}>{minutes} / {WEEKLY_STRETCH_TARGET_MIN} min</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-bg overflow-hidden">
                    <div className={`h-full rounded-full ${met ? 'bg-success' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
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
          <select
            value={chartEx}
            onChange={e => setSelEx(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-primary mb-3 focus:outline-none"
          >
            {allExNames.map(n => <option key={n}>{n}</option>)}
          </select>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip formatter={(v: number) => [`${v} min`, 'Duration']} />
                <Line type="monotone" dataKey="duration" stroke="#6366f1" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted text-center py-6">Not enough data to chart</p>
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
            <div key={m.id} className="py-2 border-b border-bg last:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-primary">{m.date}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted">{m.duration}min total</span>
                  <EditBtn onClick={() => openEditModal({ type: 'mobility', record: m })} />
                  <DelBtn onClick={() => removeMobilityEntry(m.id)} />
                </div>
              </div>
              {m.exercises.map((e, i) => (
                <div key={i} className="text-xs text-muted ml-2">
                  {e.name} — {e.duration}min{e.notes ? ` (${e.notes})` : ''}
                  {e.muscleGroups && e.muscleGroups.length > 0 && (
                    <span className="text-[10px] text-accent"> · {e.muscleGroups.join(', ')}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        />
      </Card>
    </div>
  )
}
