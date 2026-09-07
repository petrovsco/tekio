import { useMemo } from 'react'
import { useAppStore } from '../store/app'
import { usePrefs } from '../store/prefs'
import { observedHrMax, resolveHrMax, type ObservedHrMax } from '../lib/hrMax'

/**
 * The profile HRmax (roadmap 059): the observed peak, the typed override, and
 * the number the cardio classifier divides a typed average HR by.
 */
export function useHrMax(): { observed: ObservedHrMax | null; override: number | null; hrMax: number | null } {
  const cardio = useAppStore(s => s.cardio)
  const sports = useAppStore(s => s.sports)
  const override = usePrefs(s => s.hrMaxOverride)
  const observed = useMemo(() => observedHrMax(cardio, sports), [cardio, sports])
  const hrMax = useMemo(() => resolveHrMax(observed, override), [observed, override])
  return { observed, override, hrMax }
}
