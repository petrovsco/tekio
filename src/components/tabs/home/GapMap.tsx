import { useId, type MouseEvent } from 'react'
import { BODY_MAP, rampStep, type MapCallout, type MuscleState } from '@tekio/core'
import { HALF, MIRROR, ABS_LINES, FRONT_ZONES, BACK_ZONES, type Zone } from './BodyMap'

// The T1 "what is missing" read (design-system §§1, 4): the anatomical figure
// recoloured by the SIGNAL stimulus ramp, a white 45° hatch for muscles still
// recovering, and the ranked gap callouts drawn onto the map — the callouts ARE
// the missing list, worst first.

/** Stimulus ramp by share of the window target — ink accumulates like work.
 *  Shared with the Adaptations drill-down's effort spectrum (roadmap 031) so a
 *  session band and a muscle fill are read on one scale. The step for a share
 *  is `rampStep` in @tekio/core. */
export const RAMP = ['#ececea', '#c9c9c7', '#8f8f8f', '#1f1f1f'] as const
/** Everything sits here on a day with no data at all. */
export const NO_DATA = '#eeeeec'

/** Callout anchors and figure placement inside the 336×224 map: g = t + v ×
 *  scale. The figures sit right of centre so a numbered label
 *  ("4 · ADDUCTORS") fits the left margin. */
const ANCHORS = BODY_MAP.anchors
const FIG = BODY_MAP.figures
const FIG_SCALE = BODY_MAP.figures.scale

interface PlacedCallout {
  key: string
  dotX: number
  dotY: number
  labelY: number
  side: 'L' | 'R'
  text: string
  sub: string
  major: boolean
}

/** The ranked callouts (`mapCallouts`, @tekio/core) → positions on the map.
 *  Labels on the same side are nudged apart; the leader line follows. */
function placeCallouts(callouts: MapCallout[]): PlacedCallout[] {
  const placed = callouts.filter(c => ANCHORS[c.muscle]).map(c => {
    const a = ANCHORS[c.muscle]
    const f = FIG[a.fig]
    return {
      key: c.muscle,
      dotX: +(f.x + a.x * FIG_SCALE).toFixed(1),
      dotY: +(f.y + a.y * FIG_SCALE).toFixed(1),
      labelY: 0,
      side: (a.fig === 'front' ? 'L' : 'R') as 'L' | 'R',
      text: c.label,
      sub: c.sub,
      major: c.rank !== null,
    }
  })
  // Label + sub need ~24px together; nudge same-side labels apart and let the
  // leader line follow the nudge.
  for (const side of ['L', 'R'] as const) {
    let prev = -Infinity
    for (const c of placed.filter(p => p.side === side).sort((a, b) => a.dotY - b.dotY)) {
      c.labelY = Math.min(Math.max(c.dotY, prev + 24, 16), 208)
      prev = c.labelY
    }
  }
  return placed
}

interface GapMapProps {
  states: MuscleState[]
  /** The ranked gaps to point at, worst first (`mapCallouts`). */
  callouts: MapCallout[]
  zeroData: boolean
  /** Opens the muscle drill-in (T2) — a tap on a zone or a callout label. */
  onPick?: (muscle: string) => void
  /** Muscles today's open plan would reach (RFC 0098): outlined, never filled.
   *  The fill stays logged work only. */
  planned?: Set<string>
}

/** The planned outline (RFC 0098): an edge in the planned yellow, not a fill,
 *  because the fill channel is stimulus and nothing planned has happened
 *  (design-system §1). Keep in step with `--color-planned` in index.css. */
const PLANNED_EDGE = { stroke: '#d4a017', dash: '2 1.2', width: 1.4 } as const

export function GapMap({ states, callouts, zeroData, onPick, planned }: GapMapProps) {
  const uid = useId()
  const hatchId = `${uid}h`

  const byName = new Map(states.map(s => [s.name.toLowerCase(), s]))
  // A zone follows its own muscle; with no sets of its own it falls back to a
  // directly-trained top-level parent (exercise mapped to the parent, no child
  // breakdown), same rule as the adaptations map.
  const resolve = (zone: Zone): { fill: string; recovering: boolean; pick: string } => {
    const own = byName.get(zone.muscle.toLowerCase())
    const parent = byName.get(zone.parent.toLowerCase())
    const eff = own && own.sets > 0 ? own : parent && parent.sets > 0 ? parent : own
    const pick = eff?.name ?? zone.muscle
    if (zeroData) return { fill: NO_DATA, recovering: false, pick }
    if (!eff) return { fill: RAMP[0], recovering: false, pick }
    return { fill: RAMP[rampStep(eff.fillFraction)], recovering: eff.recovering, pick }
  }

  const placed = zeroData ? [] : placeCallouts(callouts)

  // Most zones are 3–16 px wide on a phone, and a fingertip lands 6–8 px from
  // where it aims, so a tap on a bare zone missed half the time (RFC 0100). One
  // handler for the whole map: an exact hit wins, otherwise the muscle most of
  // the nearest ring of sample points lands on, out to a fingertip's reach.
  const onTap = onPick && ((e: MouseEvent<SVGSVGElement>) => {
    const muscle = nearestPick(e.clientX, e.clientY)
    if (muscle) onPick(muscle)
  })

  return (
    <div>
      <svg
        viewBox="0 0 336 224" className="block w-full h-auto" role="img" aria-label="Muscle gap map"
        onClick={onTap} style={onPick && { cursor: 'pointer' }}
      >
        <defs>
          <pattern id={hatchId} width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="4" stroke="#ffffff" strokeWidth="1.6" />
          </pattern>
        </defs>
        <text x="117" y="8" textAnchor="middle" fontSize="7" letterSpacing="1" fill="#8a8a8a">FRONT</text>
        <text x="215" y="8" textAnchor="middle" fontSize="7" letterSpacing="1" fill="#8a8a8a">BACK</text>
        <Figure zones={FRONT_ZONES} abs fig="front" resolve={resolve} clipId={`${uid}f`} hatchId={hatchId} planned={planned} />
        <Figure zones={BACK_ZONES} fig="back" resolve={resolve} clipId={`${uid}b`} hatchId={hatchId} planned={planned} />
        {placed.map(c => {
          const lineX = c.side === 'L' ? 83 : 251
          const textX = c.side === 'L' ? 80 : 254
          const anchor = c.side === 'L' ? 'end' : 'start'
          return (
            <g key={c.key} data-pick={c.key}>
              <line x1={lineX} y1={c.labelY} x2={c.dotX} y2={c.dotY} stroke="#6b6b6b" strokeWidth="1" />
              <circle cx={c.dotX} cy={c.dotY} r="2.3" fill="#ffffff" stroke="#c2410c" strokeWidth="1.2" />
              <text
                x={textX} y={c.labelY + 3} textAnchor={anchor} fontSize="9"
                fontWeight={c.major ? 700 : 400} fill={c.major ? '#c2410c' : '#6b6b6b'}
              >
                {c.text}
              </text>
              <text x={textX} y={c.labelY + 13} textAnchor={anchor} fontSize="7.5" fill="#6b6b6b">
                {c.sub}
              </text>
            </g>
          )
        })}
      </svg>
      {/* legend: two dimensions in one map */}
      <div className="flex items-center gap-2.5 mt-1 pt-1 border-t border-hairline">
        <span className="flex items-center gap-1">
          <svg width="46" height="8" aria-hidden>
            {RAMP.map((c, i) => <rect key={c} x={i * 11.5} y="0" width="11" height="8" fill={c} />)}
          </svg>
          <span className="text-[9px] text-ink-2">darker = more trained · light = the gap</span>
        </span>
        <span className="flex items-center gap-1">
          <svg width="11" height="8" aria-hidden>
            <rect x="0" y="0" width="11" height="8" fill="#4a4a4a" />
            <rect x="0" y="0" width="11" height="8" fill={`url(#${hatchId})`} />
          </svg>
          <span className="text-[9px] text-ink-2">still recovering</span>
        </span>
        {planned && planned.size > 0 && (
          <span className="flex items-center gap-1">
            <svg width="11" height="8" aria-hidden>
              <rect x="0.6" y="0.6" width="9.8" height="6.8" fill="#fdf6dc" stroke={PLANNED_EDGE.stroke} strokeWidth="1.1" strokeDasharray={PLANNED_EDGE.dash} />
            </svg>
            <span className="text-[9px] text-ink-2">planned</span>
          </span>
        )}
      </div>
    </div>
  )
}

function Figure({
  zones, fig, abs, resolve, clipId, hatchId, planned,
}: {
  zones: Zone[]
  fig: 'front' | 'back'
  abs?: boolean
  resolve: (zone: Zone) => { fill: string; recovering: boolean; pick: string }
  clipId: string
  hatchId: string
  planned?: Set<string>
}) {
  const t = FIG[fig]
  return (
    <g transform={`translate(${t.x},${t.y}) scale(${FIG_SCALE})`}>
      <circle cx={BODY_MAP.head.cx} cy={BODY_MAP.head.cy} r={BODY_MAP.head.r} fill="#ffffff" stroke="#c9c9c7" strokeWidth="1" />
      <path d={HALF} fill="#ffffff" stroke="#c9c9c7" strokeWidth="1" />
      <path d={HALF} fill="#ffffff" stroke="#c9c9c7" strokeWidth="1" transform={MIRROR} />
      <clipPath id={clipId}>
        <path d={HALF} />
        <path d={HALF} transform={MIRROR} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        {zones.map(zone => {
          const { fill, recovering, pick } = resolve(zone)
          return (
            <g key={zone.muscle} data-pick={pick}>
              <g fill={fill} stroke="#ffffff" strokeWidth="0.7">
                <path d={zone.d} />
                {zone.mirrored && <path d={zone.d} transform={MIRROR} />}
              </g>
              {recovering && (
                <g fill={`url(#${hatchId})`} pointerEvents="none">
                  <path d={zone.d} />
                  {zone.mirrored && <path d={zone.d} transform={MIRROR} />}
                </g>
              )}
            </g>
          )
        })}
        {abs && (
          <path d={ABS_LINES} fill="none" stroke="#ffffff" strokeOpacity={0.5} strokeWidth={0.5} />
        )}
      </g>
      {/* Outside the clip so the edge is not cut in half at the silhouette;
          drawn after every fill so a neighbour never covers it. */}
      {planned && zones.filter(z => planned.has(z.muscle)).map(zone => (
        <g key={zone.muscle} fill="none" stroke={PLANNED_EDGE.stroke} strokeWidth={PLANNED_EDGE.width}
          strokeDasharray={PLANNED_EDGE.dash} strokeLinejoin="round" pointerEvents="none">
          <path d={zone.d} />
          {zone.mirrored && <path d={zone.d} transform={MIRROR} />}
        </g>
      ))}
    </g>
  )
}

/** How far from the finger a tap still finds a muscle, in CSS px. */
const TAP_REACH_PX = 14
const TAP_RINGS = [4, 8, 11, TAP_REACH_PX]
const TAP_SPOKES = 12

function pickAt(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y)
  return el?.closest('[data-pick]')?.getAttribute('data-pick') ?? null
}

/** The muscle under the finger, or the one most of the nearest ring hits. */
function nearestPick(x: number, y: number): string | null {
  const exact = pickAt(x, y)
  if (exact) return exact
  for (const r of TAP_RINGS) {
    const tally = new Map<string, number>()
    for (let i = 0; i < TAP_SPOKES; i++) {
      const a = (2 * Math.PI * i) / TAP_SPOKES
      const hit = pickAt(x + r * Math.cos(a), y + r * Math.sin(a))
      if (hit) tally.set(hit, (tally.get(hit) ?? 0) + 1)
    }
    if (tally.size > 0) return [...tally].sort((p, q) => q[1] - p[1])[0][0]
  }
  return null
}
