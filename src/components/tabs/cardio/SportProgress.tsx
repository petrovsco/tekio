import { useState } from 'react'
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts'
import { useAppStore } from '../../../store/app'
import { usePrefs } from '../../../store/prefs'
import { weekKey } from '../../../lib/utils'
import { Card, SecTitle } from '../../ui/Card'

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
      <SecTitle>Sessions per Week — {chartSport}</SecTitle>
      <select
        value={chartSport}
        onChange={e => { setSelSport(e.target.value); setStatsCompetitor('') }}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-primary mb-3 focus:outline-none"
      >
        {allSports.map(s => <option key={s}>{s}</option>)}
      </select>
      {chartHasCompetitor && (
        <div className="flex flex-col gap-2.5 mb-3 px-3 py-2.5 rounded-lg bg-bg border border-border">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={statsCompetitor}
              onChange={e => setStatsCompetitor(e.target.value)}
              className="border border-border rounded-lg px-2 py-1.5 text-xs bg-surface text-primary focus:outline-none"
            >
              <option value="">All competitors</option>
              {competitorsForChartSport.map(c => <option key={c}>{c}</option>)}
            </select>
            <select
              value={statsTimeFrame}
              onChange={e => setStatsTimeFrame(e.target.value as TimeFrame)}
              className="border border-border rounded-lg px-2 py-1.5 text-xs bg-surface text-primary focus:outline-none"
            >
              {TIME_FRAMES.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-lg font-bold text-green-700">{wins}</p>
              <p className="text-[10px] text-muted font-medium">Win</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-700">{losses}</p>
              <p className="text-[10px] text-muted font-medium">Loss</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-600">{ties}</p>
              <p className="text-[10px] text-muted font-medium">Tie</p>
            </div>
          </div>
        </div>
      )}
      {chartData.length > 1 ? (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#64748b' }} angle={-25} textAnchor="end" height={36} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} width={20} />
            <Tooltip formatter={(v: number) => [v, 'Sessions']} />
            <Bar dataKey="sessions" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-muted text-center py-6">Not enough data to chart</p>
      )}
    </Card>
  )
}
