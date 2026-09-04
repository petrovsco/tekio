import type { WholeBodyQuality } from '../../../lib/fusedRead'
import { RAMP, NO_DATA, rampStep } from '../home/GapMap'
import { QUALITY_SHORT, SPECTRUM_QUALITIES, fmtAgo } from './labels'

// The whole-body read of the Adaptations drill-down (roadmap 031 §3b): the
// three cardio qualities are three regions of one continuum ordered by how long
// the effort lasts — anaerobic capacity is seconds, VO₂max minutes, endurance
// hours — so they are drawn as three bands on one axis. Each band fills by the
// SIGNAL stimulus ramp (sessions ÷ the window target) and takes the accent edge
// when the quality is stale (design-system §§1, 4 — Home's polarity). A gap is a
// visibly empty stretch of the axis. Doctrine P2: no silhouette, no organ.

export interface SpectrumBand {
  key: WholeBodyQuality
  /** Qualifying sessions inside the window. */
  sessions: number
  /** Session target over the same window (weekly rate × window / 7). */
  target: number
  /** Days since the last qualifying session over all history; null = never. */
  daysSince: number | null
  /** Past the grounded staleness window (or never) — reads as missing. */
  stale: boolean
}

interface EffortSpectrumProps {
  bands: SpectrumBand[]
  zeroData: boolean
  /** Opens the quality's rx sheet (T2). */
  onPick?: (quality: WholeBodyQuality) => void
}

const W = 336
const GAP = 8
const BAND_W = (W - 2 * GAP) / 3
const BAND_Y = 13
const BAND_H = 22
const AXIS_Y = 58
const DURATION = ['SECONDS', 'MINUTES', 'HOURS'] as const

export function EffortSpectrum({ bands, zeroData, onPick }: EffortSpectrumProps) {
  const byKey = new Map(bands.map(b => [b.key, b]))
  return (
    <svg viewBox={`0 0 ${W} 70`} className="block w-full h-auto" role="img" aria-label="Effort spectrum: anaerobic, VO₂max, endurance">
      {SPECTRUM_QUALITIES.map((key, i) => {
        const b = byKey.get(key)
        const x = i * (BAND_W + GAP)
        const cx = x + BAND_W / 2
        const frac = b && b.target > 0 ? b.sessions / b.target : 0
        const fill = zeroData || !b ? NO_DATA : RAMP[rampStep(frac)]
        const stale = !zeroData && !!b?.stale
        const edge = zeroData || !b ? '#e2e2e0' : stale ? '#c2410c' : 'none'
        const sub = zeroData || !b
          ? '—'
          : `${b.sessions}/${b.target} sessions · ${fmtAgo(b.daysSince)}`
        return (
          <g
            key={key}
            onClick={onPick && (() => onPick(key))}
            style={onPick && { cursor: 'pointer' }}
            role={onPick ? 'button' : undefined}
            aria-label={`${QUALITY_SHORT[key]} — how to train it`}
          >
            <text x={cx} y="8" textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="0.8" fill="#1a1a1a">
              {QUALITY_SHORT[key]}
            </text>
            <rect x={x + 0.5} y={BAND_Y} width={BAND_W - 1} height={BAND_H} rx="2" fill={fill} stroke={edge} strokeWidth={stale ? 1.2 : 1} />
            <text x={cx} y={BAND_Y + BAND_H + 10} textAnchor="middle" fontSize="7.5" fill="#6b6b6b">
              {sub}
            </text>
            {/* tick under the band's centre on the shared axis */}
            <line x1={cx} y1={AXIS_Y - 2} x2={cx} y2={AXIS_Y + 2} stroke="#c9c9c7" strokeWidth="1" />
            <text x={cx} y={AXIS_Y + 10} textAnchor="middle" fontSize="7" letterSpacing="1" fill="#8a8a8a">
              {DURATION[i]}
            </text>
          </g>
        )
      })}
      {/* one axis: effort duration, left → right */}
      <line x1="0" y1={AXIS_Y} x2={W} y2={AXIS_Y} stroke="#c9c9c7" strokeWidth="1" />
      <path d={`M${W - 4},${AXIS_Y - 3} L${W},${AXIS_Y} L${W - 4},${AXIS_Y + 3}`} fill="none" stroke="#c9c9c7" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}
