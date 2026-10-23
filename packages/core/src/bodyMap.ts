// The anatomical figure's geometry — the one silhouette every muscle map is
// drawn on, on every client (RFC 0096). The data is JSON, so the phone apps
// read the very same file (bodyMap.json); this module only types it.
import data from './bodyMap.json'
import type { MuscleState } from './fusedRead'
import { rampStep } from './words'

export interface BodyZone {
  /** DB muscle-group name this zone represents (child, or top-level for Chest). */
  muscle: string
  /** Top-level group used as fallback when the muscle has no row of its own. */
  parent: string
  /** Drawn on both sides of the body (true) or once as a centered shape. */
  mirrored: boolean
  d: string
}

type BodyFigure = 'front' | 'back'

interface BodyMapData {
  /** The map's own space, width × height. */
  viewBox: number[]
  /** Left half of the body outline, closed along the x=60 centre seam; drawn
   *  twice (as is and through `mirror`) so the silhouette stays symmetric. */
  half: string
  mirror: { translateX: number; scaleX: number }
  head: { cx: number; cy: number; r: number }
  /** Rectus abdominis segment detail (front only). */
  absLines: string
  /** Zones in paint order, deeper muscles first. */
  front: BodyZone[]
  back: BodyZone[]
  /** Where each figure sits in the map: its offset, and one scale for both. */
  figures: Record<BodyFigure, { x: number; y: number }> & { scale: number }
  /** Callout anchor per muscle, in the figure's own space. */
  anchors: Record<string, { fig: BodyFigure; x: number; y: number }>
}

export const BODY_MAP = data as BodyMapData

/** The muscles the body map can point a callout at. */
export const MAPPED_MUSCLES: readonly string[] = Object.keys(BODY_MAP.anchors)

/** How one zone of the map is drawn: its step on the stimulus ramp (null on a
 *  day with no data at all), the hatch, and the muscle a tap on it opens. */
export interface ZoneFill {
  muscle: string
  step: 0 | 1 | 2 | 3 | null
  recovering: boolean
  pick: string
}

/** Every zone's fill, from the muscles' states. A zone follows its own muscle;
 *  with no sets of its own it falls back to a directly-trained top-level
 *  parent (an exercise mapped to the parent, no child breakdown). */
export function zoneFills(states: MuscleState[], zeroData: boolean): ZoneFill[] {
  const byName = new Map(states.map(s => [s.name.toLowerCase(), s]))
  const seen = new Set<string>()
  const fills: ZoneFill[] = []
  for (const zone of [...BODY_MAP.front, ...BODY_MAP.back]) {
    if (seen.has(zone.muscle)) continue
    seen.add(zone.muscle)
    const own = byName.get(zone.muscle.toLowerCase())
    const parent = byName.get(zone.parent.toLowerCase())
    const eff = own && own.sets > 0 ? own : parent && parent.sets > 0 ? parent : own
    const pick = eff?.name ?? zone.muscle
    fills.push(zeroData ? { muscle: zone.muscle, step: null, recovering: false, pick }
      : !eff ? { muscle: zone.muscle, step: 0, recovering: false, pick }
      : { muscle: zone.muscle, step: rampStep(eff.fillFraction), recovering: eff.recovering, pick })
  }
  return fills
}
