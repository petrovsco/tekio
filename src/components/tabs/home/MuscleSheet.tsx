import { useEffect, useMemo, useState } from 'react'
import type { LiftSet } from '../../../types'
import { useAppStore } from '../../../store/app'
import {
  muscleStates, muscleWeeklySets, muscleSources, muscleQualityMix, windowMuscleTarget,
  HISTORY_WEEKS, MUSCLE_QUALITIES, type MuscleSource,
} from '../../../lib/fusedRead'
import { RECOVER_DAYS, MUSCLE_WINDOW_DAYS, MUSCLE_SET_TARGET, WEEKLY_SET_FLOOR } from '../../../constants/app'
import { today, fmtSets, fmtAgo, fmtDate } from '../../../lib/utils'
import { BottomSheet, SheetHeader } from './BottomSheet'
import { Icon } from '../../ui/Icon'
import { GAP_CUTOFF, targetShape } from '../../../lib/adaptations'
import { RAMP, rampStep } from './GapMap'
import { QUALITY_SHORT } from '../adaptations/labels'
import { EXERCISE_CATALOGUE, CATALOGUE_ALIASES, catalogueEntryFor, linksFor } from '../../../constants/exerciseCatalogue'
import { MOVEMENT_PATTERNS, type PatternKey } from '../../../constants/movementPatterns'
import { normaliseExerciseName as norm, resolveExerciseName } from '../../../lib/exerciseName'
import { MovementQuestion } from '../weights/MovementQuestion'

// The muscle drill-in (T2, roadmap 018 unit 3): what a tap on the map reveals.
// Logging goes through an exercise on purpose — sets classify into adaptations
// by rep range, so a bare set count would write data no read can use.

/** "today", "yesterday", or "last 8 Oct" — when an exercise was last logged. */
const lastLogged = (date: string): string => {
  const when = fmtDate(date, { midSentence: true })
  return /^\d/.test(when) ? `last ${when}` : when
}

const FOOT_BTN = 'w-full min-h-[48px] rounded-[3px] text-[14px] font-bold cursor-pointer disabled:opacity-45'
const FOOT_BTN_SOLID = `${FOOT_BTN} border border-ink bg-ink text-white`
const FOOT_BTN_OUTLINE = `${FOOT_BTN} border border-ink bg-white text-ink`
/** How long "N sets saved · Undo" stays up after a save. */
const SAVED_NOTE_MS = 6000

const fmtKg = (w: number): string => (w === 0 ? 'BW' : `${fmtSets(w)} kg`)

/** "3×8 @ 24 kg" for a uniform scheme; falls back to count + last set. */
function schemeLabel(sets: LiftSet[]): string {
  if (sets.length === 0) return '—'
  const [first] = sets
  const uniform = sets.every(s => s.reps === first.reps && s.weight === first.weight)
  if (uniform) return `${sets.length}×${first.reps} @ ${fmtKg(first.weight)}`
  const last = sets[sets.length - 1]
  return `${sets.length} sets · last ${last.reps} @ ${fmtKg(last.weight)}`
}

interface MuscleSheetProps {
  muscle: string
  onClose: () => void
}

/** Does this muscle appear in a link set? Link sets are keyed by leaf name. */
const feedsIn = (links: Record<string, unknown>, muscle: string) => links[muscle] !== undefined

export default function MuscleSheet({ muscle, onClose }: MuscleSheetProps) {
  const weights = useAppStore(s => s.weights)
  const exerciseMuscles = useAppStore(s => s.exerciseMuscles)
  const muscleGroups = useAppStore(s => s.muscleGroups)
  const exerciseAdaptations = useAppStore(s => s.exerciseAdaptations)
  const adaptationTargets = useAppStore(s => s.adaptationTargets)
  const addWeightEntry = useAppStore(s => s.addWeightEntry)
  const exerciseAliases = useAppStore(s => s.exerciseAliases)

  const state = useMemo(
    () => muscleStates(weights, exerciseMuscles, muscleGroups).find(s => s.name === muscle),
    [weights, exerciseMuscles, muscleGroups, muscle],
  )
  const weeks = useMemo(
    () => muscleWeeklySets(weights, exerciseMuscles, muscle),
    [weights, exerciseMuscles, muscle],
  )
  const sources = useMemo(
    () => muscleSources(weights, exerciseMuscles, muscle),
    [weights, exerciseMuscles, muscle],
  )
  // Each quality's own target — the number and unit the Adaptations map draws
  // every muscle against, through the same resolver and the same scaler (064);
  // power counts sessions, the other three sets (roadmap 0012).
  const shapes = useMemo(
    () => Object.fromEntries(MUSCLE_QUALITIES.map(q => [q, targetShape(q, adaptationTargets)])) as
      Record<(typeof MUSCLE_QUALITIES)[number], ReturnType<typeof targetShape>>,
    [adaptationTargets],
  )
  const mix = useMemo(
    () => muscleQualityMix(
      weights, exerciseMuscles, muscle, exerciseAdaptations, undefined,
      Object.fromEntries(MUSCLE_QUALITIES.map(q => [q, shapes[q].unit])),
    ),
    [weights, exerciseMuscles, muscle, exerciseAdaptations, shapes],
  )

  // The sheet in steps (RFC 0100): the read, then which exercise, then its
  // sets. A save lands back on the exercise list, ready for the next one.
  const [step, setStep] = useState<'read' | 'pick' | 'sets'>('read')
  // The picked exercise travels by name, not index — saving re-ranks sources.
  const [pickedName, setPickedName] = useState<string | null>(null)
  const [rows, setRows] = useState<LiftSet[]>([])
  const [query, setQuery] = useState('')
  // The movement question's answer for a name nothing knows (RFC 0074).
  const [pattern, setPattern] = useState<PatternKey | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<{ id: string; exercise: string; count: number } | null>(null)
  const removeWeightEntry = useAppStore(s => s.removeWeightEntry)
  useEffect(() => {
    if (!saved) return
    const t = window.setTimeout(() => setSaved(null), SAVED_NOTE_MS)
    return () => window.clearTimeout(t)
  }, [saved])

  const sets = state?.sets ?? 0
  const daysSince = state?.daysSince ?? null
  const fill = state?.fillFraction ?? 0
  const recovering = state?.recovering ?? false

  const verdict = daysSince === null
    ? {
        text: 'Never trained.', invert: true, icon: 'M12 6.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z',
        sub: `Zero sets in the last ${MUSCLE_WINDOW_DAYS} days and no logged history — the biggest kind of gap.`,
      }
    : recovering
      ? {
          text: 'Recently hit — leave it.', invert: false, icon: 'M9 6v12M15 6v12',
          sub: `Last stimulus ${fmtAgo(daysSince)} — inside the ${RECOVER_DAYS * 24} h recovery window.`,
        }
      : fill >= 1
        ? {
            text: 'Recovered — but back off.', invert: false, icon: 'M5 12h14',
            sub: `At ${Math.round(fill * 100)}% of the ${MUSCLE_WINDOW_DAYS}-day target with ${fmtSets(sets)} sets. It is available; it is just not what is missing.`,
          }
        : fill < GAP_CUTOFF
          ? {
              text: 'Train it.', invert: true, icon: 'M12 6.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z',
              sub: `Fully recovered and under target: ${fmtSets(sets)} sets in ${MUSCLE_WINDOW_DAYS} days, last stimulus ${daysSince} d ago.`,
            }
          : {
              text: 'Recovered, close to target.', invert: false, icon: 'M5 12l5 5L19 7',
              sub: `${fmtSets(sets)} sets in ${MUSCLE_WINDOW_DAYS} days — ${Math.round(fill * 100)}% of the target and recovered.`,
            }

  const recPct = daysSince === null
    ? 100
    : Math.min(100, Math.round((100 * daysSince) / RECOVER_DAYS))
  const weekScale = Math.max(WEEKLY_SET_FLOOR, ...weeks)
  const fedBy = sources.filter(s => s.windowSets > 0).sort((a, b) => b.windowSets - a.windowSets)

  // Every exercise that can feed this muscle: the ones logged, most recent
  // first, then the linked ones never logged, primary movers first, then the
  // catalogue's lifts for it (RFC 0074) the same way.
  const choices = useMemo(() => {
    const logged = sources.map(s => ({ exercise: s.exercise, source: s as MuscleSource | null, feeds: true }))
    const seen = new Set(logged.map(c => norm(c.exercise)))
    const fresh = (name: string) => !seen.has(norm(name)) && !!seen.add(norm(name))
    const linked = exerciseMuscles
      .filter(l => l.group === muscle && l.contribution === 'stimulus')
      .sort((a, b) => a.level - b.level || a.exercise.localeCompare(b.exercise))
      .filter(l => fresh(l.exercise))
      .map(l => ({ exercise: l.exercise, source: null, feeds: true }))
    const catalogue = EXERCISE_CATALOGUE
      .map(e => ({ name: e.name, level: (linksFor(e) as Record<string, number>)[muscle] }))
      .filter(e => e.level !== undefined)
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
      .filter(e => fresh(e.name))
      .map(e => ({ exercise: e.name, source: null, feeds: true }))
    return [...logged, ...linked, ...catalogue]
  }, [sources, exerciseMuscles, muscle])

  // Search covers the whole catalogue and everything on file, by name or by
  // any of its spellings; a match that does not train this muscle says so.
  const aliases = useMemo(() => [...exerciseAliases, ...CATALOGUE_ALIASES], [exerciseAliases])
  const ownNames = useMemo(() => [...new Set(weights.map(w => w.exercise))], [weights])
  const q = norm(query)
  const shown = useMemo(() => {
    if (!q) return choices
    const spellings = new Map<string, string[]>()
    for (const a of aliases) spellings.set(norm(a.canonicalName), [...(spellings.get(norm(a.canonicalName)) ?? []), norm(a.alias)])
    const hit = (name: string) => norm(name).includes(q) || (spellings.get(norm(name)) ?? []).some(sp => sp.includes(q))
    const seen = new Set(choices.map(c => norm(c.exercise)))
    const others = [...ownNames, ...EXERCISE_CATALOGUE.map(e => e.name)]
      .filter(n => !seen.has(norm(n)) && !!seen.add(norm(n)))
      .sort((a, b) => a.localeCompare(b))
      .map(n => ({ exercise: n, source: null, feeds: false }))
    return [...choices, ...others].filter(c => hit(c.exercise))
  }, [q, choices, aliases, ownNames])
  // A typed name nothing knows: on file, an alias, or in the catalogue.
  const known = (name: string) => !!resolveExerciseName(name, ownNames, aliases) || !!catalogueEntryFor(name)
  const newName = q && !known(query) ? query.trim() : null

  const pick = (exercise: string, source: MuscleSource | null) => {
    setPickedName(exercise)
    setPattern(null)
    // Prefilled from last time; an exercise never logged starts at one
    // bodyweight set for the stepper to move.
    setRows(source ? source.lastSets.map(r => ({ ...r })) : [{ reps: 8, weight: 0 }])
    setStep('sets')
  }
  const editRow = (i: number, patch: Partial<LiftSet>) =>
    setRows(rs => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const save = async () => {
    if (!pickedName || rows.length === 0 || saving) return
    setSaving(true)
    try {
      const entry = await addWeightEntry({ date: today(), exercise: pickedName, sets: rows }, pattern ?? undefined)
      setSaved({ id: entry.id, exercise: pickedName, count: rows.length })
      setPickedName(null)
      setQuery('')
      setStep('pick')
    } finally {
      setSaving(false)
    }
  }
  const undo = async () => {
    if (!saved) return
    setSaved(null)
    await removeWeightEntry(saved.id)
  }

  const savedNote = saved && (
    <div className="flex items-center justify-between gap-2 min-h-[44px] mb-2 pl-3 rounded-[3px] bg-ink text-white text-[13px]" role="status">
      <span className="min-w-0 truncate">{saved.exercise}: {saved.count} sets saved</span>
      <button onClick={undo} className="min-h-[44px] px-3.5 font-bold underline cursor-pointer">Undo</button>
    </div>
  )

  const stepHeader = (title: string, back: () => void) => (
    <div className="flex items-center gap-1">
      <button onClick={back} aria-label="Back" className="min-w-[44px] min-h-[44px] -ml-3 flex items-center justify-center cursor-pointer">
        <Icon name="arrowRight" size={18} className="text-ink-2 rotate-180" />
      </button>
      <span className="grow min-w-0 truncate text-[10px] font-bold tracking-[0.12em] text-ink-3">{title}</span>
      <button onClick={onClose} aria-label="Close" className="min-w-[44px] min-h-[44px] flex items-center justify-end cursor-pointer">
        <Icon name="close" size={18} className="text-ink-2" />
      </button>
    </div>
  )

  if (step === 'pick') {
    const loggedToday = (c: { source: MuscleSource | null }) => c.source?.lastDate === today()
    return (
      <BottomSheet
        onClose={onClose}
        label={`Log sets for ${muscle}`}
        footer={<>{savedNote}<button onClick={() => setStep('read')} className={FOOT_BTN_OUTLINE}>Done</button></>}
      >
        {stepHeader(saved || choices.some(loggedToday) ? `ADD ANOTHER FOR ${muscle.toUpperCase()}` : `LOG SETS FOR ${muscle.toUpperCase()}`, () => setStep('read'))}
        <label className="flex items-center gap-2 min-h-[44px] mt-1 mb-1.5 px-2.5 border border-ink rounded-[3px]">
          <Icon name="search" size={14} className="text-ink-3 shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search exercises"
            aria-label="Search exercises"
            className="grow min-w-0 bg-transparent outline-none text-[14px] py-2"
          />
        </label>
        {shown.map(c => (
          <button
            key={c.exercise}
            onClick={() => pick(c.exercise, c.source)}
            className="w-full flex items-center gap-2 min-h-[52px] border-b border-line text-left cursor-pointer"
          >
            <span className="grow min-w-0">
              <span className="block text-[14px] font-bold truncate">{c.exercise}</span>
              <span className="block text-[11px] text-ink-2">
                {c.source
                  ? `${lastLogged(c.source.lastDate)} · ${schemeLabel(c.source.lastSets)}`
                  : c.feeds ? 'not logged yet' : `does not count for ${muscle}`}
              </span>
            </span>
            {loggedToday(c)
              ? <span className="text-[10px] font-bold tracking-[0.08em] text-signal shrink-0">TODAY ✓</span>
              : <Icon name="arrowRight" size={14} className="text-ink-3 shrink-0" />}
          </button>
        ))}
        {shown.length === 0 && !newName && (
          <div className="py-3 text-[12px] text-ink-2 text-pretty">Nothing in your log feeds {muscle} yet.</div>
        )}
        {newName && (
          <button
            onClick={() => pick(newName, null)}
            className="w-full flex items-center gap-2 min-h-[52px] mt-2 px-2.5 border border-ink rounded-[3px] text-[13px] font-semibold text-left cursor-pointer"
          >
            <Icon name="plus" size={14} className="shrink-0" />
            <span className="min-w-0 truncate">Log “{newName}” as a new exercise</span>
          </button>
        )}
      </BottomSheet>
    )
  }

  if (step === 'sets' && pickedName) {
    return (
      <BottomSheet
        onClose={onClose}
        label={`${pickedName} sets`}
        footer={
          <button onClick={save} disabled={saving || rows.length === 0} className={FOOT_BTN_SOLID}>
            {saving ? 'Saving…' : `Save ${rows.length} ${rows.length === 1 ? 'set' : 'sets'}`}
          </button>
        }
      >
        {stepHeader(pickedName.toUpperCase(), () => setStep('pick'))}
        {!known(pickedName) && (
          <div className="mb-2">
            <MovementQuestion value={pattern} onChange={setPattern} thumb />
            {pattern && !feedsIn(MOVEMENT_PATTERNS[pattern].links, muscle) && (
              <div className="mt-1 text-[11px] text-ink-2">That movement does not count for {muscle}.</div>
            )}
          </div>
        )}
        <div className="text-[11px] text-ink-3 mb-1">
          {sources.some(s => s.exercise === pickedName) ? 'From last time. Step the numbers to today’s.' : 'Step the numbers to what you did.'}
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[34px_1fr_1fr_36px] gap-2 items-center min-h-[52px] border-b border-line">
            <span className="text-[10px] text-ink-3 tracking-[0.06em]">SET {i + 1}</span>
            <Stepper
              value={r.reps} unit="reps" step={1} label={`Set ${i + 1} reps`} numeric
              onChange={v => editRow(i, { reps: Math.max(0, Math.floor(v)) })}
            />
            <Stepper
              value={r.weight} unit="kg" step={2.5} label={`Set ${i + 1} weight`}
              onChange={v => editRow(i, { weight: Math.max(0, v) })}
            />
            <button
              onClick={() => setRows(rs => rs.filter((_, j) => j !== i))}
              aria-label={`Remove set ${i + 1}`}
              className="w-9 h-11 flex items-center justify-center cursor-pointer"
            >
              <Icon name="close" size={14} className="text-ink-3" />
            </button>
          </div>
        ))}
        <button
          onClick={() => setRows(rs => [...rs, rs.length ? { ...rs[rs.length - 1] } : { reps: 8, weight: 0 }])}
          className="w-full min-h-[44px] mt-2 border border-dashed border-[#c9c9c7] rounded-[3px] text-[13px] font-semibold text-ink-2 cursor-pointer"
        >
          + Add a set
        </button>
        <div className="text-[10px] text-ink-3 mt-2 text-pretty">
          Saves to today’s session. Reps are what classify the sets into an adaptation.
        </div>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet
      onClose={onClose}
      label={muscle}
      footer={
        <>
          {savedNote}
          <button onClick={() => setStep('pick')} className={`${FOOT_BTN_SOLID} flex items-center justify-center gap-[7px]`}>
            <Icon name="plus" size={16} />
            Log sets for {muscle}
          </button>
        </>
      }
    >
      {/* identity */}
      <SheetHeader title={muscle} onClose={onClose} />

      {/* the one-line verdict: both dimensions at once */}
      <div className={`mt-2 px-[11px] py-[9px] border border-ink rounded-[3px] ${verdict.invert ? 'bg-ink text-white' : 'bg-white'}`}>
        <div className="flex items-center gap-[7px]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={verdict.icon} />
          </svg>
          <span className="text-[15px] font-bold tracking-[-0.01em]">{verdict.text}</span>
        </div>
        <div className="text-[11px] leading-[1.35] mt-1 opacity-[0.82] text-pretty">{verdict.sub}</div>
      </div>

      {/* the two dimensions, split */}
      <div className="grid grid-cols-2 gap-2 mt-2.5">
        <div className="border border-line rounded-[3px] px-2.5 pt-2 pb-[9px]">
          <div className="text-[8px] font-bold tracking-[0.12em] text-ink-3">STIMULUS</div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-[25px] font-bold tracking-[-0.03em]">{fmtSets(sets)}</span>
            <span className="text-[11px] text-ink-2">/ {MUSCLE_SET_TARGET} hard sets</span>
          </div>
          <div className="h-[5px] bg-line rounded-[2px] mt-[5px]">
            <div className="h-[5px] bg-ink rounded-[2px]" style={{ width: `${Math.min(100, Math.round(fill * 100))}%` }} />
          </div>
          <div className="text-[9px] text-ink-3 mt-1">
            {MUSCLE_WINDOW_DAYS}-day window · {WEEKLY_SET_FLOOR}/wk · power sets count on their own map
          </div>
        </div>
        <div className="border border-line rounded-[3px] px-2.5 pt-2 pb-[9px]">
          <div className="text-[8px] font-bold tracking-[0.12em] text-ink-3">RECOVERY</div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-[25px] font-bold tracking-[-0.03em]">{daysSince ?? '—'}</span>
            <span className="text-[11px] text-ink-2">{daysSince === null ? 'never trained' : 'days ago'}</span>
          </div>
          <div className="h-[5px] bg-line rounded-[2px] mt-[5px]">
            <div className="h-[5px] bg-ink rounded-[2px]" style={{ width: `${recPct}%` }} />
          </div>
          <div className="text-[9px] text-ink-3 mt-1">
            recovered after {RECOVER_DAYS * 24} h
          </div>
        </div>
      </div>

      {/* recent volume, per week — history, not the fill's window */}
      <div className="mt-2.5 border border-line rounded-[3px] px-2.5 pt-2 pb-[9px]">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[8px] font-bold tracking-[0.12em] text-ink-3">SETS PER WEEK, LAST {HISTORY_WEEKS} WEEKS</span>
          <span className="grow" />
          <span className="text-[9px] text-ink-3">target {WEEKLY_SET_FLOOR}/wk</span>
        </div>
        <div className="flex items-end gap-[7px] h-[54px] mt-[7px]">
          {weeks.map((n, i) => (
            <div key={i} className="grow flex flex-col items-center justify-end gap-[3px] h-[54px]">
              <span className={`text-[9px] font-semibold ${n === 0 ? 'text-[#c9c9c7]' : 'text-ink'}`}>{fmtSets(n)}</span>
              <div
                className="w-full rounded-[1px]"
                style={{
                  height: `${Math.max(2, Math.round((n / weekScale) * 40))}px`,
                  background: n === 0 ? '#e2e2e0' : n < WEEKLY_SET_FLOOR ? '#8f8f8f' : '#1a1a1a',
                }}
              />
              <span className="text-[8px] text-ink-4">w{i + 1}</span>
            </div>
          ))}
        </div>
        <div className="h-px bg-line mt-0.5" />
      </div>

      {/* which exercises fed it, in the window */}
      <div className="mt-2.5">
        <div className="text-[8px] font-bold tracking-[0.12em] text-ink-3 mb-[5px]">WHAT FED IT</div>
        {fedBy.length === 0 ? (
          <div className="text-[11px] text-ink-2">— nothing in the last {MUSCLE_WINDOW_DAYS} days</div>
        ) : (
          <div className="flex flex-col gap-1">
            {fedBy.map(s => (
              <div key={s.exercise} className="flex items-baseline gap-2 text-[12px]">
                <span className="font-semibold">{s.exercise}</span>
                <span className="grow border-b border-dotted border-chrome" />
                <span className="text-ink-2">{fmtSets(s.windowSets)} sets</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* the four muscle-linked qualities — power reads per muscle (P2).
          Each count sits on its own window target, so the number is a
          judgement and not arithmetic left to the reader (064). Same ramp as
          the body map: these are muscle numbers, and the ramp is a muscle
          rule (063). */}
        <div className="mt-2.5">
          <div className="flex items-baseline gap-1.5 mb-[5px]">
            <span className="text-[8px] font-bold tracking-[0.12em] text-ink-3">QUALITY MIX, LAST {MUSCLE_WINDOW_DAYS} DAYS</span>
            <span className="text-[8px] text-ink-4">— of its own target</span>
          </div>
          <div className="flex gap-1.5">
            {MUSCLE_QUALITIES.map(q => {
              const target = windowMuscleTarget(shapes[q].weekly)
              const fraction = target > 0 ? mix[q] / target : 0
              return (
                <div key={q} className="grow basis-0 border border-line rounded-[2px] px-1.5 pt-1 pb-[5px] text-center">
                  <div className={`text-[13px] font-bold ${mix[q] === 0 ? 'text-ink-4' : 'text-ink'}`}>
                    {fmtSets(mix[q])}
                    <span className="text-[8px] font-normal text-ink-3">
                      /{fmtSets(target)}{shapes[q].unit === 'sessions' ? ' sess' : ''}
                    </span>
                  </div>
                  <div className="h-[3px] mt-1 rounded-sm bg-line overflow-hidden">
                    <div
                      className="h-[3px] rounded-sm"
                      style={{
                        width: `${Math.min(100, fraction * 100)}%`,
                        background: RAMP[rampStep(fraction)],
                      }}
                    />
                  </div>
                  <div className="text-[7px] text-ink-3 tracking-[0.04em] mt-1">{QUALITY_SHORT[q]}</div>
                </div>
              )
            })}
          </div>
        </div>


    </BottomSheet>
  )
}

/** − value + around a typed field, every part a full thumb's height. */
function Stepper({ value, unit, step, label, numeric, onChange }: {
  value: number
  unit: string
  step: number
  label: string
  numeric?: boolean
  onChange: (v: number) => void
}) {
  // What the field shows while it is being typed in. An emptied field stays
  // empty, rather than snapping to 0 and putting a 0 in front of the next digit.
  const [draft, setDraft] = useState<string | null>(null)
  const bump = (d: number) => { setDraft(null); onChange(+(value + d).toFixed(2)) }
  const btn = 'w-9 h-11 shrink-0 flex items-center justify-center text-[18px] font-bold cursor-pointer'
  return (
    <div className="flex items-center h-11 border border-line rounded-[3px] min-w-0">
      <button onClick={() => bump(-step)} aria-label={`Less, ${label}`} className={btn}>−</button>
      <label className="grow min-w-0 flex items-baseline justify-center gap-0.5">
        <input
          type="number"
          inputMode={numeric ? 'numeric' : 'decimal'}
          step={step}
          value={draft ?? String(value)}
          onChange={e => {
            const typed = e.target.value
            setDraft(typed)
            if (typed === '') onChange(0)
            else if (Number.isFinite(+typed)) onChange(+typed)
          }}
          onBlur={() => setDraft(null)}
          aria-label={label}
          className="w-full min-w-0 h-11 text-center text-[15px] font-bold bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[10px] text-ink-3 shrink-0 pr-0.5">{unit}</span>
      </label>
      <button onClick={() => bump(step)} aria-label={`More, ${label}`} className={btn}>+</button>
    </div>
  )
}
