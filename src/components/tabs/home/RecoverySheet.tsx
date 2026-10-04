import { useAppStore } from '../../../store/app'
import { usePrefs } from '../../../store/prefs'
import { startOfWeek, today } from '../../../lib/utils'
import { Fragment, useState } from 'react'
import type { SystemicReadiness } from '../../../lib/fusedRead'
import type { CheckInAnswers } from '../../../types'
import { METHOD_NAME, CHECK_IN_ITEMS } from '../../../constants/readiness'
import { BottomSheet, SheetHeader, CaptureLabel, Chip, Recent, StepperCapture } from './BottomSheet'

// The systemic-recovery captures (SAUNA / COLD / SLEEP) as one T2 sheet
// (roadmap 018 unit 4). They used to live on RecoveryCard, which the fused
// Home replaced; the gate card is what raises the question "can I push?", so
// the control appears there (P1) and recovery stays a dimension of the read
// rather than a destination (P5).

interface RecoverySheetProps {
  sys: SystemicReadiness
  onClose: () => void
  /** Opens Profile on its readiness method card (RFC 0092). */
  onOpenProfile: () => void
}

const BAND_WORD = { low: 'Low', moderate: 'Moderate', ok: 'OK' } as const

/** The reading's value against the person's normal, in the method's unit. */
function readingLine(sys: SystemicReadiness): string | null {
  if (!sys.method || sys.recent === null || sys.normal === null) return null
  const { low, high } = sys.normal
  if (sys.method === 'check_in') return `Check-in today ${sys.recent} of 25 · your usual ${low}–${high}`
  const what = sys.method === 'morning_hrv' ? 'Morning HRV' : 'HRV'
  return `${what} this week ${sys.recent} ms · your normal ${low}–${high} ms`
}

/** Why there is no reading, when there is none. */
function missingLine(sys: SystemicReadiness): string {
  if (!sys.chosen) return 'No readiness yet. Pick how it is measured in Profile.'
  if (sys.chosen === 'overnight_hrv' && !sys.connected) return 'No watch or ring is connected, so there is no overnight HRV.'
  if (sys.awaitingInput) {
    return sys.chosen === 'check_in' ? "Answer today's check-in below." : "Type this morning's reading below."
  }
  if (sys.progress) {
    return `Building your baseline: ${sys.progress.have} of ${sys.progress.need} readings. No verdict until then.`
  }
  return 'No reading today.'
}

/** Where today's readiness came from — one tap from the card (0085, 0092). */
function ReadinessSource({ sys, onOpenProfile }: { sys: SystemicReadiness; onOpenProfile: () => void }) {
  const line = readingLine(sys)
  const fellBack = sys.method && sys.chosen && sys.method !== sys.chosen
  return (
    <div className="mb-3 pb-2.5 border-b border-line text-[12px] leading-[1.45]">
      {sys.method && sys.band && line ? (
        <>
          <div><b>{BAND_WORD[sys.band]}</b> · from {METHOD_NAME[sys.method]}</div>
          <div className="text-ink-2">{line}</div>
          {fellBack && sys.chosen && (
            <div className="text-ink-2">No {METHOD_NAME[sys.chosen]} reading today, so this comes from the next method down.</div>
          )}
        </>
      ) : (
        <div className="text-ink-2">{missingLine(sys)}</div>
      )}
      {sys.notes.restingHrAbove !== null && (
        <div className="text-ink-2">Resting heart rate {sys.notes.restingHrAbove} bpm above your normal. A note only; it does not change the verdict.</div>
      )}
      {sys.notes.shortNight !== null && (
        <div className="text-ink-2">Short night: {sys.notes.shortNight.toFixed(1)} h. A note only; it does not change the verdict.</div>
      )}
      {sys.method === 'check_in' && (
        <div className="text-ink-3 mt-0.5">Less certain than HRV. A 1-minute morning HRV reading would read your body directly.</div>
      )}
      {sys.method === 'morning_hrv' && (
        <div className="text-ink-3 mt-0.5">A watch or ring would read HRV overnight, with nothing to type.</div>
      )}
      <button onClick={onOpenProfile} className="mt-1 text-[11px] text-signal font-semibold cursor-pointer">
        Change method in Profile →
      </button>
    </div>
  )
}

/** This morning's HRV, typed (0092). Saved on Log; a second save replaces it. */
function MorningHrvCapture() {
  const inputs = useAppStore(s => s.readinessInputs)
  const logMorningHrv = useAppStore(s => s.logMorningHrv)
  const withToast = useAppStore(s => s.withToast)
  const todays = inputs.find(e => e.date === today())?.morningHrv
  const [draft, setDraft] = useState('')
  const value = Number.parseFloat(draft)
  const valid = Number.isFinite(value) && value > 0 && value < 400
  return (
    <div className="mb-3 pb-2.5 border-b border-line">
      <CaptureLabel label="MORNING HRV" meta={todays != null ? `today ${todays} ms` : 'not typed today'} />
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          aria-label="Morning HRV in ms"
          placeholder="rMSSD"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="w-24 border border-ink rounded-[3px] px-2 py-1.5 text-[16px] font-bold"
        />
        <span className="text-[11px] text-ink-2">ms</span>
        <span className="grow" />
        {valid && (
          <Chip solid onClick={() => withToast(async () => { await logMorningHrv(today(), value); setDraft('') }, 'Morning HRV saved.')}>
            Log {value} ms
          </Chip>
        )}
      </div>
      <div className="text-[9px] text-ink-3 mt-1.5 text-pretty">
        From a phone-camera app or chest strap, lying down right after waking, the same way each day.
      </div>
    </div>
  )
}

/** Today's check-in (0092): five items, 1–5, saved once all five are answered. */
function CheckInCapture() {
  const inputs = useAppStore(s => s.readinessInputs)
  const logCheckIn = useAppStore(s => s.logCheckIn)
  const withToast = useAppStore(s => s.withToast)
  const saved = inputs.find(e => e.date === today())?.checkIn
  const [answers, setAnswers] = useState<Partial<CheckInAnswers>>(() => saved ?? {})
  const pick = (key: keyof CheckInAnswers, v: number) => {
    const next = { ...answers, [key]: v }
    setAnswers(next)
    if (CHECK_IN_ITEMS.every(i => next[i.key] != null)) {
      withToast(() => logCheckIn(today(), next as CheckInAnswers), 'Check-in saved.')
    }
  }
  return (
    <div className="mb-3 pb-2.5 border-b border-line">
      <CaptureLabel label="CHECK-IN" meta={saved ? 'saved today' : 'saved on the fifth answer'} />
      <div className="grid grid-cols-[64px_1fr] gap-x-2 gap-y-1.5 items-center">
        {CHECK_IN_ITEMS.map(item => (
          <Fragment key={item.key}>
            <span className="text-[11px] font-semibold">{item.label}</span>
            <div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(v => (
                  <button
                    key={v}
                    onClick={() => pick(item.key, v)}
                    aria-label={`${item.label} ${v} of 5`}
                    aria-pressed={answers[item.key] === v}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-[3px] border cursor-pointer ${
                      answers[item.key] === v ? 'bg-ink text-white border-ink' : 'bg-white text-ink-2 border-line'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-ink-3 mt-0.5">
                <span>{item.low}</span><span>{item.high}</span>
              </div>
            </div>
          </Fragment>
        ))}
      </div>
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
      {sys.chosen === 'morning_hrv' && <MorningHrvCapture />}
      {sys.chosen === 'check_in' && <CheckInCapture />}

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
