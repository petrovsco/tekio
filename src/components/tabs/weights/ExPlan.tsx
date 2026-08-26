import { useState } from 'react'
import { isDeloadDate, deloadSets } from '../../../lib/utils'
import { VolumeRow } from './VolumeRow'
import type { WeightEntry, LiftSet } from '../../../types'

const totalVol = (sets: LiftSet[]) => sets.reduce((s, x) => s + x.weight * x.reps, 0)

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
    <div className="pt-3 border-t border-bg mt-3 first:mt-0 first:border-0 first:pt-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">{ex}</span>
          {lastV !== null && (
            <span className="text-[11px] text-muted bg-bg px-1.5 py-0.5 rounded-full">vol {lastV}kg</span>
          )}
        </div>
        <div className="flex gap-1.5">
          {isDeload ? (
            lastPerf && (
              <button
                onClick={() => onPickWithSets(ex, deloadSets(lastPerf.sets))}
                className="text-[11px] font-semibold text-white bg-dl-tx rounded-full px-2.5 py-1"
              >
                Deload ↓
              </button>
            )
          ) : (
            <>
              {lastPerf && (
                <button
                  onClick={() => setExpanded(e => !e)}
                  className="text-[11px] font-semibold text-accent bg-accent-l border border-indigo-200 rounded-full px-2.5 py-1"
                >
                  {expanded ? 'Hide' : 'Targets'}
                </button>
              )}
              <button
                onClick={() => lastPerf ? onPickWithSets(ex, lastPerf.sets) : onPick(ex)}
                className="text-[11px] font-semibold text-white bg-accent rounded-full px-2.5 py-1"
              >
                Last ↓
              </button>
            </>
          )}
        </div>
      </div>

      {lastPerf && (
        <p className="text-[11px] text-muted mb-1.5">
          Last ({lastPerf.date}): {lastPerf.sets.map(s => `${s.weight}kg×${s.reps}`).join(' · ')}
        </p>
      )}

      {expanded && lastPerf && (
        <div className="bg-bg rounded-xl p-2.5 border border-border mt-1">
          <div className="flex items-center gap-2.5 mb-3 px-2.5 py-2 bg-surface rounded-lg border border-border">
            <span className="text-[11px] text-muted font-semibold whitespace-nowrap">Volume goal</span>
            <input
              type="range" min="5" max="10" step="0.5" value={volPct}
              onChange={e => setVolPct(+e.target.value)}
              className="flex-1 accent-accent"
            />
            <span className="text-sm font-bold text-accent min-w-[38px] text-right">+{volPct}%</span>
          </div>
          <VolumeRow
            pct={volPct / 100}
            lastSets={lastPerf.sets}
            isDeload={false}
            onUse={sets => { onPickWithSets(ex, sets); setExpanded(false) }}
          />
          <p className="text-[10px] text-muted mt-2 leading-relaxed">
            💡 Volume = weight × reps. Adding reps at the same weight is always an option.
          </p>
        </div>
      )}
      {!lastPerf && (
        <p className="text-xs text-muted italic">No previous data — set your starting weight</p>
      )}
    </div>
  )
}
