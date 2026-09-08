import { useAppStore } from '../../../store/app'
import { usePrefs } from '../../../store/prefs'
import { startOfWeek, today } from '../../../lib/utils'
import { BottomSheet, SheetHeader, CaptureLabel, Chip, Recent, StepperCapture } from './BottomSheet'

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
      <SheetHeader eyebrow="RECOVERY INPUTS" onClose={onClose} className="mb-2" />

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

      <StepperCapture
        className="border-t border-line pt-2.5"
        label="SLEEP"
        // Store keeps sleep newest-first; prefill from the last night on record.
        meta={sleep[0] ? `last on record ${sleep[0].date}` : 'nothing on record'}
        initial={sleep[0]?.hours ?? 7.5}
        unit="h"
        steps={[-1, -0.5, +0.5, +1]}
        logLabel={h => `Log ${h} h — today`}
        onLog={hours => addSleepEntry({ date: today(), hours })}
        recent={
          <Recent
            entries={sleep.slice(0, 4)}
            label={e => `${e.date.slice(5)} · ${e.hours}h${e.score != null ? `·${e.score}` : ''}`}
            onEdit={e => openEditModal({ type: 'sleep', record: e })}
          />
        }
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
      <CaptureLabel
        label={label}
        meta={entries.length > 0 ? `${entries.length}× this week · ${total} min` : 'nothing this week'}
      />
      <div className="flex gap-1.5 flex-wrap">
        {minutes.map(min => (
          <Chip key={min} onClick={() => onLog(min)}>+ {min} min</Chip>
        ))}
      </div>
      <Recent entries={entries} label={e => `${e.date.slice(5)} · ${e.duration}m`} onEdit={onEdit} />
    </div>
  )
}
