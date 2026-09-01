import { useState } from 'react'
import { useAppStore } from '../../../store/app'
import { SecTitle } from '../../ui/Card'
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
        <SecTitle className="mb-1">Weekly Targets</SecTitle>
        <p className="text-[11px] text-muted">
          Resistance adaptations use a weekly per-muscle set target; cardio/skill use a weekly
          session target. Reaching a target marks the adaptation “on target” on the dashboard.
        </p>
      </div>

      <div className="flex flex-col divide-y divide-bg">
        {ADAPTATIONS.map(meta => {
          const isResistance = meta.modality === 'resistance'
          const field = isResistance ? 'weeklyMuscleTarget' : 'weeklySessionTarget'
          const current = adaptationTargets[meta.key]?.[field]
            ?? (isResistance ? meta.weeklyMuscleTarget : meta.weeklySessionTarget)
          return (
            <div key={meta.key} className="flex items-center gap-2 py-2">
              <span className="text-lg w-6 text-center shrink-0">{meta.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary truncate">{meta.label}</p>
                <p className="text-[10px] text-muted">{isResistance ? 'sets / muscle / week' : 'sessions / week'}</p>
              </div>
              <input
                type="number"
                min="0"
                step="1"
                defaultValue={current}
                disabled={saving === meta.key}
                onBlur={e => {
                  const v = +e.target.value
                  if (v !== current) save(meta.key, field, v)
                }}
                className="w-16 border border-border rounded-lg px-2.5 py-1.5 text-sm text-right bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                style={{ borderLeft: `3px solid ${meta.color}` }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
