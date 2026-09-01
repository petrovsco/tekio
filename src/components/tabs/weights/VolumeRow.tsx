import { r05, deloadSets } from '../../../lib/utils'
import { DELOAD_REP_FACTOR } from '../../../constants/app'
import { DeloadBadge } from '../../ui/Badges'
import { Icon } from '../../ui/Icon'
import type { LiftSet } from '../../../types'

const setVol = (w: number, r: number) => w * r
const repsNeeded = (tv: number, w: number) => w > 0 ? Math.ceil(tv / w) : '–'

// The three load tiers used to carry a colour each (green / blue / violet) —
// a second palette, which design-system §1 does not allow. The label already
// says which tier it is, so the table is monochrome and the ink weight does
// the ranking instead.
const TIERS = [
  { label: '= kg', offset: 0 },
  { label: '+2.5 kg', offset: 2.5 },
  { label: '+5 kg', offset: 5 },
] as const

interface VolumeRowProps {
  pct: number
  lastSets: LiftSet[]
  isDeload: boolean
  onUse: (sets: LiftSet[]) => void
}

export function VolumeRow({ pct, lastSets, isDeload, onUse }: VolumeRowProps) {
  if (isDeload) {
    return (
      <div className="mb-2.5">
        <div className="flex items-center gap-1.5">
          <DeloadBadge />
          <span className="text-[11px] text-ink-2">{Math.round(DELOAD_REP_FACTOR * 100)}% reps</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {deloadSets(lastSets).map((s, i) => (
            <span key={i} className="text-[11px] px-2 py-1 rounded-[2px] bg-hairline text-ink font-semibold">
              Set {i + 1}: {s.weight}kg × {s.reps}
            </span>
          ))}
        </div>
      </div>
    )
  }

  const computeSets = (offset: number): LiftSet[] =>
    lastSets.map(s => {
      const w = offset === 0 ? s.weight : r05(s.weight + offset)
      const tv = setVol(s.weight, s.reps) * (1 + pct)
      const r = repsNeeded(tv, w)
      return { weight: w, reps: typeof r === 'number' ? r : 0 }
    })

  return (
    <div>
      <div className="grid gap-1 mb-1.5" style={{ gridTemplateColumns: '28px 1fr 1fr 1fr' }}>
        <div />
        {TIERS.map(t => (
          <span key={t.label} className="text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3 text-center py-0.5">{t.label}</span>
        ))}
        {lastSets.map((s, si) => (
          <div key={si} className="contents">
            <span className="text-[11px] text-ink-3 text-center self-center">S{si + 1}</span>
            {TIERS.map((t, ti) => {
              const w = t.offset === 0 ? s.weight : r05(s.weight + t.offset)
              const tv = setVol(s.weight, s.reps) * (1 + pct)
              return (
                <span key={ti} className="text-[11px] text-ink text-center py-1 rounded-[2px] bg-hairline font-semibold tabular-nums whitespace-nowrap">
                  {w}×{repsNeeded(tv, w)}
                </span>
              )
            })}
          </div>
        ))}
      </div>
      <div className="grid gap-1 mt-2" style={{ gridTemplateColumns: '28px 1fr 1fr 1fr' }}>
        <div />
        {TIERS.map((t, ti) => (
          <button
            key={ti}
            onClick={() => onUse(computeSets(t.offset))}
            className="py-1 flex items-center justify-center gap-0.5 rounded-[3px] text-[11px] font-semibold text-ink bg-white border border-line hover:border-ink cursor-pointer transition-colors"
          >
            Use <Icon name="chevronDown" size={11} />
          </button>
        ))}
      </div>
      <p className="text-[10px] text-ink-3 mt-2">
        Min reps to hit +{(pct * 100).toFixed(1).replace(/\.0$/, '')}% total volume
      </p>
    </div>
  )
}
