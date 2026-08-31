import { useId } from 'react'
import type { MuscleState } from '../../../lib/fusedRead'
import { HALF, MIRROR, ABS_LINES, FRONT_ZONES, BACK_ZONES, type Zone } from './BodyMap'

// The T1 "what is missing" read (design-system §§1, 4): the anatomical figure
// recoloured by the SIGNAL stimulus ramp, a white 45° hatch for muscles still
// recovering, and the ranked gap callouts drawn onto the map — the callouts ARE
// the missing list, worst first.

/** Stimulus ramp by share of the cycle target — ink accumulates like work. */
const RAMP = ['#ececea', '#c9c9c7', '#8f8f8f', '#1f1f1f'] as const
/** Everything sits here on a day with no data at all. */
const NO_DATA = '#eeeeec'

/** The ramp's top band; below it a muscle still reads as a visible gap. */
export const GAP_CUTOFF = 0.70

function rampStep(fraction: number): number {
  if (fraction < 0.10) return 0
  if (fraction < 0.35) return 1
  if (fraction < GAP_CUTOFF) return 2
  return 3
}

/** Editorial short labels for map callouts and the verdict sentence. */
export const MUSCLE_SHORT: Record<string, string> = {
  'Rectus Abdominis': 'CORE',
  'Obliques': 'OBLIQUES',
  'Hip Flexors': 'HIP FLEX',
  'Quadriceps': 'QUADS',
  'Hamstrings': 'HAMS',
  'Glutes': 'GLUTES',
  'Calves': 'CALVES',
  'Adductors': 'ADDUCTORS',
  'Erectors': 'ERECTORS',
  'Chest': 'CHEST',
  'Biceps': 'BICEPS',
  'Triceps': 'TRICEPS',
  'Forearms': 'FOREARMS',
  'Lats': 'LATS',
  'Rhomboids': 'RHOMBOIDS',
  'Upper Back / Traps': 'TRAPS',
  'Anterior Deltoid': 'ANT DELT',
  'Lateral Deltoid': 'LAT DELT',
  'Posterior Deltoid': 'POST DELT',
  'Rotator Cuff': 'ROTATOR',
}

export function muscleShort(name: string): string {
  return MUSCLE_SHORT[name] ?? name.toUpperCase()
}

/** Callout anchor per muscle, in the figure's own 120×240 space. Back-figure
 *  muscles are pre-mirrored onto the viewer-right copy so their leader lines
 *  run to the right margin; front ones run left. Dual-figure muscles pick one
 *  canonical figure. */
const ANCHORS: Record<string, { fig: 'front' | 'back'; x: number; y: number }> = {
  'Chest': { fig: 'front', x: 48, y: 56 },
  'Anterior Deltoid': { fig: 'front', x: 40, y: 50 },
  'Lateral Deltoid': { fig: 'front', x: 32, y: 52 },
  'Biceps': { fig: 'front', x: 34, y: 71 },
  'Forearms': { fig: 'front', x: 28, y: 96 },
  'Obliques': { fig: 'front', x: 49, y: 85 },
  'Rectus Abdominis': { fig: 'front', x: 60, y: 88 },
  'Hip Flexors': { fig: 'front', x: 51, y: 113 },
  'Quadriceps': { fig: 'front', x: 49, y: 140 },
  'Adductors': { fig: 'front', x: 57, y: 134 },
  'Upper Back / Traps': { fig: 'back', x: 70, y: 45 },
  'Rotator Cuff': { fig: 'back', x: 73, y: 58 },
  'Posterior Deltoid': { fig: 'back', x: 82, y: 51 },
  'Rhomboids': { fig: 'back', x: 66, y: 61 },
  'Lats': { fig: 'back', x: 72, y: 75 },
  'Triceps': { fig: 'back', x: 86, y: 71 },
  'Erectors': { fig: 'back', x: 63, y: 88 },
  'Glutes': { fig: 'back', x: 69, y: 117 },
  'Hamstrings': { fig: 'back', x: 71, y: 148 },
  'Calves': { fig: 'back', x: 71, y: 188 },
}

/** Figure transforms inside the 336×224 map: g = t + v × 0.85. The figures sit
 *  right of centre so a numbered label ("4 · ADDUCTORS") fits the left margin. */
const FIG = {
  front: { x: 66, y: 12 },
  back: { x: 164, y: 12 },
} as const
const FIG_SCALE = 0.85

function fmtSets(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

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

/** Ranked gaps → positioned callouts: top 4 numbered, a 5th shown lighter and
 *  unnumbered when it is still clearly under-trained. Labels on the same side
 *  are nudged apart; the leader line follows. */
function placeCallouts(gaps: MuscleState[]): PlacedCallout[] {
  const anchored = gaps.filter(m => ANCHORS[m.name])
  const picked = anchored.slice(0, 4).map((m, i) => ({ m, rank: i + 1 as number | null }))
  const fifth = anchored[4]
  if (fifth && fifth.fillFraction < 0.35) picked.push({ m: fifth, rank: null })

  const placed = picked.map(({ m, rank }) => {
    const a = ANCHORS[m.name]
    const f = FIG[a.fig]
    return {
      key: m.name,
      dotX: +(f.x + a.x * FIG_SCALE).toFixed(1),
      dotY: +(f.y + a.y * FIG_SCALE).toFixed(1),
      labelY: 0,
      side: (a.fig === 'front' ? 'L' : 'R') as 'L' | 'R',
      text: rank === null ? muscleShort(m.name) : `${rank} · ${muscleShort(m.name)}`,
      sub: m.daysSince === null ? 'never trained' : `${fmtSets(m.sets)} sets / ${m.daysSince} d`,
      major: rank !== null,
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
  /** Ranked, already filtered to genuine gaps — worst first. */
  gaps: MuscleState[]
  zeroData: boolean
  /** Opens the muscle drill-in (T2) — a tap on a zone or a callout label. */
  onPick?: (muscle: string) => void
}

export function GapMap({ states, gaps, zeroData, onPick }: GapMapProps) {
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

  const callouts = zeroData ? [] : placeCallouts(gaps)

  return (
    <div>
      <svg viewBox="0 0 336 224" className="block w-full h-auto" role="img" aria-label="Muscle gap map">
        <defs>
          <pattern id={hatchId} width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="4" stroke="#ffffff" strokeWidth="1.6" />
          </pattern>
        </defs>
        <text x="117" y="8" textAnchor="middle" fontSize="7" letterSpacing="1" fill="#8a8a8a">FRONT</text>
        <text x="215" y="8" textAnchor="middle" fontSize="7" letterSpacing="1" fill="#8a8a8a">BACK</text>
        <Figure zones={FRONT_ZONES} abs fig="front" resolve={resolve} clipId={`${uid}f`} hatchId={hatchId} onPick={onPick} />
        <Figure zones={BACK_ZONES} fig="back" resolve={resolve} clipId={`${uid}b`} hatchId={hatchId} onPick={onPick} />
        {callouts.map(c => {
          const lineX = c.side === 'L' ? 83 : 251
          const textX = c.side === 'L' ? 80 : 254
          const anchor = c.side === 'L' ? 'end' : 'start'
          return (
            <g
              key={c.key}
              onClick={onPick && (() => onPick(c.key))}
              style={onPick && { cursor: 'pointer' }}
            >
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
      </div>
    </div>
  )
}

function Figure({
  zones, fig, abs, resolve, clipId, hatchId, onPick,
}: {
  zones: Zone[]
  fig: 'front' | 'back'
  abs?: boolean
  resolve: (zone: Zone) => { fill: string; recovering: boolean; pick: string }
  clipId: string
  hatchId: string
  onPick?: (muscle: string) => void
}) {
  const t = FIG[fig]
  return (
    <g transform={`translate(${t.x},${t.y}) scale(${FIG_SCALE})`}>
      <circle cx="60" cy="13.5" r="10" fill="#ffffff" stroke="#c9c9c7" strokeWidth="1" />
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
            <g
              key={zone.muscle}
              onClick={onPick && (() => onPick(pick))}
              style={onPick && { cursor: 'pointer' }}
            >
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
    </g>
  )
}
