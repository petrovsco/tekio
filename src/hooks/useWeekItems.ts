import { useMemo } from 'react'
import { useAppStore } from '../store/app'
import { weekItems, type WeekItem } from '../lib/week'

/** Every plan of every kind, as the week reads them (RFC 0114). */
export function useWeekItems(): WeekItem[] {
  const plans = useAppStore(s => s.plans)
  const sessions = useAppStore(s => s.sessionPlans)
  const cardio = useAppStore(s => s.cardio)
  const sports = useAppStore(s => s.sports)
  const mobility = useAppStore(s => s.mobility)
  return useMemo(() => weekItems(plans, sessions, { cardio, sports, mobility }), [plans, sessions, cardio, sports, mobility])
}
