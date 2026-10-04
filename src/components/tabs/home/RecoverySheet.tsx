import { useAppStore } from '../../../store/app'
import { usePrefs } from '../../../store/prefs'
import { startOfWeek, today } from '../../../lib/utils'
import { HRV_BAND_Z } from '../../../constants/app'
import type { SystemicReadiness } from '../../../lib/fusedRead'
import { BottomSheet, SheetHeader, CaptureLabel, Chip, Recent, StepperCapture } from './BottomSheet'

// The systemic-recovery captures (SAUNA / COLD / SLEEP) as one T2 sheet
// (roadmap 018 unit 4). They used to live on RecoveryCard, which the fused
// Home replaced; the gate card is what raises the question "can I push?", so
// the control appears there (P1) and recovery stays a dimension of the read
// rather than a destination (P5).

interface RecoverySheetProps {
  sys: SystemicReadiness
  onClose: () => void
  /** Where the readiness method is chosen. Opens Profile; RFC 0092 adds the
   * method card there. */
  onOpenProfile: () => void
}

const BAND_WORD = { low: 'Low', moderate: 'Moderate', ok: 'OK' } as const
const METHOD_NAME = { overnight_hrv: 'Overnight HRV, synced from your watch' } as const

/** How far this week sits from the person's own normal, in words. */
function distanceWords(z: number): string {
  const swings = Math.abs(z).toFixed(1)
  if (Math.abs(z) < 0.05) return 'right at your own normal'
  return `${swings} of your usual night-to-night swing (1 SD) ${z < 0 ? 'under' : 'over'} your own normal`
}

/** Where today's readiness came from — one tap from the card (0085). */
function ReadinessSource({ sys, onOpenProfile }: { sys: SystemicReadiness; onOpenProfile: () => void }) {
  const rule = `OK down to ${Math.abs(HRV_BAND_Z.moderate)} of a swing under (or anywhere above), Moderate down to ${Math.abs(HRV_BAND_Z.low)} swing under, Low beyond that.`
  return (
    <div className="mb-3 pb-2.5 border-b border-line">
      {sys.method && sys.z !== null ? (
        <p className="text-[11px] leading-[1.4] text-ink-2 text-pretty">
          <b className="text-ink">{sys.band ? BAND_WORD[sys.band] : ''}.</b> From{' '}
          <b className="text-ink">{METHOD_NAME[sys.method]}</b>. Your last 7 nights sit{' '}
          {distanceWords(sys.z)} (the 60 nights before them). {rule}
        </p>
      ) : (
        <p className="text-[11px] leading-[1.4] text-ink-2 text-pretty">
          <b className="text-ink">No reading yet.</b> Readiness reads overnight HRV against your own normal, and needs 14
          nights of it plus last night's before it can say anything.
        </p>
      )}
      <button onClick={onOpenProfile} className="mt-1.5 text-[11px] text-signal font-semibold cursor-pointer">
        Readiness method · Profile →
      </button>
    </div>
  )
}

export default function RecoverySheet({ sys, onClose, onOpenProfile }: RecoverySheetProps) {
  const sauna = useAppStore(s => s.sauna)
  const cold = useAppStore(s => s.cold)
  const sleep = useAppStore(s => s.sleep)
  const addSaunaEntry = useAppStore(s => s.addSaunaEntry)
  const addColdEntry = useAppStore(s => s.addColdEntry)
  const addSleepEntry = useAppStore(s => s.addSleepEntry)
  const openEditModal = useAppStore(s => s.openEditModal)
  const { weekStartDay } = usePrefs()
  const weekStart = startOfWeek(today(), weekStartDay)
  const inWeek = (d: string) => d >= weekStart && d <= today()

  const saunaWk = sauna.filter(e => inWeek(e.date))
  const coldWk = cold.filter(e => inWeek(e.date))

  return (
    <BottomSheet onClose={onClose} label="READINESS AND RECOVERY INPUTS">
      <SheetHeader eyebrow="READINESS" onClose={onClose} className="mb-2" />

      <ReadinessSource sys={sys} onOpenProfile={onOpenProfile} />

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
