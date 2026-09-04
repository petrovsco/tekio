import { rankMuscleGaps, type MuscleQuality, type MuscleState } from '../../../lib/fusedRead'
import { MUSCLE_WINDOW_DAYS } from '../../../constants/app'
import { BottomSheet, SheetClose } from '../home/BottomSheet'
import { RAMP, rampStep } from '../home/GapMap'
import { QUALITY_SHORT, fmtAgo, fmtSets } from './labels'

// The per-muscle detail for the selected quality (roadmap 031 §3a, §7 decision
// 5): every leaf muscle, ranked worst first — the same order the map's callouts
// use, with the muscles that did not earn a callout. A ranked list, not a bar
// chart against an arbitrary maximum. Tap a row → Home's muscle drill-in.

interface MuscleListSheetProps {
  quality: MuscleQuality
  states: MuscleState[]
  /** Weekly per-muscle set rate the fill is judged against. */
  weeklyTarget: number
  onPick: (muscle: string) => void
  onClose: () => void
}

export default function MuscleListSheet({ quality, states, weeklyTarget, onPick, onClose }: MuscleListSheetProps) {
  const ranked = rankMuscleGaps(states)
  const target = weeklyTarget * MUSCLE_WINDOW_DAYS / 7
  return (
    <BottomSheet label={`${QUALITY_SHORT[quality]} — all muscles`} onClose={onClose}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[9px] font-bold tracking-[0.14em] text-ink-3">ALL MUSCLES · WORST FIRST</div>
          <h3 className="text-[19px] font-bold tracking-[-0.02em] leading-tight mt-0.5">{QUALITY_SHORT[quality]}</h3>
          <p className="text-xs text-ink-2 mt-0.5">
            {weeklyTarget}/wk per muscle · {MUSCLE_WINDOW_DAYS}-day window · target {fmtSets(target)} sets
          </p>
        </div>
        <SheetClose onClose={onClose} />
      </div>

      <ul className="mt-3 border-t border-hairline">
        {ranked.map(m => (
          <li key={m.id} className="border-b border-hairline">
            <button
              onClick={() => onPick(m.name)}
              className="w-full flex items-center gap-2.5 py-2 text-left cursor-pointer"
            >
              <svg width="10" height="10" aria-hidden className="shrink-0">
                <rect x="0.5" y="0.5" width="9" height="9" rx="1" fill={RAMP[rampStep(m.fillFraction)]} stroke="#e2e2e0" />
              </svg>
              <span className="grow text-xs font-semibold truncate">{m.name}</span>
              <span className="text-xs tabular-nums text-ink">
                {fmtSets(m.sets)}<span className="text-ink-3">/{fmtSets(target)}</span>
              </span>
              <span className={`w-[64px] text-right text-[10px] ${m.daysSince === null ? 'text-signal font-semibold' : 'text-ink-2'}`}>
                {m.recovering ? 'recovering' : fmtAgo(m.daysSince)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {ranked.length === 0 && <p className="text-xs text-ink-3 text-center py-6">No muscle groups yet.</p>}
    </BottomSheet>
  )
}
