import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { TREND_DAYS, type TrendDay } from '../../../lib/fusedRead'
import { fmtDate } from '../../../lib/utils'
import { CHART } from '../../ui/chart'

// The readiness sheet's long view (Peter, 2026-10-14): what the verdict read
// each day, against the normal it was read against that day, over about six
// months, with the single readings behind it. It answers what the gauge
// cannot: whether today's dip is one week or a slide, and where the normal
// itself has been going. Drawn by hand rather than with Recharts, which is its
// own download the sheet should not wait on when it opens from Home's card;
// styled by design-system §9. See tekio.rfcs/rfcs/0109-readiness-on-your-normal.md

const HEIGHT = 136
const PAD = { top: 6, right: 6, bottom: 20, left: 28 }
/** The normal's band: a reference area, one step under the card border. */
const BAND = '#e2e2e0'
/** Where scrubbing shows a day: a solid hairline, never the reference dash. */
const CURSOR = '#c9c9c7'

interface ReadinessTrendProps {
  days: TrendDay[]
  /** What one reading is called in the readout: 'night', 'morning',
   *  'check-in'. */
  singleName: string
  /** The line, as the legend and the readout name it: '7-night average'. */
  lineName: string
  /** The band: 'your normal', 'your usual'. */
  bandName: string
  /** After a printed number: ' ms', ' of 25'. */
  unit: string
  /** HRV: the 7-day mean as a line, the single readings as grey dots behind
   *  it. The check-in reads each day on its own, so its days are ink dots and
   *  nothing joins them: a line would claim a continuity it does not have. */
  dots: boolean
  /** The chart's name, before the span: 'HRV'. */
  title: string
}

/** Grid steps a value axis may use: whole numbers that read at a glance. */
const STEPS = [1, 2, 5, 10, 20, 25, 50, 100]

/** The value axis: the span every drawn value needs, opened a little, and two
 *  to four gridlines on round numbers inside it. */
function valueAxis(values: number[]) {
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const pad = Math.max((hi - lo) * 0.08, 1)
  const from = lo - pad
  const to = hi + pad
  const step = STEPS.find(s => Math.floor(to / s) - Math.ceil(from / s) + 1 <= 4) ?? 100
  const ticks: number[] = []
  for (let v = Math.ceil(from / step) * step; v <= to; v += step) ticks.push(v)
  return { from, to, ticks }
}

/** A monotone cubic through points on an even x step (Steffen's method, as
 *  d3's curveMonotoneX): smooth like the app's other lines, never
 *  overshooting a day's value. */
function monotone(pts: [number, number][]): string {
  if (pts.length === 1) return ''
  const n = pts.length
  const s: number[] = []
  for (let i = 0; i < n - 1; i++) s.push((pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]))
  const t: number[] = new Array<number>(n)
  t[0] = s[0]
  t[n - 1] = s[n - 2]
  for (let i = 1; i < n - 1; i++) {
    const p = (s[i - 1] + s[i]) / 2
    t[i] = (Math.sign(s[i - 1]) + Math.sign(s[i])) * Math.min(Math.abs(s[i - 1]), Math.abs(s[i]), 0.5 * Math.abs(p)) || 0
  }
  const f = (v: number) => v.toFixed(1)
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`
  for (let i = 0; i < n - 1; i++) {
    const h = (pts[i + 1][0] - pts[i][0]) / 3
    d += `C${f(pts[i][0] + h)},${f(pts[i][1] + t[i] * h)} ${f(pts[i + 1][0] - h)},${f(pts[i + 1][1] - t[i + 1] * h)} ${f(pts[i + 1][0])},${f(pts[i + 1][1])}`
  }
  return d
}

/** Consecutive runs of days where `has` holds — a gap breaks a line or band. */
function runs(days: TrendDay[], has: (d: TrendDay) => boolean): number[][] {
  const out: number[][] = []
  let cur: number[] = []
  days.forEach((d, i) => {
    if (has(d)) cur.push(i)
    else if (cur.length) { out.push(cur); cur = [] }
  })
  if (cur.length) out.push(cur)
  return out
}

export default function ReadinessTrend({ days, singleName, lineName, bandName, unit, dots, title }: ReadinessTrendProps) {
  const n = days.length
  const drawn = n >= 2
  const wrap = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(340)
  const [hover, setHover] = useState<number | null>(null)

  // Drawn at the sheet's real width, so the 11 px labels stay 11 px.
  useEffect(() => {
    const el = wrap.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(200, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [drawn])

  if (!drawn) return null

  const values: number[] = []
  for (const d of days) {
    if (dots && d.single !== null) values.push(d.single)
    if (d.read !== null) values.push(d.read)
    if (d.low !== null && d.high !== null) values.push(d.low, d.high)
  }
  const axis = valueAxis(values)
  const plotW = width - PAD.left - PAD.right
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (i / (n - 1)) * plotW
  const y = (v: number) => PAD.top + (1 - (v - axis.from) / (axis.to - axis.from)) * plotH

  const bands = runs(days, d => d.low !== null && d.high !== null).map(r =>
    `M${r.map(i => `${x(i).toFixed(1)},${y(days[i].high!).toFixed(1)}`).join('L')}` +
    `L${[...r].reverse().map(i => `${x(i).toFixed(1)},${y(days[i].low!).toFixed(1)}`).join('L')}Z`)
  const lines = dots
    ? runs(days, d => d.read !== null).map(r => r.map(i => [x(i), y(days[i].read!)] as [number, number]))
    : days.flatMap((d, i) => (d.read !== null ? [[[x(i), y(d.read)] as [number, number]]] : []))
  const hasBand = days.some(d => d.low !== null)
  const hasSingles = dots && days.some(d => d.single !== null)

  // Months along the bottom, on their first day; a span too short to hold two
  // gets its first and last days instead.
  let ticks = days.flatMap((d, i) => (d.date.endsWith('-01') ? [{ i, label: fmtDate(d.date.slice(0, 7), { year: 'never' }) }] : []))
  if (ticks.length < 2) {
    ticks = [0, n - 1].map(i => ({ i, label: fmtDate(days[i].date, { relative: false, year: 'never' }) }))
  }
  const labelled: typeof ticks = []
  for (const t of ticks) {
    const prev = labelled[labelled.length - 1]
    if (!prev || x(t.i) - x(prev.i) >= 44) labelled.push(t)
  }
  // A label at an end of the axis hangs inward rather than off the frame.
  const anchor = (i: number) => (x(i) < PAD.left + 20 ? 'start' : x(i) > width - 24 ? 'end' : 'middle')

  const pick = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - box.left) / box.width) * width
    setHover(Math.round(Math.min(Math.max((px - PAD.left) / plotW, 0), 1) * (n - 1)))
  }

  const span = n >= TREND_DAYS ? 'LAST 6 MONTHS' : `SINCE ${fmtDate(days[0].date, { relative: false }).toUpperCase()}`
  const h = hover !== null ? days[hover] : null
  const num = (v: number | null | undefined) => (v == null ? '—' : String(Math.round(v)))
  // One day in words, with the numbers the card would have printed that day
  // (invented figures): "Wed 8 Oct · night 66 · 7‑night average 63 · normal
  // 60–69 ms", or "Thu 9 Oct · 16 of 25 · usual 17–21".
  const readout = (d: TrendDay) => {
    const read = d.printed?.read ?? d.read
    const parts = [fmtDate(d.date, { weekday: true, relative: false })]
    if (dots) parts.push(`${singleName} ${num(d.single)}`, `${lineName} ${num(read)}`)
    else parts.push(read === null ? `no ${singleName}` : `${num(read)}${unit}`)
    if (d.printed) parts.push(`${bandName.replace('your ', '')} ${d.printed.low}–${d.printed.high}`)
    return parts.join(' · ') + (dots ? unit : '')
  }

  return (
    <div className="mt-3">
      <div className="text-[10px] font-bold tracking-[0.12em] text-ink-3 mb-1">{title} · {span}</div>
      <div ref={wrap}>
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="img"
          aria-label={`${title}: the ${lineName} against ${bandName}, ${span.toLowerCase()}`}
          className="block touch-pan-y select-none"
          onPointerDown={pick}
          onPointerMove={pick}
          // A finger lifting keeps its day on the readout; a mouse leaving
          // clears it, and so does a touch the page took for a scroll.
          onPointerLeave={e => { if (e.pointerType === 'mouse') setHover(null) }}
          onPointerCancel={() => setHover(null)}
        >
          {axis.ticks.map(v => (
            <g key={v}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} stroke={CHART.grid} strokeWidth={1} />
              <text x={PAD.left - 5} y={y(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={CHART.axis}>{v}</text>
            </g>
          ))}
          {bands.map((d, i) => <path key={i} d={d} fill={BAND} />)}
          {dots && days.map((d, i) => d.single !== null && (
            <circle key={i} cx={x(i)} cy={y(d.single)} r={1.8} fill={CHART.line2} />
          ))}
          {lines.map((pts, i) => pts.length === 1
            ? <circle key={i} cx={pts[0][0]} cy={pts[0][1]} r={2} fill={CHART.line} />
            : <path key={i} d={monotone(pts)} fill="none" stroke={CHART.line} strokeWidth={1.5} strokeLinejoin="round" />)}
          {h && hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} stroke={CURSOR} strokeWidth={1} />
              {h.read !== null && <circle cx={x(hover)} cy={y(h.read)} r={3} fill={CHART.line} />}
            </g>
          )}
          {labelled.map(t => (
            <text key={t.i} x={x(t.i)} y={HEIGHT - 5} textAnchor={anchor(t.i)} fontSize={11} fill={CHART.axis}>{t.label}</text>
          ))}
        </svg>
      </div>
      <div className="min-h-[20px] mt-1 text-[11px] leading-[1.4] text-ink-3" aria-live="polite">
        {h ? (
          <span className="text-ink-2">{readout(h)}</span>
        ) : (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="inline-flex items-center gap-1">
              {dots
                ? <svg width="14" height="6" aria-hidden><line x1="0" y1="3" x2="14" y2="3" stroke={CHART.line} strokeWidth="1.5" /></svg>
                : <svg width="6" height="6" aria-hidden><circle cx="3" cy="3" r="2" fill={CHART.line} /></svg>}
              {lineName}
            </span>
            {hasSingles && (
              <span className="inline-flex items-center gap-1">
                <svg width="6" height="6" aria-hidden><circle cx="3" cy="3" r="1.8" fill={CHART.line2} /></svg>
                single {singleName}s
              </span>
            )}
            {hasBand && (
              <span className="inline-flex items-center gap-1">
                <span aria-hidden className="inline-block w-3 h-2" style={{ background: BAND }} />
                {bandName}
              </span>
            )}
            <span className="text-ink-4">touch to read a day</span>
          </span>
        )}
      </div>
    </div>
  )
}
