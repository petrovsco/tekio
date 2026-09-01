import { useState } from 'react'
import { useAppStore } from '../../store/app'
import { cycleInfo, getGrouped, sessionDates, defaultProgram, today, cycleExerciseProgress, programMode, resolveTodayDay, weekdayOf, startOfWeek, isDayDoneInWeek, activeVariantWeekdays, variantGroups } from '../../lib/utils'
import { CYCLE } from '../../constants/app'
import { BLOCK_TYPES, BLOCK_META, TRAINING_TAGS, DEFAULT_TAG, DAYS_OF_WEEK } from '../../constants/program'
import { parseProgramJson } from '../../lib/programImport'
import { Card, SecTitle, EmptyMsg } from '../ui/Card'
import { Btn, DelBtn } from '../ui/Button'
import { SSBadge } from '../ui/Badges'
import { Chip } from '../ui/Chip'
import { MiniChart } from '../ui/MiniChart'
import type {
  Program, ProgramDay, ProgramDayBlock, BlockType, TrainingTag, DayOfWeek,
  ActiveProgram, ProgramCycle, WeightEntry,
} from '../../types'

const inputCls = 'border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40'

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
      {/* JSON import */}
      <Card>
        <button onClick={() => setShowImport(s => !s)} className="text-xs text-accent w-full text-left">
          {showImport ? '▲ Hide JSON import' : '📥 Import from JSON'}
        </button>
        {importMsg && <p className="text-xs text-accent mt-2">✅ {importMsg}</p>}
        {showImport && (
          <div className="mt-2 flex flex-col gap-2">
            <textarea
              value={importText}
              onChange={e => { setImportText(e.target.value); setImportErr(null) }}
              placeholder='Paste program JSON ({ "name": …, "days": [ … ] })'
              rows={6}
              className={`${inputCls} font-mono text-xs resize-y`}
            />
            {importErr && <p className="text-xs text-danger whitespace-pre-wrap">⚠️ {importErr}</p>}
            <div className="flex gap-2">
              <Btn small onClick={runImport}>Import</Btn>
              <Btn small variant="secondary" onClick={() => { setImportText(''); setImportErr(null) }}>Clear</Btn>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SecTitle>Program Name</SecTitle>
        <input value={name} onChange={e => setName(e.target.value)} className={`w-full ${inputCls}`} />
      </Card>
      <Card>
        <SecTitle>Start Date</SecTitle>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={`w-full ${inputCls}`} />
      </Card>

      {days.map((day, di) => (
        <Card key={di}>
          <div className="flex items-center gap-2 mb-3">
            <input
              value={day.name}
              onChange={e => setDayName(di, e.target.value)}
              className={`flex-1 ${inputCls} font-semibold`}
            />
            <select value={day.dayOfWeek ?? ''} onChange={e => setDayDow(di, e.target.value)} className={inputCls}>
              <option value="">Unscheduled</option>
              {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <DelBtn label="Delete day" onClick={() => removeDay(di)} />
          </div>
          {day.isVariant && (
            <p className="text-[11px] text-ss font-medium mb-2">⤷ Variant day{day.variantGroupKey ? ` · ${day.variantGroupKey}` : ''}</p>
          )}

          {(day.blocks ?? []).map((block, bi) => {
            const meta = BLOCK_META[block.blockType]
            return (
              <div key={bi} className="mb-3 border border-border rounded-xl p-3 bg-bg/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{meta.icon}</span>
                  <select value={block.blockType} onChange={e => setBlockType(di, bi, e.target.value as BlockType)} className={`${inputCls} py-1.5`}>
                    {BLOCK_TYPES.map(t => <option key={t} value={t}>{BLOCK_META[t].label}</option>)}
                  </select>
                  <input value={block.name} onChange={e => setBlockName(di, bi, e.target.value)} className={`flex-1 ${inputCls} py-1.5`} placeholder="Block name" />
                  <DelBtn label="Delete block" onClick={() => removeBlock(di, bi)} />
                </div>
                <input
                  value={block.scheduledTime ?? ''}
                  onChange={e => setBlockTime(di, bi, e.target.value)}
                  placeholder="Time (e.g. 07:00)"
                  className={`${inputCls} py-1 text-xs mb-2 w-32`}
                />

                {block.supersets.length > 0 && (
                  <div className="mb-2 flex flex-col gap-1">
                    {block.supersets.map((pair, pi) => (
                      <div key={pi} className="flex items-center gap-1.5 px-2 py-1 bg-ss-l rounded-lg border border-ss-b">
                        <SSBadge />
                        <span className="text-xs text-ss font-medium">{pair[0]} + {pair[1]}</span>
                        <button onClick={() => unpair(di, bi, pair)} className="ml-auto text-muted text-base leading-none">×</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-1 mb-2">
                  {block.exercises.map((ex, ei) => {
                    const inSS = block.supersets.some(p => p.includes(ex.exercise))
                    const isPF = pairing?.di === di && pairing?.bi === bi && pairing?.first === ex.exercise
                    return (
                      <div key={ei} className={`flex items-center gap-2 px-2 py-1 rounded-lg border ${inSS ? 'bg-ss-l border-ss-b' : 'bg-surface border-border'}`}>
                        <span className="text-xs text-primary flex-1 truncate">{ex.exercise}</span>
                        <select
                          value={ex.trainingTag}
                          onChange={e => setExerciseTag(di, bi, ei, e.target.value as TrainingTag)}
                          className="text-[10px] border border-border rounded px-1 py-0.5 bg-surface text-muted"
                        >
                          {TRAINING_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        {!inSS && (
                          <button onClick={() => togglePair(di, bi, ex.exercise)} className={`text-xs font-bold ${isPF ? 'text-ss' : 'text-muted'}`} title="Pair as superset">
                            {isPF ? '★' : '⊕'}
                          </button>
                        )}
                        <button onClick={() => removeExercise(di, bi, ei)} className="text-muted leading-none">×</button>
                      </div>
                    )
                  })}
                </div>
                {pairing?.di === di && pairing?.bi === bi && (
                  <p className="text-xs text-ss italic mb-2">Tap ⊕ on another exercise to pair with "{pairing.first}"</p>
                )}

                {addingAt?.di === di && addingAt?.bi === bi ? (
                  <div className="flex gap-2">
                    <input
                      value={newExName}
                      onChange={e => setNewExName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addExercise(di, bi)}
                      placeholder="Exercise name…"
                      className={`flex-1 ${inputCls} py-1.5`}
                      autoFocus
                    />
                    <select value={newExTag} onChange={e => setNewExTag(e.target.value as TrainingTag)} className={`${inputCls} py-1.5`}>
                      <option value="">{DEFAULT_TAG[block.blockType]}</option>
                      {TRAINING_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <Btn small onClick={() => addExercise(di, bi)}>Add</Btn>
                    <Btn small variant="secondary" onClick={() => setAddingAt(null)}>Done</Btn>
                  </div>
                ) : (
                  <button onClick={() => { setAddingAt({ di, bi }); setNewExName(''); setNewExTag('') }} className="text-xs text-accent">+ Add exercise</button>
                )}
              </div>
            )
          })}

          <button onClick={() => addBlock(di)} className="text-xs text-accent">+ Add block</button>
        </Card>
      ))}

      <Card>
        <Btn small onClick={addDay}>+ Add Day</Btn>
      </Card>

      <div className="flex gap-2">
        <Btn onClick={save} className="flex-1">Save Program</Btn>
        <Btn onClick={onCancel} variant="secondary" className="flex-1">Cancel</Btn>
      </div>
    </div>
  )
}

// ── Block display ─────────────────────────────────────────────────────────────

/** Renders a day's blocks with their exercises + tags. Falls back to the flat
 *  superset-grouped view for legacy days that carry no blocks. */
function DayBlocks({ day }: { day: ProgramDay }) {
  const blocks = day.blocks ?? []
  if (blocks.length === 0) {
    if (day.exercises.length === 0) return <span className="text-xs text-muted italic">Rest day</span>
    return (
      <div className="flex flex-wrap gap-1.5">
        {getGrouped(day).map((g, gi) =>
          g.type === 'superset' ? (
            <div key={gi} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-ss-l border border-ss-b rounded-lg">
              <SSBadge />
              {g.exercises.map((ex, i) => (
                <span key={i} className="text-xs font-medium text-ss">{i > 0 ? '+ ' : ''}{ex}</span>
              ))}
            </div>
          ) : (
            <div key={gi} className="inline-flex items-center px-2.5 py-1.5 rounded-full bg-accent-l text-accent text-xs font-medium">
              🏋️ {g.exercises[0]}
            </div>
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
              <span className="text-sm">{meta.icon}</span>
              <span className="text-xs font-semibold text-primary">{block.name}</span>
              {block.scheduledTime && <span className="text-[10px] text-muted">· {block.scheduledTime}</span>}
              {block.durationMinutes && <span className="text-[10px] text-muted">· {block.durationMinutes}m</span>}
            </div>
            <div className="flex flex-wrap gap-1 pl-5">
              {block.exercises.map((ex, ei) => {
                const inSS = block.supersets.some(p => p.includes(ex.exercise))
                return (
                  <span key={ei} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${inSS ? 'bg-ss-l border-ss-b text-ss' : 'bg-bg border-border text-primary'}`}>
                    {inSS && <SSBadge />}
                    {ex.exercise}
                  </span>
                )
              })}
              {block.exercises.length === 0 && <span className="text-[11px] text-muted italic">—</span>}
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
      <div className="flex flex-wrap gap-1 mt-0.5">
        {getGrouped(day).map((g, gi) =>
          g.type === 'superset' ? (
            <span key={gi} className="text-[10px] text-ss bg-ss-l border border-ss-b rounded-full px-1.5 py-0.5">SS: {g.exercises.join('+')}</span>
          ) : (
            <span key={gi} className="text-[10px] text-muted">{g.exercises[0]}</span>
          )
        )}
      </div>
    )
  }
  return (
    <div className="flex flex-wrap gap-1 mt-0.5">
      {blocks.map((b, i) => (
        <span key={i} className="text-[10px] text-muted bg-bg rounded-full px-1.5 py-0.5" title={b.name}>
          {BLOCK_META[b.blockType].icon} {b.name}
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
      {/* Header: name + week badge */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-base font-bold text-primary">{ap.name}</p>
          {isComplete ? (
            <span className="text-xs text-accent font-semibold">🎉 Cycle complete</span>
          ) : isDeload ? (
            <span className="text-xs text-dl-tx font-semibold">⚠️ Deload week</span>
          ) : (
            <span className="text-xs text-muted">Week {week} of {CYCLE}</span>
          )}
        </div>
        <div className="flex gap-2 items-center shrink-0">
          <button onClick={onEdit} className="text-xs text-accent">Edit</button>
          <button onClick={onPause} className="text-xs text-muted">Pause</button>
        </div>
      </div>

      {/* Cycle progress bar */}
      {!isComplete && !isDeload && (
        <div className="flex gap-1 mb-3">
          {Array.from({ length: CYCLE }, (_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full ${i < week - 1 ? 'bg-accent' : i === week - 1 ? 'bg-accent/40' : 'bg-bg'}`}
            />
          ))}
        </div>
      )}

      {/* Today / this week */}
      {mode === 'flexible' ? (
        <div className="mb-3">
          <p className="text-xs text-muted mb-1">🗓️ This week</p>
          {trackableDays > 0 && (
            <p className="text-sm font-semibold text-primary mb-1.5">{doneThisWeek}/{trackableDays} lifting days done</p>
          )}
          <p className="text-[11px] text-muted">Days aren't pinned — log from the checklist in Weights.</p>
        </div>
      ) : day ? (
        <div className="mb-3">
          <p className="text-xs text-muted mb-1">{todayLabel}</p>
          <p className="text-sm font-semibold text-primary mb-1.5">{day.name}</p>
          <DayBlocks day={day} />
        </div>
      ) : (
        <div className="mb-3">
          <p className="text-xs text-muted mb-1">{todayLabel}</p>
          <p className="text-sm text-muted italic">🛌 Rest day — nothing scheduled</p>
        </div>
      )}

      {/* This week's variant toggles */}
      {mode === 'weekday' && variants.length > 0 && (
        <div className="mb-3 rounded-xl border border-border bg-bg/40 p-2.5">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-1.5">🔀 This week's variants</p>
          <div className="flex flex-col gap-1.5">
            {variants.map(g => {
              const on = variantWeekdays.has(g.weekday)
              return (
                <div key={g.weekday} className="flex items-center gap-2">
                  <span className="text-xs text-primary w-20 shrink-0">{g.weekday}</span>
                  <div className="flex gap-1 flex-1">
                    <button
                      onClick={() => onToggleVariant(g.weekday, false)}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${!on ? 'border-accent bg-accent-l text-accent' : 'border-border bg-surface text-muted'}`}
                    >
                      {g.base?.name ?? 'Base'}
                    </button>
                    <button
                      onClick={() => onToggleVariant(g.weekday, true)}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${on ? 'border-ss bg-ss-l text-ss' : 'border-border bg-surface text-muted'}`}
                    >
                      {g.variant.name}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      {isComplete ? (
        <div className="flex gap-2 mb-3">
          <Btn onClick={onRestart} className="flex-1">🔄 Restart</Btn>
          <Btn onClick={onEdit} variant="secondary" className="flex-1">✏️ Edit</Btn>
        </div>
      ) : mode === 'index' ? (
        <Btn onClick={onAdvance} variant="secondary" className="w-full mb-3">
          ✓ Done → {nextDay?.name}
        </Btn>
      ) : null}

      {/* Expandable schedule */}
      <button
        onClick={() => setScheduleOpen(o => !o)}
        className="text-xs text-muted w-full text-left py-1 border-t border-bg mt-1"
      >
        {scheduleOpen ? '▲ Hide schedule' : '▼ Full schedule'}
      </button>

      {scheduleOpen && (
        <div className="mt-2 space-y-0.5">
          {ap.days.map((d, i) => {
            const active = mode === 'index' ? i === dayIndex : d === activeDay
            const dates = sessionDates(weights, d.exercises)
            return (
              <div key={i} className={`flex items-start gap-2.5 py-2 px-2.5 rounded-xl ${active ? 'bg-accent-l' : ''}`}>
                <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5 ${active ? 'bg-accent text-white' : 'bg-bg text-muted'}`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-${active ? 'semibold' : 'normal'} ${active ? 'text-accent' : 'text-primary'} truncate`}>
                    {d.dayOfWeek ? `${d.dayOfWeek} · ` : ''}{d.name}
                  </p>
                  <BlockTypeStrip day={d} />
                  {dates.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {dates.slice(0, 3).map(dt => (
                        <span key={dt} className="text-[10px] bg-bg text-muted px-1.5 py-0.5 rounded-full">{dt}</span>
                      ))}
                      {dates.length > 3 && <span className="text-[10px] text-muted">+{dates.length - 3}</span>}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {ap.days.length === 0 && <EmptyMsg>No days in this program</EmptyMsg>}
          <div className="pt-2 border-t border-bg mt-1">
            <button onClick={onDelete} className="text-xs text-danger">Delete program</button>
          </div>
        </div>
      )}
    </Card>
  )
}

// ── Program History Card (one per past/paused cycle) ──────────────────────────

const STATUS_BADGE: Record<ProgramCycle['status'], string> = {
  active: '',
  paused: '⏸ Paused',
  completed: '🎉 Completed',
  abandoned: '⏹ Stopped early',
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
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-sm font-bold text-primary">
            {cycle.programName}{cycle.cycleNumber > 1 ? ` · Cycle ${cycle.cycleNumber}` : ''}
          </p>
          <p className="text-xs text-muted">
            {cycle.startDate} – {cycle.endDate ?? 'ongoing'}
          </p>
        </div>
        <span className="text-xs font-semibold text-muted shrink-0">{STATUS_BADGE[cycle.status]}</span>
      </div>

      {cycle.status === 'paused' && (
        <div className="flex gap-2 mt-2 mb-1">
          <Btn small onClick={onResume}>▶ Resume</Btn>
          <DelBtn label="Delete program" onClick={onDelete} />
        </div>
      )}

      <button onClick={() => setOpen(o => !o)} className="text-xs text-muted w-full text-left py-1 border-t border-bg mt-2">
        {open ? '▲ Hide progress' : '▼ View progress'}
      </button>

      {open && (
        <div className="mt-2 space-y-3">
          {progress.length > 0 && (
            <div className="flex gap-1">
              <Chip small active={metric === 'maxWeight'} onClick={() => setMetric('maxWeight')}>Max kg</Chip>
              <Chip small active={metric === 'volume'} onClick={() => setMetric('volume')}>Volume</Chip>
            </div>
          )}
          {progress.length === 0 && <EmptyMsg>No exercises logged in this cycle</EmptyMsg>}
          {progress.map(p => {
            const m = p[metric]
            return (
              <div key={p.exercise}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-primary">{p.exercise}</span>
                  <div className="text-right">
                    <span className={`text-xs font-medium ${m.delta > 0 ? 'text-accent' : m.delta < 0 ? 'text-danger' : 'text-muted'}`}>
                      {fmt(m.first)}{unit} → {fmt(m.last)}{unit} ({m.delta > 0 ? '+' : ''}{fmt(m.delta)}{unit})
                    </span>
                    <p className="text-[11px] text-muted">Peak {fmt(m.peak)}{unit}</p>
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
      setToast(`⏸ ${ap.name} paused`)
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
      setToast(`▶ ${cycle.programName} resumed`)
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
    return <div className="text-center py-12 text-muted text-sm">Saving program…</div>
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
          <SecTitle>Start a Program</SecTitle>
          <p className="text-sm text-muted mb-4">
            Pick a ready-made template to customize, or build your own from scratch.
          </p>
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">Templates</p>
            <button
              onClick={() => setEditing({ draft: defaultProgram() })}
              className="w-full flex items-center gap-3 text-left rounded-xl border border-border bg-bg/40 p-3 active:scale-[0.98] transition-transform hover:border-accent"
            >
              <span className="text-2xl shrink-0">🏋️</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary">5-Day High Efficiency Split</p>
                <p className="text-[11px] text-muted">Squat/bench/deadlift-based split with supersets</p>
              </div>
            </button>
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mt-2">Or start blank</p>
            <button
              onClick={startFromScratch}
              className="w-full flex items-center gap-3 text-left rounded-xl border border-dashed border-border bg-surface p-3 active:scale-[0.98] transition-transform hover:border-accent"
            >
              <span className="text-2xl shrink-0">✏️</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-accent">Create from scratch</p>
                <p className="text-[11px] text-muted">Build your own days, blocks and exercises</p>
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
          <SecTitle>📜 Program History</SecTitle>
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
          className="w-full border-2 border-dashed border-border bg-surface rounded-2xl p-4 text-center"
        >
          <span className="text-sm font-semibold text-accent">+ Add New Program</span>
        </button>
      )}
    </div>
  )
}
