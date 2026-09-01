import { useMemo, useState } from 'react'
import { useAppStore } from '../../../store/app'
import { Inp, SelEl } from '../../ui/Input'
import { Btn } from '../../ui/Button'
import { SmartInput } from '../../ui/SmartInput'
import type { Habit, HabitAutoSource, HabitCadence, MuscleContribution } from '../../../types'
import {
  AUTO_SOURCE_LABEL, autoSourceOptions, defaultAutoSource, defaultUnit, muscleOptions,
  sourceNeedsLink, linkTypeOf, type LinkType,
} from './habitFields'

const CADENCES: HabitCadence[] = ['daily', 'weekly', 'monthly']
const LINK_TYPES: { value: LinkType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'muscle', label: 'Muscle group' },
  { value: 'exercise', label: 'Exercise' },
]

interface HabitFormProps {
  /** Present = edit mode. */
  record?: Habit
  onDone: () => void
  /** Modal mode: write the save fn here so an external footer can call it. */
  saveRef?: { current: () => void }
}

export function HabitForm({ record, onDone, saveRef }: HabitFormProps) {
  const { habits, muscleGroups, exerciseNames, addHabit, editHabit, setToast } = useAppStore()
  const exerciseList = useMemo(() => Object.entries(exerciseNames).map(([id, name]) => ({ id, name })), [exerciseNames])
  const exNameById = exerciseNames
  const idByExName = useMemo(
    () => Object.fromEntries(exerciseList.map(e => [e.name.toLowerCase(), e.id])),
    [exerciseList],
  )
  const muscleOpts = useMemo(() => muscleOptions(muscleGroups), [muscleGroups])

  const [name, setName] = useState(record?.name ?? '')
  const [icon, setIcon] = useState(record?.icon ?? '')
  const [cadence, setCadence] = useState<HabitCadence>(record?.cadence ?? 'weekly')
  const [target, setTarget] = useState(String(record?.targetCount ?? ''))
  const [unit, setUnit] = useState(record?.unit ?? '')
  const [linkType, setLinkType] = useState<LinkType>(record ? linkTypeOf(record) : 'muscle')
  const [muscleGroupId, setMuscleGroupId] = useState(record?.muscleGroupId ?? muscleOpts[0]?.value ?? '')
  const [exerciseName, setExerciseName] = useState(
    record?.exerciseId ? (exNameById[record.exerciseId] ?? '') : '',
  )
  const [autoSource, setAutoSource] = useState<HabitAutoSource>(
    record?.autoSource ?? 'weight_sets',
  )
  const [countLevel, setCountLevel] = useState<1 | 2 | 3>(record?.countLevel ?? 1)
  const [contribution, setContribution] = useState<MuscleContribution>(record?.contribution ?? 'stimulus')
  const [singleTick, setSingleTick] = useState(record?.singleTick ?? true)
  const [notes, setNotes] = useState(record?.notes ?? '')

  const sources = autoSourceOptions(linkType)

  const onLinkChange = (lt: LinkType) => {
    setLinkType(lt)
    const next = defaultAutoSource(lt)
    setAutoSource(next)
    if (!unit) setUnit(defaultUnit(next))
  }

  const onSourceChange = (src: HabitAutoSource) => {
    setAutoSource(src)
    setUnit(defaultUnit(src))
  }

  const buildHabit = (): Omit<Habit, 'id'> | null => {
    if (!name.trim()) { setToast('Name is required.'); return null }
    const exerciseId = linkType === 'exercise' ? (idByExName[exerciseName.trim().toLowerCase()] ?? null) : null
    if (sourceNeedsLink(autoSource)) {
      if (linkType === 'muscle' && !muscleGroupId) { setToast('Pick a muscle group.'); return null }
      if (linkType === 'exercise' && !exerciseId) { setToast('Pick a known exercise.'); return null }
      if (linkType === 'none') { setToast('Auto-tracking needs a muscle or exercise link.'); return null }
    }
    return {
      name: name.trim(),
      icon: icon.trim() || null,
      cadence,
      targetCount: Math.max(1, +target || 1),
      unit: unit.trim() || null,
      muscleGroupId: linkType === 'muscle' ? muscleGroupId : null,
      exerciseId,
      autoSource,
      countLevel,
      contribution,
      singleTick,
      active: true,
      sortOrder: record?.sortOrder ?? habits.length,
      notes: notes.trim() || null,
    }
  }

  const save = async () => {
    const h = buildHabit()
    if (!h) return
    try {
      if (record) await editHabit(record.id, h)
      else await addHabit(h)
      setToast(record ? 'Habit updated!' : 'Habit added!')
      onDone()
    } catch {
      setToast('Failed to save habit.')
    }
  }
  if (saveRef) saveRef.current = save

  const showMuscleControls = linkType === 'muscle'
  const showCountLevel = sourceNeedsLink(autoSource) && autoSource === 'weight_sets' && linkType !== 'none'
  const isManual = autoSource === 'none'

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[3rem_1fr] gap-2.5">
        <Inp label="Icon" value={icon} onChange={e => setIcon(e.target.value)} placeholder="✅" maxLength={2} />
        <Inp label="Habit name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 15 chest sets" />
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <SelEl
          label="Cadence"
          value={cadence}
          onChange={e => setCadence(e.target.value as HabitCadence)}
          options={CADENCES.map(c => ({ value: c, label: c[0].toUpperCase() + c.slice(1) }))}
        />
        <Inp label="Target" type="number" min="1" value={target} onChange={e => setTarget(e.target.value)} placeholder="15" />
        <Inp label="Unit" value={unit} onChange={e => setUnit(e.target.value)} placeholder="sets" />
      </div>

      <SelEl
        label="Link to"
        value={linkType}
        onChange={e => onLinkChange(e.target.value as LinkType)}
        options={LINK_TYPES}
      />

      {showMuscleControls && (
        <SelEl
          label="Muscle group"
          value={muscleGroupId}
          onChange={e => setMuscleGroupId(e.target.value)}
          options={muscleOpts}
        />
      )}
      {linkType === 'exercise' && (
        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-xs text-muted font-medium">Exercise</label>
          <SmartInput
            value={exerciseName}
            onChange={setExerciseName}
            suggestions={exerciseList.map(e => e.name)}
            placeholder="e.g. Bench Press"
          />
        </div>
      )}

      <SelEl
        label="Tracking"
        value={autoSource}
        onChange={e => onSourceChange(e.target.value as HabitAutoSource)}
        options={sources.map(s => ({ value: s, label: AUTO_SOURCE_LABEL[s] }))}
      />

      {isManual && (
        <SelEl
          label="Completion"
          value={singleTick ? 'single' : 'counter'}
          onChange={e => setSingleTick(e.target.value === 'single')}
          options={[
            { value: 'single', label: 'Single tick (done in one tap)' },
            { value: 'counter', label: 'Counter (+1 per rep/set)' },
          ]}
        />
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {showCountLevel && (
          <SelEl
            label="Count impact ≤"
            value={String(countLevel)}
            onChange={e => setCountLevel(+e.target.value as 1 | 2 | 3)}
            options={[
              { value: '1', label: 'Level 1 (direct)' },
              { value: '2', label: 'Level 1–2' },
              { value: '3', label: 'Level 1–3 (all)' },
            ]}
          />
        )}
        {showMuscleControls && (
          <SelEl
            label="Contribution"
            value={contribution}
            onChange={e => setContribution(e.target.value as MuscleContribution)}
            options={[
              { value: 'stimulus', label: 'Stimulus (training)' },
              { value: 'recovery', label: 'Recovery (e.g. rolling)' },
            ]}
          />
        )}
      </div>

      <Inp label="Notes (opt.)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />

      {!saveRef && <Btn onClick={save} className="w-full">{record ? 'Save' : 'Add Habit'}</Btn>}
    </div>
  )
}
