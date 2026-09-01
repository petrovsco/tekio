import { useState } from 'react'
import { useAppStore } from '../../store/app'
import { cycleInfo, getGrouped, sessionDates, defaultProgram, today, cycleExerciseProgress, programMode, resolveTodayDay, weekdayOf, startOfWeek, isDayDoneInWeek, activeVariantWeekdays, variantGroups } from '../../lib/utils'
import { CYCLE } from '../../constants/app'
import { BLOCK_TYPES, BLOCK_META, TRAINING_TAGS, DEFAULT_TAG, DAYS_OF_WEEK } from '../../constants/program'
import { parseProgramJson } from '../../lib/programImport'
import { Card, SecTitle, EmptyMsg } from '../ui/Card'
import { Btn, DelBtn } from '../ui/Button'
import { SSBadge, DeloadBadge, MicroLabel } from '../ui/Badges'
import { Chip } from '../ui/Chip'
import { Icon } from '../ui/Icon'
import { FIELD, FIELD_LABEL } from '../ui/Input'
import { MiniChart } from '../ui/MiniChart'
import type {
  Program, ProgramDay, ProgramDayBlock, BlockType, TrainingTag, DayOfWeek,
  ActiveProgram, ProgramCycle, WeightEntry,
} from '../../types'

// Inline meta on a row — a stated fact, never an urgency, so it never takes
// the accent (design-system §1).
const MICRO = 'inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.10em] text-ink-3'

/** A reveal or a quiet addition: the ghost tone (§8), never the accent. */
const GHOST = 'inline-flex items-center gap-1 text-[11px] font-semibold text-ink-2 hover:text-ink cursor-pointer transition-colors'

/** A nested container on a white card — paper ground, 1px line, 3px radius. */
const NEST = 'rounded-[3px] border border-line bg-paper'

// The editor lays its rows out on grids rather than flex, because a SIGNAL
// field carries `w-full` (ui/Input) and so needs a track to fill.
const DAY_COLS = 'minmax(0,1fr) 126px 28px'
const BLOCK_COLS = '20px 124px minmax(0,1fr) 28px'
const ADD_EX_COLS = 'minmax(0,1fr) 108px auto auto'

// ── Editor helpers ────────────────────────────────────────────────────────────

/** A weight block built from a day's flat exercises (for legacy days w/o blocks). */
function flatToBlock(day: ProgramDay): ProgramDayBlock {
  return {
    blockType: 'weight',
    name: day.name,
    sortOrder: 0,
    exercises: day.exercises.map((name, j) => ({ exercise: name, trainingTag: 'STRENGTH' as TrainingTag, sortOrder: j })),
    supersets: day.supersets ?? [],
  }
}

/** Normalize a program's days for editing: every day carries a `blocks` array. */
function normalizeDays(program: Program): ProgramDay[] {
  const src = program.phases?.length ? program.phases.flatMap(ph => ph.days) : program.days
  return src.map(d => ({
    ...d,
    dayOfWeek: d.dayOfWeek ?? null,
    blocks: d.blocks && d.blocks.length > 0 ? d.blocks.map(b => ({ ...b })) : (d.exercises.length > 0 ? [flatToBlock(d)] : []),
  }))
}

/** Recompute the flat `exercises`/`supersets` view from a day's weight blocks. */
function recomputeFlat(day: ProgramDay): ProgramDay {
  const weightBlocks = (day.blocks ?? []).filter(b => b.blockType === 'weight')
  return {
    ...day,
    exercises: weightBlocks.flatMap(b => b.exercises.map(e => e.exercise)),
    supersets: weightBlocks.flatMap(b => b.supersets),
  }
}

// ── Program Editor ────────────────────────────────────────────────────────────

type Pairing = { di: number; bi: number; first: string } | null

function ProgramEditor({ draft, onSave, onCancel }: {
  draft: Program
  onSave: (p: Program) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(draft.name)
  const [startDate, setStartDate] = useState(draft.startDate)
  const [days, setDays] = useState<ProgramDay[]>(() => normalizeDays(draft))
  const [weeklyPrinciples] = useState(draft.weeklyPrinciples)
  const [newExName, setNewExName] = useState('')
  const [newExTag, setNewExTag] = useState<TrainingTag | ''>('')
  const [addingAt, setAddingAt] = useState<{ di: number; bi: number } | null>(null)
  const [pairing, setPairing] = useState<Pairing>(null)

  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importErr, setImportErr] = useState<string | null>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const mutateBlock = (di: number, bi: number, fn: (b: ProgramDayBlock) => ProgramDayBlock) =>
    setDays(ds => ds.map((d, i) => i !== di ? d : { ...d, blocks: (d.blocks ?? []).map((b, j) => j !== bi ? b : fn(b)) }))

  const addDay = () => setDays(ds => [...ds, {
    name: `Day ${ds.length + 1}`, exercises: [], supersets: [], dayOfWeek: null, queueOrder: null, blocks: [],
  }])
  const removeDay = (di: number) => setDays(ds => ds.filter((_, i) => i !== di))
  const setDayName = (di: number, v: string) => setDays(ds => ds.map((d, i) => i === di ? { ...d, name: v } : d))
  const setDayDow = (di: number, v: string) =>
    setDays(ds => ds.map((d, i) => i === di ? { ...d, dayOfWeek: (v || null) as ProgramDay['dayOfWeek'] } : d))

  const addBlock = (di: number) => setDays(ds => ds.map((d, i) => i !== di ? d : {
    ...d, blocks: [...(d.blocks ?? []), { blockType: 'weight' as BlockType, name: 'New block', sortOrder: (d.blocks?.length ?? 0), exercises: [], supersets: [] }],
  }))
  const removeBlock = (di: number, bi: number) =>
    setDays(ds => ds.map((d, i) => i !== di ? d : { ...d, blocks: (d.blocks ?? []).filter((_, j) => j !== bi) }))
  const setBlockType = (di: number, bi: number, t: BlockType) => mutateBlock(di, bi, b => ({ ...b, blockType: t }))
  const setBlockName = (di: number, bi: number, v: string) => mutateBlock(di, bi, b => ({ ...b, name: v }))
  const setBlockTime = (di: number, bi: number, v: string) => mutateBlock(di, bi, b => ({ ...b, scheduledTime: v || undefined }))

  const addExercise = (di: number, bi: number) => {
    if (!newExName.trim()) return
    const block = days[di].blocks![bi]
    const tag = newExTag || DEFAULT_TAG[block.blockType]
    mutateBlock(di, bi, b => ({
      ...b,
      exercises: [...b.exercises, { exercise: newExName.trim(), trainingTag: tag, sortOrder: b.exercises.length }],
    }))
    setNewExName(''); setNewExTag('')
  }
  const removeExercise = (di: number, bi: number, ei: number) => mutateBlock(di, bi, b => {
    const exName = b.exercises[ei].exercise
    return {
      ...b,
      exercises: b.exercises.filter((_, i) => i !== ei),
      supersets: b.supersets.filter(pair => !pair.includes(exName)),
    }
  })
  const setExerciseTag = (di: number, bi: number, ei: number, tag: TrainingTag) =>
    mutateBlock(di, bi, b => ({ ...b, exercises: b.exercises.map((e, i) => i === ei ? { ...e, trainingTag: tag } : e) }))

  const togglePair = (di: number, bi: number, exName: string) => {
    if (!pairing || pairing.di !== di || pairing.bi !== bi) { setPairing({ di, bi, first: exName }); return }
    if (pairing.first === exName) { setPairing(null); return }
    mutateBlock(di, bi, b => {
      const ss = b.supersets.filter(p => !p.includes(pairing.first) && !p.includes(exName))
      ss.push([pairing.first, exName])
      return { ...b, supersets: ss }
    })
    setPairing(null)
  }
  const unpair = (di: number, bi: number, pair: [string, string]) =>
    mutateBlock(di, bi, b => ({ ...b, supersets: b.supersets.filter(pp => !(pp[0] === pair[0] && pp[1] === pair[1])) }))

  const runImport = () => {
    const res = parseProgramJson(importText)
    if (!res.ok) { setImportErr(res.error); setImportMsg(null); return }
    setName(res.program.name)
    setStartDate(res.program.startDate)
    setDays(normalizeDays(res.program))
    setImportErr(null)
    const dayCount = res.program.days.length
    const blockCount = res.program.days.reduce((n, d) => n + (d.blocks?.length ?? 0), 0)
    setImportMsg(`Imported ${dayCount} day${dayCount === 1 ? '' : 's'}, ${blockCount} block${blockCount === 1 ? '' : 's'}.`)
    setShowImport(false)
  }

  const save = () => {
    const finalDays = days.map(recomputeFlat)
    onSave({
      name: name.trim() || 'Untitled Program',
      startDate,
      currentDayIndex: draft.currentDayIndex ?? 0,
      lastAdvancedDate: draft.lastAdvancedDate ?? startDate,
      weeklyPrinciples,
      days: finalDays,
      phases: [{ name: 'Main', sortOrder: 0, durationWeeks: CYCLE, goal: 'general', days: finalDays }],
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* JSON import — opening it writes nothing, so it is a reveal (§8). */}
      <Card>
        <button onClick={() => setShowImport(s => !s)} className={GHOST}>
          Import from JSON
          <Icon name={showImport ? 'chevronUp' : 'chevronDown'} size={11} />
        </button>
        {importMsg && (
          <p className="inline-flex items-center gap-1 text-[11px] text-ink-2 mt-2 ml-3">
            <Icon name="check" size={11} className="shrink-0" />{importMsg}
          </p>
        )}
        {showImport && (
          <div className="mt-2 flex flex-col gap-2">
            <textarea
              value={importText}
              onChange={e => { setImportText(e.target.value); setImportErr(null) }}
              placeholder='Paste program JSON ({ "name": …, "days": [ … ] })'
              rows={6}
              className={`${FIELD} font-mono resize-y`}
            />
            {/* A parse error is the one thing on the card that needs acting on. */}
            {importErr && <p className="text-[11px] text-signal whitespace-pre-wrap">{importErr}</p>}
            <div className="flex gap-2">
              <Btn small onClick={runImport}>Import</Btn>
              <Btn small variant="secondary" onClick={() => { setImportText(''); setImportErr(null) }}>Clear</Btn>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SecTitle>Program name</SecTitle>
        <input value={name} onChange={e => setName(e.target.value)} className={FIELD} />
      </Card>
      <Card>
        <SecTitle>Start date</SecTitle>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={FIELD} />
      </Card>

      {days.map((day, di) => (
        <Card key={di}>
          <div className="grid gap-1.5 items-center mb-2.5" style={{ gridTemplateColumns: DAY_COLS }}>
            <input
              value={day.name}
              onChange={e => setDayName(di, e.target.value)}
              className={`${FIELD} font-bold`}
            />
            <select value={day.dayOfWeek ?? ''} onChange={e => setDayDow(di, e.target.value)} className={`${FIELD} px-1.5`}>
              <option value="">Unscheduled</option>
              {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <DelBtn label="Delete day" onClick={() => removeDay(di)} />
          </div>
          {day.isVariant && (
            <p className="mb-2">
              <MicroLabel>{day.variantGroupKey ? `Variant · ${day.variantGroupKey}` : 'Variant'}</MicroLabel>
            </p>
          )}

          {(day.blocks ?? []).map((block, bi) => {
            const meta = BLOCK_META[block.blockType]
            return (
              <div key={bi} className={`mb-2.5 p-2 ${NEST}`}>
                <div className="grid gap-1.5 items-center mb-1.5" style={{ gridTemplateColumns: BLOCK_COLS }}>
                  <Icon name={meta.iconName} size={14} className="text-ink-2 justify-self-center" />
                  <select value={block.blockType} onChange={e => setBlockType(di, bi, e.target.value as BlockType)} className={`${FIELD} px-1.5 py-1.5`}>
                    {BLOCK_TYPES.map(t => <option key={t} value={t}>{BLOCK_META[t].label}</option>)}
                  </select>
                  <input value={block.name} onChange={e => setBlockName(di, bi, e.target.value)} className={`${FIELD} py-1.5`} placeholder="Block name" />
                  <DelBtn label="Delete block" onClick={() => removeBlock(di, bi)} />
                </div>
                <div className="w-28 mb-1.5">
                  <input
                    value={block.scheduledTime ?? ''}
                    onChange={e => setBlockTime(di, bi, e.target.value)}
                    placeholder="Time 07:00"
                    className={`${FIELD} py-1`}
                  />
                </div>

                {block.supersets.length > 0 && (
                  <div className="mb-1.5 flex flex-col gap-1">
                    {block.supersets.map((pair, pi) => (
                      <div key={pi} className="flex items-center gap-1.5 px-2 py-1 rounded-[3px] border border-line bg-white">
                        <SSBadge />
                        <span className="text-[11px] text-ink truncate">{pair[0]} + {pair[1]}</span>
                        <button
                          onClick={() => unpair(di, bi, pair)}
                          aria-label="Unpair"
                          className="ml-auto shrink-0 text-ink-3 hover:text-ink cursor-pointer transition-colors"
                        >
                          <Icon name="close" size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-1 mb-1.5">
                  {block.exercises.map((ex, ei) => {
                    const inSS = block.supersets.some(p => p.includes(ex.exercise))
                    const isPF = pairing?.di === di && pairing?.bi === bi && pairing?.first === ex.exercise
                    return (
                      <div key={ei} className={`flex items-center gap-1.5 px-2 py-1 rounded-[3px] bg-white border ${inSS ? 'border-ink' : 'border-line'}`}>
                        {inSS && <SSBadge />}
                        <span className="text-[11px] text-ink flex-1 truncate">{ex.exercise}</span>
                        <select
                          value={ex.trainingTag}
                          onChange={e => setExerciseTag(di, bi, ei, e.target.value as TrainingTag)}
                          className="shrink-0 text-[9px] font-bold uppercase tracking-[0.06em] border border-line rounded-[2px] px-1 py-0.5 bg-white text-ink-2 focus:outline-none focus:border-ink"
                        >
                          {TRAINING_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        {!inSS && (
                          // The pairing pick reads with the chip tones (§8):
                          // solid ink is the one chosen, outline the rest.
                          <button
                            onClick={() => togglePair(di, bi, ex.exercise)}
                            title="Pair as superset"
                            className={`shrink-0 px-1.5 py-[2px] rounded-[2px] text-[8px] font-bold uppercase tracking-[0.08em] border cursor-pointer transition-colors ${
                              isPF ? 'bg-ink text-white border-ink' : 'bg-white text-ink-3 border-line hover:border-ink hover:text-ink'
                            }`}
                          >
                            SS
                          </button>
                        )}
                        <button
                          onClick={() => removeExercise(di, bi, ei)}
                          aria-label="Remove exercise"
                          className="shrink-0 text-ink-3 hover:text-ink cursor-pointer transition-colors"
                        >
                          <Icon name="close" size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
                {pairing?.di === di && pairing?.bi === bi && (
                  <p className="text-[11px] text-ink-2 mb-1.5">Tap SS on another exercise to pair with “{pairing.first}”</p>
                )}

                {addingAt?.di === di && addingAt?.bi === bi ? (
                  <div className="grid gap-1.5 items-center" style={{ gridTemplateColumns: ADD_EX_COLS }}>
                    <input
                      value={newExName}
                      onChange={e => setNewExName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addExercise(di, bi)}
                      placeholder="Exercise name…"
                      className={`${FIELD} py-1.5`}
                      autoFocus
                    />
                    <select value={newExTag} onChange={e => setNewExTag(e.target.value as TrainingTag)} className={`${FIELD} py-1.5`}>
                      <option value="">{DEFAULT_TAG[block.blockType]}</option>
                      {TRAINING_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <Btn small onClick={() => addExercise(di, bi)}>Add</Btn>
                    <Btn small variant="secondary" onClick={() => setAddingAt(null)}>Done</Btn>
                  </div>
                ) : (
                  <button onClick={() => { setAddingAt({ di, bi }); setNewExName(''); setNewExTag('') }} className={GHOST}>
                    <Icon name="plus" size={11} />Add exercise
                  </button>
                )}
              </div>
            )
          })}

          <button onClick={() => addBlock(di)} className={GHOST}>
            <Icon name="plus" size={11} />Add block
          </button>
        </Card>
      ))}

      <Card>
        <Btn small variant="secondary" onClick={addDay}>+ Add day</Btn>
      </Card>

      <div className="flex gap-2">
        <Btn onClick={save} className="flex-1">Save program</Btn>
        <Btn onClick={onCancel} variant="secondary" className="flex-1">Cancel</Btn>
      </div>
    </div>
  )
}

// ── Block display ─────────────────────────────────────────────────────────────

/** One exercise as it reads on the plan: an outlined tile, ink when it is half
 *  of a superset — the SS badge, not a colour, says which (§1). */
function ExTile({ inSS, children }: { inSS?: boolean; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-[3px] bg-white border text-[11px] text-ink ${inSS ? 'border-ink' : 'border-line'}`}>
      {children}
    </span>
  )
}

/** Renders a day's blocks with their exercises + tags. Falls back to the flat
 *  superset-grouped view for legacy days that carry no blocks. */
function DayBlocks({ day }: { day: ProgramDay }) {
  const blocks = day.blocks ?? []
  if (blocks.length === 0) {
    if (day.exercises.length === 0) return <span className="text-[11px] text-ink-3">Rest day</span>
    return (
      <div className="flex flex-wrap gap-1.5">
        {getGrouped(day).map((g, gi) =>
          g.type === 'superset' ? (
            <ExTile key={gi} inSS>
              <SSBadge />
              {g.exercises.map((ex, i) => (
                <span key={i}>{i > 0 ? '+ ' : ''}{ex}</span>
              ))}
            </ExTile>
          ) : (
            <ExTile key={gi}>{g.exercises[0]}</ExTile>
          )
        )}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block, bi) => {
        const meta = BLOCK_META[block.blockType]
        return (
          <div key={bi}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon name={meta.iconName} size={13} className="text-ink-2 shrink-0" />
              <span className="text-[11px] font-bold text-ink">{block.name}</span>
              {block.scheduledTime && <span className="text-[10px] text-ink-3 tabular-nums">· {block.scheduledTime}</span>}
              {block.durationMinutes && <span className="text-[10px] text-ink-3 tabular-nums">· {block.durationMinutes}m</span>}
            </div>
            <div className="flex flex-wrap gap-1 pl-5">
              {block.exercises.map((ex, ei) => (
                <ExTile key={ei} inSS={block.supersets.some(p => p.includes(ex.exercise))}>
                  {block.supersets.some(p => p.includes(ex.exercise)) && <SSBadge />}
                  {ex.exercise}
                </ExTile>
              ))}
              {block.exercises.length === 0 && <span className="text-[11px] text-ink-3">—</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Compact one-line summary of a day's block types (for the schedule list). */
function BlockTypeStrip({ day }: { day: ProgramDay }) {
  const blocks = day.blocks ?? []
  if (blocks.length === 0) {
    return (
      <div className="flex flex-wrap items-center gap-1 mt-1">
        {getGrouped(day).map((g, gi) =>
          g.type === 'superset' ? (
            <span key={gi} className="inline-flex items-center gap-1 text-[10px] text-ink-2">
              <SSBadge />{g.exercises.join(' + ')}
            </span>
          ) : (
            <span key={gi} className="text-[10px] text-ink-3">{g.exercises[0]}</span>
          )
        )}
      </div>
    )
  }
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {blocks.map((b, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 text-[10px] text-ink-2 border border-line rounded-[2px] px-1.5 py-0.5"
          title={b.name}
        >
          <Icon name={BLOCK_META[b.blockType].iconName} size={11} className="text-ink-3 shrink-0" />
          {b.name}
        </span>
      ))}
    </div>
  )
}

// ── Program Card (one per active program) ─────────────────────────────────────

function ProgramCard({
  ap,
  weights,
  onEdit,
  onAdvance,
  onRestart,
  onPause,
  onDelete,
  variantWeekdays,
  onToggleVariant,
}: {
  ap: ActiveProgram
  weights: WeightEntry[]
  onEdit: () => void
  onAdvance: () => void
  onRestart: () => void
  onPause: () => void
  onDelete: () => void
  variantWeekdays: Set<DayOfWeek>
  onToggleVariant: (dayOfWeek: DayOfWeek, variantActive: boolean) => void
}) {
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const { week, isDeload, isComplete } = cycleInfo(ap)
  const mode = programMode(ap)
  const dayIndex = ap.currentDayIndex % ap.days.length
  const day = mode === 'flexible' ? null : resolveTodayDay(ap, today(), variantWeekdays)
  const activeDay = mode === 'index' ? ap.days[dayIndex] : day
  const nextDay = ap.days[(ap.currentDayIndex + 1) % ap.days.length]
  const variants = variantGroups(ap)

  const weekStart = startOfWeek(today())
  const trackableDays = ap.days.filter(d => d.exercises.length > 0).length
  const doneThisWeek = ap.days.filter(d => isDayDoneInWeek(weights, d, weekStart)).length

  const todayLabel = mode === 'index'
    ? `Today · Day ${dayIndex + 1}/${ap.days.length}`
    : `Today · ${weekdayOf()}`

  return (
    <Card>
      {/* Header: name + where the cycle stands */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-ink tracking-[-0.01em]">{ap.name}</p>
          <div className="mt-0.5">
            {isComplete ? (
              <span className={MICRO}><Icon name="check" size={11} />Cycle complete</span>
            ) : isDeload ? (
              <DeloadBadge week={week} />
            ) : (
              <span className="text-[11px] text-ink-2">Week {week} of {CYCLE}</span>
            )}
          </div>
        </div>
        <div className="flex gap-1.5 items-center shrink-0">
          <Btn small variant="secondary" onClick={onEdit}>Edit</Btn>
          <Btn small variant="ghost" onClick={onPause}>Pause</Btn>
        </div>
      </div>

      {/* Cycle progress — ink accumulates like the stimulus ramp (§4): weeks
          behind you are ink, this week is the mid step, ahead is hairline. */}
      {!isComplete && !isDeload && (
        <div className="flex gap-1 mb-3">
          {Array.from({ length: CYCLE }, (_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-[2px] ${i < week - 1 ? 'bg-ink' : i === week - 1 ? 'bg-ink-3' : 'bg-hairline'}`}
            />
          ))}
        </div>
      )}

      {/* Today / this week */}
      {mode === 'flexible' ? (
        <div className="mb-3">
          <p className={`${FIELD_LABEL} mb-1`}>This week</p>
          {trackableDays > 0 && (
            <p className="text-xs font-bold text-ink mb-1 tabular-nums">{doneThisWeek}/{trackableDays} lifting days done</p>
          )}
          <p className="text-[11px] text-ink-3">Days aren't pinned — log from the checklist in Weights.</p>
        </div>
      ) : day ? (
        <div className="mb-3">
          <p className="text-[11px] text-ink-3 mb-1">{todayLabel}</p>
          <p className="text-xs font-bold text-ink mb-1.5">{day.name}</p>
          <DayBlocks day={day} />
        </div>
      ) : (
        <div className="mb-3">
          <p className="text-[11px] text-ink-3 mb-1">{todayLabel}</p>
          <p className="inline-flex items-center gap-1.5 text-xs text-ink-2">
            <Icon name="recovery" size={13} className="shrink-0" />
            Rest day — nothing scheduled
          </p>
        </div>
      )}

      {/* This week's variant toggles */}
      {mode === 'weekday' && variants.length > 0 && (
        <div className={`mb-3 p-2 ${NEST}`}>
          <p className={`${FIELD_LABEL} mb-1.5`}>This week's variants</p>
          <div className="flex flex-col gap-1.5">
            {variants.map(g => {
              const on = variantWeekdays.has(g.weekday)
              return (
                <div key={g.weekday} className="flex items-center gap-1.5">
                  <span className="text-[11px] text-ink w-20 shrink-0 truncate">{g.weekday}</span>
                  <Chip active={!on} onClick={() => onToggleVariant(g.weekday, false)} className="flex-1 truncate">
                    {g.base?.name ?? 'Base'}
                  </Chip>
                  <Chip active={on} onClick={() => onToggleVariant(g.weekday, true)} className="flex-1 truncate">
                    {g.variant.name}
                  </Chip>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions — both of these write, so both take the solid commit tone (§8). */}
      {isComplete ? (
        <div className="flex gap-2 mb-3">
          <Btn onClick={onRestart} className="flex-1">Restart cycle</Btn>
          <Btn onClick={onEdit} variant="secondary" className="flex-1">Edit</Btn>
        </div>
      ) : mode === 'index' ? (
        <Btn onClick={onAdvance} className="w-full mb-3 inline-flex items-center justify-center gap-1.5">
          <Icon name="check" size={13} />Done → {nextDay?.name}
        </Btn>
      ) : null}

      {/* Expandable schedule */}
      <button
        onClick={() => setScheduleOpen(o => !o)}
        className={`${GHOST} w-full justify-between py-1 border-t border-hairline mt-1`}
      >
        Full schedule
        <Icon name={scheduleOpen ? 'chevronUp' : 'chevronDown'} size={11} />
      </button>

      {scheduleOpen && (
        <div className="mt-1.5">
          {ap.days.map((d, i) => {
            const active = mode === 'index' ? i === dayIndex : d === activeDay
            const dates = sessionDates(weights, d.exercises)
            return (
              <div key={i} className={`flex items-start gap-2 py-2 px-2 rounded-[3px] ${active ? 'bg-hairline' : ''}`}>
                <span className={`shrink-0 w-5 h-5 rounded-[2px] flex items-center justify-center text-[10px] font-bold tabular-nums mt-0.5 ${active ? 'bg-ink text-white' : 'bg-hairline text-ink-3'}`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[11px] truncate ${active ? 'font-bold text-ink' : 'text-ink-2'}`}>
                    {d.dayOfWeek ? `${d.dayOfWeek} · ` : ''}{d.name}
                  </p>
                  <BlockTypeStrip day={d} />
                  {dates.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {dates.slice(0, 3).map(dt => (
                        <span key={dt} className="text-[10px] text-ink-3 tabular-nums border border-line rounded-[2px] px-1.5 py-0.5">{dt}</span>
                      ))}
                      {dates.length > 3 && <span className="text-[10px] text-ink-3 tabular-nums">+{dates.length - 3}</span>}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {ap.days.length === 0 && <EmptyMsg>No days in this program</EmptyMsg>}
          <div className="pt-2 border-t border-hairline mt-1">
            <Btn small variant="danger" onClick={onDelete}>Delete program</Btn>
          </div>
        </div>
      )}
    </Card>
  )
}

// ── Program History Card (one per past/paused cycle) ──────────────────────────

// A cycle's ending is a stated fact, so it reads as an outlined micro label —
// no amber for paused, no colour for completed (§1).
const STATUS_LABEL: Record<ProgramCycle['status'], string> = {
  active: '',
  paused: 'Paused',
  completed: 'Completed',
  abandoned: 'Stopped early',
}

function ProgramHistoryCard({
  cycle,
  weights,
  onResume,
  onDelete,
}: {
  cycle: ProgramCycle
  weights: WeightEntry[]
  onResume: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [metric, setMetric] = useState<'maxWeight' | 'volume'>('maxWeight')
  const progress = cycleExerciseProgress(weights, cycle)
  const fmt = (n: number) => Math.round(n * 10) / 10
  const unit = metric === 'maxWeight' ? 'kg' : ''

  return (
    <Card>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <p className="text-xs font-bold text-ink truncate">
            {cycle.programName}{cycle.cycleNumber > 1 ? ` · Cycle ${cycle.cycleNumber}` : ''}
          </p>
          <p className="text-[11px] text-ink-3 tabular-nums">
            {cycle.startDate} – {cycle.endDate ?? 'ongoing'}
          </p>
        </div>
        {STATUS_LABEL[cycle.status] && (
          <span className="shrink-0"><MicroLabel>{STATUS_LABEL[cycle.status]}</MicroLabel></span>
        )}
      </div>

      {cycle.status === 'paused' && (
        <div className="flex items-center gap-1.5 mt-2 mb-1">
          <Btn small onClick={onResume}>Resume</Btn>
          <DelBtn label="Delete program" onClick={onDelete} />
        </div>
      )}

      <button onClick={() => setOpen(o => !o)} className={`${GHOST} w-full justify-between py-1 border-t border-hairline mt-2`}>
        Progress
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={11} />
      </button>

      {open && (
        <div className="mt-2 space-y-3">
          {progress.length > 0 && (
            <div className="flex gap-1.5">
              <Chip small active={metric === 'maxWeight'} onClick={() => setMetric('maxWeight')}>Max kg</Chip>
              <Chip small active={metric === 'volume'} onClick={() => setMetric('volume')}>Volume</Chip>
            </div>
          )}
          {progress.length === 0 && <EmptyMsg>No exercises logged in this cycle</EmptyMsg>}
          {progress.map(p => {
            const m = p[metric]
            return (
              <div key={p.exercise}>
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <span className="text-[11px] font-bold text-ink min-w-0 truncate">{p.exercise}</span>
                  <div className="text-right shrink-0">
                    {/* A result is not an urgency, so the delta stays ink and
                        the sign carries it (§1). */}
                    <span className="text-[11px] text-ink tabular-nums">
                      {fmt(m.first)}{unit} → {fmt(m.last)}{unit}
                      <span className="text-ink-2"> ({m.delta > 0 ? '+' : ''}{fmt(m.delta)}{unit})</span>
                    </span>
                    <p className="text-[10px] text-ink-3 tabular-nums">Peak {fmt(m.peak)}{unit}</p>
                  </div>
                </div>
                <MiniChart data={m.series} />
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// ── Main Program Tab ──────────────────────────────────────────────────────────

type EditingState = { programId?: string; userProgramId?: string; draft: Program } | null

export function ProgramTab() {
  const [editing, setEditing] = useState<EditingState>(null)
  const [saving, setSaving] = useState(false)
  const {
    programs,
    programHistory,
    weights,
    weekOverrides,
    saveActiveProgram,
    advanceActiveProgram,
    restartActiveProgram,
    pauseActiveProgram,
    resumeActiveProgram,
    removeProgram,
    toggleWeekVariant,
    setToast,
  } = useAppStore()

  const handleSave = async (p: Program, programId?: string, userProgramId?: string) => {
    setSaving(true)
    try {
      await saveActiveProgram(p, programId, userProgramId)
      setEditing(null)
      setToast('Program saved!')
    } catch {
      setToast('Failed to save program.')
    } finally {
      setSaving(false)
    }
  }

  const handleAdvance = async (ap: ActiveProgram) => {
    const newIndex = (ap.currentDayIndex + 1) % ap.days.length
    try {
      await advanceActiveProgram(ap.userProgramId, newIndex, today())
      setToast(`Advanced to ${ap.days[newIndex].name}`)
    } catch {
      setToast('Failed to advance.')
    }
  }

  const handleRestart = async (ap: ActiveProgram) => {
    try {
      await restartActiveProgram(ap.userProgramId, today())
      setToast('Program restarted!')
    } catch {
      setToast('Failed to restart.')
    }
  }

  const handlePause = async (ap: ActiveProgram) => {
    try {
      await pauseActiveProgram(ap.userProgramId)
      setToast(`${ap.name} paused`)
    } catch {
      setToast('Failed to pause.')
    }
  }

  const handleDelete = async (ap: ActiveProgram) => {
    try {
      await removeProgram(ap.programId, ap.userProgramId)
      setToast(`${ap.name} deleted`)
    } catch {
      setToast('Failed to delete.')
    }
  }

  const handleResume = async (cycle: ProgramCycle) => {
    try {
      await resumeActiveProgram(cycle.userProgramId)
      setToast(`${cycle.programName} resumed`)
    } catch {
      setToast('Failed to resume.')
    }
  }

  const handleDeleteHistory = async (cycle: ProgramCycle) => {
    try {
      await removeProgram(cycle.programId, cycle.userProgramId)
      setToast(`${cycle.programName} deleted`)
    } catch {
      setToast('Failed to delete.')
    }
  }

  if (saving) {
    return <div className="text-center py-12 text-ink-3 text-xs">Saving program…</div>
  }

  if (editing !== null) {
    return (
      <ProgramEditor
        draft={editing.draft}
        onSave={p => handleSave(p, editing.programId, editing.userProgramId)}
        onCancel={() => setEditing(null)}
      />
    )
  }

  const startFromScratch = () => setEditing({
    draft: { name: 'New Program', days: [], startDate: today(), currentDayIndex: 0, lastAdvancedDate: today() },
  })

  return (
    <div className="flex flex-col gap-4">
      {programs.length === 0 && (
        <Card>
          <SecTitle>Start a program</SecTitle>
          <p className="text-[11px] text-ink-2 mb-3">
            Pick a ready-made template to customize, or build your own from scratch.
          </p>
          <div className="flex flex-col gap-2">
            <p className={FIELD_LABEL}>Templates</p>
            <button
              onClick={() => setEditing({ draft: defaultProgram() })}
              className="w-full flex items-center gap-2.5 text-left rounded-[3px] border border-line bg-white p-2.5 hover:border-ink cursor-pointer transition-colors"
            >
              <Icon name="weights" size={18} className="text-ink-2 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink">5-Day High Efficiency Split</p>
                <p className="text-[11px] text-ink-3">Squat/bench/deadlift-based split with supersets</p>
              </div>
            </button>
            <p className={`${FIELD_LABEL} mt-1`}>Or start blank</p>
            <button
              onClick={startFromScratch}
              className="w-full flex items-center gap-2.5 text-left rounded-[3px] border border-line bg-white p-2.5 hover:border-ink cursor-pointer transition-colors"
            >
              <Icon name="plus" size={18} className="text-ink-2 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink">Create from scratch</p>
                <p className="text-[11px] text-ink-3">Build your own days, blocks and exercises</p>
              </div>
            </button>
          </div>
        </Card>
      )}

      {programs.map(ap => (
        <ProgramCard
          key={ap.userProgramId}
          ap={ap}
          weights={weights}
          variantWeekdays={activeVariantWeekdays(weekOverrides, ap.userProgramId)}
          onToggleVariant={(dow, active) => toggleWeekVariant(ap.userProgramId, dow, active)}
          onEdit={() => setEditing({ programId: ap.programId, userProgramId: ap.userProgramId, draft: ap })}
          onAdvance={() => handleAdvance(ap)}
          onRestart={() => handleRestart(ap)}
          onPause={() => handlePause(ap)}
          onDelete={() => handleDelete(ap)}
        />
      ))}

      {programHistory.filter(c => c.status !== 'active').length > 0 && (
        <div className="flex flex-col gap-3">
          <SecTitle className="mb-0">Program history</SecTitle>
          {programHistory.filter(c => c.status !== 'active').map(cycle => (
            <ProgramHistoryCard
              key={cycle.id}
              cycle={cycle}
              weights={weights}
              onResume={() => handleResume(cycle)}
              onDelete={() => handleDeleteHistory(cycle)}
            />
          ))}
        </div>
      )}

      {programs.length > 0 && (
        <button
          onClick={startFromScratch}
          className="w-full flex items-center justify-center gap-1.5 rounded-[3px] border border-line bg-white py-2.5 text-xs font-semibold text-ink hover:border-ink cursor-pointer transition-colors"
        >
          <Icon name="plus" size={13} />Add program
        </button>
      )}
    </div>
  )
}
