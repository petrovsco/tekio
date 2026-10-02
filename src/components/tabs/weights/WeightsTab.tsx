import { useState, useMemo } from 'react'
import { XAxis, YAxis, Tooltip, Line } from 'recharts'
import { useAppStore } from '../../../store/app'
import { today, groupBy, lastPerformance, bestOneRM, isSetPR, weightsPickerNames, uniqSorted, recentExercises } from '../../../lib/utils'
import { Card, SecTitle } from '../../ui/Card'
import { Inp, SelEl, FIELD_LABEL } from '../../ui/Input'
import { Btn, RowActions, YesNo, ACT_CHIP } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { SSBadge, MicroLabel, MICRO_LABEL } from '../../ui/Badges'
import { SmartInput } from '../../ui/SmartInput'
import { HistoryList } from '../../ui/HistoryList'
import { SetsGrid } from '../../ui/SetsGrid'
import { toSetStr, parseSets } from '../../../lib/sets'
import type { SetStr } from '../../../lib/sets'
import { CHART, CHART_LINE, CHART_AXIS, CHART_TOOLTIP, hoverDot } from '../../ui/chart'
import { ChartFrame } from '../../ui/ChartFrame'
import type { WeightEntry } from '../../../types'

/** How many recent exercises get a one-tap chip. */
const RECENT_CHIPS = 8

export function WeightsTab() {
  const [ex, setEx] = useState('')
  const [date, setDate] = useState(today())
  const [sets, setSets] = useState<SetStr[]>([{ weight: '', reps: '' }])
  const [revealed, setRevealed] = useState(1)
  const [selEx, setSelEx] = useState('')
  const [chartMetric, setChartMetric] = useState<'maxWeight' | 'volume'>('maxWeight')
  // The 1RM is answered on demand and never at rest (roadmap 067). The answer
  // belongs to the exact set it was asked about, so the ask carries that set's
  // identity: edit the exercise or any number and the ask no longer matches,
  // which reads as `idle` again without an effect resetting it.
  const [ask, setAsk] = useState<{ key: string; state: 'asking' | 'toFailure' | 'submax' } | null>(null)

  const weights = useAppStore(s => s.weights)
  const exerciseMuscles = useAppStore(s => s.exerciseMuscles)
  const exerciseAliases = useAppStore(s => s.exerciseAliases)
  const addWeightEntry = useAppStore(s => s.addWeightEntry)
  const removeWeightEntry = useAppStore(s => s.removeWeightEntry)
  const openEditModal = useAppStore(s => s.openEditModal)
  const withToast = useAppStore(s => s.withToast)

  // This component holds the log form's state as well as the history read, so
  // every keystroke re-renders it. Everything derived from `weights` is memoised
  // on `weights` so a keystroke recomputes none of it (roadmap 048 B7).
  const exercises = useMemo(() => uniqSorted(weights.map(d => d.exercise)), [weights])
  const pickerNames = useMemo(() => weightsPickerNames(weights, exerciseMuscles), [weights, exerciseMuscles])
  // The chips are the one-tap start for a lift, so they hold only the most
  // recent few: every exercise ever logged was a cloud that only grew
  // (tekio.rfcs/rfcs/0034-v2-1-candidates-tbc.md). Anything older is one
  // autocomplete pick away, and the pick fills its last sets the same way.
  const chipNames = useMemo(() => recentExercises(weights, RECENT_CHIPS), [weights])

  const getLastPerf = (n: string) => lastPerformance(weights, n)

  const lastPerf = getLastPerf(ex)

  const typedSets = useMemo(() => parseSets(sets, revealed), [sets, revealed])

  // What the typed sets could support if asked — computed, but not shown until
  // it is. `null` when no set is inside the grounded rep window.
  const oneRmCandidate = bestOneRM(typedSets)

  // A personal best is measured, never estimated: the first typed set that
  // nothing already logged for this exercise matched at its reps and its load.
  const exHistory = useMemo(
    () => ex.trim()
      ? weights.filter(d => d.exercise.toLowerCase() === ex.trim().toLowerCase()).flatMap(d => d.sets)
      : [],
    [weights, ex],
  )
  const prSet = typedSets.find(s => isSetPR(s, exHistory)) ?? null

  const askKey = `${ex.trim().toLowerCase()}|${typedSets.map(s => `${s.weight}x${s.reps}`).join(',')}`
  const maxAsk = ask?.key === askKey ? ask.state : 'idle'
  const answer = (state: 'asking' | 'toFailure' | 'submax') => () => setAsk({ key: askKey, state })

  const handleSelectEx = (n: string) => {
    setEx(n); setSelEx(n)
    const p = getLastPerf(n)
    if (p) { setSets(toSetStr(p.sets)); setRevealed(p.sets.length) }
    else { setSets([{ weight: '', reps: '' }]); setRevealed(1) }
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

  const chartEx = selEx || exercises[0] || ''
  const chartData = useMemo(() => weights
    .filter(d => d.exercise === chartEx)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      date: d.date.slice(5),
      maxWeight: Math.max(...d.sets.map(s => s.weight)),
      volume: d.sets.reduce((a, s) => a + s.weight * s.reps, 0),
    })), [weights, chartEx])

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
      <Card>
          <SecTitle>Log Exercise</SecTitle>
          <div className="flex flex-col gap-2.5 mb-3">
            <div className="flex flex-col gap-1">
              <label className={FIELD_LABEL}>Exercise</label>
              <SmartInput
                value={ex}
                onChange={setEx}
                onPick={handleSelectEx}
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

          {(prSet || oneRmCandidate) && (
            <div className="flex flex-col gap-2 px-2.5 py-2 bg-hairline rounded-[3px] mb-3">
              {/* A personal best is a stated fact, not an urgency, so it takes
                  the outline tone (design-system §1) — like SS and DELOAD. */}
              {prSet && (
                <div className="flex items-center justify-between gap-2">
                  <span className={FIELD_LABEL}>Personal best</span>
                  <span className="text-[11px] text-ink-2 tabular-nums flex items-center gap-1.5">
                    {prSet.weight}kg×{prSet.reps}
                    <MicroLabel>PR</MicroLabel>
                  </span>
                </div>
              )}

              {oneRmCandidate && maxAsk === 'idle' && (
                <button className={`${ACT_CHIP} self-start`} onClick={answer('asking')}>
                  Estimate 1RM
                </button>
              )}

              {oneRmCandidate && maxAsk === 'asking' && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] text-ink-2">Was that set taken to failure?</span>
                  <YesNo onYes={answer('toFailure')} onNo={answer('submax')} />
                </div>
              )}

              {oneRmCandidate && maxAsk === 'toFailure' && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={FIELD_LABEL}>{oneRmCandidate.kind === 'measured' ? '1RM' : 'Est. 1RM'}</span>
                    <span className="text-[13px] font-bold text-ink tabular-nums">
                      {oneRmCandidate.kind === 'measured' ? '' : '≈'}{oneRmCandidate.kg} kg
                    </span>
                  </div>
                  <p className="text-[10px] text-ink-3 leading-snug">
                    {oneRmCandidate.kind === 'measured'
                      ? 'Measured — a single rep to failure is the max itself.'
                      : `Brzycki, from ${oneRmCandidate.fromReps} reps. A tested max moves about 3 % day to day, so this is rounded to the plate.`}
                  </p>
                </div>
              )}

              {maxAsk === 'submax' && (
                <p className="text-[10px] text-ink-3 leading-snug">
                  No estimate — the formula is only validated on a set taken to failure.
                </p>
              )}
            </div>
          )}

          <Btn onClick={addEntry} className="w-full">Save exercise</Btn>
      </Card>

      {chipNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chipNames.map(e => (
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
          <ChartFrame data={chartData}>
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
              activeDot={hoverDot(CHART.line)}
              // No resting dots (§9).
              dot={false}
            />
          </ChartFrame>
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
