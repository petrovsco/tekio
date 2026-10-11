import { useState } from 'react'
import { useAppStore } from '../../../store/app'
import { today, uniqSorted, parseDurationMins, formatDurationMins } from '../../../lib/utils'
import { CARDIO_TYPES, CARDIO_FORMATS } from '../../../constants/app'
import { BottomSheet } from '../home/BottomSheet'
import { Inp, SelEl, FIELD_LABEL } from '../../ui/Input'
import { Btn } from '../../ui/Button'
import { Toggle } from '../../ui/Fields'
import { SmartInput } from '../../ui/SmartInput'
import { MICRO_LABEL } from '../../ui/Badges'
import type { CardioFormat, PlannedKind, PlannedSession } from '../../../types'

const KIND_LABEL: Record<PlannedKind, string> = { cardio: 'Cardio', sport: 'Sport', mobility: 'Mobility' }
const NOTES_HINT: Record<PlannedKind, string> = { cardio: 'e.g. Easy zone 2', sport: 'e.g. 16:00 game', mobility: 'e.g. Easy, hips first' }

/** A stretch row as typed: minutes stay a string until saved. */
type StretchStr = { name: string; duration: string }

/** "40" → 40; empty or nonsense → undefined, which the plan leaves out. */
const minutes = (raw: string): number | undefined => {
  const n = Number(raw)
  return raw.trim() !== '' && Number.isFinite(n) && n > 0 ? n : undefined
}

/**
 * Write or rewrite a cardio, sport or mobility plan (RFC 0104), in a sheet over
 * its tab so the log form underneath stays a log form. Saving logs nothing.
 * The day is today or later, as on Weights.
 */
export function SessionPlanSheet({ plan, kinds, defaultKind = kinds[0], onClose }: {
  /** The plan to edit; absent writes a new one. */
  plan?: PlannedSession
  /** What this tab plans. */
  kinds: PlannedKind[]
  /** The kind a new plan starts as. */
  defaultKind?: PlannedKind
  onClose: () => void
}) {
  const addSessionPlan = useAppStore(s => s.addSessionPlan)
  const editSessionPlan = useAppStore(s => s.editSessionPlan)
  const withToast = useAppStore(s => s.withToast)
  const sports = useAppStore(s => s.sports)
  const mobility = useAppStore(s => s.mobility)

  const [kind, setKind] = useState<PlannedKind>(plan?.kind ?? defaultKind)
  const [date, setDate] = useState(plan?.date ?? today())
  const [cardioType, setCardioType] = useState(plan?.kind === 'cardio' ? plan.name : CARDIO_TYPES[0])
  const [sport, setSport] = useState(plan?.kind === 'sport' ? plan.name : '')
  const [duration, setDuration] = useState(plan?.duration ? String(plan.duration) : '')
  const [distance, setDistance] = useState(plan?.distance ? String(plan.distance) : '')
  const [format, setFormat] = useState<CardioFormat | ''>(plan?.format ?? '')
  const [bout, setBout] = useState(plan?.boutSeconds ? formatDurationMins(plan.boutSeconds / 60) : '')
  const [stretches, setStretches] = useState<StretchStr[]>(
    plan?.stretches?.length
      ? plan.stretches.map(s => ({ name: s.name, duration: s.duration ? String(s.duration) : '' }))
      : [{ name: '', duration: '' }],
  )
  const [notes, setNotes] = useState(plan?.notes ?? '')

  const named = stretches.filter(s => s.name.trim())
  const valid = date >= today() && (
    kind === 'cardio' ? true
    : kind === 'sport' ? sport.trim() !== ''
    : named.length > 0
  )

  const save = async () => {
    if (!valid) return
    const boutSeconds = format === 'intervals' ? Math.round(parseDurationMins(bout) * 60) || undefined : undefined
    const patch = {
      kind,
      date,
      name: kind === 'cardio' ? cardioType : kind === 'sport' ? sport.trim() : '',
      ...(kind !== 'mobility' ? { duration: minutes(duration) } : {}),
      ...(kind === 'cardio' ? { distance: minutes(distance), format: format || undefined, boutSeconds } : {}),
      ...(kind === 'mobility'
        ? { stretches: named.map(s => ({ name: s.name.trim(), duration: minutes(s.duration) ?? 0 })) }
        : {}),
      notes: notes.trim() || undefined,
    }
    const ok = await withToast(
      () => (plan ? editSessionPlan(plan.id, patch) : addSessionPlan(patch)),
      plan ? 'Plan updated' : 'Planned',
    )
    if (ok) onClose()
  }

  const setStretch = (i: number, f: keyof StretchStr, v: string) =>
    setStretches(p => p.map((s, j) => (j === i ? { ...s, [f]: v } : s)))

  return (
    <BottomSheet
      onClose={onClose}
      label={plan ? 'Edit plan' : 'Add to plan'}
      footer={
        <div className="flex gap-2">
          <Btn onClick={save} disabled={!valid} className="flex-1">Save plan</Btn>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        </div>
      }
    >
      <div className="flex flex-col gap-2.5">
        <div>
          <div className="text-[10px] font-bold tracking-[0.1em]">{plan ? 'EDIT PLAN' : 'ADD TO PLAN'}</div>
          <p className="text-[11px] text-ink-2 mt-0.5">
            {plan ? 'Changes the plan, not your log.' : 'For today or a later day.'} Nothing counts until you log it.
          </p>
        </div>
        {/* The kind is picked once: an edit keeps it, because each kind keeps
            its own targets. */}
        {!plan && kinds.length > 1 && (
          <Toggle options={kinds.map(k => ({ value: k, label: KIND_LABEL[k] }))} value={kind} onPick={setKind} />
        )}

        {kind === 'cardio' && (
          <div className="grid grid-cols-2 gap-2.5">
            <SelEl
              label="Type"
              value={cardioType}
              onChange={e => setCardioType(e.target.value)}
              options={CARDIO_TYPES.map(t => ({ value: t, label: t }))}
            />
            <Inp label="Date" type="date" min={today()} value={date} onChange={e => setDate(e.target.value)} />
            <Inp label="Minutes (opt.)" type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} placeholder="40" />
            <Inp label="Distance (km, opt.)" type="number" step="0.01" value={distance} onChange={e => setDistance(e.target.value)} placeholder="6" />
            <div className="col-span-2">
              <Toggle
                label="Format (opt.)"
                options={CARDIO_FORMATS}
                value={format}
                onPick={v => setFormat(f => (f === v ? '' : v))}
              />
            </div>
            {format === 'intervals' && (
              <Inp label="Bout (MM:SS, opt.)" type="text" value={bout} onChange={e => setBout(e.target.value)} placeholder="4:00" />
            )}
          </div>
        )}

        {kind === 'sport' && (
          <>
            <div className="flex flex-col gap-1">
              <label className={FIELD_LABEL}>Sport</label>
              <SmartInput
                value={sport}
                onChange={setSport}
                onPick={setSport}
                suggestions={uniqSorted(sports.map(d => d.sport))}
                placeholder="e.g. Volleyball"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Inp label="Date" type="date" min={today()} value={date} onChange={e => setDate(e.target.value)} />
              <Inp label="Minutes (opt.)" type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} placeholder="90" />
            </div>
          </>
        )}

        {kind === 'mobility' && (
          <>
            <Inp label="Date" type="date" min={today()} value={date} onChange={e => setDate(e.target.value)} />
            <div>
              <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: 'minmax(0,1fr) 64px' }}>
                <p className={MICRO_LABEL}>Stretch</p>
                <p className={MICRO_LABEL}>Min</p>
              </div>
              {stretches.map((s, i) => (
                <div key={i} className="grid gap-1.5 items-center mb-1.5" style={{ gridTemplateColumns: 'minmax(0,1fr) 64px' }}>
                  <SmartInput
                    value={s.name}
                    onChange={v => setStretch(i, 'name', v)}
                    onPick={v => setStretch(i, 'name', v)}
                    suggestions={uniqSorted(mobility.flatMap(m => m.exercises.map(e => e.name)))}
                    placeholder={`Stretch ${i + 1}`}
                  />
                  <Inp type="number" min="1" value={s.duration} onChange={e => setStretch(i, 'duration', e.target.value)} placeholder="3" />
                </div>
              ))}
              {stretches.length < 8 && (
                <button
                  onClick={() => setStretches(p => [...p, { name: '', duration: '' }])}
                  className="text-[11px] font-semibold text-ink underline underline-offset-2 cursor-pointer"
                >
                  + Add stretch
                </button>
              )}
            </div>
          </>
        )}

        <Inp label="Notes (opt.)" value={notes} onChange={e => setNotes(e.target.value)} placeholder={NOTES_HINT[kind]} />
      </div>
    </BottomSheet>
  )
}
