import { useState } from 'react'
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts'
import { useAppStore } from '../../store/app'
import { CARDIO_TYPES, CARDIO_ICONS } from '../../constants/app'
import { Card, SecTitle } from '../ui/Card'
import { Chip } from '../ui/Chip'
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

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SecTitle>Log Session</SecTitle>
        <div className="flex gap-1.5 mb-3">
          {([['cardio', '❤️ Cardio'], ['sport', '⚽ Sport']] as [LogMode, string][]).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${mode === m ? 'border-accent bg-accent-l text-accent' : 'border-border bg-surface text-muted'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {mode === 'cardio' ? <CardioLogForm /> : <SportLogForm />}
      </Card>

      <Card>
        <SecTitle>Progress</SecTitle>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {['All', ...CARDIO_TYPES].map(t => (
            <Chip key={t} active={filter === t} onClick={() => setFilter(t)}>
              {t === 'All' ? 'All' : `${CARDIO_ICONS[t]} ${t}`}
            </Chip>
          ))}
        </div>
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip />
              <Line type="monotone" dataKey="duration" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Duration (min)" />
              {chartData.some(d => d.distance) && (
                <Line type="monotone" dataKey="pace" stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Pace (min/km)" />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted text-center py-8">Not enough data to chart yet</p>
        )}
      </Card>

      <SportProgress />

      <SessionList />
    </div>
  )
}
