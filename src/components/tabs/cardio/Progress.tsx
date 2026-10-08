import { useState } from 'react'
import { XAxis, YAxis, Tooltip, Line } from 'recharts'
import { useAppStore } from '../../../store/app'
import { usePrefs } from '../../../store/prefs'
import { CARDIO_TYPES } from '../../../constants/app'
import {
  TIME_FRAMES, withinTimeFrame, grainForFrame, rollupCardio, hasLonePoint, uniqSorted, fmtDate,
  DATE_DAY_MONTH, DATE_SHORT_YEAR, DATE_MONTH, type TimeFrame, type CardioBucket,
} from '../../../lib/utils'
import { Card, SecTitle } from '../../ui/Card'
import { Chip } from '../../ui/Chip'
import { SelEl } from '../../ui/Input'
import { CHART, CHART_LINE, CHART_AXIS, CHART_TOOLTIP, hoverDot } from '../../ui/chart'
import { ChartFrame } from '../../ui/ChartFrame'
import { lensSessions, sessionLabel, type Lens } from './lens'
import { WinLossRecord } from './WinLossRecord'

type Second = 'pace' | 'avgHr'

/** Recharts clones the `dot` element once per point, null ones included, so
 *  this draws only where the second series has no segment to show the value —
 *  §9's one exception to "no resting dots" (roadmap 056). */
function LoneDot({ buckets, field, index, cx, cy }: {
  buckets: CardioBucket[]; field: Second; index?: number; cx?: number; cy?: number
}) {
  if (index == null || cx == null || cy == null || !hasLonePoint(buckets, index, field)) return null
  return <circle cx={cx} cy={cy} r={2} fill={CHART.line2} stroke="none" />
}

/**
 * Duration over time, with a second series on its own axis. Under the Cardio
 * lens that series is pace; under Sport and All it is average heart rate
 * (roadmap 076), because a match has no distance and pace would be empty.
 * Heart rate is shown as recorded — a match's average is an intermittent one,
 * and the chart claims no more than that.
 */
export function Progress({ lens }: { lens: Lens }) {
  const [filter, setFilter] = useState('All')
  // A window, not all time: the Garmin backfill (roadmap 054) put three years
  // of runs behind this chart, and one point per session over three years is
  // a hairball with the same month-day appearing three times.
  const [frame, setFrame] = useState<TimeFrame>('Last 90 days')
  const cardio = useAppStore(s => s.cardio)
  const sports = useAppStore(s => s.sports)
  const weekStartDay = usePrefs(s => s.weekStartDay)

  const second: Second = lens === 'cardio' ? 'pace' : 'avgHr'
  const secondName = second === 'pace' ? 'Pace (min/km)' : 'Avg HR (bpm)'
  // Under All the chips drill into the two kinds, not into thirty names.
  const chips = lens === 'cardio'
    ? ['All', ...CARDIO_TYPES]
    : lens === 'sport'
      ? ['All', ...uniqSorted(sports.map(d => d.sport))]
      : ['All', 'Cardio', 'Sport']
  // Under Cardio, All still charts one type: a pace line across running and
  // cycling would average two scales into neither.
  const ct = filter === 'All' ? 'Running' : filter
  const sessions = lensSessions(cardio, sports, lens)
    .filter(s => {
      if (!withinTimeFrame(s.entry.date, frame)) return false
      if (lens === 'cardio') return sessionLabel(s) === ct
      if (filter === 'All') return true
      if (lens === 'all') return s.kind === filter.toLowerCase()
      return sessionLabel(s) === filter
    })
    .map(s => ({
      date: s.entry.date,
      duration: s.entry.duration,
      ...(second === 'pace' && s.kind === 'cardio' ? { distance: s.entry.distance } : {}),
      ...(second === 'avgHr' ? { avgHr: s.entry.avgHr } : {}),
    }))
    .reverse()
  // The grain follows the frame (roadmap 055): a point is a session in the
  // 30- and 90-day frames, a week this year, a month over all time. Three
  // years of runs at one point each is a hairball at 390 px.
  const grain = grainForFrame(frame)
  // The year joins the per-session axis label only when the frame actually
  // spans two; the week and month keys carry it always.
  const spansYears = new Set(sessions.map(d => d.date.slice(0, 4))).size > 1
  // Per session: two runs on one day (six such dates in the history) are two
  // points, not one category slot shared. The label is the date; the suffix
  // only keeps the key unique. Rolled up: one bucket per week or month, empty
  // ones included.
  const chartData: CardioBucket[] = grain === 'session'
    ? sessions.map((d, i) => ({
        key: `${d.date}#${i}`,
        sessions: 1,
        ...(d.duration ? { duration: +d.duration.toFixed(2) } : {}),
        ...(d.distance && d.duration ? { distance: d.distance, pace: +(d.duration / d.distance).toFixed(2) } : {}),
        ...(d.avgHr ? { avgHr: d.avgHr } : {}),
      }))
    : rollupCardio(sessions, grain, weekStartDay)
  const labelOf = (key: string) => {
    const hash = key.indexOf('#')
    if (hash >= 0) return fmtDate(key.slice(0, hash), spansYears ? DATE_SHORT_YEAR : DATE_DAY_MONTH)
    return fmtDate(key, grain === 'week' ? DATE_SHORT_YEAR : DATE_MONTH)
  }
  // A rolled-up point is a sum, so its tooltip leads with the count.
  const tooltipLabel = (key: string, payload: ReadonlyArray<{ payload?: CardioBucket }>) => {
    const row = payload[0]?.payload
    if (grain === 'session' || !row) return labelOf(key)
    const km = row.distance ? ` · ${row.distance} km` : ''
    return `${labelOf(key)} · ${row.sessions} session${row.sessions === 1 ? '' : 's'}${km}`
  }
  // One session is not a line; below two the card says so and the legend
  // stays out with the chart.
  const hasSecond = chartData.length > 1 && chartData.some(d => d[second] != null)
  // A month of running can pass 1000 min; four digits clip at the 30 px the
  // per-session axis needs.
  const durationAxisWidth = chartData.some(d => (d.duration ?? 0) >= 1000) ? 36 : 30
  const subject = lens === 'cardio' ? `${ct} ` : filter === 'All' ? (lens === 'sport' ? 'sport ' : '') : `${filter} `
  const emptyMsg = sessions.length < 2
    ? (frame === 'All time' ? 'Not enough data to chart yet' : `Fewer than two ${subject}sessions in this frame`)
    : `All ${subject}sessions in this frame fall in one ${grain}`

  return (
    <Card>
      <SecTitle>Progress</SecTitle>
      {/* Plain type names, no emoji: the marker is chrome here, not data (§7). */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {chips.map(t => (
          <Chip key={t} active={filter === t} onClick={() => setFilter(t)}>{t}</Chip>
        ))}
        {/* The grain label and the frame select wrap as one unit, so the card
            always says what a point is right beside the frame that set it. */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-ink-3">per {grain}</span>
          {/* SelEl is w-full by design; the wrapper gives it its width. */}
          <div className="w-[124px]">
            <SelEl
              aria-label="Time frame"
              value={frame}
              onChange={e => setFrame(e.target.value as TimeFrame)}
              options={TIME_FRAMES.map(f => ({ value: f, label: f }))}
            />
          </div>
        </div>
      </div>
      {/* Keyed by the sport, so a competitor picked for one starts fresh on the next. */}
      {lens === 'sport' && filter !== 'All' && <WinLossRecord key={filter} sport={filter} />}
      <ChartFrame data={chartData} empty={emptyMsg}>
        <XAxis dataKey="key" tickFormatter={labelOf} {...CHART_AXIS} />
        <YAxis yAxisId="duration" width={durationAxisWidth} {...CHART_AXIS} />
        {/* The second series gets its own axis: minutes and min/km (or bpm)
            are two scales, and one drawn on the other's is the pretty lie P2
            forbids. */}
        {hasSecond && (
          <YAxis yAxisId={second} orientation="right" width={30} domain={['auto', 'auto']} {...CHART_AXIS} />
        )}
        <Tooltip {...CHART_TOOLTIP} labelFormatter={tooltipLabel} />
        <Line
          {...CHART_LINE}
          yAxisId="duration"
          dataKey="duration"
          stroke={CHART.line}
          name="Duration (min)"
          // Per session a hole is a value never recorded, not a week with no
          // training, so the line bridges it; rolled up, an empty bucket
          // stays a gap (P2).
          connectNulls={grain === 'session'}
          activeDot={hoverDot(CHART.line)}
        />
        {/* The second series is the pale ink (§9) — solid, because a dash
            means "not data" and is spent on reference lines. */}
        {hasSecond && (
          <Line
            {...CHART_LINE}
            yAxisId={second}
            dataKey={second}
            stroke={CHART.line2}
            name={secondName}
            connectNulls={grain === 'session'}
            // Rolled up, a bucket with no neighbour carrying the series has
            // no line to sit on; per session the line bridges every hole.
            dot={grain === 'session' ? false : <LoneDot buckets={chartData} field={second} />}
            activeDot={hoverDot(CHART.line2)}
          />
        )}
      </ChartFrame>
      {hasSecond && (
        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1.5 text-[10px] text-ink-3">
            <span className="w-3 h-[1.5px] bg-ink" /> Duration (min)
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-ink-3">
            <span className="w-3 h-[1.5px]" style={{ background: CHART.line2 }} /> {secondName}
          </span>
        </div>
      )}
    </Card>
  )
}
