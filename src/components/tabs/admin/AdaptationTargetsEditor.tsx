import { useState } from 'react'
import { useAppStore } from '../../../store/app'
import { SecTitle } from '../../ui/Card'
import { FIELD } from '../../ui/Input'
import { ADAPTATIONS } from '../../../constants/adaptations'
import { updateAdaptationTarget } from '../../../lib/db/adaptationTargets'
import type { Adaptation } from '../../../types'

export function AdaptationTargetsEditor() {
  const { adaptationTargets, reloadAdaptationTargets, setToast } = useAppStore()
  const [saving, setSaving] = useState<Adaptation | null>(null)

  const save = async (
    key: Adaptation,
    field: 'weeklyMuscleTarget' | 'weeklySessionTarget',
    value: number,
  ) => {
    if (!Number.isFinite(value) || value < 0) return
    setSaving(key)
    try {
      await updateAdaptationTarget(key, { [field]: Math.round(value) })
      await reloadAdaptationTargets()
      setToast('Target updated.')
    } catch {
      setToast('Failed to update target.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <SecTitle className="mb-1">Weekly targets</SecTitle>
        <p className="text-[11px] text-ink-2 leading-[1.4]">
          Muscle-linked adaptations use a weekly per-muscle set target; the cardio ones use a
          weekly session target. Reaching a target marks the adaptation “on target” on the dashboard.
        </p>
      </div>

      {/* Each row used to carry the adaptation's emoji and tint its input.
          Neither survives §1 and §7 — the name is what identifies the row, and
          one tint per adaptation would be seven colours claiming seven
          meanings. */}
      <div className="flex flex-col divide-y divide-hairline">
        {ADAPTATIONS.map(meta => {
          const isResistance = meta.modality === 'resistance'
          const field = isResistance ? 'weeklyMuscleTarget' : 'weeklySessionTarget'
          const current = adaptationTargets[meta.key]?.[field]
            ?? (isResistance ? meta.weeklyMuscleTarget : meta.weeklySessionTarget)
          return (
            <div key={meta.key} className="flex items-center gap-2 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink truncate">{meta.label}</p>
                <p className="text-[10px] text-ink-3">{isResistance ? 'sets / muscle / week' : 'sessions / week'}</p>
              </div>
              {/* The field is full-width inside a fixed cell rather than a
                  narrow field: FIELD already sets w-full, and two width
                  utilities on one element do not resolve by source order. */}
              <div className="w-16 shrink-0">
                <input
                  type="number"
                  min="0"
                  step="1"
                  aria-label={`${meta.label} weekly target`}
                  defaultValue={current}
                  disabled={saving === meta.key}
                  onBlur={e => {
                    const v = +e.target.value
                    if (v !== current) save(meta.key, field, v)
                  }}
                  className={`${FIELD} text-right tabular-nums disabled:opacity-40`}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
