import { useState } from 'react'
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts'
import { useAppStore } from '../../store/app'
import { usePrefs } from '../../store/prefs'
import { CARDIO_TYPES } from '../../constants/app'
import {
  TIME_FRAMES, withinTimeFrame, grainForFrame, rollupCardio, hasLonePace, type TimeFrame, type CardioBucket,
} from '../../lib/utils'
import { Card, SecTitle, EmptyMsg } from '../ui/Card'
import { Chip } from '../ui/Chip'
import { Toggle } from '../ui/Fields'
import { SelEl } from '../ui/Input'
import { CHART, CHART_LINE, CHART_AXIS, CHART_TOOLTIP } from '../ui/chart'
import { CardioLogForm } from './cardio/CardioLogForm'
import { SportLogForm } from './cardio/SportLogForm'
import { SportProgress } from './cardio/SportProgress'
import { SessionList } from './cardio/SessionList'

/**
 * Cardio is the single destination for endurance stimulus. Sports folded in
 * here (doctrine ledger, 2026-08-26): a sport session is a cardio session with
 * a name and a quality rating, so it is a second capture mode — not a second
 * section. The DB merge is deliberately a separate brief; these are still two
 * tables underneath.
 */
type LogMode = 'cardio' | 'sport'

const MODES: { value: LogMode; label: string }[] = [
  { value: 'cardio', label: 'Cardio' },
  { value: 'sport', label: 'Sport' },
]

/** Recharts clones the `dot` element once per point, null ones included, so
 *  this draws only where the pace series has no segment to show the value —
 *  §9's one exception to "no resting dots" (roadmap 056). */
function LoneDot({ buckets, index, cx, cy }: { buckets: CardioBucket[]; index?: number; cx?: number; cy?: number }) {
  if (index == null || cx == null || cy == null || !hasLonePace(buckets, index)) return null
  return <circle cx={cx} cy={cy} r={2} fill={CHART.line2} stroke="none" />
}

export function CardioTab() {
  const [mode, setMode] = useState<LogMode>('cardio')
  const [filter, setFilter] = useState('All')
  // A window, not all time: the Garmin backfill (roadmap 054) put three years
  // of runs behind this chart, and one point per session over three years is
  // a hairball with the same month-day appearing three times.
  const [frame, setFrame] = useState<TimeFrame>('Last 90 days')
  const cardio = useAppStore(s => s.cardio)
  const weekStartDay = usePrefs(s => s.weekStartDay)

  const ct = filter === 'All' ? 'Running' : filter
  const sessions = cardio
    .filter(d => d.type === ct && withinTimeFrame(d.date, frame))
    .sort((a, b) => a.date.localeCompare(b.date))
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
        key: `${spansYears ? d.date.slice(2) : d.date.slice(5)}#${i}`,
        sessions: 1,
        duration: +d.duration.toFixed(2),
        ...(d.distance ? { distance: d.distance, pace: +(d.duration / d.distance).toFixed(2) } : {}),
      }))
    : rollupCardio(sessions, grain, weekStartDay)
  const labelOf = (key: string) => {
    const hash = key.indexOf('#')
    if (hash >= 0) return key.slice(0, hash)
    return grain === 'week' ? key.slice(2) : key
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
  const hasPace = chartData.length > 1 && chartData.some(d => d.distance)
  // A month of running can pass 1000 min; four digits clip at the 30 px the
  // per-session axis needs.
  const durationAxisWidth = chartData.some(d => d.duration >= 1000) ? 36 : 30
  const emptyMsg = sessions.length < 2
    ? (frame === 'All time' ? 'Not enough data to chart yet' : `Fewer than two ${ct} sessions in this frame`)
    : `All ${ct} sessions in this frame fall in one ${grain}`

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SecTitle>Log session</SecTitle>
        <div className="mb-3">
          <Toggle options={MODES} value={mode} onPick={setMode} />
        </div>
        {mode === 'cardio' ? <CardioLogForm /> : <SportLogForm />}
      </Card>

      <Card>
        <SecTitle>Progress</SecTitle>
        {/* Plain type names, no emoji: the marker is chrome here, not data (§7). */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {['All', ...CARDIO_TYPES].map(t => (
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
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={chartData} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis dataKey="key" tickFormatter={labelOf} {...CHART_AXIS} />
              <YAxis yAxisId="duration" width={durationAxisWidth} {...CHART_AXIS} />
              {/* Pace gets its own axis: minutes and min/km are two scales, and
                  one frame drawn on the wrong one is the pretty lie P2 forbids. */}
              {hasPace && (
                <YAxis yAxisId="pace" orientation="right" width={30} domain={['auto', 'auto']} {...CHART_AXIS} />
              )}
              <Tooltip {...CHART_TOOLTIP} labelFormatter={tooltipLabel} />
              <Line
                {...CHART_LINE}
                yAxisId="duration"
                dataKey="duration"
                stroke={CHART.line}
                name="Duration (min)"
                activeDot={{ r: 3, fill: CHART.line, stroke: 'none' }}
              />
              {/* Pace is the second series, so it is the pale ink (§9) — solid,
                  because a dash means "not data" and is spent on reference lines. */}
              {hasPace && (
                <Line
                  {...CHART_LINE}
                  yAxisId="pace"
                  dataKey="pace"
                  stroke={CHART.line2}
                  name="Pace (min/km)"
                  // Rolled up, a bucket with no paced neighbour has no line
                  // to sit on; per session every point has one.
                  dot={grain === 'session' ? false : <LoneDot buckets={chartData} />}
                  activeDot={{ r: 3, fill: CHART.line2, stroke: 'none' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyMsg>{emptyMsg}</EmptyMsg>
        )}
        {hasPace && (
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1.5 text-[10px] text-ink-3">
              <span className="w-3 h-[1.5px] bg-ink" /> Duration (min)
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-ink-3">
              <span className="w-3 h-[1.5px]" style={{ background: CHART.line2 }} /> Pace (min/km)
            </span>
          </div>
        )}
      </Card>

      <SportProgress />

      <SessionList />
    </div>
  )
}
