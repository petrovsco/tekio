import { r05 } from '../../../lib/utils'
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
  onUse: (sets: LiftSet[]) => void
}

export function VolumeRow({ pct, lastSets, onUse }: VolumeRowProps) {
  // One computation per tier, read by both the table and its "Use" button —
  // they must prescribe the same thing. `reps` is '–' where there is no weight
  // to divide the target volume by; "Use" logs that row as 0 reps.
  const tiers = TIERS.map(t => ({
    label: t.label,
    sets: lastSets.map(s => {
      const weight = t.offset === 0 ? s.weight : r05(s.weight + t.offset)
      return { weight, reps: repsNeeded(setVol(s.weight, s.reps) * (1 + pct), weight) }
    }),
  }))

  return (
    <div>
      <div className="grid gap-1 mb-1.5" style={{ gridTemplateColumns: '28px 1fr 1fr 1fr' }}>
        <div />
        {tiers.map(t => (
          <span key={t.label} className="text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3 text-center py-0.5">{t.label}</span>
        ))}
        {lastSets.map((_, si) => (
          <div key={si} className="contents">
            <span className="text-[11px] text-ink-3 text-center self-center">S{si + 1}</span>
            {tiers.map((t, ti) => (
              <span key={ti} className="text-[11px] text-ink text-center py-1 rounded-[2px] bg-hairline font-semibold tabular-nums whitespace-nowrap">
                {t.sets[si].weight}×{t.sets[si].reps}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="grid gap-1 mt-2" style={{ gridTemplateColumns: '28px 1fr 1fr 1fr' }}>
        <div />
        {tiers.map((t, ti) => (
          <button
            key={ti}
            onClick={() => onUse(t.sets.map(s => ({ weight: s.weight, reps: typeof s.reps === 'number' ? s.reps : 0 })))}
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
