import { GAUGE_NORMAL, type Gauge } from '../../../lib/fusedRead'

// A reading against the person's own normal: a grey band for the normal, a
// dot for the reading. It replaced a fill (Peter, 2026-10-14): a fill reads as
// an amount, so a good HRV over a short bar looked broken, and a range drawn
// on top of a fill measured two things at once. The verdict asks where you are
// against where you usually are, and a dot on a range says exactly that. The
// sleep score keeps its fill beside it on the card: it is an amount, 0–100.
// See tekio.rfcs/rfcs/0109-readiness-on-your-normal.md

const SIZE = {
  card: { track: 3, dot: 9, ring: 1.5 },
  sheet: { track: 6, dot: 14, ring: 2 },
} as const

const INK = '#1a1a1a'
const PAPER = '#ffffff'

/** Labels the sheet prints on the gauge: the reading over the dot, the
 *  normal's edges under the band. */
interface GaugeLabels { value: string; low: string; high: string }

export function ReadinessGauge({ gauge, size = 'card', inverted = false, labels }: {
  /** Null draws the empty track: no reading to place yet. */
  gauge: Gauge | null
  size?: keyof typeof SIZE
  /** The held card, inverted to ink (design-system §2). */
  inverted?: boolean
  labels?: GaugeLabels
}) {
  const s = SIZE[size]
  const band = inverted ? '#8a8a8a' : '#c9c9c7'
  const dot = inverted ? PAPER : INK
  const ring = inverted ? INK : PAPER
  const pct = (f: number) => `${f * 100}%`
  // Band and dot share one inner layer, inset by the dot's radius, so a dot
  // pinned to an end still sits whole on the track.
  const track = (
    <div
      className={`relative rounded-sm ${inverted ? 'bg-invert-line' : 'bg-line'}`}
      style={{ height: s.track }}
    >
      {gauge && (
        <div className="absolute inset-y-0" style={{ left: s.dot / 2, right: s.dot / 2 }}>
          <div
            className="absolute inset-y-0"
            style={{ left: pct(GAUGE_NORMAL.from), width: pct(GAUGE_NORMAL.to - GAUGE_NORMAL.from), background: band }}
          />
          <div
            className="absolute top-1/2 rounded-full"
            style={{
              left: pct(gauge.at),
              width: s.dot,
              height: s.dot,
              transform: 'translate(-50%, -50%)',
              background: dot,
              boxShadow: `0 0 0 ${s.ring}px ${ring}`,
            }}
          />
        </div>
      )}
    </div>
  )
  if (!labels || !gauge) return track

  // A label near an end hangs inward, so it never runs off the sheet.
  const align = (f: number) =>
    f < 0.15 ? 'translateX(0)' : f > 0.85 ? 'translateX(-100%)' : 'translateX(-50%)'
  const edge = 'absolute text-[11px] leading-none text-ink-3 whitespace-nowrap'
  return (
    <div className="pt-[30px] pb-[22px]">
      <div className="relative">
        {track}
        <div className="absolute inset-0 pointer-events-none" style={{ left: s.dot / 2, right: s.dot / 2 }}>
          <span
            className="absolute bottom-full mb-[10px] text-[12px] leading-none font-bold whitespace-nowrap"
            style={{ left: pct(gauge.at), transform: align(gauge.at) }}
          >
            {labels.value}
          </span>
          <span className={edge} style={{ left: pct(GAUGE_NORMAL.from), transform: 'translateX(-50%)', top: s.track + 9 }}>
            {labels.low}
          </span>
          <span className={edge} style={{ left: pct(GAUGE_NORMAL.to), transform: 'translateX(-50%)', top: s.track + 9 }}>
            {labels.high}
          </span>
        </div>
      </div>
    </div>
  )
}
