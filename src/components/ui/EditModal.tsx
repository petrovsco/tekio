import { useState, useMemo, useEffect } from 'react'
import { parseDurationMins, formatDurationMins, calcPace } from '../../lib/utils'
import { useAppStore } from '../../store/app'
import { Modal } from './Modal'
import { SetsGrid } from './SetsGrid'
import { toSetStr, parseSets } from '../../lib/sets'
import type { SetStr } from '../../lib/sets'
import { Inp, SelEl, FIELD_LABEL } from './Input'
import { FieldLabel, Toggle, Rating } from './Fields'
import { Btn, DelBtn } from './Button'
import { Icon } from './Icon'
import { SSBadge } from './Badges'
import { SmartInput } from './SmartInput'
import { ChipListInput } from './ChipListInput'
import { CARDIO_TYPES, CARDIO_FORMATS, DONATION_TYPES } from '../../constants/app'
import type {
  EditModalTarget,
  WeightEntry,
  BodyweightEntry,
  CardioEntry,
  CardioFormat,
  MobilityEntry,
  SportEntry,
  DonationEntry,
  WaterEntry,
  SleepEntry,
  SaunaEntry,
  ColdEntry,
  SleepQuality,
  LiftSet,
  MobilityExercise,
  QualityRating,
  MatchResult,
  NewSportFlags,
} from '../../types'

// ── Form plumbing ─────────────────────────────────────────────────────────────

/**
 * Where the open form publishes its save handler for the footer's Save button.
 *
 * A plain module-level box rather than a React ref threaded through props:
 * EditModal is mounted once in AppShell and the store holds one `editModal` at a
 * time, so exactly one form is ever live. Passing a ref down as a prop is the
 * thing React's own rules tell you not to build (`react-hooks/refs`), and it
 * cost every form an extra prop.
 */
const saveSlot = { run: () => {} }

/** Every form takes the record it edits and the modal's close. */
type FormProps<T> = { record: T; onClose: () => void }

/**
 * Publishes a form's save handler to the footer and runs it through the store's
 * `withToast`. Every form says the same two things, so the strings live here.
 *
 * `write` carries the *whole* success path: the write and the close that follows
 * it both run inside `withToast`, which is what keeps a failed save from
 * dismissing a modal full of typed-in data.
 *
 * `ready` is the form's own validity guard. False means the Save button does
 * nothing at all — no write, no toast — which is what each form did with an
 * early `return` above its `try`.
 *
 * The slot is filled in an effect rather than during render. The effect has no
 * dependency array, so it re-publishes after every commit and the footer can
 * never hold a stale closure.
 */
function useSave(onClose: () => void, ready: boolean, write: () => Promise<void>) {
  const withToast = useAppStore(s => s.withToast)
  useEffect(() => {
    saveSlot.run = () => {
      if (!ready) return
      void withToast(async () => {
        await write()
        onClose()
      }, 'Updated!', 'Failed to update.')
    }
  })
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Custom hook — manages a sets grid's local state. */
function useSets(initial: LiftSet[]) {
  const [sets, setSets] = useState<SetStr[]>(() => toSetStr(initial))
  const [revealed, setRevealed] = useState(initial.length || 1)

  const update = (i: number, f: 'weight' | 'reps', v: string) =>
    setSets(p => p.map((s, idx) => (idx === i ? { ...s, [f]: v } : s)))

  const remove = (i: number) => {
    setSets(p => p.filter((_, idx) => idx !== i))
    setRevealed(r => Math.max(1, r - 1))
  }

  const revealNext = () => {
    const n = revealed + 1
    if (n > sets.length) setSets(p => [...p, { weight: p[p.length - 1]?.weight || '', reps: '' }])
    setRevealed(n)
  }

  return { sets, revealed, update, remove, revealNext, parsed: parseSets(sets, revealed) }
}

// ── Save/Cancel footer ────────────────────────────────────────────────────────

function Footer({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="flex gap-2">
      <Btn variant="secondary" onClick={onCancel} className="flex-1">Cancel</Btn>
      <Btn onClick={onSave} className="flex-1">Save</Btn>
    </div>
  )
}

// ── WeightForm ────────────────────────────────────────────────────────────────

function WeightForm({ record, onClose }: FormProps<WeightEntry>) {
  const editWeightEntry = useAppStore(s => s.editWeightEntry)
  const [date, setDate] = useState(record.date)
  const s = useSets(record.sets)

  useSave(onClose, s.parsed.length > 0, () =>
    editWeightEntry(record.id, { sets: s.parsed, date }))

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] font-bold text-ink">{record.exercise}</p>
      <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
      <SetsGrid
        sets={s.sets} revealed={s.revealed}
        onUpdate={s.update} onRemove={s.remove} onRevealNext={s.revealNext}
      />
    </div>
  )
}

// ── SupersetForm ──────────────────────────────────────────────────────────────

function SupersetForm({ record, onClose }: FormProps<[WeightEntry, WeightEntry]>) {
  const editWeightEntry = useAppStore(s => s.editWeightEntry)
  const [first, second] = record
  const [date, setDate] = useState(first.date)
  const s0 = useSets(first.sets)
  const s1 = useSets(second.sets)

  useSave(onClose, s0.parsed.length > 0 && s1.parsed.length > 0, async () => {
    await Promise.all([
      editWeightEntry(first.id, { sets: s0.parsed, date }),
      editWeightEntry(second.id, { sets: s1.parsed, date }),
    ])
  })

  return (
    <div className="flex flex-col gap-4">
      <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />

      <div className="border border-line rounded-[3px] p-2.5 bg-hairline">
        <p className="flex items-center gap-1.5 text-xs font-bold text-ink mb-2"><SSBadge />{first.exercise}</p>
        <SetsGrid
          sets={s0.sets} revealed={s0.revealed}
          onUpdate={s0.update} onRemove={s0.remove} onRevealNext={s0.revealNext}
        />
      </div>

      <div className="border border-line rounded-[3px] p-2.5 bg-hairline">
        <p className="flex items-center gap-1.5 text-xs font-bold text-ink mb-2"><SSBadge />{second.exercise}</p>
        <SetsGrid
          sets={s1.sets} revealed={s1.revealed}
          onUpdate={s1.update} onRemove={s1.remove} onRevealNext={s1.revealNext}
        />
      </div>
    </div>
  )
}

// ── BodyweightForm ────────────────────────────────────────────────────────────

function BodyweightForm({ record, onClose }: FormProps<BodyweightEntry>) {
  const editBodyweightEntry = useAppStore(s => s.editBodyweightEntry)
  const [date, setDate] = useState(record.date)
  const [weight, setWeight] = useState(String(record.weight))

  useSave(onClose, !!weight, () =>
    editBodyweightEntry(record.id, { date, weight: +weight }))

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Inp
          label="Weight (kg)"
          type="number"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          step="0.1"
          min="0"
          placeholder="70.5"
        />
      </div>
    </div>
  )
}

// ── CardioForm ────────────────────────────────────────────────────────────────

function CardioForm({ record, onClose }: FormProps<CardioEntry>) {
  const editCardioEntry = useAppStore(s => s.editCardioEntry)
  const [date, setDate] = useState(record.date)
  const [type, setType] = useState(record.type)
  const [duration, setDuration] = useState(formatDurationMins(record.duration))
  const [distance, setDistance] = useState(record.distance != null ? String(record.distance) : '')
  const [avgHr, setAvgHr] = useState(record.avgHr != null ? String(record.avgHr) : '')
  const [format, setFormat] = useState<CardioFormat | ''>(record.format ?? '')
  const [bout, setBout] = useState(record.boutSeconds != null ? formatDurationMins(record.boutSeconds / 60) : '')
  const [notes, setNotes] = useState(record.notes ?? '')

  const durationMins = parseDurationMins(duration)
  const distKm = distance ? +distance : 0
  const livePace = calcPace(durationMins, distKm)
  const boutSeconds = format === 'intervals' ? Math.round(parseDurationMins(bout) * 60) || undefined : undefined

  useSave(onClose, !!durationMins, () =>
    editCardioEntry(record.id, {
      date,
      type,
      duration: durationMins,
      distance: distKm || undefined,
      avgHr: avgHr ? +avgHr : undefined,
      format: format || undefined,
      boutSeconds,
      notes: notes || undefined,
    }))

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        <SelEl
          label="Type"
          value={type}
          onChange={e => setType(e.target.value as CardioEntry['type'])}
          options={CARDIO_TYPES.map(t => ({ value: t, label: t }))}
        />
        <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Inp
          label="Duration (MM:SS)"
          type="text"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          placeholder="30:00"
        />
        <div>
          <Inp
            label="Distance (km, opt.)"
            type="number"
            value={distance}
            onChange={e => setDistance(e.target.value)}
            placeholder="5.0"
            step="0.01"
            min="0"
          />
          {livePace && <p className="text-[11px] text-ink-2 mt-1 tabular-nums">{livePace}</p>}
        </div>
        <Inp
          label="Avg HR (bpm, opt.)"
          type="number"
          value={avgHr}
          onChange={e => setAvgHr(e.target.value)}
          placeholder="145"
          min="0"
          step="1"
        />
        <Toggle
          label="Format (opt.)"
          options={CARDIO_FORMATS}
          value={format}
          onPick={v => setFormat(f => (f === v ? '' : v))}
        />
        {/* Shown only for an intervals session (P1) — the bout length decides
            anaerobic capacity (≤ 2 min) vs VO₂max, roadmap 005. */}
        {format === 'intervals' && (
          <Inp
            label="Bout (MM:SS, opt.)"
            type="text"
            value={bout}
            onChange={e => setBout(e.target.value)}
            placeholder="4:00"
          />
        )}
      </div>
      <Inp
        label="Notes (opt.)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="e.g. Easy zone 2"
      />
    </div>
  )
}

// ── MobilityForm ──────────────────────────────────────────────────────────────

function emptyEx(): MobilityExercise { return { name: '', duration: 0, notes: '' } }

function MobilityForm({ record, onClose }: FormProps<MobilityEntry>) {
  const editMobilityEntry = useAppStore(s => s.editMobilityEntry)
  const mobility = useAppStore(s => s.mobility)
  const exerciseAliases = useAppStore(s => s.exerciseAliases)
  const allExNames = useMemo(
    () => [...new Set(mobility.flatMap(m => m.exercises.map(e => e.name)))].sort(),
    [mobility]
  )
  const [date, setDate] = useState(record.date)
  const [exercises, setExercises] = useState<MobilityExercise[]>(
    record.exercises.length ? [...record.exercises] : [emptyEx()]
  )

  const updateEx = (i: number, field: keyof MobilityExercise, value: string | number) =>
    setExercises(prev => prev.map((e, j) => (j === i ? { ...e, [field]: value } : e)))
  const addEx = () => setExercises(p => [...p, emptyEx()])
  const removeEx = (i: number) => setExercises(p => p.filter((_, j) => j !== i))

  const valid = exercises.filter(e => e.name.trim() && e.duration > 0)

  useSave(onClose, valid.length > 0, () =>
    editMobilityEntry(record.id, {
      date,
      exercises: valid,
      duration: valid.reduce((s, e) => s + e.duration, 0),
    }))

  return (
    <div className="flex flex-col gap-3">
      <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />

      {exercises.map((ex, i) => (
        <div key={i} className="flex flex-col gap-1.5 pb-3 border-b border-hairline last:border-0 last:pb-0">
          {/* Row 1: name + delete */}
          <div className="flex items-center gap-2">
            <SmartInput
              value={ex.name}
              onChange={v => updateEx(i, 'name', v)}
              suggestions={allExNames}
              aliases={exerciseAliases}
              placeholder={`Exercise ${i + 1}`}
              className="flex-1 min-w-0"
            />
            <DelBtn noConfirm onClick={() => removeEx(i)} />
          </div>
          {/* Row 2: duration + notes */}
          <div className="grid grid-cols-2 gap-2">
            <Inp
              type="number"
              value={ex.duration || ''}
              onChange={e => updateEx(i, 'duration', +e.target.value)}
              placeholder="Duration (min)"
              min="1"
            />
            <Inp
              value={ex.notes}
              onChange={e => updateEx(i, 'notes', e.target.value)}
              placeholder="Notes (opt.)"
            />
          </div>
        </div>
      ))}

      <button onClick={addEx} className="text-[11px] font-semibold text-ink underline underline-offset-2 text-left cursor-pointer">+ Add exercise</button>
    </div>
  )
}

// ── SportForm ─────────────────────────────────────────────────────────────────

function SportForm({ record, onClose }: FormProps<SportEntry>) {
  const editSportEntry = useAppStore(s => s.editSportEntry)
  const sports = useAppStore(s => s.sports)
  const sportTypes = useAppStore(s => s.sportTypes)
  const allSports = useMemo(() => [...new Set(sports.map(d => d.sport))].sort(), [sports])
  const allCompetitors = useMemo(
    () => [...new Set(sports.flatMap(d => d.competitorNames ?? []))].sort(),
    [sports]
  )
  const allTeammates = useMemo(
    () => [...new Set(sports.flatMap(d => d.teammateNames ?? []))].sort(),
    [sports]
  )
  const [date, setDate] = useState(record.date)
  const [sport, setSport] = useState<string>(record.sport)
  const [withTrainer, setWithTrainer] = useState(record.withTrainer)
  const [quality, setQuality] = useState<number>(record.quality)
  const [duration, setDuration] = useState(record.duration != null ? formatDurationMins(record.duration) : '')
  const [avgHr, setAvgHr] = useState(record.avgHr != null ? String(record.avgHr) : '')
  const [notes, setNotes] = useState(record.notes)
  const [competitorNames, setCompetitorNames] = useState<string[]>(record.competitorNames ?? [])
  const [result, setResult] = useState<MatchResult | ''>(record.result ?? '')
  const [teammates, setTeammates] = useState<string[]>(record.teammateNames ?? [])
  const [newSportHasCompetitor, setNewSportHasCompetitor] = useState(false)
  const [newSportHasTeammate, setNewSportHasTeammate] = useState(false)

  const existingType = sportTypes.find(t => t.name.toLowerCase() === sport.trim().toLowerCase())
  const isNewSport = sport.trim() !== '' && !existingType
  const hasCompetitor = existingType ? existingType.hasCompetitor : (isNewSport && newSportHasCompetitor)
  const hasTeammate = existingType ? existingType.hasTeammate : (isNewSport && newSportHasTeammate)
  const newSportFlags: NewSportFlags | undefined = isNewSport
    ? { hasCompetitor: newSportHasCompetitor, hasTeammate: newSportHasTeammate }
    : undefined

  useSave(onClose, sport.trim() !== '', () =>
    editSportEntry(record.id, {
      date,
      sport: sport as SportEntry['sport'],
      withTrainer,
      quality: quality as QualityRating,
      duration: parseDurationMins(duration) || undefined,
      avgHr: avgHr ? +avgHr : undefined,
      notes,
      competitorNames: hasCompetitor ? (competitorNames.length ? competitorNames : undefined) : undefined,
      result: hasCompetitor ? (result || undefined) : undefined,
      teammateNames: hasTeammate ? teammates : undefined,
    }, newSportFlags))

  return (
    <div className="flex flex-col gap-3">
      <div>
        <FieldLabel>Sport</FieldLabel>
        <SmartInput
          value={sport}
          onChange={setSport}
          suggestions={allSports}
          placeholder="e.g. Tennis"
        />
      </div>

      {isNewSport && (
        <div className="flex flex-col gap-1.5 px-2.5 py-2 rounded-[3px] bg-hairline border border-line">
          <p className={FIELD_LABEL}>New sport — what should this track?</p>
          <label className="flex items-center gap-2 text-xs text-ink">
            <input type="checkbox" className="accent-ink" checked={newSportHasCompetitor} onChange={e => setNewSportHasCompetitor(e.target.checked)} />
            Competitor (opponent + win/loss)
          </label>
          <label className="flex items-center gap-2 text-xs text-ink">
            <input type="checkbox" className="accent-ink" checked={newSportHasTeammate} onChange={e => setNewSportHasTeammate(e.target.checked)} />
            Teammate(s)
          </label>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Toggle
          label="With trainer?"
          value={withTrainer}
          onPick={setWithTrainer}
          options={[{ value: false, label: 'No' }, { value: true, label: 'Yes' }]}
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Inp
          label="Duration (MM:SS, opt.)"
          type="text"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          placeholder="60:00"
        />
        <Inp
          label="Avg HR (bpm, opt.)"
          type="number"
          value={avgHr}
          onChange={e => setAvgHr(e.target.value)}
          placeholder="130"
          min="0"
          step="1"
        />
      </div>

      <Rating label="Quality" value={quality} onPick={v => setQuality(v as QualityRating | 0)} />

      {hasCompetitor && (
        <>
          <div>
            <FieldLabel>Competitor(s) (opt.)</FieldLabel>
            <ChipListInput
              items={competitorNames}
              onChange={setCompetitorNames}
              suggestions={allCompetitors}
              placeholder="Add competitor"
            />
          </div>
          <Toggle
            label="Result"
            value={result}
            onPick={(r: MatchResult) => setResult(rv => (rv === r ? '' : r))}
            options={(['win', 'loss', 'tie'] as MatchResult[]).map(r => ({ value: r, label: r[0].toUpperCase() + r.slice(1) }))}
          />
        </>
      )}

      {hasTeammate && (
        <div>
          <FieldLabel>Teammate(s) (opt.)</FieldLabel>
          <ChipListInput items={teammates} onChange={setTeammates} suggestions={allTeammates} placeholder="Add teammate" />
        </div>
      )}

      <Inp
        label="Notes (opt.)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="How did it go?"
      />
    </div>
  )
}

// ── DonationForm ──────────────────────────────────────────────────────────────

function DonationForm({ record, onClose }: FormProps<DonationEntry>) {
  const editDonationEntry = useAppStore(s => s.editDonationEntry)
  const [date, setDate] = useState(record.date)
  const [type, setType] = useState(record.type)
  const [notes, setNotes] = useState(record.notes ?? '')

  // No validity guard: a date and a type are always present.
  useSave(onClose, true, () =>
    editDonationEntry(record.id, { date, type, notes }))

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <SelEl
          label="Type"
          value={type}
          onChange={e => setType(e.target.value as DonationEntry['type'])}
          options={DONATION_TYPES.map(t => ({ value: t, label: t }))}
        />
      </div>
      <Inp
        label="Notes (opt.)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Optional notes"
      />
    </div>
  )
}

// ── WaterForm ─────────────────────────────────────────────────────────────────

function WaterForm({ record, onClose }: FormProps<WaterEntry>) {
  const editWaterEntry = useAppStore(s => s.editWaterEntry)
  const [date, setDate] = useState(record.date)
  const [amount, setAmount] = useState(String(record.amountMl))

  useSave(onClose, !!amount, () =>
    editWaterEntry(record.id, { date, amountMl: +amount }))

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Inp
          label="Amount (ml)"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          step="10"
          min="0"
          placeholder="250"
        />
      </div>
    </div>
  )
}

// ── Recovery: delete affordance ─────────────────────────────────────────────

/**
 * Recovery modalities have no history tab, so their edit modals carry their own
 * delete button. It owns the whole delete — the write, the toast and the close.
 */
function DeleteRow({ id, onClose, remove }: { id: string; onClose: () => void; remove: (id: string) => Promise<void> }) {
  const withToast = useAppStore(s => s.withToast)
  const del = () => withToast(async () => {
    await remove(id)
    onClose()
  }, 'Deleted', 'Failed to delete.')

  return (
    <Btn variant="danger" small onClick={del} className="self-start mt-1 inline-flex items-center gap-1.5">
      <Icon name="trash" size={13} />
      Delete entry
    </Btn>
  )
}

// ── SleepForm ─────────────────────────────────────────────────────────────────

function SleepForm({ record, onClose }: FormProps<SleepEntry>) {
  const editSleepEntry = useAppStore(s => s.editSleepEntry)
  const removeSleepEntry = useAppStore(s => s.removeSleepEntry)
  const [date, setDate] = useState(record.date)
  const [hours, setHours] = useState(String(record.hours))
  const [quality, setQuality] = useState<SleepQuality | 0>(record.quality ?? 0)
  const [notes, setNotes] = useState(record.notes ?? '')

  useSave(onClose, !!hours, () =>
    editSleepEntry(record.id, { date, hours: +hours, quality: quality || undefined, notes: notes || undefined }))

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Inp label="Hours" type="number" value={hours} onChange={e => setHours(e.target.value)} step="0.25" min="0" placeholder="7.5" />
      </div>
      {record.score != null && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[3px] bg-hairline">
          <span className={FIELD_LABEL}>Garmin sleep score</span>
          <span className="text-[13px] font-bold text-ink tabular-nums">{record.score}</span>
          {record.scoreQualifier && <span className="text-[11px] text-ink-3">{record.scoreQualifier.toLowerCase()}</span>}
        </div>
      )}
      <Rating label="Quality (opt.)" value={quality} onPick={v => setQuality(v as SleepQuality | 0)} />
      <Inp label="Notes (opt.)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. woke up once" />
      <DeleteRow id={record.id} onClose={onClose} remove={removeSleepEntry} />
    </div>
  )
}

// ── SaunaForm / ColdForm (shared session shape) ─────────────────────────────

function SessionEditForm({
  record, onClose, tempPlaceholder, onEdit, onRemove,
}: FormProps<SaunaEntry | ColdEntry> & {
  tempPlaceholder: string
  onEdit: (id: string, patch: { date: string; duration: number; tempC?: number; notes?: string }) => Promise<void>
  onRemove: (id: string) => Promise<void>
}) {
  const [date, setDate] = useState(record.date)
  const [duration, setDuration] = useState(String(record.duration))
  const [temp, setTemp] = useState(record.tempC != null ? String(record.tempC) : '')
  const [notes, setNotes] = useState(record.notes ?? '')

  useSave(onClose, !!duration, () =>
    onEdit(record.id, { date, duration: +duration, tempC: temp ? +temp : undefined, notes: notes || undefined }))

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2.5">
        <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Inp label="Minutes" type="number" value={duration} onChange={e => setDuration(e.target.value)} step="1" min="0" placeholder="15" />
        <Inp label="°C (opt.)" type="number" value={temp} onChange={e => setTemp(e.target.value)} step="1" placeholder={tempPlaceholder} />
      </div>
      <Inp label="Notes (opt.)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
      <DeleteRow id={record.id} onClose={onClose} remove={onRemove} />
    </div>
  )
}

function SaunaForm({ record, onClose }: FormProps<SaunaEntry>) {
  const editSaunaEntry = useAppStore(s => s.editSaunaEntry)
  const removeSaunaEntry = useAppStore(s => s.removeSaunaEntry)
  return (
    <SessionEditForm
      record={record} onClose={onClose} tempPlaceholder="80"
      onEdit={editSaunaEntry} onRemove={removeSaunaEntry}
    />
  )
}

function ColdForm({ record, onClose }: FormProps<ColdEntry>) {
  const editColdEntry = useAppStore(s => s.editColdEntry)
  const removeColdEntry = useAppStore(s => s.removeColdEntry)
  return (
    <SessionEditForm
      record={record} onClose={onClose} tempPlaceholder="10"
      onEdit={editColdEntry} onRemove={removeColdEntry}
    />
  )
}

// ── Main EditModal ────────────────────────────────────────────────────────────

// Typed as a full Record over the union, so a new EditModalTarget variant is a
// compile error here rather than a modal that opens with a blank header.
const TITLES: Record<EditModalTarget['type'], string> = {
  weight: 'Edit Exercise',
  'weight-superset': 'Edit Superset',
  bodyweight: 'Edit Body Weight',
  cardio: 'Edit Cardio Session',
  mobility: 'Edit Mobility Session',
  sport: 'Edit Sport Session',
  donation: 'Edit Donation',
  water: 'Edit Water Entry',
  sleep: 'Edit Sleep',
  sauna: 'Edit Sauna Session',
  cold: 'Edit Cold Session',
}

/**
 * Global edit modal — mounted once in AppShell, driven by store.editModal.
 * Each tab opens it via openEditModal(target).
 *
 * The branches stay a chain rather than a `Record<type, Component>` lookup: with
 * the save slot carrying the wiring, each branch is one line, and a lookup would
 * cost a cast (TypeScript cannot follow a discriminant through an index) for an
 * exhaustiveness check TITLES above already performs.
 */
export function EditModal() {
  const editModal = useAppStore(s => s.editModal)
  const closeEditModal = useAppStore(s => s.closeEditModal)

  return (
    <Modal
      open={!!editModal}
      onClose={closeEditModal}
      title={editModal ? TITLES[editModal.type] : ''}
      footer={<Footer onCancel={closeEditModal} onSave={() => saveSlot.run()} />}
    >
      {editModal?.type === 'weight' && <WeightForm record={editModal.record} onClose={closeEditModal} />}
      {editModal?.type === 'weight-superset' && <SupersetForm record={editModal.record} onClose={closeEditModal} />}
      {editModal?.type === 'bodyweight' && <BodyweightForm record={editModal.record} onClose={closeEditModal} />}
      {editModal?.type === 'cardio' && <CardioForm record={editModal.record} onClose={closeEditModal} />}
      {editModal?.type === 'mobility' && <MobilityForm record={editModal.record} onClose={closeEditModal} />}
      {editModal?.type === 'sport' && <SportForm record={editModal.record} onClose={closeEditModal} />}
      {editModal?.type === 'donation' && <DonationForm record={editModal.record} onClose={closeEditModal} />}
      {editModal?.type === 'water' && <WaterForm record={editModal.record} onClose={closeEditModal} />}
      {editModal?.type === 'sleep' && <SleepForm record={editModal.record} onClose={closeEditModal} />}
      {editModal?.type === 'sauna' && <SaunaForm record={editModal.record} onClose={closeEditModal} />}
      {editModal?.type === 'cold' && <ColdForm record={editModal.record} onClose={closeEditModal} />}
    </Modal>
  )
}
