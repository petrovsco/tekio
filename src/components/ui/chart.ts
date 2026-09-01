// The SIGNAL chart palette (design-system §9), in one place so every Recharts
// surface reads the same. Recharts takes colours as props, not classes, so
// these are literals rather than tokens — keep them in step with index.css.

export const CHART = {
  /** The data. */
  line: '#1a1a1a',
  /** A second series; there is no third (§9 — draw two charts instead). */
  line2: '#c9c9c7',
  /** Bars sit at the ramp's mid step so they never read as a filled muscle. */
  bar: '#8f8f8f',
  barEmphasis: '#1a1a1a',
  /** Marks single points only, never a series. */
  accent: '#c2410c',
  grid: '#eeeeec',
  axis: '#8a8a8a',
  /** A target or cap — the only dash in the system. */
  reference: '#c9c9c7',
} as const

export const CHART_LINE = { strokeWidth: 1.5, dot: false, type: 'monotone' } as const

export const CHART_AXIS = {
  tick: { fontSize: 11, fill: CHART.axis },
  axisLine: false,
  tickLine: false,
} as const

export const CHART_TOOLTIP = {
  contentStyle: {
    fontSize: 11,
    padding: '3px 7px',
    borderRadius: 3,
    border: '1px solid #e2e2e0',
    background: '#ffffff',
    boxShadow: 'none',
    color: CHART.line,
  },
  cursor: { stroke: CHART.grid, strokeWidth: 1 },
} as const
