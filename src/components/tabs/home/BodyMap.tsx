import { useId } from 'react'
import type { MuscleStatus, MuscleStatusRow } from '../../../lib/adaptations'
import { STATUS_STYLE } from './MuscleStatusList'

const SILHOUETTE = '#e2e8f0'
const UNTOUCHED = '#cbd5e1'

/** Left half of the body outline, closed along the x=60 center seam; rendered
 *  twice (identity + mirror) so the silhouette stays symmetric for free. */
export const HALF =
  'M60,24 L55,24 Q54,29 53.5,32 Q46,35 38,40 Q31,42 30,50 ' +
  'L27,79 Q24,95 22,108 Q19,113 20,119 Q22,126 25,123 Q28,117 29,110 ' +
  'L32,85 L38,63 Q41,61 42,63 Q44,82 46,94 Q43,104 42,115 ' +
  'Q42,142 45,168 Q42,184 46,203 L48,220 L46,227 Q45,233 51,233 ' +
  'L55,225 L55,221 Q58,198 56,172 Q57,148 59,124 L60,121 Z'

export const MIRROR = 'translate(120,0) scale(-1,1)'

/** Rectus abdominis segment detail (front only). */
export const ABS_LINES = 'M60,70 L60,108 M54,79.5 L66,79.5 M53.5,89 L66.5,89 M54,97.5 L66,97.5'

export interface Zone {
  /** DB muscle-group name this zone represents (child, or top-level for Chest). */
  muscle: string
  /** Top-level group used as fallback when the muscle has no row of its own. */
  parent: string
  /** Drawn on both sides of the body (true) or once as a centered shape. */
  mirrored: boolean
  d: string
}

/* Anatomical zones, drawn in paint order (deeper muscles first so e.g. the
 * traps overlay the rhomboids). Mirrored zones are authored on the figure's
 * right (viewer-left) side; overshoot past the outline is clipped away. */
export const FRONT_ZONES: Zone[] = [
  { muscle: 'Upper Back / Traps', parent: 'Back', mirrored: true, d: 'M54,32 Q47.5,34.5 42,40 L52,41.5 Q54,37 54,32 Z' },
  { muscle: 'Anterior Deltoid', parent: 'Shoulders', mirrored: true, d: 'M46,42.5 Q40,40.5 36,44 L35,58 Q40,61 44,58 Q46,50 46,42.5 Z' },
  { muscle: 'Lateral Deltoid', parent: 'Shoulders', mirrored: true, d: 'M36,44 Q31,45 30,50 Q29,56 32,60 Q34,62 35,58 L36,44 Z' },
  { muscle: 'Chest', parent: 'Chest', mirrored: true, d: 'M59,46 Q47.5,44 42.5,50 Q40.5,57 43.5,63 Q51,68 57,66 Q59,63 59,55 Z' },
  { muscle: 'Biceps', parent: 'Arms', mirrored: true, d: 'M38.5,60 Q31.5,61.5 30,71 Q29,79 31,82 Q35.5,83 37,76 Q38.5,68 38.5,60 Z' },
  { muscle: 'Forearms', parent: 'Arms', mirrored: true, d: 'M33,85 Q27,88 25,97 Q23,104 23.5,109 Q26.5,111 28,106 Q31,95 33,85 Z' },
  { muscle: 'Obliques', parent: 'Core', mirrored: true, d: 'M52.5,70 L52.5,102 Q48.5,100 46.5,93 Q45.5,80 48,70 Q50.5,69 52.5,70 Z' },
  { muscle: 'Rectus Abdominis', parent: 'Core', mirrored: false, d: 'M53,70 Q60,68 67,70 L67,102 Q63.5,108 60,109 Q56.5,108 53,102 Z' },
  { muscle: 'Hip Flexors', parent: 'Legs', mirrored: true, d: 'M46,106 Q52,108 57,114 L57,119.5 Q50,114 45,110 Z' },
  { muscle: 'Quadriceps', parent: 'Legs', mirrored: true, d: 'M45,114 Q42.5,132 43.5,150 Q45,164 49,167.5 Q53,165 55,152 L55,122 Q50,115 45,114 Z' },
  { muscle: 'Adductors', parent: 'Legs', mirrored: true, d: 'M57.5,122 L58.5,125 L57.5,147 Q55.5,144 55,136 Q55,127 57.5,122 Z' },
  { muscle: 'Calves', parent: 'Legs', mirrored: true, d: 'M46.5,174 Q43.5,184 45,198 Q46,204 48.5,202 Q47.5,188 48.5,176 Q47.5,172.5 46.5,174 Z M54.5,174 Q56.5,184 55.5,198 Q54.5,203.5 52.5,201.5 Q54,188 53,176 Q53.5,172.5 54.5,174 Z' },
]

export const BACK_ZONES: Zone[] = [
  { muscle: 'Lats', parent: 'Back', mirrored: true, d: 'M43,58 Q40,68 44,80 Q50,90 57,96 L58.5,98 L58.5,72 Q56,66 52,62 Q47,59 43,58 Z' },
  { muscle: 'Rhomboids', parent: 'Back', mirrored: true, d: 'M58.5,54 L58.5,70 Q52,66 49.5,59 Q54,55 58.5,54 Z' },
  { muscle: 'Rotator Cuff', parent: 'Shoulders', mirrored: true, d: 'M47.5,52 Q43.5,56 44.5,63 Q47.5,67 50.5,63.5 Q51.5,56 49.5,52 Z' },
  { muscle: 'Upper Back / Traps', parent: 'Back', mirrored: false, d: 'M60,28 Q57.5,28.5 56.5,32 Q50,34.5 44,39.5 Q41,42 45,45 Q53,48 57,58 Q59,64 60,70 Q61,64 63,58 Q67,48 75,45 Q79,42 76,39.5 Q70,34.5 63.5,32 Q62.5,28.5 60,28 Z' },
  { muscle: 'Posterior Deltoid', parent: 'Shoulders', mirrored: true, d: 'M46,42 Q36,40 31,46 Q29,52 32,59 Q38,63 43,59 Q46,52 46,42 Z' },
  { muscle: 'Triceps', parent: 'Arms', mirrored: true, d: 'M38.5,60 Q31.5,61.5 29.5,72 Q28.5,80 31,83 Q35.5,82.5 37,75 Q38.5,67 38.5,60 Z' },
  { muscle: 'Forearms', parent: 'Arms', mirrored: true, d: 'M33,85 Q27,88 25,97 Q23,104 23.5,109 Q26.5,111 28,106 Q31,95 33,85 Z' },
  { muscle: 'Erectors', parent: 'Core', mirrored: true, d: 'M55,72 L59,72 L59,107 Q56,105 54.5,98 Q54,85 55,72 Z' },
  { muscle: 'Glutes', parent: 'Legs', mirrored: true, d: 'M58.5,106 Q47,104 43.5,112 Q42,122 47,129.5 Q54.5,133.5 58.5,127 Q59.5,116 58.5,106 Z' },
  { muscle: 'Adductors', parent: 'Legs', mirrored: true, d: 'M57.5,130 L58.5,132 L57.5,150 Q55.5,146 55,139 Q55,133 57.5,130 Z' },
  { muscle: 'Hamstrings', parent: 'Legs', mirrored: true, d: 'M45,132 Q42.5,146 44.5,160 Q46.5,167 50.5,167 Q54.5,164 55,151 L55.5,136 Q50,129 45,132 Z' },
  { muscle: 'Calves', parent: 'Legs', mirrored: true, d: 'M46.5,172 Q42.5,182 44.5,196 Q46.5,205 50,205 Q54,203 55,192 Q55,180 52,172 Q48.5,168 46.5,172 Z' },
]

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

/**
 * Resolves a zone to its fill + tooltip. A zone follows its own muscle's
 * status; when that muscle has no sets but its top-level group was trained
 * directly (exercise mapped to the parent, no child breakdown), the parent's
 * direct sets colour all of its zones so the work still shows up.
 */
function zoneResolver(muscles: MuscleStatusRow[]) {
  const tops = new Map(muscles.map(m => [m.name.toLowerCase(), m]))
  const kids = new Map<string, MuscleStatusRow>()
  for (const t of muscles) for (const c of t.children) kids.set(c.name.toLowerCase(), c)

  return (zone: Zone): { fill: string; title: string } => {
    const child = kids.get(zone.muscle.toLowerCase())
    const asTop = tops.get(zone.muscle.toLowerCase())
    const parent = tops.get(zone.parent.toLowerCase())

    let status: MuscleStatus = 'untouched'
    if (child && child.aggSets > 0) status = child.status
    else if (asTop && asTop.aggSets > 0) status = asTop.status
    else if (parent && parent.sets > 0) status = parent.sets >= parent.target ? 'on_track' : 'needs_work'

    const row = child ?? asTop
    const sets = row && row.aggSets > 0 ? ` · ${fmt(row.aggSets)}/${row.target} sets` : ''
    return {
      fill: row || parent ? STATUS_STYLE[status].bar : UNTOUCHED,
      title: `${zone.muscle} — ${STATUS_STYLE[status].label}${sets}`,
    }
  }
}

/**
 * Anatomical front/back figure with one zone per tracked muscle group
 * (deltoid heads, biceps/triceps/forearms, lats/traps/rhomboids, core and
 * leg muscles), each tinted by its weekly status for the selected adaptation.
 */
export function BodyMap({ muscles }: { muscles: MuscleStatusRow[] }) {
  const resolve = zoneResolver(muscles)
  const clipId = useId()
  return (
    <div>
      <div className="flex justify-center gap-4">
        <Figure zones={FRONT_ZONES} label="Front" resolve={resolve} clipId={`${clipId}f`} />
        <Figure zones={BACK_ZONES} label="Back" resolve={resolve} clipId={`${clipId}b`} />
      </div>
      <div className="flex justify-center gap-3 mt-1.5">
        {(['on_track', 'needs_work', 'untouched'] as const).map(s => (
          <span key={s} className="flex items-center gap-1 text-[9px] text-muted">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: STATUS_STYLE[s].bar }} />
            {STATUS_STYLE[s].label}
          </span>
        ))}
      </div>
    </div>
  )
}

function Figure({
  zones, label, resolve, clipId,
}: {
  zones: Zone[]
  label: string
  resolve: (zone: Zone) => { fill: string; title: string }
  clipId: string
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 120 240" className="w-28 h-auto" role="img" aria-label={`${label} muscle map`}>
        <circle cx="60" cy="13.5" r="10" fill={SILHOUETTE} />
        <path d={HALF} fill={SILHOUETTE} />
        <path d={HALF} fill={SILHOUETTE} transform={MIRROR} />
        <clipPath id={clipId}>
          <path d={HALF} />
          <path d={HALF} transform={MIRROR} />
        </clipPath>
        <g clipPath={`url(#${clipId})`} stroke="#fff" strokeOpacity={0.8} strokeWidth={0.6}>
          {zones.map(zone => {
            const { fill, title } = resolve(zone)
            return (
              <g key={zone.muscle} fill={fill}>
                <path d={zone.d}>
                  <title>{title}</title>
                </path>
                {zone.mirrored && (
                  <path d={zone.d} transform={MIRROR}>
                    <title>{title}</title>
                  </path>
                )}
              </g>
            )
          })}
          {label === 'Front' && (
            <path d={ABS_LINES} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={0.5} />
          )}
        </g>
      </svg>
      <span className="text-[10px] text-muted font-medium">{label}</span>
    </div>
  )
}
