import { ResponsiveContainer, LineChart, Line, YAxis, Tooltip } from 'recharts'
import { CHART, CHART_LINE, CHART_TOOLTIP } from './chart'

interface MiniChartProps {
  data: { x: string; y: number }[]
  /** Override only to mark the one thing being pointed at (§9). */
  color?: string
}

/** The smallest conformer to design-system §9: ink line, no resting dots,
 *  no grid at this size, a hairline-bordered tooltip. */
export function MiniChart({ data, color = CHART.line }: MiniChartProps) {
  if (data.length < 2) return null
  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip
          {...CHART_TOOLTIP}
          formatter={(v: number) => [v, '']}
          labelFormatter={() => ''}
        />
        <Line
          {...CHART_LINE}
          dataKey="y"
          stroke={color}
          activeDot={{ r: 3, fill: color, stroke: 'none' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
