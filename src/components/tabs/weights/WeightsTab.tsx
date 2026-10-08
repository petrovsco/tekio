import { useState, useMemo, useRef } from 'react'
import { XAxis, YAxis, Tooltip, Line } from 'recharts'
import { useAppStore } from '../../../store/app'
import { today, groupBy, lastPerformance, bestOneRM, isSetPR, weightsPickerNames, uniqSorted, fmtDate, DATE_DAY_MONTH } from '../../../lib/utils'
import { Card, SecTitle } from '../../ui/Card'
import { Inp, SelEl, FIELD_LABEL } from '../../ui/Input'
import { Btn, RowActions, YesNo, ACT_CHIP } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { SSBadge, MicroLabel, MICRO_LABEL } from '../../ui/Badges'
import { SmartInput } from '../../ui/SmartInput'
import { HistoryList } from '../../ui/HistoryList'
import { SetsGrid } from '../../ui/SetsGrid'
import { toSetStr, parseSets, setsProblem, liftSetProblem } from '../../../lib/sets'
import type { SetStr } from '../../../lib/sets'
import { CHART, CHART_LINE, CHART_AXIS, CHART_TOOLTIP, hoverDot } from '../../ui/chart'
import { ChartFrame } from '../../ui/ChartFrame'
import type { WeightEntry, PlannedExercise } from '../../../types'
import { CATALOGUE_ALIASES, CATALOGUE_NAMES, catalogueEntryFor } from '../../../constants/exerciseCatalogue'
import type { PatternKey } from '../../../constants/movementPatterns'
import { normaliseExerciseName, resolveExerciseName } from '../../../lib/exerciseName'
import { MovementQuestion } from './MovementQuestion'
import { PlanCard } from './PlanCard'
import { PlanSheet } from './PlanSheet'

export function WeightsTab() {
  const [ex, setEx] = useState('')
  const [date, setDate] = useState(today())
  const [sets, setSets] = useState<SetStr[]>([{ weight: '', reps: '' }])
  const [revealed, setRevealed] = useState(1)
  const [selEx, setSelEx] = useState('')
  const formRef = useRef<HTMLDivElement>(null)
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
  const setToast = useAppStore(s => s.setToast)
  const markPlanLogged = useAppStore(s => s.markPlanLogged)
  // The plan the form was filled from (RFC 0098). Saving the form logs the work
  // and ticks the plan; the numbers may differ from its targets.
  const [fromPlan, setFromPlan] = useState<PlannedExercise | null>(null)
  // The plan sheet (RFC 0098): `plan` absent writes a new plan.
  const [planSheet, setPlanSheet] = useState<{ plan?: PlannedExercise } | null>(null)

  // This component holds the log form's state as well as the history read, so
  // every keystroke re-renders it. Everything derived from `weights` is memoised
  // on `weights` so a keystroke recomputes none of it (roadmap 048 B7).
  const exercises = useMemo(() => uniqSorted(weights.map(d => d.exercise)), [weights])
  const pickerNames = useMemo(() => weightsPickerNames(weights, exerciseMuscles), [weights, exerciseMuscles])
  // RFC 0074: the catalogue's lifts are offered after the ones already on
  // file, so an empty field still opens on what this user actually trains.
  const suggestions = useMemo(() => {
    const own = new Set(pickerNames.map(normaliseExerciseName))
    return [...pickerNames, ...CATALOGUE_NAMES.filter(n => !own.has(normaliseExerciseName(n))).sort()]
  }, [pickerNames])
  const aliases = useMemo(() => [...exerciseAliases, ...CATALOGUE_ALIASES], [exerciseAliases])
  const getLastPerf = (n: string) => lastPerformance(weights, n)

  const lastPerf = getLastPerf(ex)

  // The movement question (RFC 0074) is for a name nothing knows. Its answer
  // belongs to the name it was given for, the way the 1RM ask below does: edit
  // the name and the answer no longer applies, with no effect resetting it.
  // While the name is still being typed, a partial that the picker can still
  // complete is not a new lift; the question waits until nothing matches or
  // the sets are being entered.
  const nameKey = normaliseExerciseName(ex)
  const stillTyping = suggestions.some(n => normaliseExerciseName(n).includes(nameKey))
    || aliases.some(a => normaliseExerciseName(a.alias).includes(nameKey))
  const unknownName = nameKey !== ''
    && !resolveExerciseName(ex, pickerNames, aliases)
    && !catalogueEntryFor(ex)
    && (!stillTyping || sets.some(s => s.weight !== '' || s.reps !== ''))
  const [movement, setMovement] = useState<{ key: string; pattern: PatternKey | null } | null>(null)
  const pattern = unknownName && movement?.key === nameKey ? movement.pattern : null

  // Only sets that could be saved feed the previews below: an invalid set is
  // neither a personal best nor a 1RM input.
  const typedSets = useMemo(() => parseSets(sets, revealed).filter(s => !liftSetProblem(s)), [sets, revealed])

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
    const problem = setsProblem(sets, revealed)
    if (problem) { setToast(problem); return }
    const vs = parseSets(sets, revealed)
    if (!vs.length) { setToast('Add at least one set with weight and reps.'); return }
    await withToast(async () => {
      const saved = await addWeightEntry({ date, exercise: ex.trim(), sets: vs }, pattern ?? undefined)
      if (fromPlan) await markPlanLogged(fromPlan.id, saved.id)
      setEx(''); setSets([{ weight: '', reps: '' }]); setRevealed(1); setMovement(null); setFromPlan(null)
    }, 'Exercise saved!')
  }

  const fillFromPlan = (p: PlannedExercise) => {
    setEx(p.exercise); setSelEx(p.exercise)
    if (p.targets.length) { setSets(toSetStr(p.targets)); setRevealed(p.targets.length) }
    else { setSets([{ weight: '', reps: '' }]); setRevealed(1) }
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const logFromPlan = (p: PlannedExercise) => {
    fillFromPlan(p); setDate(today()); setFromPlan(p)
  }



  const chartEx = selEx || exercises[0] || ''
  const chartData = useMemo(() => weights
    .filter(d => d.exercise === chartEx)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      date: fmtDate(d.date, DATE_DAY_MONTH),
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
      <PlanCard onLog={logFromPlan} onEdit={p => setPlanSheet({ plan: p })} onAdd={() => setPlanSheet({})} />
      {planSheet && (
        <PlanSheet plan={planSheet.plan} suggestions={suggestions} aliases={aliases} onClose={() => setPlanSheet(null)} />
      )}

      <div ref={formRef} className="scroll-mt-24"><Card>
          <SecTitle>Log Exercise</SecTitle>
          {fromPlan && (
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 mb-2.5 border border-dashed border-planned bg-planned-tint rounded-[3px]">
              <span className="text-[11px] text-ink-2">From today's plan: <span className="font-bold text-ink">{fromPlan.exercise}</span></span>
              <button className="text-[11px] text-ink-3 hover:text-ink cursor-pointer" onClick={() => setFromPlan(null)}>Unlink</button>
            </div>
          )}
          <div className="flex flex-col gap-2.5 mb-3">
            <div className="flex flex-col gap-1">
              <label className={FIELD_LABEL}>Exercise</label>
              <SmartInput
                value={ex}
                onChange={setEx}
                onPick={handleSelectEx}
                suggestions={suggestions}
                aliases={aliases}
                placeholder="e.g. Bench Press"
              />
            </div>
            {unknownName && (
              <MovementQuestion
                key={nameKey}
                value={pattern}
                onChange={p => setMovement({ key: nameKey, pattern: p })}
              />
            )}
            {lastPerf && (
              <div className="px-2.5 py-2 bg-hairline rounded-[3px] text-[11px] text-ink-2">
                <span className="font-bold text-ink">Last ({fmtDate(lastPerf.date)}):</span>{' '}
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
                  the outline tone (design-system §1) — like SS. */}
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
      </Card></div>

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
                      label={fmtDate(g.entries[0].date)}
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
                  label={fmtDate(entry.date)}
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
