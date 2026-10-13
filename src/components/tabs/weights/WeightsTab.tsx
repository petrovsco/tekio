import { useState, useMemo, useRef, useEffect } from 'react'
import { XAxis, YAxis, Tooltip, Line } from 'recharts'
import { useAppStore } from '../../../store/app'
import { today, lastPerformance, bestOneRM, isSetPR, weightsPickerNames, uniqSorted, fmtDate } from '../../../lib/utils'
import { Card, SecTitle } from '../../ui/Card'
import { Inp, SelEl, FIELD_LABEL } from '../../ui/Input'
import { Btn, DelBtn, RowActions, YesNo, ACT_CHIP } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { SSBadge, MicroLabel, MICRO_LABEL } from '../../ui/Badges'
import { SmartInput } from '../../ui/SmartInput'
import { HistoryList } from '../../ui/HistoryList'
import { SetsGrid } from '../../ui/SetsGrid'
import { toSetStr, parseSets, setsProblem, liftSetProblem } from '../../../lib/sets'
import type { SetStr } from '../../../lib/sets'
import { CHART, CHART_LINE, CHART_AXIS, CHART_TOOLTIP, hoverDot } from '../../ui/chart'
import { ChartFrame } from '../../ui/ChartFrame'
import type { PlannedExercise } from '../../../types'
import { CATALOGUE_ALIASES, CATALOGUE_NAMES, catalogueEntryFor } from '../../../constants/exerciseCatalogue'
import type { PatternKey } from '../../../constants/movementPatterns'
import { normaliseExerciseName, resolveExerciseName } from '../../../lib/exerciseName'
import { MovementQuestion } from './MovementQuestion'
import { PlanCard } from './PlanCard'
import { PlanSheet } from './PlanSheet'
import { FromPlanStrip } from '../../ui/PlannedCard'
import { groupRuns, groupName } from '../../../lib/supersets'
import { readDraft, writeDraft, emptyLift, liftTouched, type DraftLift, type LogDraft } from '../../../lib/logDraft'

export function WeightsTab() {
  // The form is a draft kept on the device (RFC 0106): one lift, or the lifts
  // of a superset side by side. Each set goes into the log when it is ticked;
  // what is typed and not yet ticked survives leaving the tab.
  const [draft, setDraft] = useState<LogDraft>(() => readDraft(today()))
  useEffect(() => writeDraft(draft), [draft])
  const { date, lifts, active } = draft
  const lift = lifts[active]
  const { ex, sets, revealed } = lift
  const setDate = (d: string) => setDraft(x => ({ ...x, date: d }))
  const patchLift = (f: (l: DraftLift) => DraftLift) =>
    setDraft(x => ({ ...x, lifts: x.lifts.map((l, i) => (i === x.active ? f(l) : l)) }))
  const setEx = (v: string) => patchLift(l => ({ ...l, ex: v }))
  const setSets = (u: SetStr[] | ((p: SetStr[]) => SetStr[])) =>
    patchLift(l => ({ ...l, sets: typeof u === 'function' ? u(l.sets) : u }))
  const setRevealed = (u: number | ((r: number) => number)) =>
    patchLift(l => ({ ...l, revealed: typeof u === 'function' ? u(l.revealed) : u }))
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
  const editWeightEntry = useAppStore(s => s.editWeightEntry)
  const openEditModal = useAppStore(s => s.openEditModal)
  const withToast = useAppStore(s => s.withToast)
  const setToast = useAppStore(s => s.setToast)
  const markPlanLogged = useAppStore(s => s.markPlanLogged)
  const plans = useAppStore(s => s.plans)
  // The plan the lift was filled from (RFC 0098). Saving the form logs the work
  // and ticks the plan; the numbers may differ from its targets.
  const fromPlan = plans.find(p => p.id === lift.planId && (!p.loggedAs || p.loggedAs === lift.entryId)) ?? null
  const unlinkPlan = () => patchLift(l => ({ ...l, planId: undefined, supersetId: undefined }))
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
  // The lift being logged is not its own "last": its ticked sets are already in
  // the log (RFC 0106).
  const getLastPerf = (n: string) => lastPerformance(lift.entryId ? weights.filter(w => w.id !== lift.entryId) : weights, n)

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
      ? weights
          .filter(d => d.id !== lift.entryId && d.exercise.toLowerCase() === ex.trim().toLowerCase())
          .flatMap(d => d.sets)
      : [],
    [weights, ex, lift.entryId],
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

  // A lift's entry, if the log still has it: an entry deleted from Recent
  // leaves its lift with nothing saved.
  const entryOf = (l: DraftLift) => (l.entryId && weights.some(w => w.id === l.entryId) ? l.entryId : undefined)
  const savedOf = (l: DraftLift) => (entryOf(l) ? l.saved ?? [] : [])
  const anySaved = lifts.some(l => savedOf(l).some(Boolean))
  const [busy, setBusy] = useState(false)
  // The button names everything it will save: a superset's Finish saves every
  // lift on the form, not only the one showing (RFC 0106).
  const together = lifts.length > 1 && lifts.every(l => l.supersetId && l.supersetId === lifts[0].supersetId)
  const what = together ? groupName(lifts.length).toLowerCase() : lifts.length > 1 ? `${lifts.length} exercises` : 'exercise'
  const saveLabel = `${anySaved ? 'Finish' : 'Save'} ${what}`

  /**
   * Writes a lift's chosen rows to the log (RFC 0106): the first set creates
   * its entry, in its superset and ticking its plan; later ones rewrite the
   * entry's sets; none left removes it. Returns whether the write went in.
   */
  const writeLift = async (l: DraftLift, saved: boolean[], toast: string): Promise<boolean> => {
    if (!l.ex.trim()) { setToast('Pick an exercise first.'); return false }
    const rows = l.sets.slice(0, l.revealed).map((s, i) => ({ s, i })).filter(r => saved[r.i])
    const chosen = rows.map(({ s }) => ({ weight: +s.weight, reps: +s.reps }))
    const problem = chosen.map(liftSetProblem).find(Boolean)
    if (problem) { setToast(problem); return false }
    const entryId = entryOf(l)
    setBusy(true)
    const ok = await withToast(async () => {
      let id = entryId
      if (!id && chosen.length) {
        const entry = await addWeightEntry(
          { date, exercise: l.ex.trim(), sets: chosen, ...(l.supersetId ? { supersetId: l.supersetId } : {}) },
          l.id === lift.id ? pattern ?? undefined : undefined,
        )
        id = entry.id
        if (l.planId && plans.some(p => p.id === l.planId && !p.loggedAs)) await markPlanLogged(l.planId, id)
      } else if (id && chosen.length) {
        await editWeightEntry(id, { sets: chosen })
      } else if (id) {
        await removeWeightEntry(id)
        id = undefined
      }
      setDraft(x => ({
        ...x,
        lifts: x.lifts.map(y => (y.id === l.id ? { ...y, entryId: id, saved: id ? saved : [] } : y)),
      }))
    }, toast)
    setBusy(false)
    return ok
  }

  /** Tick: this one set goes into the log, or comes back out of it. */
  const toggleSet = (i: number) => {
    const saved = [...savedOf(lift)]
    saved[i] = !saved[i]
    void writeLift(lift, saved, saved[i] ? `Set ${i + 1} saved` : `Set ${i + 1} taken out`)
  }

  /** Finish: every filled set not yet ticked is saved too, and the lifts that
   *  are in the log leave the form. A lift with nothing typed stays. */
  const addEntry = async () => {
    const pending = lifts.filter(l => l.ex.trim() && parseSets(l.sets, l.revealed).length > 0)
    if (!pending.length) {
      setToast(ex.trim() ? 'Add at least one set with weight and reps.' : 'Pick an exercise first.')
      return
    }
    for (const l of pending) {
      const problem = setsProblem(l.sets, l.revealed)
      if (problem) { setToast(lifts.length > 1 ? `${l.ex.trim()}: ${problem}` : problem); return }
    }
    for (const l of pending) {
      const prev = savedOf(l)
      const saved = l.sets.slice(0, l.revealed).map((s, i) => !!prev[i] || !!(s.weight && s.reps))
      const changed = saved.some((v, i) => v !== !!prev[i])
      if (changed && !(await writeLift(l, saved, 'Saved'))) return
      // In the log now: off the form.
      setDraft(x => {
        const rest = x.lifts.filter(y => y.id !== l.id)
        return rest.length ? { ...x, lifts: rest, active: 0 } : { ...x, lifts: [emptyLift()], active: 0 }
      })
    }
    setMovement(null)
    setToast(pending.length > 1 ? `${pending.length} exercises saved!` : 'Exercise saved!')
  }

  const liftFromPlan = (p: PlannedExercise): DraftLift => ({
    id: crypto.randomUUID(),
    ex: p.exercise,
    sets: p.targets.length ? toSetStr(p.targets) : [{ weight: '', reps: '' }],
    revealed: p.targets.length || 1,
    planId: p.id,
    ...(p.supersetId ? { supersetId: p.supersetId } : {}),
  })

  /** Log on a plan: a lift already on the form is shown as typed; otherwise the
   *  plan, with the rest of its superset, joins the form. An untouched form is
   *  replaced; one with typing keeps it, beside the new lifts. */
  const logFromPlan = (p: PlannedExercise) => {
    setSelEx(p.exercise)
    setDraft(x => {
      const at = x.lifts.findIndex(l => l.planId === p.id)
      if (at >= 0) return { ...x, active: at }
      const group = p.supersetId
        ? plans.filter(q => q.supersetId === p.supersetId && !q.loggedAs && !x.lifts.some(l => l.planId === q.id))
        : [p]
      const kept = x.lifts.filter(liftTouched)
      const added = group.map(liftFromPlan)
      return {
        date: kept.length ? x.date : today(),
        lifts: [...kept, ...added],
        active: kept.length + Math.max(0, group.findIndex(q => q.id === p.id)),
      }
    })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const chartEx = selEx || exercises[0] || ''
  const chartData = useMemo(() => weights
    .filter(d => d.exercise === chartEx)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      date: fmtDate(d.date, { year: 'never', relative: false }),
      maxWeight: Math.max(...d.sets.map(s => s.weight)),
      volume: d.sets.reduce((a, s) => a + s.weight * s.reps, 0),
    })), [weights, chartEx])

  // A superset or circuit (RFC 0106) reads as one block wherever its first
  // lift stands, newest first like every other row.
  const recentGrouped = useMemo(() => groupRuns(
    [...weights].sort((a, b) => b.date.localeCompare(a.date)),
    e => e.supersetId,
  ).map(entries => ({ type: entries.length > 1 ? 'superset' as const : 'single' as const, entries })), [weights])

  return (
    <div className="flex flex-col gap-4">
      <PlanCard onLog={logFromPlan} onEdit={p => setPlanSheet({ plan: p })} onAdd={() => setPlanSheet({})} />
      {planSheet && (
        <PlanSheet plan={planSheet.plan} suggestions={suggestions} aliases={aliases} onClose={() => setPlanSheet(null)} />
      )}

      <div ref={formRef} className="scroll-mt-24"><Card>
          <SecTitle>Log Exercise</SecTitle>
          {lifts.length > 1 && (
            <div className="flex flex-col gap-1.5 mb-2.5">
              {lifts.every(l => l.supersetId && l.supersetId === lifts[0].supersetId) && (
                <div className="flex items-center gap-1.5">
                  <SSBadge />
                  <span className={MICRO_LABEL}>{groupName(lifts.length)}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {lifts.map((l, i) => (
                  <Chip key={l.id} small active={i === active} onClick={() => { setDraft(x => ({ ...x, active: i })); if (l.ex) setSelEx(l.ex) }}>
                    {l.ex.trim() || 'New exercise'}
                  </Chip>
                ))}
                <DelBtn
                  label={`Take ${ex.trim() || 'this exercise'} off this log`}
                  onClick={() => setDraft(x => ({ ...x, lifts: x.lifts.filter((_, i) => i !== x.active), active: 0 }))}
                />
              </div>
            </div>
          )}
          {fromPlan && <FromPlanStrip name={fromPlan.exercise} onUnlink={unlinkPlan} />}
          <div className="flex flex-col gap-2.5 mb-3">
            <div className="flex flex-col gap-1">
              <label className={FIELD_LABEL}>Exercise</label>
              {entryOf(lift) ? (
                <p className="text-[13px] font-bold text-ink py-1">{ex}</p>
              ) : <SmartInput
                value={ex}
                onChange={setEx}
                onPick={handleSelectEx}
                suggestions={suggestions}
                aliases={aliases}
                placeholder="e.g. Bench Press"
              />}
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
                <span className="font-bold text-ink">Last ({fmtDate(lastPerf.date, { midSentence: true })}):</span>{' '}
                {lastPerf.sets.map(s => `${s.weight}kg×${s.reps}`).join(' · ')}
              </div>
            )}
            <Inp label="Date" type="date" value={date} disabled={anySaved} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="mb-3">
            <SetsGrid
              sets={sets}
              revealed={revealed}
              onUpdate={updateSet}
              onRemove={removeSet}
              onRevealNext={revealNext}
              saved={savedOf(lift)}
              onToggle={toggleSet}
              busy={busy}
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

          <Btn onClick={addEntry} disabled={busy} className="w-full">
            {saveLabel}
          </Btn>
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
                    <span className={MICRO_LABEL}>{groupName(g.entries.length)}</span>
                    <RowActions
                      label={fmtDate(g.entries[0].date)}
                      className="ml-auto"
                      onEdit={() => openEditModal({ type: 'weight-superset', record: g.entries })}
                      onDelete={() => g.entries.forEach(e => removeWeightEntry(e.id))}
                    />
                  </div>
                  {g.entries.map((e, ei) => (
                    <div key={ei} className={ei < g.entries.length - 1 ? 'mb-1.5' : ''}>
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
