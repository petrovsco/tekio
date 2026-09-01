import { useState, useEffect } from 'react'
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts'
import { useAppStore } from '../../../store/app'
import { today, cycleInfo, isDeloadDate, isTodayDone, programMode, activeVariantWeekdays, best1RM } from '../../../lib/utils'
import { Card, SecTitle } from '../../ui/Card'
import { Inp } from '../../ui/Input'
import { Btn, DelBtn, EditBtn } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { SSBadge } from '../../ui/Badges'
import { SmartInput } from '../../ui/SmartInput'
import { HistoryList } from '../../ui/HistoryList'
import { TodaysPlan } from './TodaysPlan'
import { SupersetLogger } from './SupersetLogger'
import type { WeightEntry, LiftSet } from '../../../types'

interface SetStr { weight: string; reps: string }

export function WeightsTab() {
  const [ex, setEx] = useState('')
  const [date, setDate] = useState(today())
  const [sets, setSets] = useState<SetStr[]>([{ weight: '', reps: '' }])
  const [revealed, setRevealed] = useState(1)
  const [selEx, setSelEx] = useState('')
  const [chartMetric, setChartMetric] = useState<'maxWeight' | 'volume'>('maxWeight')
  const [ssExercises, setSsExercises] = useState<[string, string] | null>(null)
  const [ssInitialSets, setSsInitialSets] = useState<{ sets0?: LiftSet[]; sets1?: LiftSet[] } | null>(null)

  const { weights, programs, weekOverrides, addWeightEntry, removeWeightEntry, openEditModal, advanceActiveProgram, toggleWeekVariant, setToast } = useAppStore()

  // Auto-advance sequential (legacy index-mode) programs when today's day is done.
  // Weekday-pinned and flexible programs derive their day from the calendar/checklist
  // instead, so there's no index to advance.
  useEffect(() => {
    for (const ap of programs) {
      if (cycleInfo(ap).isComplete) continue
      if (programMode(ap) !== 'index') continue
      const day = ap.days[ap.currentDayIndex % ap.days.length]
      if (!day || day.exercises.length === 0) continue
      if (isTodayDone(weights, day) && ap.lastAdvancedDate !== today()) {
        const newIndex = (ap.currentDayIndex + 1) % ap.days.length
        advanceActiveProgram(ap.userProgramId, newIndex, today())
      }
    }
  }, [weights])

  const exercises = [...new Set(weights.map(d => d.exercise))].sort()

  const isAnyDeload = programs.some(ap => isDeloadDate(ap.startDate, today()))

  const getLastPerf = (n: string): WeightEntry | undefined =>
    n.trim()
      ? [...weights]
          .filter(d =>
            d.exercise.toLowerCase() === n.trim().toLowerCase() &&
            !programs.some(ap => isDeloadDate(ap.startDate, d.date))
          )
          .sort((a, b) => b.date.localeCompare(a.date))[0]
      : undefined

  const lastPerf = getLastPerf(ex)

  // Estimated 1RM (Epley × Brzycki blend): live from the sets being entered,
  // plus the historical best across all logged sets for this exercise.
  const liveSets = sets.slice(0, revealed)
    .filter(s => s.weight && s.reps)
    .map(s => ({ weight: +s.weight, reps: +s.reps }))
  const live1RM = best1RM(liveSets)
  const historical1RM = ex.trim()
    ? Math.max(
        0,
        ...weights
          .filter(d => d.exercise.toLowerCase() === ex.trim().toLowerCase())
          .map(d => best1RM(d.sets)),
      )
    : 0

  const handleSelectEx = (n: string) => {
    setEx(n); setSelEx(n); setSsExercises(null)
    const p = getLastPerf(n)
    if (p) { setSets(p.sets.map(s => ({ weight: String(s.weight), reps: String(s.reps) }))); setRevealed(p.sets.length) }
    else { setSets([{ weight: '', reps: '' }]); setRevealed(1) }
  }

  const handlePickWithSets = (n: string, computedSets: LiftSet[]) => {
    setSsExercises(null)
    setEx(n); setSelEx(n)
    setSets(computedSets.map(s => ({ weight: String(s.weight), reps: String(s.reps) })))
    setRevealed(computedSets.length)
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  const revealNext = () => {
    const n = revealed + 1
    if (n > sets.length) setSets(p => [...p, { weight: p[p.length - 1]?.weight || '', reps: '' }])
    setRevealed(n)
  }

  const updateSet = (i: number, f: keyof SetStr, v: string) =>
    setSets(p => p.map((s, idx) => idx === i ? { ...s, [f]: v } : s))

  const removeSet = (i: number) => {
    setSets(p => p.filter((_, idx) => idx !== i))
    setRevealed(r => Math.max(1, r - 1))
  }

  const addEntry = async () => {
    if (!ex.trim()) return
    const vs: LiftSet[] = sets.slice(0, revealed).filter(s => s.weight && s.reps).map(s => ({ weight: +s.weight, reps: +s.reps }))
    if (!vs.length) return
    try {
      await addWeightEntry({ date, exercise: ex.trim(), sets: vs })
      setEx(''); setSets([{ weight: '', reps: '' }]); setRevealed(1)
      setToast('Exercise saved!')
    } catch {
      setToast('Failed to save.')
    }
  }

  const saveSS = async (entries: Array<Omit<WeightEntry, 'id'>>) => {
    try {
      await Promise.all(entries.map(e => addWeightEntry(e)))
      setSsExercises(null); setSsInitialSets(null)
      setToast('Superset saved!')
    } catch {
      setToast('Failed to save.')
    }
  }

  const chartEx = selEx || exercises[0] || ''
  // For chart, find the program that tracks the chart exercise (or first program)
  const chartProgram = programs.find(ap => ap.days.some(d => d.exercises.includes(chartEx))) ?? programs[0]
  const chartData = weights
    .filter(d => d.exercise === chartEx)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      date: d.date.slice(5),
      maxWeight: Math.max(...d.sets.map(s => s.weight)),
      volume: d.sets.reduce((a, s) => a + s.weight * s.reps, 0),
      deload: chartProgram ? isDeloadDate(chartProgram.startDate, d.date) : false,
    }))

  const allWeightsSorted = [...weights].sort((a, b) => b.date.localeCompare(a.date))

  const recentGrouped: Array<{ type: 'single' | 'superset'; entries: WeightEntry[] }> = []
  const usedIds = new Set<string>()
  for (const entry of allWeightsSorted) {
    if (usedIds.has(entry.id)) continue
    if (entry.supersetId) {
      const partner = allWeightsSorted.find(e => e.supersetId === entry.supersetId && e.id !== entry.id)
      if (partner && !usedIds.has(partner.id)) {
        recentGrouped.push({ type: 'superset', entries: [entry, partner] })
        usedIds.add(entry.id); usedIds.add(partner.id); continue
      }
    }
    recentGrouped.push({ type: 'single', entries: [entry] })
    usedIds.add(entry.id)
  }

  return (
    <div className="flex flex-col gap-4">
      {programs
        .filter(ap => !cycleInfo(ap).isComplete)
        .map(ap => (
          <TodaysPlan
            key={ap.userProgramId}
            program={ap}
            weights={weights}
            variantWeekdays={activeVariantWeekdays(weekOverrides, ap.userProgramId)}
            onToggleVariant={(dow, active) => toggleWeekVariant(ap.userProgramId, dow, active)}
            onPickSingle={n => { setSsExercises(null); handleSelectEx(n); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50) }}
            onPickSingleWithSets={handlePickWithSets}
            onPickSuperset={exArr => { setSsInitialSets(null); setSsExercises(exArr); setEx(''); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50) }}
            onPickSupersetDeload={(exArr, getLastFn) => {
              const s0 = getLastFn(exArr[0])?.sets.map(s => ({ weight: s.weight, reps: Math.max(1, Math.round(s.reps * 0.7)) }))
              const s1 = getLastFn(exArr[1])?.sets.map(s => ({ weight: s.weight, reps: Math.max(1, Math.round(s.reps * 0.7)) }))
              setSsInitialSets({ sets0: s0, sets1: s1 })
              setSsExercises(exArr); setEx('')
              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
            }}
          />
        ))}

      {ssExercises && (
        <SupersetLogger
          exercises={ssExercises}
          weights={weights}
          date={date}
          programStartDate={chartProgram?.startDate}
          isDeload={isAnyDeload}
          initialSets0={ssInitialSets?.sets0}
          initialSets1={ssInitialSets?.sets1}
          onSave={saveSS}
          onCancel={() => { setSsExercises(null); setSsInitialSets(null) }}
        />
      )}

      {!ssExercises && (
        <Card>
          <SecTitle>Log Exercise</SecTitle>
          <div className="flex flex-col gap-2.5 mb-3">
            <div>
              <p className="text-xs text-muted font-medium mb-1">Exercise</p>
              <SmartInput
                value={ex}
                onChange={v => { setEx(v); if (!v) setSsExercises(null) }}
                suggestions={exercises}
                placeholder="e.g. Bench Press"
              />
            </div>
            {lastPerf && (
              <div className="px-2.5 py-2 bg-bg rounded-lg text-xs text-muted">
                <span className="font-semibold text-primary">Last ({lastPerf.date}):</span>{' '}
                {lastPerf.sets.map(s => `${s.weight}kg×${s.reps}`).join(' · ')}
              </div>
            )}
            <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="mb-3">
            <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: '28px minmax(0,1fr) minmax(0,1fr) 28px' }}>
              {['#', 'Weight (kg)', 'Reps', ''].map((h, i) => (
                <p key={i} className="text-[11px] text-muted font-semibold">{h}</p>
              ))}
            </div>
            {sets.slice(0, revealed).map((s, i) => (
              <div key={i} className="grid gap-1.5 mb-1.5 items-center" style={{ gridTemplateColumns: '28px minmax(0,1fr) minmax(0,1fr) 28px' }}>
                <span className="text-xs text-muted text-center">{i + 1}</span>
                <input
                  value={s.weight} onChange={e => updateSet(i, 'weight', e.target.value)}
                  type="number" placeholder="60" min="0" step="0.5"
                  className="w-full min-w-0 border border-border rounded-lg px-2.5 py-1.5 text-sm bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                <input
                  value={s.reps} onChange={e => updateSet(i, 'reps', e.target.value)}
                  type="number" placeholder="10" min="1"
                  className="w-full min-w-0 border border-border rounded-lg px-2.5 py-1.5 text-sm bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                <div>{sets.slice(0, revealed).length > 1 && <DelBtn noConfirm onClick={() => removeSet(i)} />}</div>
              </div>
            ))}
            <button onClick={revealNext} className="text-xs text-accent mt-1">
              + {revealed < sets.length ? `Set ${revealed + 1} (${sets[revealed].weight}kg × ${sets[revealed].reps})` : 'Add set'}
            </button>
          </div>

          {(live1RM > 0 || historical1RM > 0) && (
            <div className="flex items-center justify-between px-2.5 py-2 bg-accent-l rounded-lg mb-3 text-xs">
              <span className="text-muted font-medium">💪 Est. 1RM</span>
              <span className="text-primary font-semibold tabular-nums flex items-center gap-1.5">
                {live1RM > 0 ? `${Math.round(live1RM)} kg` : '–'}
                {historical1RM > 0 && (
                  <span className="text-muted font-normal">· best {Math.round(historical1RM)} kg</span>
                )}
                {live1RM > 0 && live1RM >= historical1RM && historical1RM > 0 && (
                  <span className="text-accent font-bold">🏆 PR</span>
                )}
              </span>
            </div>
          )}

          <Btn onClick={addEntry} className="w-full">Save Exercise</Btn>
        </Card>
      )}

      {exercises.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {exercises.map(e => (
            <Chip key={e} active={selEx === e} onClick={() => handleSelectEx(e)}>{e}</Chip>
          ))}
        </div>
      )}

      {exercises.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2.5">
            <SecTitle>Progress</SecTitle>
            <div className="flex gap-1">
              <Chip small active={chartMetric === 'maxWeight'} onClick={() => setChartMetric('maxWeight')}>Max kg</Chip>
              <Chip small active={chartMetric === 'volume'} onClick={() => setChartMetric('volume')}>Volume</Chip>
            </div>
          </div>
          <select
            value={chartEx}
            onChange={e => setSelEx(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-primary mb-3 focus:outline-none"
          >
            {exercises.map(e => <option key={e}>{e}</option>)}
          </select>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} width={40} />
                <Tooltip formatter={(v: number) => [`${v} kg`, chartMetric === 'maxWeight' ? 'Max Weight' : 'Volume']} />
                <Line
                  type="monotone"
                  dataKey={chartMetric}
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={(props: { cx?: number; cy?: number; payload?: { deload?: boolean }; index?: number }) => {
                    const { cx, cy, payload, index } = props
                    if (cx == null || cy == null) return <g key={index} />
                    return payload?.deload
                      ? <circle key={index} cx={cx} cy={cy} r={5} fill="#92400e" stroke="#fcd34d" strokeWidth={2} />
                      : <circle key={index} cx={cx} cy={cy} r={3} fill="#6366f1" />
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted text-center py-8">Not enough data to chart</p>
          )}
        </Card>
      )}

      <Card>
        <SecTitle>Recent</SecTitle>
        <HistoryList
          items={recentGrouped}
          getDate={g => g.entries[0].date}
          categories={exercises}
          categoryLabel="Exercise"
          matchesCategory={(g, cat) => g.entries.some(e => e.exercise === cat)}
          emptyMessage="No entries yet"
          renderItem={(g, gi) => {
            if (g.type === 'superset') {
              return (
                <div key={gi} className="mb-3 border border-ss-b rounded-xl p-2.5 bg-ss-l">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <SSBadge />
                    <span className="text-[11px] text-ss font-semibold">Superset</span>
                    <span className="text-[11px] text-muted ml-auto">{g.entries[0].date}</span>
                    <EditBtn onClick={() => openEditModal({ type: 'weight-superset', records: [g.entries[0], g.entries[1]] })} />
                    <DelBtn onClick={() => {
                      g.entries.forEach(e => removeWeightEntry(e.id))
                    }} />
                  </div>
                  {g.entries.map((e, ei) => (
                    <div key={ei} className={ei === 0 ? 'mb-1.5' : ''}>
                      <span className="text-xs font-semibold text-primary">{e.exercise}</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {e.sets.map((s, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-surface text-[11px] text-muted">S{i + 1}: {s.weight}kg×{s.reps}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
            const entry = g.entries[0]
            return (
              <div key={gi} className="flex items-start justify-between py-2 border-b border-bg last:border-0">
                <div>
                  <p className="text-sm font-semibold text-primary flex items-center gap-1.5">
                    {entry.exercise}
                    {best1RM(entry.sets) > 0 && (
                      <span className="text-[10px] font-medium text-accent bg-accent-l px-1.5 py-0.5 rounded-full">
                        ≈{Math.round(best1RM(entry.sets))}kg 1RM
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {entry.sets.map((s, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-bg text-[11px] text-muted">S{i + 1}: {s.weight}kg×{s.reps}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-2 mt-0.5">
                  <span className="text-[11px] text-muted">{entry.date}</span>
                  <EditBtn onClick={() => openEditModal({ type: 'weight', record: entry })} />
                  <DelBtn onClick={() => removeWeightEntry(entry.id)} />
                </div>
              </div>
            )
          }}
        />
      </Card>
    </div>
  )
}
