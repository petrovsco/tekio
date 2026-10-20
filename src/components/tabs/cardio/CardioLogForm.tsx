import { useState } from 'react'
import { useAppStore } from '../../../store/app'
import { today, CARDIO_TYPES } from '@tekio/core'
import { parseDurationMins, calcPace, formatDurationMins } from '../../../lib/utils'
import { CARDIO_FORMATS } from '../../../constants/app'
import { Inp, SelEl } from '../../ui/Input'
import { Toggle } from '../../ui/Fields'
import { Btn } from '../../ui/Button'
import { useHrMax } from '../../../hooks/useHrMax'
import type { CardioType, CardioFormat, PlannedSession } from '../../../types'

/** A planned type the select knows, or the default: an agent may have written
 *  a type the app does not list. */
const knownType = (name?: string): CardioType =>
  CARDIO_TYPES.find(t => t.toLowerCase() === name?.trim().toLowerCase()) ?? 'Running'

/**
 * `plan` fills the form once, when it mounts (the tab keys the form by the
 * plan); `onLogged` hears the saved entry's id, so the plan can be ticked
 * (RFC 0104). The numbers typed may differ from the plan's targets.
 */
export function CardioLogForm({ plan, onLogged }: {
  plan?: PlannedSession | null
  onLogged?: (entryId: string) => Promise<void>
} = {}) {
  const { hrMax } = useHrMax()
  const [type, setType] = useState<CardioType>(knownType(plan?.name))
  const [date, setDate] = useState(today())
  const [duration, setDuration] = useState(plan?.duration ? formatDurationMins(plan.duration) : '')
  const [distance, setDistance] = useState(plan?.distance ? String(plan.distance) : '')
  const [avgHr, setAvgHr] = useState('')
  const [format, setFormat] = useState<CardioFormat | ''>(plan?.format ?? '')
  const [bout, setBout] = useState(plan?.boutSeconds ? formatDurationMins(plan.boutSeconds / 60) : '')
  const [notes, setNotes] = useState(plan?.notes ?? '')
  const addCardioEntry = useAppStore(s => s.addCardioEntry)
  const editCardioEntry = useAppStore(s => s.editCardioEntry)
  const cardio = useAppStore(s => s.cardio)
  const withToast = useAppStore(s => s.withToast)

  const durationMins = parseDurationMins(duration)
  const distKm = distance ? +distance : 0
  const livePace = calcPace(durationMins, distKm)
  // Same MM:SS convention as Duration, kept in seconds: "4:00" → 240, "0:45" → 45.
  const boutSeconds = format === 'intervals' ? Math.round(parseDurationMins(bout) * 60) || undefined : undefined

  const add = async () => {
    if (!durationMins) return
    const typed = {
      date, type, duration: durationMins,
      distance: distKm || undefined,
      avgHr: avgHr ? +avgHr : undefined,
      format: format || undefined,
      boutSeconds,
      notes: notes || undefined,
    }
    // The watch already synced this session: what is typed merges into its
    // row rather than standing beside it. The sync does the same the other
    // way round (scripts/garmin-sync, "claims"), and a typed value wins
    // there as here; a field left empty keeps what the watch measured.
    const synced = cardio.find(e => e.source === 'garmin' && e.date === date && e.type === type)
    await withToast(async () => {
      let id: string
      if (synced) {
        const { id: syncedId, ...rest } = synced
        await editCardioEntry(syncedId, {
          ...rest,
          ...typed,
          distance: typed.distance ?? rest.distance,
          avgHr: typed.avgHr ?? rest.avgHr,
          format: typed.format ?? rest.format,
          boutSeconds: typed.boutSeconds ?? rest.boutSeconds,
          notes: typed.notes ?? rest.notes,
        })
        id = syncedId
      } else {
        id = (await addCardioEntry(typed)).id
      }
      await onLogged?.(id)
      setDuration(''); setDistance(''); setAvgHr(''); setFormat(''); setBout(''); setNotes('')
    }, synced ? 'Merged with the synced session' : 'Session logged!')
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <SelEl
          label="Type"
          value={type}
          onChange={e => setType(e.target.value as CardioType)}
          options={CARDIO_TYPES.map(t => ({ value: t, label: t }))}
        />
        <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Inp
          label="Duration (H:MM:SS)"
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
          />
          {/* A derived read-back, not an urgency — so it is stated in ink, not
              the accent (design-system §1). */}
          {livePace && (
            <p className="text-[11px] text-ink-2 mt-1 tabular-nums">{livePace}</p>
          )}
        </div>
        <div>
          <Inp
            label="Avg HR (bpm, opt.)"
            type="number"
            value={avgHr}
            onChange={e => setAvgHr(e.target.value)}
            placeholder="145"
            min="0"
            step="1"
          />
          {/* A typed HR is read as a share of the profile HRmax; without one
              it is not read, and the fix lives on the Profile — said here,
              where the question came up (P1, roadmap 060). An intervals row's
              typed HR is not read either way, so no hint there. */}
          {avgHr && hrMax == null && format !== 'intervals' && (
            <p className="text-[11px] text-ink-2 mt-1">
              Not read yet — add your birth date in Profile to read it against your max heart rate.
            </p>
          )}
        </div>
        {/* Tapping the chosen format again clears it: "not stated" is a real
            answer, and most sessions are neither in particular. */}
        <Toggle
          label="Format (opt.)"
          options={CARDIO_FORMATS}
          value={format}
          onPick={v => setFormat(f => (f === v ? '' : v))}
        />
        {/* The work-bout length is only a question on an intervals session, so
            the field appears with that answer (P1). It decides anaerobic
            capacity (≤ 2 min) vs VO₂max — roadmap 005. */}
        {format === 'intervals' && (
          <Inp
            label="Bout (MM:SS, opt.)"
            type="text"
            value={bout}
            onChange={e => setBout(e.target.value)}
            placeholder="4:00"
          />
        )}
        <div className="col-span-2">
          <Inp label="Notes (opt.)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Easy zone 2" />
        </div>
      </div>
      <Btn onClick={add} className="w-full">Log session</Btn>
    </>
  )
}
