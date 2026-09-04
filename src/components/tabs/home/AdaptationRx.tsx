import type { AdaptationRx as Rx } from '../../../constants/adaptations'

const ROWS: [keyof Rx, string][] = [
  ['load', 'Load'],
  ['reps', 'Reps'],
  ['sets', 'Sets'],
  ['rest', 'Rest'],
  ['effort', 'Effort'],
]

/** Compact load/reps/sets/rest/effort table + cue for one adaptation — the
 *  body of the drill-down's rx sheet (roadmap 031), in the SIGNAL tokens. */
export function AdaptationRxTable({ rx }: { rx: Rx }) {
  return (
    <div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
        {ROWS.map(([k, label]) => (
          <div key={k} className="contents">
            <dt className="text-[9px] font-bold uppercase tracking-[0.1em] text-ink-3 pt-px">{label}</dt>
            <dd className="text-xs leading-[1.4] text-ink text-right text-pretty">{rx[k]}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs leading-[1.4] text-ink-2 italic mt-2.5 text-pretty">{rx.cue}</p>
    </div>
  )
}
