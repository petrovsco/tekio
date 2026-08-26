import { r05, deloadSets } from '../../../lib/utils'
import { DELOAD_REP_FACTOR } from '../../../constants/app'
import type { LiftSet } from '../../../types'

const setVol = (w: number, r: number) => w * r
const repsNeeded = (tv: number, w: number) => w > 0 ? Math.ceil(tv / w) : '–'

const TIERS = [
  { label: '= kg', offset: 0, color: '#059669', bg: '#ecfdf5' },
  { label: '+2.5 kg', offset: 2.5, color: '#2563eb', bg: '#eff6ff' },
  { label: '+5 kg', offset: 5, color: '#7c3aed', bg: '#f5f3ff' },
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
        <span className="text-[11px] font-bold text-dl-tx bg-dl-bg px-2 py-0.5 rounded-full">
          ⚠️ Deload — {Math.round(DELOAD_REP_FACTOR * 100)}% reps
        </span>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {deloadSets(lastSets).map((s, i) => (
            <span key={i} className="text-xs px-2 py-1 rounded-lg bg-dl-bg text-dl-tx font-semibold">
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
          <span key={t.label} className="text-[10px] font-bold text-center py-0.5 rounded" style={{ color: t.color, background: t.bg }}>{t.label}</span>
        ))}
        {lastSets.map((s, si) => (
          <div key={si} className="contents">
            <span className="text-[11px] text-muted text-center self-center">S{si + 1}</span>
            {TIERS.map((t, ti) => {
              const w = t.offset === 0 ? s.weight : r05(s.weight + t.offset)
              const tv = setVol(s.weight, s.reps) * (1 + pct)
              return (
                <span key={ti} className="text-xs text-center py-1 rounded font-semibold whitespace-nowrap" style={{ color: t.color, background: t.bg }}>
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
            className="py-1.5 rounded-lg text-[11px] font-bold border"
            style={{ color: t.color, background: t.bg, borderColor: t.color }}
          >
            Use ↓
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted mt-2 italic">
        Min reps to hit +{(pct * 100).toFixed(1).replace(/\.0$/, '')}% total volume
      </p>
    </div>
  )
}
