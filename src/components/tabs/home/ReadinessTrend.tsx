import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { ReadinessTrend as Trend, TrendDay } from '@tekio/core'
import { fmtDate } from '../../../lib/utils'
import { CHART } from '../../ui/chart'

// The readiness sheet's chart (Peter, 2026-10-14): the days today's normal is
// built from and the days it reads, for HRV the 60 nights before this week and
// the week itself. Today's normal is drawn across them as one band, with each
// night behind the line the verdict reads, so the chart shows what the
// sentence above it says: where the normal comes from, and where this week
// sits on it. Six months was tried first and was too much. Drawn by hand
// rather than with Recharts, which is its own download the sheet should not
// wait on when it opens from Home's card; styled by design-system §9.
// See tekio.rfcs/rfcs/0109-readiness-on-your-normal.md

const HEIGHT = 136
const PAD = { top: 6, right: 6, bottom: 20, left: 28 }
/** The normal's band: a reference area, one step under the card border. */
const BAND = '#e2e2e0'
/** Where touching shows a day: a solid hairline, never the reference dash. */
const CURSOR = '#c9c9c7'
/** A tap this near the day on show puts it away (Peter, 2026-10-14: nothing
 *  brought the legend back). A day can be narrower than a fingertip, so a
 *  second tap at the same spot often misses its day but lands this near. */
const REACH = 16
/** A finger that moves less than this is tapping, not sliding. */
const SLOP = 8

interface ReadinessTrendProps {
  trend: Trend
  /** The chart's name: 'HRV'. */
  title: string
  /** The window, as the header names it when the history covers it:
   *  '60 NIGHTS + THIS WEEK'. */
  span: string
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

/** Consecutive runs of days where `has` holds — a gap breaks a line. */
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

export default function ReadinessTrend({ trend, title, span, singleName, lineName, bandName, unit, dots }: ReadinessTrendProps) {
  const { days, normal, full } = trend
  const n = days.length
  const drawn = n >= 2
  const wrap = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(340)
  // The day on show. A mouse shows the day under it and takes it away on
  // leaving; a finger's day is pinned, so it stays to be read after the lift.
  const [shown, setShown] = useState<{ i: number; pinned: boolean } | null>(null)
  // The press under way: where it started, and whether it landed on the
  // pinned day, which a tap that does not slide puts away.
  const press = useRef<{ x: number; away: boolean } | null>(null)
  const pinned = shown?.pinned ?? false

  // Drawn at the sheet's real width, so the 11 px labels stay 11 px.
  useEffect(() => {
    const el = wrap.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(200, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [drawn])

  // A press anywhere outside the chart puts a pinned day away too, and the
  // legend it stood in for comes back.
  useEffect(() => {
    if (!pinned) return
    const outside = (e: Event) => {
      if (!wrap.current?.contains(e.target as Node)) setShown(null)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [pinned])

  if (!drawn) return null

  const values: number[] = []
  for (const d of days) {
    if (dots && d.single !== null) values.push(d.single)
    if (d.read !== null) values.push(d.read)
  }
  if (normal) values.push(normal.low, normal.high)
  const axis = valueAxis(values)
  const plotW = width - PAD.left - PAD.right
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (i / (n - 1)) * plotW
  const y = (v: number) => PAD.top + (1 - (v - axis.from) / (axis.to - axis.from)) * plotH

  const lines = dots
    ? runs(days, d => d.read !== null).map(r => r.map(i => [x(i), y(days[i].read!)] as [number, number]))
    : days.flatMap((d, i) => (d.read !== null ? [[[x(i), y(d.read)] as [number, number]]] : []))
  const hasSingles = dots && days.some(d => d.single !== null)

  // The window's first day and today at the ends; the months between them
  // where there is room for their names.
  const ends = [
    { i: 0, label: fmtDate(days[0].date, { relative: false, year: 'never' }), anchor: 'start' as const },
    { i: n - 1, label: fmtDate(days[n - 1].date, { year: 'never' }), anchor: 'end' as const },
  ]
  const months = days.flatMap((d, i) => (i > 0 && i < n - 1 && d.date.endsWith('-01')
    ? [{ i, label: fmtDate(d.date.slice(0, 7), { year: 'never' }), anchor: 'middle' as const }]
    : []))
  const labelled = [...ends, ...months.filter(m => ends.every(e => Math.abs(x(m.i) - x(e.i)) >= 44))]

  /** Where a pointer is across the chart, in its drawing's units. */
  const along = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    return ((e.clientX - box.left) / box.width) * width
  }
  const show = (e: PointerEvent<SVGSVGElement>) => {
    const i = Math.round(Math.min(Math.max((along(e) - PAD.left) / plotW, 0), 1) * (n - 1))
    const pin = e.pointerType !== 'mouse'
    setShown(s => (s && s.i === i && s.pinned === pin ? s : { i, pinned: pin }))
  }
  const down = (e: PointerEvent<SVGSVGElement>) => {
    const away = shown !== null && shown.pinned && Math.abs(along(e) - x(shown.i)) <= REACH
    press.current = { x: e.clientX, away }
    if (!away) show(e)
  }
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'mouse') { show(e); return }
    const p = press.current
    if (!p || (p.away && Math.abs(e.clientX - p.x) < SLOP)) return
    p.away = false
    show(e)
  }
  const up = () => {
    if (press.current?.away) setShown(null)
    press.current = null
  }

  const head = full ? span : `SINCE ${fmtDate(days[0].date, { relative: false }).toUpperCase()}`
  const h = shown ? days[shown.i] : null
  const num = (v: number | null) => (v === null ? '—' : String(Math.round(v)))
  // One day in words (invented figures): "Wed 8 Oct · night 66 · 7‑night
  // average 63 ms", or "Thu 9 Oct · 16 of 25".
  const readout = (d: TrendDay) => {
    const parts = [fmtDate(d.date, { weekday: true, relative: false })]
    if (dots) parts.push(`${singleName} ${num(d.single)}`, `${lineName} ${num(d.printed)}${unit}`)
    else parts.push(d.printed === null ? `no ${singleName}` : `${d.printed}${unit}`)
    return parts.join(' · ')
  }

  return (
    <div className="mt-3">
      <div className="text-[10px] font-bold tracking-[0.12em] text-ink-3 mb-1">{title} · {head}</div>
      <div ref={wrap}>
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="img"
          aria-label={`${title}: the ${lineName} against ${bandName}, ${head.toLowerCase()}`}
          className="block touch-pan-y select-none"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          // A mouse leaving takes its day away; a finger lifting leaves its
          // day pinned. A touch the page took for a scroll puts it away.
          onPointerLeave={e => { if (e.pointerType === 'mouse') setShown(null) }}
          onPointerCancel={() => { press.current = null; setShown(null) }}
        >
          {axis.ticks.map(v => (
            <g key={v}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} stroke={CHART.grid} strokeWidth={1} />
              <text x={PAD.left - 5} y={y(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={CHART.axis}>{v}</text>
            </g>
          ))}
          {normal && (
            <rect x={PAD.left} width={plotW} y={y(normal.high)} height={y(normal.low) - y(normal.high)} fill={BAND} />
          )}
          {dots && days.map((d, i) => d.single !== null && (
            <circle key={i} cx={x(i)} cy={y(d.single)} r={2} fill={CHART.line2} />
          ))}
          {lines.map((pts, i) => pts.length === 1
            ? <circle key={i} cx={pts[0][0]} cy={pts[0][1]} r={2} fill={CHART.line} />
            : <path key={i} d={monotone(pts)} fill="none" stroke={CHART.line} strokeWidth={1.5} strokeLinejoin="round" />)}
          {shown && h && (
            <g>
              <line x1={x(shown.i)} x2={x(shown.i)} y1={PAD.top} y2={PAD.top + plotH} stroke={CURSOR} strokeWidth={1} />
              {h.read !== null && <circle cx={x(shown.i)} cy={y(h.read)} r={3} fill={CHART.line} />}
            </g>
          )}
          {labelled.map(t => (
            <text key={t.i} x={x(t.i)} y={HEIGHT - 5} textAnchor={t.anchor} fontSize={11} fill={CHART.axis}>{t.label}</text>
          ))}
        </svg>
      </div>
      {/* The day is read over the legend, which keeps its room, so the sheet
          does not jump when a day is put away and the legend comes back. */}
      <div className="grid mt-1 text-[11px] leading-[1.4] text-ink-3" aria-live="polite">
        <span className={`col-start-1 row-start-1 flex flex-wrap items-center gap-x-3 gap-y-0.5${h ? ' invisible' : ''}`}>
          <span className="inline-flex items-center gap-1">
            {dots
              ? <svg width="14" height="6" aria-hidden><line x1="0" y1="3" x2="14" y2="3" stroke={CHART.line} strokeWidth="1.5" /></svg>
              : <svg width="6" height="6" aria-hidden><circle cx="3" cy="3" r="2" fill={CHART.line} /></svg>}
            {lineName}
          </span>
          {hasSingles && (
            <span className="inline-flex items-center gap-1">
              <svg width="6" height="6" aria-hidden><circle cx="3" cy="3" r="2" fill={CHART.line2} /></svg>
              single {singleName}s
            </span>
          )}
          {normal && (
            <span className="inline-flex items-center gap-1">
              <span aria-hidden className="inline-block w-3 h-2" style={{ background: BAND }} />
              {bandName}
            </span>
          )}
          <span className="text-ink-4">touch to read a day</span>
        </span>
        {shown && h && (
          <span className="col-start-1 row-start-1 self-start flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="text-ink-2">{readout(h)}</span>
            {shown.pinned && <span className="text-ink-4">tap again to clear</span>}
          </span>
        )}
      </div>
    </div>
  )
}
