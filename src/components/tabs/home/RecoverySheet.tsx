import { useAppStore } from '../../../store/app'
import { usePrefs } from '../../../store/prefs'
import { startOfWeek, today, fmtDate } from '../../../lib/utils'
import { Fragment, useEffect, useState, type ReactNode } from 'react'
import type { SystemicReadiness } from '../../../lib/fusedRead'
import type { CheckInAnswers, SleepEntry } from '../../../types'
import { METHOD_NAME, CHECK_IN_ITEMS } from '../../../constants/readiness'
import { BottomSheet, SheetHeader, CaptureLabel } from './BottomSheet'
import { Icon } from '../../ui/Icon'

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
      <button onClick={onOpenProfile} className="min-h-[44px] -mb-2.5 text-[12px] text-signal font-semibold cursor-pointer">
        Change method in Profile →
      </button>
    </div>
  )
}

/** This morning's HRV, typed (0092). Saved on Log; a second save replaces it. */
function MorningHrvCapture({ onSaved }: { onSaved: () => void }) {
  const inputs = useAppStore(s => s.readinessInputs)
  const logMorningHrv = useAppStore(s => s.logMorningHrv)
  const withToast = useAppStore(s => s.withToast)
  const todays = inputs.find(e => e.date === today())?.morningHrv
  const [draft, setDraft] = useState('')
  const value = Number.parseFloat(draft)
  const valid = Number.isFinite(value) && value > 0 && value < 400
  return (
    <div className="mt-1">
      <CaptureLabel label="THIS MORNING" meta={todays != null ? `today ${todays} ms` : 'not typed today'} />
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          aria-label="Morning HRV in ms"
          placeholder="rMSSD"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="w-28 h-12 border border-ink rounded-[3px] px-2 text-[18px] font-bold"
        />
        <span className="text-[13px] text-ink-2">ms</span>
      </div>
      <button
        disabled={!valid}
        onClick={async () => { if (await withToast(() => logMorningHrv(today(), value), 'Morning HRV saved.')) { setDraft(''); onSaved() } }}
        className="w-full min-h-[48px] mt-3 rounded-[3px] bg-ink text-white text-[14px] font-bold cursor-pointer disabled:opacity-45"
      >
        {valid ? `Log ${value} ms` : 'Type a reading to log it'}
      </button>
      <div className="text-[11px] text-ink-3 mt-2 text-pretty">
        From a phone-camera app or chest strap, lying down right after waking, the same way each day.
      </div>
    </div>
  )
}

/** Today's check-in (0092): five items, 1–5, saved once all five are answered. */
function CheckInCapture({ onSaved }: { onSaved: () => void }) {
  const inputs = useAppStore(s => s.readinessInputs)
  const logCheckIn = useAppStore(s => s.logCheckIn)
  const withToast = useAppStore(s => s.withToast)
  const saved = inputs.find(e => e.date === today())?.checkIn
  const [answers, setAnswers] = useState<Partial<CheckInAnswers>>(() => saved ?? {})
  const pick = (key: keyof CheckInAnswers, v: number) => {
    const next = { ...answers, [key]: v }
    setAnswers(next)
    if (CHECK_IN_ITEMS.every(i => next[i.key] != null)) {
      void withToast(() => logCheckIn(today(), next as CheckInAnswers), 'Check-in saved.').then(ok => ok && onSaved())
    }
  }
  return (
    <div className="mt-1">
      <CaptureLabel label="TODAY" meta={saved ? 'saved today' : 'saved on the fifth answer'} />
      <div className="grid grid-cols-[64px_1fr] gap-x-2 gap-y-2.5 items-center">
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
                    className={`flex-1 h-11 text-[13px] font-semibold rounded-[3px] border cursor-pointer ${
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

type Step = 'read' | 'sauna' | 'cold' | 'sleep' | 'morning_hrv' | 'check_in'
type Saved = { text: string; undo?: () => Promise<void> }

/** How long "… saved · Undo" stays up after a log. */
const SAVED_NOTE_MS = 6000
const FOOT_BTN = 'w-full min-h-[48px] rounded-[3px] text-[14px] font-bold cursor-pointer disabled:opacity-45 border border-ink'
const ROW = 'w-full flex items-center gap-2.5 min-h-[52px] border-b border-line text-left cursor-pointer'

const SESSIONS = {
  sauna: { label: 'Sauna', minutes: [10, 15, 20], tempC: 80 },
  cold: { label: 'Cold', minutes: [2, 3, 5], tempC: 10 },
} as const

// The sheet in steps (RFC 0100): the read and a list of what can be logged,
// then one capture per step. A log lands back on the read with Undo, so
// nothing writes on a single stray tap and nothing writes twice.
export default function RecoverySheet({ sys, onClose, onOpenProfile }: RecoverySheetProps) {
  const sauna = useAppStore(s => s.sauna)
  const cold = useAppStore(s => s.cold)
  const sleep = useAppStore(s => s.sleep)
  const inputs = useAppStore(s => s.readinessInputs)
  const addSaunaEntry = useAppStore(s => s.addSaunaEntry)
  const addColdEntry = useAppStore(s => s.addColdEntry)
  const removeSaunaEntry = useAppStore(s => s.removeSaunaEntry)
  const removeColdEntry = useAppStore(s => s.removeColdEntry)
  const addSleepEntry = useAppStore(s => s.addSleepEntry)
  const removeSleepEntry = useAppStore(s => s.removeSleepEntry)
  const openEditModal = useAppStore(s => s.openEditModal)
  const { weekStartDay } = usePrefs()
  const weekStart = startOfWeek(today(), weekStartDay)
  const inWeek = (d: string) => d >= weekStart && d <= today()

  // When today's reading is the thing missing ("Answer ›" on the card), the
  // sheet opens straight on that capture.
  const [step, setStep] = useState<Step>(() =>
    sys.awaitingInput && (sys.chosen === 'morning_hrv' || sys.chosen === 'check_in') ? sys.chosen : 'read')
  const [saved, setSaved] = useState<Saved | null>(null)
  useEffect(() => {
    if (!saved) return
    const t = window.setTimeout(() => setSaved(null), SAVED_NOTE_MS)
    return () => window.clearTimeout(t)
  }, [saved])
  const done = (note: Saved) => { setSaved(note); setStep('read') }

  const week = { sauna: sauna.filter(e => inWeek(e.date)), cold: cold.filter(e => inWeek(e.date)) }
  const minutesMeta = (xs: { duration: number }[]) =>
    xs.length > 0 ? `${xs.length}× this week · ${xs.reduce((n, e) => n + e.duration, 0)} min` : 'nothing this week'
  const todays = inputs.find(e => e.date === today())

  const savedNote = saved && (
    <div className="flex items-center justify-between gap-2 min-h-[44px] mb-2 pl-3 rounded-[3px] bg-ink text-white text-[13px]" role="status">
      <span className="min-w-0 truncate py-2">{saved.text}</span>
      {saved.undo && (
        <button
          onClick={() => { const u = saved.undo; setSaved(null); void u?.() }}
          className="min-h-[44px] px-3.5 font-bold underline cursor-pointer"
        >
          Undo
        </button>
      )}
    </div>
  )

  const stepHeader = (title: string) => (
    <div className="flex items-center gap-1">
      <button onClick={() => setStep('read')} aria-label="Back" className="min-w-[44px] min-h-[44px] -ml-3 flex items-center justify-center cursor-pointer">
        <Icon name="arrowRight" size={18} className="text-ink-2 rotate-180" />
      </button>
      <span className="grow min-w-0 truncate text-[10px] font-bold tracking-[0.12em] text-ink-3">{title}</span>
      <button onClick={onClose} aria-label="Close" className="min-w-[44px] min-h-[44px] flex items-center justify-end cursor-pointer">
        <Icon name="close" size={18} className="text-ink-2" />
      </button>
    </div>
  )

  if (step === 'sauna' || step === 'cold') {
    const kind = step
    const cfg = SESSIONS[kind]
    return (
      <SessionStep
        key={kind}
        header={stepHeader(cfg.label.toUpperCase())}
        unitLabel={cfg.label.toLowerCase()}
        minutes={cfg.minutes}
        entries={week[kind]}
        onClose={onClose}
        onEdit={e => openEditModal({ type: kind, record: e })}
        onLog={async min => {
          const add = kind === 'sauna' ? addSaunaEntry : addColdEntry
          const remove = kind === 'sauna' ? removeSaunaEntry : removeColdEntry
          const entry = await add({ date: today(), duration: min, tempC: cfg.tempC })
          done({ text: `${cfg.label} ${min} min saved`, undo: () => remove(entry.id) })
        }}
      />
    )
  }

  if (step === 'sleep') {
    // A night already on record (usually the watch's) is replaced by a typed
    // one, so Undo would delete it; Undo is offered only for a new night.
    const existing = sleep.some(e => e.date === today())
    return (
      <SleepStep
        header={stepHeader('SLEEP')}
        initial={sleep[0]?.hours ?? 7.5}
        recent={sleep.slice(0, 4)}
        onClose={onClose}
        onEdit={e => openEditModal({ type: 'sleep', record: e })}
        onLog={async hours => {
          const entry = await addSleepEntry({ date: today(), hours })
          done({ text: `Sleep ${hours} h saved`, undo: existing ? undefined : () => removeSleepEntry(entry.id) })
        }}
      />
    )
  }

  if (step === 'morning_hrv') {
    return (
      <BottomSheet onClose={onClose} label="Morning HRV">
        {stepHeader('MORNING HRV')}
        <MorningHrvCapture onSaved={() => done({ text: 'Morning HRV saved' })} />
      </BottomSheet>
    )
  }

  if (step === 'check_in') {
    return (
      <BottomSheet onClose={onClose} label="Check-in">
        {stepHeader('CHECK-IN')}
        <CheckInCapture onSaved={() => done({ text: 'Check-in saved' })} />
      </BottomSheet>
    )
  }

  const rows: { step: Step; label: string; meta: string }[] = [
    ...(sys.chosen === 'morning_hrv'
      ? [{ step: 'morning_hrv' as const, label: 'MORNING HRV', meta: todays?.morningHrv != null ? `today ${todays.morningHrv} ms` : 'not typed today' }]
      : []),
    ...(sys.chosen === 'check_in'
      ? [{ step: 'check_in' as const, label: 'CHECK-IN', meta: todays?.checkIn ? 'answered today' : 'not answered today' }]
      : []),
    { step: 'sauna', label: 'SAUNA', meta: minutesMeta(week.sauna) },
    { step: 'cold', label: 'COLD', meta: minutesMeta(week.cold) },
    { step: 'sleep', label: 'SLEEP', meta: sleep[0] ? `last night on record ${sleep[0].hours} h` : 'nothing on record' },
  ]

  return (
    <BottomSheet onClose={onClose} label="READINESS AND RECOVERY INPUTS" footer={savedNote || undefined}>
      <SheetHeader eyebrow="READINESS" onClose={onClose} className="mb-2" />
      <ReadinessSource sys={sys} onOpenProfile={onOpenProfile} />
      <div className="text-[10px] font-bold tracking-[0.12em] text-ink-3 mt-1">LOG</div>
      {rows.map(r => (
        <button key={r.step} onClick={() => setStep(r.step)} className={ROW}>
          <span className="w-[92px] shrink-0 text-[12px] font-bold tracking-[0.06em]">{r.label}</span>
          <span className="grow min-w-0 truncate text-[12px] text-ink-2">{r.meta}</span>
          <Icon name="arrowRight" size={14} className="text-ink-3 shrink-0" />
        </button>
      ))}
      <div className="text-[10px] text-ink-3 mt-2.5 text-pretty">
        Sauna and cold are systemic inputs and never move the map.
      </div>
    </BottomSheet>
  )
}

/** Sauna or cold: pick the minutes, then one Log. This week's bouts edit on tap. */
function SessionStep<T extends { id: string; date: string; duration: number }>({
  header, unitLabel, minutes, entries, onLog, onEdit, onClose,
}: {
  header: ReactNode
  unitLabel: string
  minutes: readonly number[]
  entries: T[]
  onLog: (min: number) => Promise<void>
  onEdit: (e: T) => void
  onClose: () => void
}) {
  // Preselect the last bout's length when it is one of the choices.
  const last = entries[0]?.duration
  const [min, setMin] = useState<number>(last && minutes.includes(last) ? last : minutes[1])
  const [busy, setBusy] = useState(false)
  const log = async () => {
    if (busy) return
    setBusy(true)
    try { await onLog(min) } finally { setBusy(false) }
  }
  return (
    <BottomSheet
      onClose={onClose}
      label={unitLabel}
      footer={
        <button onClick={log} disabled={busy} className={`${FOOT_BTN} bg-ink text-white`}>
          {busy ? 'Saving…' : `Log ${min} min ${unitLabel}`}
        </button>
      }
    >
      {header}
      <div className="text-[11px] text-ink-3 mt-1 mb-2">How long, today</div>
      <div className="grid grid-cols-3 gap-2">
        {minutes.map(m => (
          <button
            key={m}
            onClick={() => setMin(m)}
            aria-pressed={m === min}
            className={`min-h-[48px] rounded-[3px] text-[14px] font-semibold cursor-pointer ${
              m === min ? 'border-2 border-ink text-ink' : 'border border-line text-ink-2'
            }`}
          >
            {m} min
          </button>
        ))}
      </div>
      <EntryList
        title="THIS WEEK"
        entries={entries}
        label={e => `${fmtDay(e.date)} · ${e.duration} min`}
        onEdit={onEdit}
      />
    </BottomSheet>
  )
}

/** Sleep: step last night's hours, then one Log. Only for a night the watch missed. */
function SleepStep({ header, initial, recent, onLog, onEdit, onClose }: {
  header: ReactNode
  initial: number
  recent: SleepEntry[]
  onLog: (hours: number) => Promise<void>
  onEdit: (e: SleepEntry) => void
  onClose: () => void
}) {
  const [hours, setHours] = useState(initial)
  const [busy, setBusy] = useState(false)
  const step = (d: number) => setHours(h => Math.max(0, Math.min(16, Math.round((h + d) * 2) / 2)))
  const log = async () => {
    if (busy) return
    setBusy(true)
    try { await onLog(hours) } finally { setBusy(false) }
  }
  const btn = 'w-14 h-12 shrink-0 flex items-center justify-center border border-line rounded-[3px] text-[20px] font-bold cursor-pointer'
  return (
    <BottomSheet
      onClose={onClose}
      label="Sleep"
      footer={
        <button onClick={log} disabled={busy} className={`${FOOT_BTN} bg-ink text-white`}>
          {busy ? 'Saving…' : `Log ${hours.toFixed(1)} h for last night`}
        </button>
      }
    >
      {header}
      <div className="text-[11px] text-ink-3 mt-1 mb-2 text-pretty">
        Sleep normally arrives from the watch. Log it here only for a night it missed.
      </div>
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => step(-0.5)} aria-label="Half an hour less" className={btn}>−</button>
        <span className="flex items-baseline gap-1">
          <span className="text-[32px] font-bold tracking-[-0.02em]">{hours.toFixed(1)}</span>
          <span className="text-[13px] text-ink-2">h</span>
        </span>
        <button onClick={() => step(0.5)} aria-label="Half an hour more" className={btn}>+</button>
      </div>
      <EntryList
        title="RECENT NIGHTS"
        entries={recent}
        label={e => `${fmtDay(e.date)} · ${e.hours} h${e.score != null ? ` · score ${e.score}` : ''}`}
        onEdit={onEdit}
      />
    </BottomSheet>
  )
}

/** Past entries as full-width rows, tap to edit. */
function EntryList<T extends { id: string }>({ title, entries, label, onEdit }: {
  title: string
  entries: T[]
  label: (e: T) => string
  onEdit: (e: T) => void
}) {
  if (entries.length === 0) return null
  return (
    <div className="mt-4">
      <div className="text-[10px] font-bold tracking-[0.12em] text-ink-3">{title} <span className="font-normal tracking-normal">· tap to fix</span></div>
      {entries.map(e => (
        <button key={e.id} onClick={() => onEdit(e)} className="w-full flex items-center justify-between min-h-[44px] border-b border-line text-left text-[13px] cursor-pointer">
          <span>{label(e)}</span>
          <Icon name="edit" size={14} className="text-ink-3" />
        </button>
      ))}
    </div>
  )
}

const fmtDay = (date: string): string => fmtDate(date, { weekday: true })
