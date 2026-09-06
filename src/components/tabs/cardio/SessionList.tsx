import { useAppStore } from '../../../store/app'
import { formatDurationMins, calcPace } from '../../../lib/utils'
import { CARDIO_TYPES } from '../../../constants/app'
import { Card, SecTitle } from '../../ui/Card'
import { DelBtn, EditBtn } from '../../ui/Button'
import { HistoryList } from '../../ui/HistoryList'
import { Icon } from '../../ui/Icon'
import { MicroLabel } from '../../ui/Badges'
import { RatingRead } from '../../ui/Fields'
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

/** The row's right-hand column: date and the two controls, one shape for both
 *  kinds of session. */
function RowActions({ date, onEdit, onDelete }: { date: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1 shrink-0 ml-2">
      <span className="text-[11px] text-ink-3 tabular-nums">{date}</span>
      <EditBtn onClick={onEdit} />
      <DelBtn onClick={onDelete} />
    </div>
  )
}

function CardioRow({ d }: { d: CardioEntry }) {
  const { removeCardioEntry, openEditModal } = useAppStore()
  return (
    <div className="py-2 border-b border-hairline last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* The stroke icon separates the two kinds of session in one list;
              the emoji it replaced was chrome, not data (§7). */}
          <Icon name="cardio" size={13} className="text-ink-3 shrink-0" />
          <span className="text-xs font-bold text-ink truncate">{d.type}</span>
          {d.format && <MicroLabel>{d.format === 'intervals' ? 'Intervals' : 'Steady'}</MicroLabel>}
          {d.source === 'garmin' && <MicroLabel>Garmin</MicroLabel>}
        </div>
        <RowActions
          date={d.date}
          onEdit={() => openEditModal({ type: 'cardio', record: d })}
          onDelete={() => removeCardioEntry(d.id)}
        />
      </div>
      <p className="text-[11px] text-ink-2 mt-1 tabular-nums">
        {formatDurationMins(d.duration)}
        {d.distance ? ` · ${d.distance} km · ${calcPace(d.duration, d.distance)}` : ''}
        {d.avgHr ? ` · ${d.avgHr} bpm` : ''}
        {d.elevationGain ? ` · ${Math.round(d.elevationGain)} m up` : ''}
        {d.notes ? ` — ${d.notes}` : ''}
      </p>
      {(d.aerobicTe != null || d.anaerobicTe != null) && (
        <p className="text-[11px] text-ink-3 mt-0.5 tabular-nums">
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
    <div className="py-2 border-b border-hairline last:border-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon name="sport" size={13} className="text-ink-3 shrink-0" />
          <span className="text-xs font-bold text-ink truncate">{d.sport}</span>
          {d.source === 'garmin' && <MicroLabel>Garmin</MicroLabel>}
        </div>
        <RowActions
          date={d.date}
          onEdit={() => openEditModal({ type: 'sport', record: d })}
          onDelete={() => removeSportEntry(d.id)}
        />
      </div>
      {(d.withTrainer || d.quality > 0 || d.result) && (
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {d.withTrainer && <MicroLabel>With trainer</MicroLabel>}
          {/* The result is the word, not a colour: green for a win would be a
              second palette, and §1 has exactly one accent to spend. */}
          {d.result && <MicroLabel>{d.result}</MicroLabel>}
          {d.quality > 0 && <RatingRead value={d.quality} />}
        </div>
      )}
      {(d.duration || d.avgHr) && (
        <p className="text-[11px] text-ink-2 mt-1 tabular-nums">
          {d.duration ? formatDurationMins(d.duration) : ''}
          {d.duration && d.avgHr ? ' · ' : ''}
          {d.avgHr ? `${d.avgHr} bpm` : ''}
        </p>
      )}
      {d.competitorNames && d.competitorNames.length > 0 && <p className="text-[11px] text-ink-2 mt-1">vs {d.competitorNames.join(', ')}</p>}
      {d.teammateNames && d.teammateNames.length > 0 && (
        <p className="text-[11px] text-ink-2 mt-1">with {d.teammateNames.join(', ')}</p>
      )}
      {d.notes && <p className="text-[11px] text-ink-3 italic mt-1">{d.notes}</p>}
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
