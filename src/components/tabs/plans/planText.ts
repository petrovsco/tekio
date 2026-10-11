import { formatDurationMins } from '../../../lib/utils'
import type { PlannedSession } from '../../../types'

/** A plan's name as a row reads it. A mobility plan has no name of its own. */
export const planTitle = (p: PlannedSession): string =>
  p.kind === 'mobility' ? 'Mobility' : p.name

/** Its targets, as the dashed chips under the name. */
export function planChips(p: PlannedSession): string[] {
  if (p.kind === 'mobility') {
    return (p.stretches ?? []).map(s => (s.duration ? `${s.name} ${s.duration} min` : s.name))
  }
  return [
    ...(p.duration ? [`${p.duration} min`] : []),
    ...(p.distance ? [`${p.distance} km`] : []),
    ...(p.format === 'intervals' ? [p.boutSeconds ? `Intervals, ${formatDurationMins(p.boutSeconds / 60)} bouts` : 'Intervals'] : []),
    ...(p.format === 'steady' ? ['Steady'] : []),
  ]
}
