// The anatomical figure's geometry, as the web draws it. The paths live in
// @tekio/core (bodyMap.json) so the phone apps draw the very same silhouette;
// this module only turns the shared mirror into an SVG transform. GapMap (Home
// and the Adaptations drill-down, roadmap 031) owns the rendering.
import { BODY_MAP } from '@tekio/core'

export type { BodyZone as Zone } from '@tekio/core'

export const HALF = BODY_MAP.half

export const MIRROR = `translate(${BODY_MAP.mirror.translateX},0) scale(${BODY_MAP.mirror.scaleX},1)`

/** Rectus abdominis segment detail (front only). */
export const ABS_LINES = BODY_MAP.absLines

export const FRONT_ZONES = BODY_MAP.front
export const BACK_ZONES = BODY_MAP.back
