import { useAppStore } from '../../../store/app'
import { formatDurationMins, calcPace } from '../../../lib/utils'
import { CARDIO_TYPES, CARDIO_ICONS } from '../../../constants/app'
import { Card, SecTitle } from '../../ui/Card'
import { DelBtn, EditBtn } from '../../ui/Button'
import { HistoryList } from '../../ui/HistoryList'
import type { CardioEntry, SportEntry } from '../../../types'

/**
 * One history for both capture paths. A sport session is cardio stimulus, so
 * "what did I do this week" is one list — the doctrine fold that actually
 * changes a read, rather than two tabs stacked behind a toggle.
 */
type Session =
  | { kind: 'cardio'; entry: CardioEntry }
  | { kind: 'sport'; entry: SportEntry }

/** Garmin's Training-Effect label (e.g. "VO2MAX", "AEROBIC_BASE") → readable text. */
function prettyTeLabel(label: string): string {
  const titled = label
    .toLowerCase()
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  return titled.replace(/Vo2max/i, 'VO₂max').replace(/Vo2/i, 'VO₂')
}

function sessionDate(s: Session): string {
  return s.entry.date
}

function sessionLabel(s: Session): string {
  return s.kind === 'cardio' ? s.entry.type : s.entry.sport
}

function CardioRow({ d }: { d: CardioEntry }) {
  const { removeCardioEntry, openEditModal } = useAppStore()
  return (
    <div className="pb-2 mb-2 border-b border-bg last:border-0 last:mb-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{CARDIO_ICONS[d.type]}</span>
          <span className="text-sm font-semibold text-primary">{d.type}</span>
          {d.source === 'garmin' && (
            <span className="text-[10px] font-semibold text-accent bg-accent-l px-1.5 py-0.5 rounded-full">
              ⌚ Garmin
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted">{d.date}</span>
          <EditBtn onClick={() => openEditModal({ type: 'cardio', record: d })} />
          <DelBtn onClick={() => removeCardioEntry(d.id)} />
        </div>
      </div>
      <p className="text-xs text-muted mt-0.5 ml-0.5">
        {formatDurationMins(d.duration)}
        {d.distance ? ` · ${d.distance} km · ${calcPace(d.duration, d.distance)}` : ''}
        {d.avgHr ? ` · ❤️ ${d.avgHr} bpm` : ''}
        {d.elevationGain ? ` · ⛰️ ${Math.round(d.elevationGain)} m` : ''}
        {d.notes ? ` — ${d.notes}` : ''}
      </p>
      {(d.aerobicTe != null || d.anaerobicTe != null) && (
        <p className="text-[11px] text-muted mt-0.5 ml-0.5">
          {d.trainingEffectLabel ? `${prettyTeLabel(d.trainingEffectLabel)} · ` : ''}
          aerobic {d.aerobicTe ?? '—'} · anaerobic {d.anaerobicTe ?? '—'}
        </p>
      )}
    </div>
  )
}

function SportRow({ d }: { d: SportEntry }) {
  const { removeSportEntry, openEditModal } = useAppStore()
  return (
    <div className="pb-2 mb-2 border-b border-bg last:border-0 last:mb-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base">⚽</span>
          <span className="text-sm font-semibold text-primary truncate">{d.sport}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-muted">{d.date}</span>
          <EditBtn onClick={() => openEditModal({ type: 'sport', record: d })} />
          <DelBtn onClick={() => removeSportEntry(d.id)} />
        </div>
      </div>
      {(d.withTrainer || d.quality > 0 || d.result) && (
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {d.withTrainer && (
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
              with trainer
            </span>
          )}
          {d.quality > 0 && (
            <span className="text-xs text-warning">{'★'.repeat(d.quality)}</span>
          )}
          {d.result && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${d.result === 'win' ? 'text-green-700 bg-green-50' : d.result === 'loss' ? 'text-red-700 bg-red-50' : 'text-slate-700 bg-slate-100'}`}>
              {d.result}
            </span>
          )}
        </div>
      )}
      {(d.duration || d.avgHr) && (
        <p className="text-xs text-muted mt-1">
          {d.duration ? `⏱️ ${formatDurationMins(d.duration)}` : ''}
          {d.duration && d.avgHr ? ' · ' : ''}
          {d.avgHr ? `❤️ ${d.avgHr} bpm` : ''}
        </p>
      )}
      {d.competitorNames && d.competitorNames.length > 0 && <p className="text-xs text-muted mt-1">vs {d.competitorNames.join(', ')}</p>}
      {d.teammateNames && d.teammateNames.length > 0 && (
        <p className="text-xs text-muted mt-1">with {d.teammateNames.join(', ')}</p>
      )}
      {d.notes && <p className="text-xs text-muted italic mt-1">{d.notes}</p>}
    </div>
  )
}

export function SessionList() {
  const { cardio, sports } = useAppStore()

  const merged: Session[] = [
    ...cardio.map(entry => ({ kind: 'cardio' as const, entry })),
    ...sports.map(entry => ({ kind: 'sport' as const, entry })),
  ].sort((a, b) => sessionDate(b).localeCompare(sessionDate(a)))

  const sportNames = [...new Set(sports.map(d => d.sport))].sort()

  return (
    <Card>
      <SecTitle>Sessions</SecTitle>
      <HistoryList
        items={merged}
        getDate={sessionDate}
        categories={[...CARDIO_TYPES, ...sportNames]}
        categoryLabel="Type"
        matchesCategory={(s, cat) => sessionLabel(s) === cat}
        emptyMessage="No sessions yet"
        renderItem={s => s.kind === 'cardio'
          ? <CardioRow key={`c-${s.entry.id}`} d={s.entry} />
          : <SportRow key={`s-${s.entry.id}`} d={s.entry} />
        }
      />
    </Card>
  )
}
