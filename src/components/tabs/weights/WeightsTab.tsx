import { useState, useMemo, useRef, useEffect } from 'react'
import { XAxis, YAxis, Tooltip, Line } from 'recharts'
import { useAppStore } from '../../../store/app'
import { today, lastPerformance, bestOneRM, isSetPR, weightsPickerNames, uniqSorted, fmtDate } from '../../../lib/utils'
import { Card, SecTitle } from '../../ui/Card'
import { Inp, SelEl, FIELD_LABEL } from '../../ui/Input'
import { Btn, RowActions, YesNo, ACT_CHIP } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { SSBadge, MicroLabel, MICRO_LABEL } from '../../ui/Badges'
import { SmartInput } from '../../ui/SmartInput'
import { HistoryList } from '../../ui/HistoryList'
import { SetsGrid } from '../../ui/SetsGrid'
import { Icon } from '../../ui/Icon'
import { toSetStr, toLiftSet, parseSets, setsProblem, liftSetProblem, rowFilled, fmtSet, isTimedSet } from '../../../lib/sets'
import type { SetStr } from '../../../lib/sets'
import { CHART, CHART_LINE, CHART_AXIS, CHART_TOOLTIP, hoverDot } from '../../ui/chart'
import { ChartFrame } from '../../ui/ChartFrame'
import type { PlannedExercise, LiftSet } from '../../../types'
import { CATALOGUE_ALIASES, CATALOGUE_NAMES, catalogueEntryFor, isTimedName } from '../../../constants/exerciseCatalogue'
import type { PatternKey } from '../../../constants/movementPatterns'
import { normaliseExerciseName, resolveExerciseName } from '../../../lib/exerciseName'
import { MovementQuestion } from './MovementQuestion'
import { PlanCard } from './PlanCard'
import { PlanSheet } from './PlanSheet'
import { FromPlanStrip } from '../../ui/PlannedCard'
import { groupRuns, groupName } from '../../../lib/supersets'
import { readDraft, writeDraft, emptyLift, liftTouched, type DraftLift, type LogDraft } from '../../../lib/logDraft'

const sameSet = (a: LiftSet, b: LiftSet) => a.weight === b.weight && a.reps === b.reps && a.seconds === b.seconds

/** A lift on its way to the log, with what the first write needs from the
 *  form: the day, and the movement named for a lift nothing knows. */
type OnLog = DraftLift & { date: string; pattern?: PatternKey }

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

  // Whether a name is a hold, logged in seconds (RFC 0107): the catalogue's
  // holds are; any other name the app knows is what it was last logged or
  // planned as. `null` for a name nothing knows: its lift's own answer decides.
  const timedOf = (n: string): boolean | null => {
    if (!n.trim()) return null
    if (isTimedName(n)) return true
    const known = resolveExerciseName(n, pickerNames, aliases)
    const name = normaliseExerciseName(known ?? n)
    const last = weights
      .filter(w => normaliseExerciseName(w.exercise) === name)
      .reduce<typeof weights[number] | undefined>((a, w) => (!a || w.date > a.date ? w : a), undefined)
    if (last) return last.sets.some(isTimedSet)
    const plan = plans.find(p => normaliseExerciseName(p.exercise) === name && p.targets.length > 0)
    if (plan) return plan.targets.some(isTimedSet)
    return known || catalogueEntryFor(n) ? false : null
  }
  const timedLift = (l: DraftLift): boolean => timedOf(l.ex) ?? l.timed ?? false
  const timed = timedLift(lift)

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
  const typedSets = useMemo(() => parseSets(sets, revealed, timed).filter(s => !liftSetProblem(s)), [sets, revealed, timed])

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

  const askKey = `${ex.trim().toLowerCase()}|${typedSets.map(fmtSet).join(',')}`
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
  // leaves its lift with nothing saved. A tick shows the moment it is tapped,
  // before its write lands, so a lift with no entry yet can already have
  // ticked rows; one whose entry has gone has none.
  const liveEntry = (id?: string) => (id && useAppStore.getState().weights.some(w => w.id === id) ? id : undefined)
  const entryOf = (l: DraftLift) => (l.entryId && weights.some(w => w.id === l.entryId) ? l.entryId : undefined)
  const savedOf = (l: DraftLift) => (l.entryId && !entryOf(l) ? [] : l.saved ?? [])
  const anySaved = lifts.some(l => savedOf(l).some(Boolean))
  // Only Finish holds the button; a tick never does, it waits its turn below.
  // The ref stops a double tap that lands before the button redraws disabled.
  const [busy, setBusy] = useState<'one' | 'all' | null>(null)
  const finishing = useRef(false)
  // The button names everything it will save: a superset's Finish saves every
  // lift on the form, not only the one showing (RFC 0106).
  const together = lifts.length > 1 && lifts.every(l => l.supersetId && l.supersetId === lifts[0].supersetId)
  const what = together ? groupName(lifts.length).toLowerCase() : lifts.length > 1 ? `${lifts.length} exercises` : 'exercise'
  const saveLabel = `${anySaved ? 'Finish' : 'Save'} ${what}`
  // With more than one lift on the form, the one showing can be finished on
  // its own: it leaves the switcher and the rest stay.
  const oneLabel = `${savedOf(lift).some(Boolean) ? 'Finish' : 'Save'} this one`

  // Writes go to the database one at a time, in the order they were tapped, so
  // a second tick can follow the first without waiting on screen for it.
  // `logged` is what the database holds for each lift, as the last write left
  // it; the form's `saved` is what the user has asked for, shown at once.
  const queue = useRef<Promise<unknown>>(Promise.resolve())
  const enqueue = <T,>(job: () => Promise<T>): Promise<T> => {
    const run = queue.current.then(job)
    queue.current = run.catch(() => {})
    return run
  }
  const logged = useRef(new Map<string, { entryId?: string; saved: boolean[] }>())
  // The same ticks as state, so a row whose write is still on its way can
  // show it is (the spinner on Done).
  const [confirmed, setConfirmed] = useState<Record<string, boolean[]>>({})
  const setLogged = (id: string, v?: { entryId?: string; saved: boolean[] }) => {
    if (v) logged.current.set(id, v)
    else logged.current.delete(id)
    setConfirmed(c => {
      const { [id]: _, ...rest } = c
      return v ? { ...rest, [id]: v.saved } : rest
    })
  }
  const pendingOf = (l: DraftLift) => {
    const have = confirmed[l.id]
    return have ? savedOf(l).map((v, i) => !!v !== !!have[i]) : []
  }
  const loggedOf = (l: DraftLift) => logged.current.get(l.id) ?? fromLog(l)
  // A lift this visit has not written: its ticks are trusted only as far as
  // the entry's sets bear them out, in order, since a tick left on the device
  // by a write that never landed must not read as saved.
  const fromLog = (l: DraftLift) => {
    const entry = useAppStore.getState().weights.find(w => w.id === l.entryId)
    if (!entry) return { entryId: undefined, saved: [] }
    let j = 0
    const saved = l.sets.map((s, i) => {
      const hit = !!l.saved?.[i] && j < entry.sets.length && sameSet(toLiftSet(s, timedLift(l)), entry.sets[j])
      if (hit) j++
      return hit
    })
    return { entryId: entry.id, saved }
  }
  // The latest tick asked of each lift, with the lift as it stood then: a
  // queued write saves that, so rapid ticks collapse into one write.
  const wanted = useRef(new Map<string, { lift: OnLog; toast: string }>())

  /**
   * Writes a lift's chosen rows to the log (RFC 0106): the first set creates
   * its entry, in its superset and ticking its plan; later ones change the
   * entry's sets; none left removes it. Returns whether the write went in.
   */
  const writeLift = async (l: OnLog, saved: boolean[], toast: string): Promise<boolean> => {
    const rows = l.sets.slice(0, l.revealed).map((s, i) => ({ s, i })).filter(r => saved[r.i])
    const chosen = rows.map(({ s }) => toLiftSet(s, timedLift(l)))
    const problem = chosen.map(liftSetProblem).find(Boolean)
    if (problem) { setToast(problem); return false }
    const entryId = liveEntry(loggedOf(l).entryId)
    return withToast(async () => {
      let id = entryId
      if (!id && chosen.length) {
        const entry = await addWeightEntry(
          { date: l.date, exercise: l.ex.trim(), sets: chosen, ...(l.supersetId ? { supersetId: l.supersetId } : {}) },
          l.pattern,
        )
        id = entry.id
        if (l.planId && useAppStore.getState().plans.some(p => p.id === l.planId && !p.loggedAs)) await markPlanLogged(l.planId, id)
      } else if (id && chosen.length) {
        await editWeightEntry(id, { sets: chosen })
      } else if (id) {
        await removeWeightEntry(id)
        id = undefined
      }
      setLogged(l.id, { entryId: id, saved: id ? saved : [] })
      setDraft(x => ({ ...x, lifts: x.lifts.map(y => (y.id === l.id ? { ...y, entryId: id } : y)) }))
    }, toast)
  }

  /** Brings a lift's log up to its latest tick. A write that fails puts the
   *  ticks back as the log has them, and drops the ticks queued behind it. */
  const syncLift = async (id: string) => {
    const want = wanted.current.get(id)
    if (!want) return
    const saved = want.lift.saved ?? []
    const have = loggedOf(want.lift).saved
    if (saved.length === have.length && saved.every((v, i) => v === have[i])) return
    if (await writeLift(want.lift, saved, want.toast)) return
    wanted.current.delete(id)
    const back = loggedOf(want.lift).saved
    setDraft(x => ({ ...x, lifts: x.lifts.map(y => (y.id === id ? { ...y, saved: back } : y)) }))
  }

  /** Tick: this one set goes into the log, or comes back out of it. The tick
   *  shows at once; the write follows in the background. */
  const toggleSet = (i: number) => {
    const s = sets[i]
    const on = !savedOf(lift)[i]
    if (on) {
      if (!ex.trim()) { setToast('Pick an exercise first.'); return }
      if (!rowFilled(s, timed)) { setToast(`Enter ${timed ? 'seconds' : 'weight and reps'} for set ${i + 1} first.`); return }
      const problem = liftSetProblem(toLiftSet(s, timed))
      if (problem) { setToast(problem); return }
    }
    // Until a lift's first tick, the form is what the log holds.
    if (!logged.current.has(lift.id)) setLogged(lift.id, fromLog(lift))
    const saved = [...savedOf(lift)]
    saved[i] = on
    // What the first write needs from the form, fixed as it stands now.
    wanted.current.set(lift.id, {
      lift: { ...lift, saved, date, pattern: pattern ?? undefined },
      toast: on ? `Set ${i + 1} saved` : `Set ${i + 1} taken out`,
    })
    setDraft(x => ({ ...x, lifts: x.lifts.map(y => (y.id === lift.id ? { ...y, saved } : y)) }))
    void enqueue(() => syncLift(lift.id))
  }

  /** Takes a lift off the form; the next one along shows. */
  const dropLift = (id: string) => setDraft(x => {
    const rest = x.lifts.filter(y => y.id !== id)
    return rest.length
      ? { ...x, lifts: rest, active: Math.min(x.active, rest.length - 1) }
      : { ...x, lifts: [emptyLift()], active: 0 }
  })

  /** Rows typed but not ticked, on a form where ticking has started: Finish
   *  asks before it logs them, since a tap meant for one lift or one set can
   *  land on Finish. A form saved without any tick is a plain Save. */
  const untickedOf = (scope: DraftLift[]) => scope.some(l => savedOf(l).some(Boolean))
    ? scope.flatMap(l => l.sets.slice(0, l.revealed)
      .map((s, i) => ({ l, i, s }))
      .filter(r => r.l.ex.trim() && rowFilled(r.s, timedLift(r.l)) && !savedOf(r.l)[r.i]))
    : []
  // The lifts the asked Finish covers, by id, so the question follows the form.
  const [askFinish, setAskFinish] = useState<{ only?: string[] } | null>(null)
  const askedScope = askFinish?.only ? lifts.filter(l => askFinish.only!.includes(l.id)) : lifts
  const askedRows = askFinish ? untickedOf(askedScope) : []

  /** Finish: every filled set not yet ticked is saved too, and the lifts that
   *  are in the log leave the form. A lift with nothing typed stays. `only`
   *  finishes just those lifts, leaving the rest on the switcher. With
   *  `ticked` only the ticked sets are kept, and a lift with none stays. */
  const addEntry = async (only?: DraftLift[], mode?: 'all' | 'ticked') => {
    if (finishing.current) return
    const scope = only ?? lifts
    if (!mode && untickedOf(scope).length) { setAskFinish({ only: only?.map(l => l.id) }); return }
    setAskFinish(null)
    const pending = scope.filter(l => l.ex.trim() && parseSets(l.sets, l.revealed, timedLift(l)).length > 0)
      .filter(l => mode !== 'ticked' || savedOf(l).some(Boolean))
    if (!pending.length) {
      setToast(ex.trim() ? `Add at least one set with ${timed ? 'seconds' : 'weight and reps'}.` : 'Pick an exercise first.')
      return
    }
    for (const l of pending) {
      const problem = setsProblem(l.sets, l.revealed, timedLift(l))
      if (problem && mode !== 'ticked') { setToast(lifts.length > 1 ? `${l.ex.trim()}: ${problem}` : problem); return }
    }
    finishing.current = true
    setBusy(only ? 'one' : 'all')
    try {
      for (const l of pending) {
        // After the ticks already on their way, so prev is what the log holds.
        const ok = await enqueue(async () => {
          wanted.current.delete(l.id)
          const prev = loggedOf(l).saved
          const saved = l.sets.slice(0, l.revealed).map((s, i) => !!prev[i] || (mode !== 'ticked' && rowFilled(s, timedLift(l))))
          const changed = saved.some((v, i) => v !== !!prev[i])
          return !changed || writeLift({ ...l, date, pattern: l.id === lift.id ? pattern ?? undefined : undefined }, saved, 'Saved')
        })
        if (!ok) return
        setLogged(l.id)
        // In the log now: off the form.
        dropLift(l.id)
      }
      setMovement(null)
      setToast(pending.length > 1 ? `${pending.length} exercises saved!` : 'Exercise saved!')
    } finally {
      finishing.current = false
      setBusy(null)
    }
  }

  /** Back to plan: the lift leaves the form and its plan waits on the Planned
   *  card again. Sets already ticked come out of the log with it, which the
   *  strip asks about first; the plan's link goes with the entry. */
  const [askBack, setAskBack] = useState<string | null>(null)
  const backToPlan = async () => {
    if (finishing.current) return
    const l = lift
    setAskBack(null)
    finishing.current = true
    try {
      // After the ticks already on their way, so the entry is the one they made.
      const ok = await enqueue(async () => {
        wanted.current.delete(l.id)
        const id = liveEntry(loggedOf(l).entryId)
        return !id || withToast(() => removeWeightEntry(id), 'Back on the plan')
      })
      if (!ok) return
      if (!entryOf(l) && !savedOf(l).some(Boolean)) setToast('Back on the plan')
      setLogged(l.id)
      dropLift(l.id)
    } finally {
      finishing.current = false
    }
  }
  const ticked = savedOf(lift).filter(Boolean).length

  const liftFromPlan = (p: PlannedExercise): DraftLift => ({
    id: crypto.randomUUID(),
    ex: p.exercise,
    sets: p.targets.length ? toSetStr(p.targets) : [{ weight: '', reps: '' }],
    revealed: p.targets.length || 1,
    planId: p.id,
    ...(p.supersetId ? { supersetId: p.supersetId } : {}),
    ...(p.targets.some(isTimedSet) ? { timed: true } : {}),
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
  // A hold's progress is how long it lasted (RFC 0107); it has no volume load.
  const chartTimed = useMemo(() => weights.some(d => d.exercise === chartEx && d.sets.some(isTimedSet)), [weights, chartEx])
  const metric = chartTimed ? 'longest' : chartMetric
  const chartData = useMemo(() => weights
    .filter(d => d.exercise === chartEx)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      date: fmtDate(d.date, { year: 'never', relative: false }),
      maxWeight: Math.max(...d.sets.map(s => s.weight)),
      volume: d.sets.reduce((a, s) => a + (isTimedSet(s) ? 0 : s.weight * s.reps), 0),
      longest: Math.max(0, ...d.sets.map(s => s.seconds ?? 0)),
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
        <PlanSheet plan={planSheet.plan} suggestions={suggestions} aliases={aliases} timedOf={timedOf} onClose={() => setPlanSheet(null)} />
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
                  <Chip key={l.id} small active={i === active} className="inline-flex items-center gap-0.5" onClick={() => { setDraft(x => ({ ...x, active: i })); if (l.ex) setSelEx(l.ex) }}>
                    {savedOf(l).some(Boolean) && <Icon name="check" size={10} />}
                    {l.ex.trim() || 'New exercise'}
                  </Chip>
                ))}
              </div>
              {/* An unplanned lift with nothing in the log yet: dropping it
                  only loses what was typed. A planned one goes back to plan
                  from its strip; a logged one is finished. */}
              {!fromPlan && !ticked && !entryOf(lift) && (
                <button
                  className="self-start text-[11px] text-ink-3 hover:text-ink cursor-pointer"
                  onClick={() => dropLift(lift.id)}
                >
                  Remove {ex.trim() || 'this exercise'}
                </button>
              )}
            </div>
          )}
          {fromPlan && (
            <FromPlanStrip
              name={fromPlan.exercise}
              action={askBack === lift.id ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-2">
                  Take {ticked} logged set{ticked === 1 ? '' : 's'} out?
                  <YesNo onYes={() => void backToPlan()} onNo={() => setAskBack(null)} />
                </span>
              ) : (
                <button
                  className="leading-snug text-ink-3 hover:text-ink cursor-pointer"
                  onClick={() => (ticked ? setAskBack(lift.id) : void backToPlan())}
                >
                  Back to plan
                </button>
              )}
            />
          )}
          <div className="flex flex-col gap-2.5 mb-3">
            <div className="flex flex-col gap-1">
              <label className={FIELD_LABEL}>Exercise</label>
              {entryOf(lift) || savedOf(lift).some(Boolean) ? (
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
                timed={timed}
                onTimed={t => patchLift(l => ({ ...l, timed: t }))}
              />
            )}
            {lastPerf && (
              <div className="px-2.5 py-2 bg-hairline rounded-[3px] text-[11px] text-ink-2">
                <span className="font-bold text-ink">Last ({fmtDate(lastPerf.date, { midSentence: true })}):</span>{' '}
                {lastPerf.sets.map(fmtSet).join(' · ')}
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
              pending={pendingOf(lift)}
              timed={timed}
            />
          </div>

          {(prSet || oneRmCandidate) && (
            <div className="flex flex-col gap-2 px-2.5 py-2 bg-hairline rounded-[3px] mb-3">
              {/* A personal best is a stated fact, not an urgency, so it takes
                  the outline tone (design-system §1) — like SS. */}
              {prSet && (
                <div className="flex items-center justify-between gap-2">
                  <span className={FIELD_LABEL}>{isTimedSet(prSet) ? 'Longest hold' : 'Personal best'}</span>
                  <span className="text-[11px] text-ink-2 tabular-nums flex items-center gap-1.5">
                    {fmtSet(prSet)}
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

          {askedRows.length > 0 ? (
            <div className="flex flex-col gap-2 px-2.5 py-2.5 bg-hairline rounded-[3px]">
              <p className="text-[12px] text-ink leading-snug">
                {askedRows.length === 1 ? '1 set isn’t' : `${askedRows.length} sets aren’t`} ticked:{' '}
                {[...new Set(askedRows.map(r => r.l))].map(l => {
                  const nums = askedRows.filter(r => r.l === l).map(r => r.i + 1)
                  return `${l.ex.trim()} set${nums.length === 1 ? '' : 's'} ${nums.join(', ')}`
                }).join('; ')}. Log {askedRows.length === 1 ? 'it' : 'them'} as done?
              </p>
              <div className="flex gap-2">
                <Btn variant="secondary" onClick={() => setAskFinish(null)} className="flex-1">Cancel</Btn>
                <Btn variant="secondary" onClick={() => void addEntry(askFinish?.only && askedScope, 'ticked')} className="flex-1">Only ticked</Btn>
                <Btn onClick={() => void addEntry(askFinish?.only && askedScope, 'all')} className="flex-1">Log all</Btn>
              </div>
            </div>
          ) : (
          <div className="flex gap-2">
            {lifts.length > 1 && (
              <Btn variant="secondary" onClick={() => void addEntry([lift])} disabled={!!busy} className="flex-1 inline-flex items-center justify-center gap-1.5">
                {busy === 'one' && <Icon name="spinner" size={13} className="animate-spin" />}
                {oneLabel}
              </Btn>
            )}
            <Btn onClick={() => void addEntry()} disabled={!!busy} className="flex-1 inline-flex items-center justify-center gap-1.5">
              {busy === 'all' && <Icon name="spinner" size={13} className="animate-spin" />}
              {saveLabel}
            </Btn>
          </div>
          )}
      </Card></div>

      {exercises.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2.5">
            <SecTitle>Progress</SecTitle>
            {chartTimed ? <span className={MICRO_LABEL}>Longest hold</span> : (
              <div className="flex gap-1">
                <Chip small active={chartMetric === 'maxWeight'} onClick={() => setChartMetric('maxWeight')}>Max kg</Chip>
                <Chip small active={chartMetric === 'volume'} onClick={() => setChartMetric('volume')}>Volume</Chip>
              </div>
            )}
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
              formatter={(v: number) => metric === 'longest' ? [`${v} s`, 'Longest hold']
                : metric === 'maxWeight' ? [`${v} kg`, 'Max weight']
                : [`${v} kg·reps`, 'Volume']}
            />
            <Line
              {...CHART_LINE}
              dataKey={metric}
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
                          <span key={i} className="px-1.5 py-0.5 rounded-[2px] bg-white border border-line text-[10px] text-ink-2 tabular-nums">S{i + 1}: {fmtSet(s)}</span>
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
                      <span key={i} className="px-1.5 py-0.5 rounded-[2px] bg-hairline text-[10px] text-ink-2 tabular-nums">S{i + 1}: {fmtSet(s)}</span>
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
