import { useState } from 'react'
import { useAppStore } from '../../../store/app'
import { usePrefs } from '../../../store/prefs'
import { startOfWeek, today } from '../../../lib/utils'
import { BottomSheet, SheetClose, Chip } from './BottomSheet'
import type { SleepEntry } from '../../../types'

// The systemic-recovery captures (SAUNA / COLD / SLEEP) as one T2 sheet
// (roadmap 018 unit 4). They used to live on RecoveryCard, which the fused
// Home replaced; the gate card is what raises the question "can I push?", so
// the control appears there (P1) and recovery stays a dimension of the read
// rather than a destination (P5).

interface RecoverySheetProps {
  onClose: () => void
}

export default function RecoverySheet({ onClose }: RecoverySheetProps) {
  const {
    sauna, cold, sleep,
    addSaunaEntry, addColdEntry, addSleepEntry, openEditModal,
  } = useAppStore()
  const { weekStartDay } = usePrefs()
  const weekStart = startOfWeek(today(), weekStartDay)
  const inWeek = (d: string) => d >= weekStart && d <= today()

  const saunaWk = sauna.filter(e => inWeek(e.date))
  const coldWk = cold.filter(e => inWeek(e.date))

  return (
    <BottomSheet onClose={onClose} label="RECOVERY INPUTS">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[9px] font-bold tracking-[0.14em] text-ink-3">RECOVERY INPUTS</span>
        <span className="grow" />
        <SheetClose onClose={onClose} />
      </div>

      <SessionRow
        label="SAUNA"
        minutes={[10, 15, 20]}
        entries={saunaWk}
        onLog={min => addSaunaEntry({ date: today(), duration: min, tempC: 80 })}
        onEdit={e => openEditModal({ type: 'sauna', record: e })}
      />

      <SessionRow
        label="COLD"
        minutes={[2, 3, 5]}
        entries={coldWk}
        onLog={min => addColdEntry({ date: today(), duration: min, tempC: 10 })}
        onEdit={e => openEditModal({ type: 'cold', record: e })}
      />

      <SleepRow
        sleep={sleep}
        onLog={hours => addSleepEntry({ date: today(), hours })}
        onEdit={e => openEditModal({ type: 'sleep', record: e })}
      />

      <div className="text-[9px] text-ink-3 mt-3 text-pretty">
        Sauna and cold are systemic inputs — they never move the map. Sleep
        normally arrives from Garmin; log it here only for a night it missed.
      </div>
    </BottomSheet>
  )
}

/** One capture block: chips that log on tap, then this week's entries. */
function SessionRow<T extends { id: string; date: string; duration: number }>({
  label, minutes, entries, onLog, onEdit,
}: {
  label: string
  minutes: number[]
  entries: T[]
  onLog: (min: number) => void | Promise<void>
  onEdit: (e: T) => void
}) {
  const total = entries.reduce((s, e) => s + e.duration, 0)
  return (
    <div className="border-t border-line pt-2.5 mb-2.5">
      <div className="flex items-baseline gap-1.5 mb-1.5">
        <span className="text-[10px] font-bold tracking-[0.1em]">{label}</span>
        <span className="text-[9px] text-ink-3">
          {entries.length > 0 ? `${entries.length}× this week · ${total} min` : 'nothing this week'}
        </span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {minutes.map(min => (
          <Chip key={min} onClick={() => onLog(min)}>+ {min} min</Chip>
        ))}
      </div>
      <Recent entries={entries} label={e => `${e.date.slice(5)} · ${e.duration}m`} onEdit={onEdit} />
    </div>
  )
}

const roundHalf = (v: number): number => Math.round(v * 2) / 2

function SleepRow({
  sleep, onLog, onEdit,
}: {
  sleep: SleepEntry[]
  onLog: (hours: number) => void | Promise<void>
  onEdit: (e: SleepEntry) => void
}) {
  // Store keeps sleep newest-first; prefill from the last night on record.
  const [hours, setHours] = useState(() => sleep[0]?.hours ?? 7.5)
  const recent = sleep.slice(0, 4)

  return (
    <div className="border-t border-line pt-2.5">
      <div className="flex items-baseline gap-1.5 mb-1.5">
        <span className="text-[10px] font-bold tracking-[0.1em]">SLEEP</span>
        <span className="text-[9px] text-ink-3">
          {sleep[0] ? `last on record ${sleep[0].date}` : 'nothing on record'}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[25px] font-bold tracking-[-0.02em]">{hours.toFixed(1)}</span>
        <span className="text-[11px] text-ink-2">h</span>
      </div>
      <div className="flex gap-1.5 mt-2">
        {[-1, -0.5, +0.5, +1].map(step => (
          <Chip key={step} onClick={() => setHours(v => Math.max(0, roundHalf(v + step)))}>
            {step > 0 ? `+ ${step}` : `− ${Math.abs(step)}`}
          </Chip>
        ))}
      </div>
      <div className="mt-2.5">
        <Chip solid onClick={() => onLog(hours)}>Log {hours.toFixed(1)} h — today</Chip>
      </div>
      <Recent
        entries={recent}
        label={e => `${e.date.slice(5)} · ${e.hours}h${e.score != null ? `·${e.score}` : ''}`}
        onEdit={onEdit}
      />
    </div>
  )
}

/** Recent entries, tap to edit — the fold carries the correction path with it,
 *  not just the capture (the old tab was where a mistyped entry got fixed). */
function Recent<T extends { id: string }>({
  entries, label, onEdit,
}: {
  entries: T[]
  label: (e: T) => string
  onEdit: (e: T) => void
}) {
  if (entries.length === 0) return null
  return (
    <div className="flex gap-1.5 flex-wrap mt-2">
      {entries.map(e => (
        <button
          key={e.id}
          onClick={() => onEdit(e)}
          className="text-[9px] text-ink-2 border border-line rounded-[3px] px-1.5 py-[3px] cursor-pointer"
        >
          {label(e)}
        </button>
      ))}
    </div>
  )
}
