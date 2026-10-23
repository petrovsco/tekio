// The anatomical figure's geometry — the one silhouette every muscle map is
// drawn on, on every client (RFC 0096). The data is JSON, so the phone apps
// read the very same file (bodyMap.json); this module only types it.
import data from './bodyMap.json'

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
