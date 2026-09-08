import { useState, useEffect, useMemo } from 'react'
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts'
import { useAppStore } from '../../../store/app'
import { today, cycleInfo, deloadSets, groupBy, isDeloadDate, isTodayDone, lastPerformance, programMode, best1RM, weightsPickerNames, uniqSorted } from '../../../lib/utils'
import { Card, SecTitle, EmptyMsg } from '../../ui/Card'
import { Inp, SelEl, FIELD_LABEL } from '../../ui/Input'
import { Btn, RowActions } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { SSBadge, MICRO_LABEL } from '../../ui/Badges'
import { SmartInput } from '../../ui/SmartInput'
import { HistoryList } from '../../ui/HistoryList'
import { SetsGrid } from '../../ui/SetsGrid'
import { toSetStr, parseSets } from '../../../lib/sets'
import type { SetStr } from '../../../lib/sets'
import { CHART, CHART_LINE, CHART_AXIS, CHART_TOOLTIP } from '../../ui/chart'
import { TodaysPlan } from './TodaysPlan'
import { SupersetLogger } from './SupersetLogger'
import type { WeightEntry, LiftSet } from '../../../types'

export function WeightsTab() {
  const [ex, setEx] = useState('')
  const [date, setDate] = useState(today())
  const [sets, setSets] = useState<SetStr[]>([{ weight: '', reps: '' }])
  const [revealed, setRevealed] = useState(1)
  const [selEx, setSelEx] = useState('')
  const [chartMetric, setChartMetric] = useState<'maxWeight' | 'volume'>('maxWeight')
  const [ssExercises, setSsExercises] = useState<[string, string] | null>(null)
  const [ssInitialSets, setSsInitialSets] = useState<{ sets0?: LiftSet[]; sets1?: LiftSet[] } | null>(null)

  const { weights, exerciseMuscles, exerciseAliases, programs, addWeightEntry, removeWeightEntry, openEditModal, advanceActiveProgram, withToast } = useAppStore()

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

  // This component holds the log form's state as well as the history read, so
  // every keystroke re-renders it. Everything derived from `weights` is memoised
  // on `weights` so a keystroke recomputes none of it (roadmap 048 B7).
  const exercises = useMemo(() => uniqSorted(weights.map(d => d.exercise)), [weights])
  const pickerNames = useMemo(() => weightsPickerNames(weights, exerciseMuscles), [weights, exerciseMuscles])

  const isAnyDeload = programs.some(ap => isDeloadDate(ap.startDate, today()))

  // A session counts as deload if it falls in *any* active program's deload week.
  const programStartDates = programs.map(ap => ap.startDate)
  const getLastPerf = (n: string) => lastPerformance(weights, n, programStartDates)

  const lastPerf = getLastPerf(ex)

  // Estimated 1RM (Epley × Brzycki blend): live from the sets being entered,
  // plus the historical best across all logged sets for this exercise.
  const live1RM = best1RM(parseSets(sets, revealed))
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
    if (p) { setSets(toSetStr(p.sets)); setRevealed(p.sets.length) }
    else { setSets([{ weight: '', reps: '' }]); setRevealed(1) }
  }

  const handlePickWithSets = (n: string, computedSets: LiftSet[]) => {
    setSsExercises(null)
    setEx(n); setSelEx(n)
    setSets(toSetStr(computedSets))
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
    const vs = parseSets(sets, revealed)
    if (!vs.length) return
    await withToast(async () => {
      await addWeightEntry({ date, exercise: ex.trim(), sets: vs })
      setEx(''); setSets([{ weight: '', reps: '' }]); setRevealed(1)
    }, 'Exercise saved!')
  }

  const saveSS = async (entries: Array<Omit<WeightEntry, 'id'>>) => {
    await withToast(async () => {
      await Promise.all(entries.map(e => addWeightEntry(e)))
      setSsExercises(null); setSsInitialSets(null)
    }, 'Superset saved!')
  }

  const chartEx = selEx || exercises[0] || ''
  // For chart, find the program that tracks the chart exercise (or first program)
  const chartProgram = programs.find(ap => ap.days.some(d => d.exercises.includes(chartEx))) ?? programs[0]
  const chartData = useMemo(() => weights
    .filter(d => d.exercise === chartEx)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      date: d.date.slice(5),
      maxWeight: Math.max(...d.sets.map(s => s.weight)),
      volume: d.sets.reduce((a, s) => a + s.weight * s.reps, 0),
      deload: chartProgram ? isDeloadDate(chartProgram.startDate, d.date) : false,
    })), [weights, chartEx, chartProgram])

  const recentGrouped = useMemo(() => {
    const sorted = [...weights].sort((a, b) => b.date.localeCompare(a.date))
    // Index the supersets once. The pairing used to `find` a partner in the
    // whole list per entry, which is O(n²) — and it ran on every keystroke.
    // Entries with no superset all land in the '' bucket, which is never read.
    const bySuperset = groupBy(sorted, e => e.supersetId ?? '')
    const groups: Array<{ type: 'single' | 'superset'; entries: WeightEntry[] }> = []
    const used = new Set<string>()
    for (const entry of sorted) {
      if (used.has(entry.id)) continue
      const partner = entry.supersetId
        ? bySuperset.get(entry.supersetId)?.find(e => e.id !== entry.id && !used.has(e.id))
        : undefined
      if (partner) {
        groups.push({ type: 'superset', entries: [entry, partner] })
        used.add(entry.id); used.add(partner.id)
        continue
      }
      groups.push({ type: 'single', entries: [entry] })
      used.add(entry.id)
    }
    return groups
  }, [weights])

  return (
    <div className="flex flex-col gap-4">
      {programs
        .filter(ap => !cycleInfo(ap).isComplete)
        .map(ap => (
          <TodaysPlan
            key={ap.userProgramId}
            program={ap}
            onPickSingle={n => { setSsExercises(null); handleSelectEx(n); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50) }}
            onPickSingleWithSets={handlePickWithSets}
            onPickSuperset={exArr => { setSsInitialSets(null); setSsExercises(exArr); setEx(''); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50) }}
            onPickSupersetDeload={exArr => {
              // One deload model, from lib/utils — this used to re-implement it
              // with a bare 0.7 and disagree with the plan preview beside it.
              const prescribe = (n: string) => {
                const p = getLastPerf(n)
                return p && deloadSets(p.sets)
              }
              setSsInitialSets({ sets0: prescribe(exArr[0]), sets1: prescribe(exArr[1]) })
              setSsExercises(exArr); setEx('')
              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
            }}
          />
        ))}

      {ssExercises && (
        <SupersetLogger
          exercises={ssExercises}
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
            <div className="flex flex-col gap-1">
              <label className={FIELD_LABEL}>Exercise</label>
              <SmartInput
                value={ex}
                onChange={v => { setEx(v); if (!v) setSsExercises(null) }}
                suggestions={pickerNames}
                aliases={exerciseAliases}
                placeholder="e.g. Bench Press"
              />
            </div>
            {lastPerf && (
              <div className="px-2.5 py-2 bg-hairline rounded-[3px] text-[11px] text-ink-2">
                <span className="font-bold text-ink">Last ({lastPerf.date}):</span>{' '}
                {lastPerf.sets.map(s => `${s.weight}kg×${s.reps}`).join(' · ')}
              </div>
            )}
            <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="mb-3">
            <SetsGrid
              sets={sets}
              revealed={revealed}
              onUpdate={updateSet}
              onRemove={removeSet}
              onRevealNext={revealNext}
            />
          </div>

          {(live1RM > 0 || historical1RM > 0) && (
            <div className="flex items-center justify-between gap-2 px-2.5 py-2 bg-hairline rounded-[3px] mb-3">
              <span className={FIELD_LABEL}>Est. 1RM</span>
              <span className="text-[13px] font-bold text-ink tabular-nums flex items-center gap-1.5">
                {live1RM > 0 ? `${Math.round(live1RM)} kg` : '–'}
                {historical1RM > 0 && (
                  <span className="text-[11px] text-ink-2 font-normal">· best {Math.round(historical1RM)} kg</span>
                )}
                {/* A personal best is a fact, not an urgency, so it takes no
                    accent (design-system §1) — it is stated, like SS and DELOAD. */}
                {live1RM > 0 && live1RM >= historical1RM && historical1RM > 0 && (
                  <span className="inline-flex items-center px-1.5 py-[2px] rounded-[2px] bg-ink text-white text-[8px] font-bold uppercase tracking-[0.08em]">PR</span>
                )}
              </span>
            </div>
          )}

          <Btn onClick={addEntry} className="w-full">Save exercise</Btn>
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
          <div className="mb-3">
            <SelEl
              value={chartEx}
              onChange={e => setSelEx(e.target.value)}
              options={exercises.map(e => ({ value: e, label: e }))}
            />
          </div>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={chartData} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="date" {...CHART_AXIS} />
                <YAxis domain={['auto', 'auto']} width={38} {...CHART_AXIS} />
                <Tooltip
                  {...CHART_TOOLTIP}
                  formatter={(v: number) => chartMetric === 'maxWeight'
                    ? [`${v} kg`, 'Max weight']
                    : [`${v} kg·reps`, 'Volume']}
                />
                <Line
                  {...CHART_LINE}
                  dataKey={chartMetric}
                  stroke={CHART.line}
                  activeDot={{ r: 3, fill: CHART.line, stroke: 'none' }}
                  // No resting dots (§9) — the only marked points are the deload
                  // sessions, and a single point is exactly what the accent is for.
                  dot={(props: { cx?: number; cy?: number; payload?: { deload?: boolean }; index?: number }) => {
                    const { cx, cy, payload, index } = props
                    if (cx == null || cy == null || !payload?.deload) return <g key={index} />
                    return <circle key={index} cx={cx} cy={cy} r={3.5} fill={CHART.accent} />
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyMsg>Not enough data to chart</EmptyMsg>
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
                <div key={gi} className="mb-3 border border-line rounded-[3px] p-2.5 bg-paper">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <SSBadge />
                    <span className={MICRO_LABEL}>Superset</span>
                    <RowActions
                      label={g.entries[0].date}
                      className="ml-auto"
                      onEdit={() => openEditModal({ type: 'weight-superset', record: [g.entries[0], g.entries[1]] })}
                      onDelete={() => g.entries.forEach(e => removeWeightEntry(e.id))}
                    />
                  </div>
                  {g.entries.map((e, ei) => (
                    <div key={ei} className={ei === 0 ? 'mb-1.5' : ''}>
                      <span className="text-xs font-bold text-ink">{e.exercise}</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {e.sets.map((s, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded-[2px] bg-white border border-line text-[10px] text-ink-2 tabular-nums">S{i + 1}: {s.weight}kg×{s.reps}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
            const entry = g.entries[0]
            return (
              <div key={gi} className="flex items-start justify-between py-2 border-b border-hairline last:border-0">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink flex items-center gap-1.5 flex-wrap">
                    {entry.exercise}
                    {best1RM(entry.sets) > 0 && (
                      <span className="text-[10px] font-semibold text-ink-2 border border-line px-1.5 py-0.5 rounded-[2px] tabular-nums">
                        ≈{Math.round(best1RM(entry.sets))}kg 1RM
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {entry.sets.map((s, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded-[2px] bg-hairline text-[10px] text-ink-2 tabular-nums">S{i + 1}: {s.weight}kg×{s.reps}</span>
                    ))}
                  </div>
                </div>
                <RowActions
                  label={entry.date}
                  className="ml-2 mt-0.5"
                  onEdit={() => openEditModal({ type: 'weight', record: entry })}
                  onDelete={() => removeWeightEntry(entry.id)}
                />
              </div>
            )
          }}
        />
      </Card>
    </div>
  )
}
