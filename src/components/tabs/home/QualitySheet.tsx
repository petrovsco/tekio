import { useMemo } from 'react'
import type { Adaptation, CardioEntry, EditModalTarget, SportEntry } from '../../../types'
import { useAppStore } from '../../../store/app'
import { muscleWindow } from '../../../lib/fusedRead'
import { classifyCardioAdaptations, classifySportAdaptations, type AdaptationSummary } from '../../../lib/adaptations'
import { useHrMax } from '../../../hooks/useHrMax'
import { MUSCLE_WINDOW_DAYS } from '../../../constants/app'
import { today, daysBetween, fmtAgo, formatDurationMins } from '../../../lib/utils'
import { BottomSheet, SheetHeader } from './BottomSheet'
import { QUALITY_SHORT } from '../adaptations/labels'

// The whole-body quality drill-in (T2): what a tap on a VO₂MAX / ANAEROBIC /
// ENDURANCE tile reveals — the sessions inside the coverage window that
// credited it. Each row is classified by the same calls `adaptationCoverage`
// makes, so the list is exactly the count behind the tile's fill, never a
// second opinion. Tap a row to correct it.

export type WholeBodyQuality = Extract<Adaptation, 'vo2max' | 'anaerobic_capacity' | 'endurance'>

type Row =
  | { kind: 'cardio'; entry: CardioEntry; credits: Adaptation[] }
  | { kind: 'sport'; entry: SportEntry; credits: Adaptation[] }

/** "Tue 3 Mar", with the year once the date is not in the current one — the
 *  last eligible session can sit a year or more back. */
const fmtDay = (date: string): string =>
  new Date(date).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    ...(date.slice(0, 4) !== today().slice(0, 4) ? { year: 'numeric' } : {}),
  })

interface QualitySheetProps {
  quality: WholeBodyQuality
  /** The quality's coverage — volume, target and unit — from the same call the
   *  tile reads, so the title is the tile's number (roadmap 0012). */
  summary: AdaptationSummary
  onClose: () => void
}

export default function QualitySheet({ quality, summary, onClose }: QualitySheetProps) {
  const cardio = useAppStore(s => s.cardio)
  const sports = useAppStore(s => s.sports)
  const openEditModal = useAppStore(s => s.openEditModal)
  const { hrMax } = useHrMax()

  const date = today()
  const { from } = muscleWindow(date)
  // Every session that ever credited the quality, newest first. The window's
  // rows are the list; the newest one before it is the reference an empty
  // window shows at the foot.
  const credited = useMemo(() => {
    const out: Row[] = []
    for (const entry of cardio) {
      if (entry.date > date) continue
      const credits = classifyCardioAdaptations(entry, hrMax)
      if (credits.includes(quality)) out.push({ kind: 'cardio', entry, credits })
    }
    for (const entry of sports) {
      if (entry.date > date) continue
      const credits = classifySportAdaptations(entry)
      if (credits.includes(quality)) out.push({ kind: 'sport', entry, credits })
    }
    return out.sort((a, b) => b.entry.date.localeCompare(a.entry.date))
  }, [cardio, sports, hrMax, quality, date])
  const rows = credited.filter(r => r.entry.date >= from)
  const lastBefore = rows.length === 0 ? credited[0] ?? null : null

  const target = Math.round(summary.target * 10) / 10
  // Endurance counts minutes (Galpin's side of 0012's fork); the others count
  // the sessions listed below.
  const title = summary.unit === 'minutes'
    ? `${Math.round(summary.volume)} of ${Math.round(summary.target)} min`
    : `${rows.length} of ${target} session${target === 1 ? '' : 's'}`

  return (
    <BottomSheet onClose={onClose} label={QUALITY_SHORT[quality]}>
      <SheetHeader
        eyebrow={`${QUALITY_SHORT[quality]} · LAST ${MUSCLE_WINDOW_DAYS} DAYS`}
        title={title}
        sub={rows.length === 0
          ? credited.length === 0
            ? `Nothing on record has credited ${QUALITY_SHORT[quality].toLowerCase()} yet.`
            : `Nothing in the window credited ${QUALITY_SHORT[quality].toLowerCase()}.`
          : undefined}
        onClose={onClose}
        className="mb-2"
      />

      {rows.length > 0 && (
        <div className="border-t border-line">
          {rows.map(r => (
            <SessionRow key={`${r.kind}-${r.entry.id}`} row={r} quality={quality} onEdit={openEditModal} />
          ))}
        </div>
      )}

      {lastBefore && (
        <div className="mt-2.5">
          <div className="text-[9px] font-bold tracking-[0.1em] text-ink-3">
            LAST ELIGIBLE SESSION · {fmtAgo(daysBetween(lastBefore.entry.date, date)).toUpperCase()}
          </div>
          <div className="border-t border-line mt-1">
            <SessionRow row={lastBefore} quality={quality} onEdit={openEditModal} />
          </div>
        </div>
      )}

      <div className="text-[9px] text-ink-3 mt-2.5 text-pretty">
        Cardio and sport sessions, classified the way the tile counts them. Tap
        one to correct it.
      </div>
    </BottomSheet>
  )
}

/** One credited session, tap to correct it. */
function SessionRow({ row: r, quality, onEdit }: {
  row: Row
  quality: WholeBodyQuality
  onEdit: (target: EditModalTarget) => void
}) {
  const others = r.credits.filter(c => c !== quality)
  const name = r.kind === 'cardio'
    ? `${r.entry.type}${r.entry.format === 'intervals' ? ' · intervals' : ''}`
    : r.entry.sport
  const facts = [
    r.entry.duration != null ? formatDurationMins(r.entry.duration) : null,
    r.kind === 'cardio' && r.entry.distance ? `${r.entry.distance} km` : null,
    r.entry.avgHr ? `${r.entry.avgHr} bpm` : null,
  ].filter(Boolean).join(' · ')
  return (
    <button
      onClick={() => onEdit(r.kind === 'cardio'
        ? { type: 'cardio', record: r.entry }
        : { type: 'sport', record: r.entry })}
      className="w-full flex items-baseline justify-between gap-3 py-2 border-b border-line text-left cursor-pointer"
    >
      <div className="min-w-0">
        <div className="text-xs font-semibold truncate">{name}</div>
        <div className="text-[9px] text-ink-2 mt-0.5">
          {facts || '—'}
          {others.length > 0 && (
            <span className="text-ink-3"> · also {others.map(o => QUALITY_SHORT[o]).join(', ')}</span>
          )}
        </div>
      </div>
      <span className="text-[10px] text-ink-2 shrink-0">{fmtDay(r.entry.date)}</span>
    </button>
  )
}
