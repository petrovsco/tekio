import { useAppStore } from '../../../store/app'
import { formatDurationMins, calcPace, uniqSorted } from '../../../lib/utils'
import { isThresholdCardio, isThresholdSport } from '../../../lib/adaptations'
import { useHrMax } from '../../../hooks/useHrMax'
import { CARDIO_TYPES } from '../../../constants/app'
import { Card, SecTitle } from '../../ui/Card'
import { RowActions } from '../../ui/Button'
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

function CardioRow({ d, hrMax }: { d: CardioEntry; hrMax: number | null }) {
  const removeCardioEntry = useAppStore(s => s.removeCardioEntry)
  const openEditModal = useAppStore(s => s.openEditModal)
  // The one fact a hard endurance session used to lose on its way to the read
  // (roadmap 057). It says what the session was, never what it credits.
  const threshold = isThresholdCardio(d, hrMax)
  return (
    <div className="py-2 border-b border-hairline last:border-0">
      <div className="flex items-center justify-between">
        {/* Wraps: with two labels beside it on a phone the name would
            otherwise truncate to "Indoor R…", and the name is the row. */}
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {/* The stroke icon separates the two kinds of session in one list;
              the emoji it replaced was chrome, not data (§7). */}
          <Icon name="cardio" size={13} className="text-ink-3 shrink-0" />
          <span className="text-xs font-bold text-ink">{d.type}</span>
          {d.format && (
            <MicroLabel>
              {d.format === 'intervals'
                ? `Intervals${d.boutSeconds ? ` · ${formatDurationMins(d.boutSeconds / 60)}` : ''}`
                : 'Steady'}
            </MicroLabel>
          )}
          {threshold && <MicroLabel>Threshold</MicroLabel>}
          {d.source === 'garmin' && <MicroLabel>Garmin</MicroLabel>}
        </div>
        <RowActions
          label={d.date}
          className="ml-2"
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
          {/* The chip above already says Threshold, so the row prints Garmin's
              word only when it adds one (VO₂max, Recovery, Aerobic Base). */}
          {d.trainingEffectLabel && !threshold ? `${prettyTeLabel(d.trainingEffectLabel)} · ` : ''}
          aerobic {d.aerobicTe ?? '—'} · anaerobic {d.anaerobicTe ?? '—'}
        </p>
      )}
    </div>
  )
}

function SportRow({ d }: { d: SportEntry }) {
  const removeSportEntry = useAppStore(s => s.removeSportEntry)
  const openEditModal = useAppStore(s => s.openEditModal)
  // Garmin's word only: a match's average HR is an intermittent average, so a
  // hand-logged match is never flagged (roadmap 057, 059 decision 4).
  const threshold = isThresholdSport(d)
  return (
    <div className="py-2 border-b border-hairline last:border-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon name="sport" size={13} className="text-ink-3 shrink-0" />
          <span className="text-xs font-bold text-ink truncate">{d.sport}</span>
          {d.source === 'garmin' && <MicroLabel>Garmin</MicroLabel>}
        </div>
        <RowActions
          label={d.date}
          className="ml-2"
          onEdit={() => openEditModal({ type: 'sport', record: d })}
          onDelete={() => removeSportEntry(d.id)}
        />
      </div>
      {(d.withTrainer || d.quality > 0 || d.result || threshold) && (
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {threshold && <MicroLabel>Threshold</MicroLabel>}
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
  const cardio = useAppStore(s => s.cardio)
  const sports = useAppStore(s => s.sports)
  // Read once for the whole list: the observed peak walks every synced row, so
  // a per-row hook would repeat that work for each row drawn.
  const { hrMax } = useHrMax()

  const merged: Session[] = [
    ...cardio.map(entry => ({ kind: 'cardio' as const, entry })),
    ...sports.map(entry => ({ kind: 'sport' as const, entry })),
  ].sort((a, b) => sessionDate(b).localeCompare(sessionDate(a)))

  const sportNames = uniqSorted(sports.map(d => d.sport))

  return (
    <Card>
      <SecTitle>Sessions</SecTitle>
      <HistoryList
        items={merged}
        getDate={sessionDate}
        // Swimming is a cardio type and a sport; one filter entry covers both rows.
        categories={[...new Set<string>([...CARDIO_TYPES, ...sportNames])]}
        categoryLabel="Type"
        matchesCategory={(s, cat) => sessionLabel(s) === cat}
        emptyMessage="No sessions yet"
        renderItem={s => s.kind === 'cardio'
          ? <CardioRow key={`c-${s.entry.id}`} d={s.entry} hrMax={hrMax} />
          : <SportRow key={`s-${s.entry.id}`} d={s.entry} />
        }
      />
    </Card>
  )
}
