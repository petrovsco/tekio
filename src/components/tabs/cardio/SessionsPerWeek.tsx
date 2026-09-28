import { useState } from 'react'
import { XAxis, YAxis, Tooltip, Bar } from 'recharts'
import { useAppStore } from '../../../store/app'
import { usePrefs } from '../../../store/prefs'
import { TIME_FRAMES, withinTimeFrame, rollupCardio, uniqSorted, type TimeFrame } from '../../../lib/utils'
import { MICRO_LABEL } from '../../ui/Badges'
import { Card, SecTitle } from '../../ui/Card'
import { SelEl } from '../../ui/Input'
import { CHART, CHART_AXIS, CHART_TOOLTIP } from '../../ui/chart'
import { ChartFrame } from '../../ui/ChartFrame'
import { lensSessions, sessionLabel, type Lens } from './lens'

/** One column of the win/loss/tie record. The label names the outcome, so the
 *  number needs no colour of its own (design-system §1). */
function RecordStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-[17px] font-bold text-ink tabular-nums leading-tight">{value}</p>
      <p className={`${MICRO_LABEL} mt-0.5`}>{label}</p>
    </div>
  )
}

/** The drill-down's first entry: everything the lens admits. */
const ALL = ''

/**
 * Session count over time for what the lens admits, plus the win/loss record
 * for a sport that tracks a competitor. Frequency is a count, not a duration
 * trend, so it stays its own card rather than joining the Progress chart.
 * Under a lens the drill-down lists only that lens's names; under All it
 * splits into cardio and sport (roadmap 076).
 */
export function SessionsPerWeek({ lens }: { lens: Lens }) {
  const [drill, setDrill] = useState(ALL)
  // Three years of Garmin runs one bar a week is a comb at 390 px, so the
  // chart takes a frame like Progress does, and all time counts by month.
  const [frame, setFrame] = useState<TimeFrame>('Last 90 days')
  const [statsCompetitor, setStatsCompetitor] = useState('')
  const [statsTimeFrame, setStatsTimeFrame] = useState<TimeFrame>('All time')
  const cardio = useAppStore(s => s.cardio)
  const sports = useAppStore(s => s.sports)
  const sportTypes = useAppStore(s => s.sportTypes)
  const weekStartDay = usePrefs(s => s.weekStartDay)

  const all = lensSessions(cardio, sports, lens)
  if (all.length === 0) return null

  const options = lens === 'all'
    ? [{ value: ALL, label: 'All sessions' }, { value: 'cardio', label: 'Cardio' }, { value: 'sport', label: 'Sport' }]
    : [
        { value: ALL, label: lens === 'cardio' ? 'All cardio' : 'All sports' },
        ...uniqSorted(all.map(sessionLabel)).map(n => ({ value: n, label: n })),
      ]
  const picked = drill === ALL
    ? all
    : all.filter(s => lens === 'all' ? s.kind === drill : sessionLabel(s) === drill)
  const grain = frame === 'All time' ? 'month' : 'week'
  const chartData = rollupCardio(
    picked.filter(s => withinTimeFrame(s.entry.date, frame)).map(s => ({ date: s.entry.date })).reverse(),
    grain,
    weekStartDay,
  ).map(b => ({ key: grain === 'week' ? b.key.slice(5) : b.key, sessions: b.sessions }))

  // The record belongs to one named sport, so it shows only once one is picked.
  const sport = lens === 'sport' && drill !== ALL ? drill : ''
  const sportType = sport ? sportTypes.find(t => t.name.toLowerCase() === sport.toLowerCase()) : undefined
  const hasCompetitor = sportType?.hasCompetitor ?? false
  const competitors = uniqSorted(
    sports.filter(d => d.sport === sport).flatMap(d => d.competitorNames ?? [])
  )
  const statsEntries = sports.filter(d =>
    d.sport === sport &&
    d.result &&
    withinTimeFrame(d.date, statsTimeFrame) &&
    (!statsCompetitor || (d.competitorNames ?? []).includes(statsCompetitor))
  )
  const wins = statsEntries.filter(d => d.result === 'win').length
  const losses = statsEntries.filter(d => d.result === 'loss').length
  const ties = statsEntries.filter(d => d.result === 'tie').length

  return (
    <Card>
      <SecTitle>Sessions per {grain}</SecTitle>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <SelEl
            aria-label="Sessions of"
            value={drill}
            onChange={e => { setDrill(e.target.value); setStatsCompetitor('') }}
            options={options}
          />
        </div>
        {/* SelEl is w-full by design; the wrapper gives it its width. */}
        <div className="w-[124px] shrink-0">
          <SelEl
            aria-label="Time frame"
            value={frame}
            onChange={e => setFrame(e.target.value as TimeFrame)}
            options={TIME_FRAMES.map(f => ({ value: f, label: f }))}
          />
        </div>
      </div>
      {hasCompetitor && (
        <div className="flex flex-col gap-2.5 mb-3 px-2.5 py-2.5 rounded-[3px] bg-hairline border border-line">
          <div className="grid grid-cols-2 gap-2">
            <SelEl
              value={statsCompetitor}
              onChange={e => setStatsCompetitor(e.target.value)}
              options={[
                { value: '', label: 'All competitors' },
                ...competitors.map(c => ({ value: c, label: c })),
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
      <ChartFrame data={chartData} bar empty={`Not enough ${grain}s in this frame to chart`}>
        <XAxis dataKey="key" angle={-25} textAnchor="end" height={38} {...CHART_AXIS} />
        <YAxis allowDecimals={false} width={22} {...CHART_AXIS} />
        <Tooltip {...CHART_TOOLTIP} formatter={(v: number) => [v, 'Sessions']} />
        {/* The ramp's mid step, so a bar never reads as a filled muscle (§9). */}
        <Bar dataKey="sessions" fill={CHART.bar} radius={[2, 2, 0, 0]} />
      </ChartFrame>
    </Card>
  )
}
