import { useState } from 'react'
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts'
import { useAppStore } from '../../../store/app'
import { usePrefs } from '../../../store/prefs'
import { weekKey } from '../../../lib/utils'
import { Card, SecTitle, EmptyMsg } from '../../ui/Card'
import { SelEl } from '../../ui/Input'
import { CHART, CHART_AXIS, CHART_TOOLTIP } from '../../ui/chart'

const TIME_FRAMES = ['All time', 'Last 30 days', 'Last 90 days', 'This year'] as const
type TimeFrame = typeof TIME_FRAMES[number]

function withinTimeFrame(date: string, frame: TimeFrame): boolean {
  if (frame === 'All time') return true
  const d = new Date(date)
  const now = new Date()
  if (frame === 'This year') return d.getFullYear() === now.getFullYear()
  const days = frame === 'Last 30 days' ? 30 : 90
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - days)
  return d >= cutoff
}

/** One column of the win/loss/tie record. The label names the outcome, so the
 *  number needs no colour of its own (design-system §1). */
function RecordStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-[17px] font-bold text-ink tabular-nums leading-tight">{value}</p>
      <p className="text-[9px] font-bold text-ink-3 uppercase tracking-[0.10em] mt-0.5">{label}</p>
    </div>
  )
}

/**
 * Sessions-per-week for one sport, plus the win/loss record for sports that
 * track a competitor. Sport frequency is a session count, not a duration
 * trend, so it stays its own card rather than joining the cardio line chart.
 */
export function SportProgress() {
  const [selSport, setSelSport] = useState('')
  const [statsCompetitor, setStatsCompetitor] = useState('')
  const [statsTimeFrame, setStatsTimeFrame] = useState<TimeFrame>('All time')
  const { sports, sportTypes } = useAppStore()
  const { weekStartDay } = usePrefs()

  const allSports = [...new Set(sports.map(d => d.sport))].sort()
  if (allSports.length === 0) return null

  const chartSport = selSport || allSports[0]
  const weekMap: Record<string, number> = {}
  sports.filter(d => d.sport === chartSport).forEach(d => {
    const wk = weekKey(d.date, weekStartDay)
    weekMap[wk] = (weekMap[wk] || 0) + 1
  })
  const chartData = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, sessions]) => ({ week: week.slice(5), sessions }))

  const chartSportType = sportTypes.find(t => t.name.toLowerCase() === chartSport.toLowerCase())
  const chartHasCompetitor = chartSportType?.hasCompetitor ?? false
  const competitorsForChartSport = [...new Set(
    sports.filter(d => d.sport === chartSport).flatMap(d => d.competitorNames ?? [])
  )].sort()
  const statsEntries = sports.filter(d =>
    d.sport === chartSport &&
    d.result &&
    withinTimeFrame(d.date, statsTimeFrame) &&
    (!statsCompetitor || (d.competitorNames ?? []).includes(statsCompetitor))
  )
  const wins = statsEntries.filter(d => d.result === 'win').length
  const losses = statsEntries.filter(d => d.result === 'loss').length
  const ties = statsEntries.filter(d => d.result === 'tie').length

  return (
    <Card>
      <SecTitle>Sessions per week — {chartSport}</SecTitle>
      <div className="mb-3">
        <SelEl
          value={chartSport}
          onChange={e => { setSelSport(e.target.value); setStatsCompetitor('') }}
          options={allSports.map(s => ({ value: s, label: s }))}
        />
      </div>
      {chartHasCompetitor && (
        <div className="flex flex-col gap-2.5 mb-3 px-2.5 py-2.5 rounded-[3px] bg-hairline border border-line">
          <div className="grid grid-cols-2 gap-2">
            <SelEl
              value={statsCompetitor}
              onChange={e => setStatsCompetitor(e.target.value)}
              options={[
                { value: '', label: 'All competitors' },
                ...competitorsForChartSport.map(c => ({ value: c, label: c })),
              ]}
            />
            <SelEl
              value={statsTimeFrame}
              onChange={e => setStatsTimeFrame(e.target.value as TimeFrame)}
              options={TIME_FRAMES.map(f => ({ value: f, label: f }))}
            />
          </div>
          <div className="flex items-center justify-center gap-8">
            <RecordStat label="Win" value={wins} />
            <RecordStat label="Loss" value={losses} />
            <RecordStat label="Tie" value={ties} />
          </div>
        </div>
      )}
      {chartData.length > 1 ? (
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={chartData} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="week" angle={-25} textAnchor="end" height={38} {...CHART_AXIS} />
            <YAxis allowDecimals={false} width={22} {...CHART_AXIS} />
            <Tooltip {...CHART_TOOLTIP} formatter={(v: number) => [v, 'Sessions']} />
            {/* The ramp's mid step, so a bar never reads as a filled muscle (§9). */}
            <Bar dataKey="sessions" fill={CHART.bar} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyMsg>Not enough data to chart</EmptyMsg>
      )}
    </Card>
  )
}
