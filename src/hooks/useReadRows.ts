import { useMemo } from 'react'
import type { ReadRows } from '@tekio/core'
import { useAppStore } from '../store/app'
import { usePrefs } from '../store/prefs'
import { useHrMax } from './useHrMax'

/** The store's rows as the reads take them (RFC 0094 step 2b): the same shape
 *  the API loads, so a screen and the API compute from the same inputs. */
export function useReadRows(): ReadRows {
  const weights = useAppStore(s => s.weights)
  const cardio = useAppStore(s => s.cardio)
  const sports = useAppStore(s => s.sports)
  const sleep = useAppStore(s => s.sleep)
  const donations = useAppStore(s => s.donations)
  const readinessInputs = useAppStore(s => s.readinessInputs)
  const muscleGroups = useAppStore(s => s.muscleGroups)
  const exerciseMuscles = useAppStore(s => s.exerciseMuscles)
  const exerciseAdaptations = useAppStore(s => s.exerciseAdaptations)
  const adaptationTargets = useAppStore(s => s.adaptationTargets)
  const readinessMethod = usePrefs(s => s.readinessMethod)
  const { hrMax } = useHrMax()
  return useMemo(() => ({
    weights, cardio, sports, sleep, donations, readinessInputs, muscleGroups, exerciseMuscles,
    exerciseAdaptations, adaptationTargets, hrMax, readinessMethod,
  }), [
    weights, cardio, sports, sleep, donations, readinessInputs, muscleGroups, exerciseMuscles,
    exerciseAdaptations, adaptationTargets, hrMax, readinessMethod,
  ])
}
