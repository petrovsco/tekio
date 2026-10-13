import { groupBy } from './utils'

// Supersets and circuits (RFC 0106): lifts sharing a group id are done back to
// back. One shape for plans and logged entries alike, since a plan's group id
// becomes the logged entry's `superset_group_id` unchanged.

/** Two lifts are a superset; three or more are a circuit. */
export const groupName = (size: number): 'Superset' | 'Circuit' => (size >= 3 ? 'Circuit' : 'Superset')

/**
 * The items in their order, with every group gathered where its first member
 * stands. A group left with one member reads as a plain lift.
 */
export function groupRuns<T>(items: T[], groupOf: (item: T) => string | undefined): T[][] {
  const byGroup = groupBy(items.filter(i => groupOf(i)), i => groupOf(i)!)
  const seen = new Set<string>()
  const runs: T[][] = []
  for (const item of items) {
    const g = groupOf(item)
    if (!g) { runs.push([item]); continue }
    if (seen.has(g)) continue
    seen.add(g)
    runs.push(byGroup.get(g)!)
  }
  return runs
}
