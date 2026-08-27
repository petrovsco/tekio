import { useState } from 'react'
import { useAppStore } from '../../../store/app'
import { today, parseDurationMins, calcPace } from '../../../lib/utils'
import { CARDIO_TYPES } from '../../../constants/app'
import { Inp } from '../../ui/Input'
import { Btn } from '../../ui/Button'
import type { CardioType } from '../../../types'

export function CardioLogForm() {
  const [type, setType] = useState<CardioType>('Running')
  const [date, setDate] = useState(today())
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')
  const [avgHr, setAvgHr] = useState('')
  const [notes, setNotes] = useState('')
  const { addCardioEntry, setToast } = useAppStore()

  const durationMins = parseDurationMins(duration)
  const distKm = distance ? +distance : 0
  const livePace = calcPace(durationMins, distKm)

  const add = async () => {
    if (!durationMins) return
    try {
      await addCardioEntry({
        date, type, duration: durationMins,
        distance: distKm || undefined,
        avgHr: avgHr ? +avgHr : undefined,
        notes: notes || undefined,
      })
      setDuration(''); setDistance(''); setAvgHr(''); setNotes('')
      setToast('✅ Session logged!')
    } catch {
      setToast('❌ Failed to save.')
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div>
          <p className="text-xs text-muted font-medium mb-1">Type</p>
          <select
            value={type}
            onChange={e => setType(e.target.value as CardioType)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            {CARDIO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <Inp label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <div>
          <Inp
            label="Duration (MM:SS)"
            type="text"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="30:00"
          />
        </div>
        <div>
          <Inp
            label="Distance (km, opt.)"
            type="number"
            value={distance}
            onChange={e => setDistance(e.target.value)}
            placeholder="5.0"
            step="0.01"
          />
          {livePace && (
            <p className="text-xs text-accent font-medium mt-1">⚡ {livePace}</p>
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
        </div>
        <div className="col-span-2">
          <Inp label="Notes (opt.)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Easy zone 2" />
        </div>
      </div>
      <Btn onClick={add} className="w-full">Add Session</Btn>
    </>
  )
}
