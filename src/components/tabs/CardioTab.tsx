import { useState } from 'react'
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts'
import { useAppStore } from '../../store/app'
import { CARDIO_TYPES } from '../../constants/app'
import { Card, SecTitle, EmptyMsg } from '../ui/Card'
import { Chip } from '../ui/Chip'
import { Toggle } from '../ui/Fields'
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

export function CardioTab() {
  const [mode, setMode] = useState<LogMode>('cardio')
  const [filter, setFilter] = useState('All')
  const cardio = useAppStore(s => s.cardio)

  const ct = filter === 'All' ? 'Running' : filter
  const chartData = cardio
    .filter(d => d.type === ct)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      date: d.date.slice(5),
      duration: +d.duration.toFixed(2),
      ...(d.distance ? { distance: d.distance, pace: +(d.duration / d.distance).toFixed(2) } : {}),
    }))
  const hasPace = chartData.some(d => d.distance)

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
        <div className="flex flex-wrap gap-1.5 mb-3">
          {['All', ...CARDIO_TYPES].map(t => (
            <Chip key={t} active={filter === t} onClick={() => setFilter(t)}>{t}</Chip>
          ))}
        </div>
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={chartData} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis dataKey="date" {...CHART_AXIS} />
              <YAxis yAxisId="duration" width={30} {...CHART_AXIS} />
              {/* Pace gets its own axis: minutes and min/km are two scales, and
                  one frame drawn on the wrong one is the pretty lie P2 forbids. */}
              {hasPace && (
                <YAxis yAxisId="pace" orientation="right" width={30} domain={['auto', 'auto']} {...CHART_AXIS} />
              )}
              <Tooltip {...CHART_TOOLTIP} />
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
                  activeDot={{ r: 3, fill: CHART.line2, stroke: 'none' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyMsg>Not enough data to chart yet</EmptyMsg>
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
