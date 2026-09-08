import type { ReactNode } from 'react'
import { ResponsiveContainer, LineChart, BarChart, CartesianGrid } from 'recharts'
import { EmptyMsg } from './Card'
import { CHART } from './chart'

/**
 * The frame every full-size chart shares (design-system §9): the "not enough
 * data" guard, the 170 px container, the chart's margin and the
 * horizontal-only grid. Four surfaces drew all four by hand, so the height and
 * the grid colour lived in four places; they now live here.
 *
 * The axes and the series stay with the caller on purpose. Recharts finds its
 * children by element type, so a `<Line>` returned from a component of ours
 * would be invisible to it — and the four axes differ enough (a second
 * right-hand axis on Cardio, an angled category axis on Sports) that passing
 * them as props would take more words than drawing them.
 */
export function ChartFrame({ data, empty = 'Not enough data to chart', bar = false, children }: {
  data: unknown[]
  empty?: ReactNode
  /** Bars instead of lines. They also want a tighter right margin: a bar ends
   *  at the axis, where a line's hover dot needs room to sit past it. */
  bar?: boolean
  children: ReactNode
}) {
  if (data.length <= 1) return <EmptyMsg>{empty}</EmptyMsg>
  const margin = { top: 6, right: bar ? 6 : 12, bottom: 0, left: 0 }
  const grid = <CartesianGrid vertical={false} stroke={CHART.grid} />
  return (
    <ResponsiveContainer width="100%" height={170}>
      {bar
        ? <BarChart data={data} margin={margin}>{grid}{children}</BarChart>
        : <LineChart data={data} margin={margin}>{grid}{children}</LineChart>}
    </ResponsiveContainer>
  )
}
