import { useState } from 'react'
import { useAppStore } from '../../../store/app'
import { TIME_FRAMES, withinTimeFrame, uniqSorted, type TimeFrame } from '../../../lib/utils'
import { MICRO_LABEL } from '../../ui/Badges'
import { SelEl } from '../../ui/Input'

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

/**
 * The win/loss/tie record for one named sport that tracks a competitor. It
 * belongs to one sport, so Progress shows it only once a sport chip is picked.
 * It lived on the Sessions per week card until that chart was cut
 * (tekio.rfcs/rfcs/done/0034-v2-1-candidates-tbc.md): Home already reads session
 * counts against their targets, and the record was the one thing it held that
 * nothing else shows.
 */
export function WinLossRecord({ sport }: { sport: string }) {
  const [competitor, setCompetitor] = useState('')
  const [frame, setFrame] = useState<TimeFrame>('All time')
  const sports = useAppStore(s => s.sports)
  const sportTypes = useAppStore(s => s.sportTypes)

  const sportType = sportTypes.find(t => t.name.toLowerCase() === sport.toLowerCase())
  if (!sportType?.hasCompetitor) return null

  const competitors = uniqSorted(
    sports.filter(d => d.sport === sport).flatMap(d => d.competitorNames ?? [])
  )
  const entries = sports.filter(d =>
    d.sport === sport &&
    d.result &&
    withinTimeFrame(d.date, frame) &&
    (!competitor || (d.competitorNames ?? []).includes(competitor))
  )
  const count = (r: string) => entries.filter(d => d.result === r).length

  return (
    <div className="flex flex-col gap-2.5 mb-3 px-2.5 py-2.5 rounded-[3px] bg-hairline border border-line">
      <div className="grid grid-cols-2 gap-2">
        <SelEl
          aria-label="Competitor"
          value={competitor}
          onChange={e => setCompetitor(e.target.value)}
          options={[
            { value: '', label: 'All competitors' },
            ...competitors.map(c => ({ value: c, label: c })),
          ]}
        />
        <SelEl
          aria-label="Record time frame"
          value={frame}
          onChange={e => setFrame(e.target.value as TimeFrame)}
          options={TIME_FRAMES.map(f => ({ value: f, label: f }))}
        />
      </div>
      <div className="flex items-center justify-center gap-8">
        <RecordStat label="Win" value={count('win')} />
        <RecordStat label="Loss" value={count('loss')} />
        <RecordStat label="Tie" value={count('tie')} />
      </div>
    </div>
  )
}
