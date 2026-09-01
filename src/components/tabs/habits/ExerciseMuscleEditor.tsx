import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../../../store/app'
import { SecTitle } from '../../ui/Card'
import { Btn, DelBtn } from '../../ui/Button'
import { Inp, SelEl } from '../../ui/Input'
import { muscleOptions } from './habitFields'
import {
  loadExerciseMuscleRows, upsertExerciseMuscle, deleteExerciseMuscle, createExercise,
  setExerciseAdaptation,
  type ExerciseMuscleRow,
} from '../../../lib/db/muscles'
import { ADAPTATIONS } from '../../../constants/adaptations'
import type { Adaptation, MuscleContribution } from '../../../types'

const LEVEL_OPTS = [
  { value: '1', label: 'L1 · primary' },
  { value: '2', label: 'L2 · secondary' },
  { value: '3', label: 'L3 · secondary' },
]
const CONTRIB_OPTS = [
  { value: 'stimulus', label: 'Stimulus' },
  { value: 'recovery', label: 'Recovery' },
]
const ADAPTATION_OPTS = [
  { value: '', label: 'Auto (by reps)' },
  ...ADAPTATIONS.map(a => ({ value: a.key, label: `${a.icon} ${a.label}` })),
]

const rowKey = (r: ExerciseMuscleRow) => `${r.exerciseId}:${r.muscleGroupId}`

export function ExerciseMuscleEditor() {
  const { exerciseNames, exerciseAdaptations, muscleGroups, reloadMuscleData, setToast } = useAppStore()

  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [rows, setRows] = useState<ExerciseMuscleRow[]>([])
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (!open || loaded) return
    loadExerciseMuscleRows()
      .then(r => { setRows(r); setLoaded(true) })
      .catch(() => setToast('Failed to load mappings.'))
  }, [open, loaded, setToast])

  const muscleOpts = useMemo(() => muscleOptions(muscleGroups), [muscleGroups])
  const muscleNameById = useMemo(() => new Map(muscleGroups.map(g => [g.id, g.name])), [muscleGroups])
  const rowsByExercise = useMemo(() => {
    const m = new Map<string, ExerciseMuscleRow[]>()
    for (const r of rows) {
      const arr = m.get(r.exerciseId) ?? []
      arr.push(r)
      m.set(r.exerciseId, arr)
    }
    return m
  }, [rows])

  const exercises = useMemo(() => {
    const list = Object.entries(exerciseNames).map(([id, name]) => ({ id, name }))
    const q = search.trim().toLowerCase()
    return list
      .filter(e => !q || e.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [exerciseNames, search])

  const toggle = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const persist = async (row: ExerciseMuscleRow) => {
    setRows(prev => {
      const others = prev.filter(r => rowKey(r) !== rowKey(row))
      return [...others, row]
    })
    try {
      await upsertExerciseMuscle(row)
      await reloadMuscleData()
    } catch {
      setToast('Failed to save link.')
    }
  }

  const remove = async (row: ExerciseMuscleRow) => {
    setRows(prev => prev.filter(r => rowKey(r) !== rowKey(row)))
    try {
      await deleteExerciseMuscle(row.exerciseId, row.muscleGroupId)
      await reloadMuscleData()
    } catch {
      setToast('Failed to remove link.')
    }
  }

  const addLink = async (exerciseId: string, muscleGroupId: string) => {
    if (!muscleGroupId) return
    await persist({ exerciseId, muscleGroupId, level: 1, contribution: 'stimulus' })
  }

  const saveAdaptation = async (exerciseId: string, value: string) => {
    try {
      await setExerciseAdaptation(exerciseId, (value || null) as Adaptation | null)
      await reloadMuscleData()
    } catch {
      setToast('Failed to save adaptation.')
    }
  }

  const addExercise = async () => {
    const name = newName.trim()
    if (!name) return
    if (Object.values(exerciseNames).some(n => n.toLowerCase() === name.toLowerCase())) {
      setToast('That exercise already exists.')
      return
    }
    try {
      const ex = await createExercise(name)
      await reloadMuscleData()
      setNewName('')
      setExpanded(prev => new Set(prev).add(ex.id))
      setToast('Exercise created — add its muscles.')
    } catch {
      setToast('Failed to create exercise.')
    }
  }

  return (
    <div className="border-t border-bg pt-3 mt-1">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between">
        <SecTitle className="mb-0">Exercise → Muscle Mapping</SecTitle>
        <span className="text-[10px] text-muted">{open ? '▾ hide' : '▸ edit'}</span>
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-[11px] text-muted">
            Each exercise can target multiple muscles — L1 primary, L2/L3 secondary — as stimulus or recovery.
            Set an <b>Adaptation</b> to always count an exercise toward power/speed/etc. (overrides rep-based
            classification); leave it on Auto to classify by reps. Edits update the dashboards.
          </p>

          <div className="flex items-end gap-2">
            <Inp
              label="Add exercise"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Pigeon Stretch"
              onKeyDown={e => { if (e.key === 'Enter') addExercise() }}
            />
            <Btn small onClick={addExercise}>Add</Btn>
          </div>

          <Inp
            label="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter exercises…"
          />

          {!loaded ? (
            <p className="text-sm text-muted text-center py-4">Loading…</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-[28rem] overflow-y-auto pr-1">
              {exercises.map(ex => {
                const links = (rowsByExercise.get(ex.id) ?? []).slice().sort((a, b) => a.level - b.level)
                const isOpen = expanded.has(ex.id)
                const linkedIds = new Set(links.map(l => l.muscleGroupId))
                const available = muscleOpts.filter(o => !linkedIds.has(o.value))
                const adaptation = exerciseAdaptations[ex.name.toLowerCase()]
                const adaptMeta = adaptation ? ADAPTATIONS.find(a => a.key === adaptation) : null
                return (
                  <div key={ex.id} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggle(ex.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-bg"
                    >
                      <span className="text-[10px] text-muted w-3">{isOpen ? '▾' : '▸'}</span>
                      <span className="text-sm font-semibold text-primary flex-1 truncate">{ex.name}</span>
                      {adaptMeta && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: `${adaptMeta.color}1a`, color: adaptMeta.color }}
                          title={`Always counts as ${adaptMeta.label}`}
                        >
                          {adaptMeta.icon} {adaptMeta.label}
                        </span>
                      )}
                      <span className="text-[10px] text-muted shrink-0">
                        {links.length === 0 ? 'no muscles' : `${links.length} muscle${links.length > 1 ? 's' : ''}`}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-3 pb-3 pt-1 flex flex-col gap-2 bg-bg/40">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted flex-1">Adaptation</span>
                          <SelEl
                            options={ADAPTATION_OPTS}
                            value={adaptation ?? ''}
                            onChange={e => saveAdaptation(ex.id, e.target.value)}
                            className="!py-1 !px-2 text-xs w-40"
                          />
                        </div>
                        {links.map(link => (
                          <div key={link.muscleGroupId} className="flex items-center gap-2">
                            <span className="text-xs text-primary flex-1 truncate">
                              {muscleNameById.get(link.muscleGroupId) ?? '—'}
                            </span>
                            <SelEl
                              options={LEVEL_OPTS}
                              value={String(link.level)}
                              onChange={e => persist({ ...link, level: +e.target.value as 1 | 2 | 3 })}
                              className="!py-1 !px-2 text-xs w-28"
                            />
                            <SelEl
                              options={CONTRIB_OPTS}
                              value={link.contribution}
                              onChange={e => persist({ ...link, contribution: e.target.value as MuscleContribution })}
                              className="!py-1 !px-2 text-xs w-24"
                            />
                            <DelBtn label="Remove muscle" noConfirm onClick={() => remove(link)} />
                          </div>
                        ))}

                        {available.length > 0 && (
                          <SelEl
                            options={[{ value: '', label: '+ Add muscle…' }, ...available]}
                            value=""
                            onChange={e => addLink(ex.id, e.target.value)}
                            className="!py-1 text-xs"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              {exercises.length === 0 && (
                <p className="text-sm text-muted text-center py-4">No exercises match “{search}”.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
