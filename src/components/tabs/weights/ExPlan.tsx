import { useState } from 'react'
import { isDeloadDate, deloadSets } from '../../../lib/utils'
import { VolumeRow } from './VolumeRow'
import { Icon } from '../../ui/Icon'
import type { WeightEntry, LiftSet } from '../../../types'

const totalVol = (sets: LiftSet[]) => sets.reduce((s, x) => s + x.weight * x.reps, 0)

// Nothing here commits an entry — every button just prefills the log form — so
// they are all the reversible tone (design-system §8): outline for the act on
// the row, ghost for the quieter disclosure beside it.
const ACT_CHIP =
  'inline-flex items-center gap-0.5 px-2.5 py-[3px] text-[11px] font-semibold text-ink bg-white border border-line rounded-[3px] hover:border-ink cursor-pointer transition-colors'
const GHOST_CHIP =
  'px-2 py-[3px] text-[11px] font-semibold text-ink-3 hover:text-ink cursor-pointer transition-colors'

interface ExPlanProps {
  ex: string
  last: WeightEntry | undefined
  isDeload: boolean
  programStartDate?: string
  onPick: (ex: string) => void
  onPickWithSets: (ex: string, sets: LiftSet[]) => void
}

export function ExPlan({ ex, last, isDeload, programStartDate, onPick, onPickWithSets }: ExPlanProps) {
  const [expanded, setExpanded] = useState(false)
  const [volPct, setVolPct] = useState(7.5)

  // lastPerf skips deload sessions
  const lastPerf = last && programStartDate && isDeloadDate(programStartDate, last.date) ? undefined : last
  const lastV = lastPerf ? totalVol(lastPerf.sets) : null

  return (
    <div className="pt-3 border-t border-hairline mt-3 first:mt-0 first:border-0 first:pt-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-ink truncate">{ex}</span>
          {lastV !== null && (
            <span className="shrink-0 text-[10px] text-ink-3 bg-hairline px-1.5 py-0.5 rounded-[2px] tabular-nums">vol {lastV}kg</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isDeload ? (
            lastPerf && (
              <button onClick={() => onPickWithSets(ex, deloadSets(lastPerf.sets))} className={ACT_CHIP}>
                Deload <Icon name="chevronDown" size={11} />
              </button>
            )
          ) : (
            <>
              {lastPerf && (
                <button onClick={() => setExpanded(e => !e)} className={GHOST_CHIP}>
                  {expanded ? 'Hide' : 'Targets'}
                </button>
              )}
              <button
                onClick={() => lastPerf ? onPickWithSets(ex, lastPerf.sets) : onPick(ex)}
                className={ACT_CHIP}
              >
                Last <Icon name="chevronDown" size={11} />
              </button>
            </>
          )}
        </div>
      </div>

      {lastPerf && (
        <p className="text-[11px] text-ink-2 mb-1.5">
          Last ({lastPerf.date}): {lastPerf.sets.map(s => `${s.weight}kg×${s.reps}`).join(' · ')}
        </p>
      )}

      {expanded && lastPerf && (
        <div className="bg-white rounded-[3px] p-2.5 border border-line mt-1">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink-3 whitespace-nowrap">Volume goal</span>
            <input
              type="range" min="5" max="10" step="0.5" value={volPct}
              onChange={e => setVolPct(+e.target.value)}
              className="flex-1 accent-ink"
            />
            <span className="text-[13px] font-bold text-ink tabular-nums min-w-[38px] text-right">+{volPct}%</span>
          </div>
          <VolumeRow
            pct={volPct / 100}
            lastSets={lastPerf.sets}
            isDeload={false}
            onUse={sets => { onPickWithSets(ex, sets); setExpanded(false) }}
          />
          <p className="text-[10px] text-ink-3 mt-2 leading-relaxed">
            Volume = weight × reps. Adding reps at the same weight is always an option.
          </p>
        </div>
      )}
      {!lastPerf && (
        <p className="text-[11px] text-ink-3">No previous data — set your starting weight</p>
      )}
    </div>
  )
}
