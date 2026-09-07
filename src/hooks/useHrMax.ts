import { useMemo } from 'react'
import { useAppStore } from '../store/app'
import { usePrefs } from '../store/prefs'
import {
  observedHrMax, resolveHrMax, formulaHrMax, hrMaxProposal,
  type ObservedHrMax, type HrMaxSource,
} from '../lib/hrMax'

export interface HrMaxRead {
  /** The replicated peak in the synced rows, whether or not the user has accepted it. */
  observed: ObservedHrMax | null
  /** The number the user set, and where it came from. */
  stored: { value: number; source: HrMaxSource } | null
  birthDate: string | null
  /** The age estimate, when there is a birth date. */
  estimate: number | null
  /** What the cardio classifier divides a typed average HR by. */
  hrMax: number | null
  /** What `hrMax` is — or null when there is no number. */
  source: HrMaxSource | 'estimate' | null
  /** The tracker peak the Profile should offer, when there is one to offer. */
  proposal: ObservedHrMax | null
}

/**
 * The profile HRmax (roadmap 060): the number the user set, else the age
 * estimate; the observed peak is a proposal until they accept it.
 */
export function useHrMax(): HrMaxRead {
  const cardio = useAppStore(s => s.cardio)
  const sports = useAppStore(s => s.sports)
  const storedValue = usePrefs(s => s.hrMaxStored)
  const storedSource = usePrefs(s => s.hrMaxSource)
  const birthDate = usePrefs(s => s.birthDate)
  const observed = useMemo(() => observedHrMax(cardio, sports), [cardio, sports])
  return useMemo(() => {
    const stored = storedValue != null && storedSource != null ? { value: storedValue, source: storedSource } : null
    const estimate = formulaHrMax(birthDate)
    const hrMax = resolveHrMax(stored?.value, birthDate)
    const source: HrMaxRead['source'] = stored ? stored.source : estimate != null ? 'estimate' : null
    return { observed, stored, birthDate, estimate, hrMax, source, proposal: hrMaxProposal(observed, stored?.value) }
  }, [observed, storedValue, storedSource, birthDate])
}
