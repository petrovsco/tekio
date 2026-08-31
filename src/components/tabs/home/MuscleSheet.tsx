import { useMemo, useState } from 'react'
import type { LiftSet } from '../../../types'
import { useAppStore } from '../../../store/app'
import {
  muscleStates, muscleWeeklySets, muscleSources, muscleQualityMix,
  CYCLE_WINDOW_DAYS, MUSCLE_QUALITIES, type MuscleSource,
} from '../../../lib/fusedRead'
import { CYCLE, RECOVER_DAYS, CYCLE_SET_TARGET } from '../../../constants/app'
import { today } from '../../../lib/utils'
import { BottomSheet, SheetClose } from './BottomSheet'
import { GAP_CUTOFF } from './GapMap'

// The muscle drill-in (T2, roadmap 018 unit 3): what a tap on the map reveals.
// Logging goes through an exercise on purpose — sets classify into adaptations
// by rep range, so a bare set count would write data no read can use.

const WEEKLY_TARGET = CYCLE_SET_TARGET / CYCLE

const fmtSets = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1))

const fmtDay = (date: string): string =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

const fmtKg = (w: number): string => (w === 0 ? 'BW' : `${fmtSets(w)} kg`)

/** "3×8 @ 24 kg" for a uniform scheme; falls back to count + last set. */
function schemeLabel(sets: LiftSet[]): string {
  if (sets.length === 0) return '—'
  const [first] = sets
  const uniform = sets.every(s => s.reps === first.reps && s.weight === first.weight)
  if (uniform) return `${sets.length}×${first.reps} @ ${fmtKg(first.weight)}`
  const last = sets[sets.length - 1]
  return `${sets.length} sets · last ${last.reps} @ ${fmtKg(last.weight)}`
}

const QUALITY_LABELS: Record<(typeof MUSCLE_QUALITIES)[number], string> = {
  strength: 'STRENGTH',
  hypertrophy: 'HYPERTROPHY',
  muscular_endurance: 'MUSC. END',
  power: 'POWER',
}

interface MuscleSheetProps {
  muscle: string
  onClose: () => void
  /** The T3 escape: nothing here fits, go search the exercise list. */
  onSearchExercises: () => void
}

export default function MuscleSheet({ muscle, onClose, onSearchExercises }: MuscleSheetProps) {
  const {
    weights, exerciseMuscles, muscleGroups, exerciseAdaptations, addWeightEntry,
  } = useAppStore()

  const state = useMemo(
    () => muscleStates(weights, exerciseMuscles, muscleGroups).find(s => s.name === muscle),
    [weights, exerciseMuscles, muscleGroups, muscle],
  )
  const weeks = useMemo(
    () => muscleWeeklySets(weights, exerciseMuscles, muscle),
    [weights, exerciseMuscles, muscle],
  )
  const sources = useMemo(
    () => muscleSources(weights, exerciseMuscles, muscle),
    [weights, exerciseMuscles, muscle],
  )
  const mix = useMemo(
    () => muscleQualityMix(weights, exerciseMuscles, muscle, exerciseAdaptations),
    [weights, exerciseMuscles, muscle, exerciseAdaptations],
  )

  const [logOpen, setLogOpen] = useState(false)
  // The picked exercise travels by name, not index — saving re-ranks sources.
  const [pickedName, setPickedName] = useState<string | null>(null)
  const [rows, setRows] = useState<LiftSet[]>([])
  const [savedCount, setSavedCount] = useState<number | null>(null)

  const sets = state?.sets ?? 0
  const daysSince = state?.daysSince ?? null
  const fill = state?.fillFraction ?? 0
  const recovering = state?.recovering ?? false

  const verdict = daysSince === null
    ? {
        text: 'Never trained.', invert: true, icon: 'M12 5v14M5 12h14',
        sub: 'Zero sets this cycle and no logged history — the biggest kind of gap.',
      }
    : recovering
      ? {
          text: 'Recently hit — leave it.', invert: false, icon: 'M9 6v12M15 6v12',
          sub: `Last stimulus ${daysSince === 0 ? 'today' : `${daysSince} d ago`} — inside the ${RECOVER_DAYS * 24} h recovery window (PLACEHOLDER).`,
        }
      : fill >= 1
        ? {
            text: 'Recovered — but back off.', invert: false, icon: 'M5 12h14',
            sub: `At ${Math.round(fill * 100)}% of the cycle target with ${fmtSets(sets)} sets. It is available; it is just not what is missing.`,
          }
        : fill < GAP_CUTOFF
          ? {
              text: 'Train it.', invert: true, icon: 'M12 5v14M5 12h14',
              sub: `Fully recovered and under target: ${fmtSets(sets)} sets in ${CYCLE_WINDOW_DAYS} days, last stimulus ${daysSince} d ago.`,
            }
          : {
              text: 'Recovered, close to target.', invert: false, icon: 'M5 12l5 5L19 7',
              sub: `${fmtSets(sets)} sets in ${CYCLE_WINDOW_DAYS} days — ${Math.round(fill * 100)}% of the target and recovered.`,
            }

  const recPct = daysSince === null
    ? 100
    : Math.min(100, Math.round((100 * daysSince) / RECOVER_DAYS))
  const weekScale = Math.max(WEEKLY_TARGET, ...weeks)
  const fedBy = sources.filter(s => s.windowSets > 0).sort((a, b) => b.windowSets - a.windowSets)

  const pick = (s: MuscleSource) => {
    setPickedName(s.exercise)
    setRows(s.lastSets.map(r => ({ ...r })))
    setSavedCount(null)
  }
  const editRow = (i: number, patch: Partial<LiftSet>) => {
    setRows(rs => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))
    setSavedCount(null)
  }
  const save = async () => {
    if (!pickedName || rows.length === 0) return
    await addWeightEntry({ date: today(), exercise: pickedName, sets: rows })
    setSavedCount(rows.length)
  }

  return (
    <BottomSheet onClose={onClose} label={muscle}>
      {/* identity */}
      <div className="flex items-center gap-2">
        <span className="text-[19px] font-bold tracking-[-0.01em]">{muscle}</span>
        <span className="grow" />
        <SheetClose onClose={onClose} />
      </div>

      {/* the one-line verdict: both dimensions at once */}
      <div className={`mt-2 px-[11px] py-[9px] border border-ink rounded-[3px] ${verdict.invert ? 'bg-ink text-white' : 'bg-white'}`}>
        <div className="flex items-center gap-[7px]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={verdict.icon} />
          </svg>
          <span className="text-[15px] font-bold tracking-[-0.01em]">{verdict.text}</span>
        </div>
        <div className="text-[11px] leading-[1.35] mt-1 opacity-[0.82] text-pretty">{verdict.sub}</div>
      </div>

      {/* the two dimensions, split */}
      <div className="grid grid-cols-2 gap-2 mt-2.5">
        <div className="border border-line rounded-[3px] px-2.5 pt-2 pb-[9px]">
          <div className="text-[8px] font-bold tracking-[0.12em] text-ink-3">STIMULUS</div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-[25px] font-bold tracking-[-0.03em]">{fmtSets(sets)}</span>
            <span className="text-[11px] text-ink-2">/ {CYCLE_SET_TARGET} sets</span>
          </div>
          <div className="h-[5px] bg-line rounded-[2px] mt-[5px]">
            <div className="h-[5px] bg-ink rounded-[2px]" style={{ width: `${Math.min(100, Math.round(fill * 100))}%` }} />
          </div>
          <div className="text-[9px] text-ink-3 mt-1">
            {CYCLE_WINDOW_DAYS}-day cycle · target {CYCLE_SET_TARGET} <strong className="text-ink">PLACEHOLDER</strong>
          </div>
        </div>
        <div className="border border-line rounded-[3px] px-2.5 pt-2 pb-[9px]">
          <div className="text-[8px] font-bold tracking-[0.12em] text-ink-3">RECOVERY</div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-[25px] font-bold tracking-[-0.03em]">{daysSince ?? '—'}</span>
            <span className="text-[11px] text-ink-2">{daysSince === null ? 'never trained' : 'days ago'}</span>
          </div>
          <div className="h-[5px] bg-line rounded-[2px] mt-[5px]">
            <div className="h-[5px] bg-ink rounded-[2px]" style={{ width: `${recPct}%` }} />
          </div>
          <div className="text-[9px] text-ink-3 mt-1">
            recovered after {RECOVER_DAYS * 24} h <strong className="text-ink">PLACEHOLDER</strong>
          </div>
        </div>
      </div>

      {/* recent volume, per week of the cycle */}
      <div className="mt-2.5 border border-line rounded-[3px] px-2.5 pt-2 pb-[9px]">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[8px] font-bold tracking-[0.12em] text-ink-3">SETS PER WEEK, THIS CYCLE</span>
          <span className="grow" />
          <span className="text-[9px] text-ink-3">target {WEEKLY_TARGET}/wk <strong className="text-ink">PLACEHOLDER</strong></span>
        </div>
        <div className="flex items-end gap-[7px] h-[54px] mt-[7px]">
          {weeks.map((n, i) => (
            <div key={i} className="grow flex flex-col items-center justify-end gap-[3px] h-[54px]">
              <span className={`text-[9px] font-semibold ${n === 0 ? 'text-[#c9c9c7]' : 'text-ink'}`}>{fmtSets(n)}</span>
              <div
                className="w-full rounded-[1px]"
                style={{
                  height: `${Math.max(2, Math.round((n / weekScale) * 40))}px`,
                  background: n === 0 ? '#e2e2e0' : n < WEEKLY_TARGET ? '#8f8f8f' : '#1a1a1a',
                }}
              />
              <span className="text-[8px] text-ink-4">w{i + 1}</span>
            </div>
          ))}
        </div>
        <div className="h-px bg-line mt-0.5" />
      </div>

      {/* which exercises fed it, this cycle */}
      <div className="mt-2.5">
        <div className="text-[8px] font-bold tracking-[0.12em] text-ink-3 mb-[5px]">WHAT FED IT</div>
        {fedBy.length === 0 ? (
          <div className="text-[11px] text-ink-2">— nothing this cycle</div>
        ) : (
          <div className="flex flex-col gap-1">
            {fedBy.map(s => (
              <div key={s.exercise} className="flex items-baseline gap-2 text-[12px]">
                <span className="font-semibold">{s.exercise}</span>
                <span className="grow border-b border-dotted border-chrome" />
                <span className="text-ink-2">{fmtSets(s.windowSets)} sets</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* the four muscle-linked qualities — power reads per muscle (P2).
          Hidden while the log flow is open: capture takes the room. */}
      {!logOpen && (
        <div className="mt-2.5">
          <div className="text-[8px] font-bold tracking-[0.12em] text-ink-3 mb-[5px]">QUALITY MIX, THIS CYCLE</div>
          <div className="flex gap-1.5">
            {MUSCLE_QUALITIES.map(q => (
              <div key={q} className="grow border border-line rounded-[2px] px-1.5 pt-1 pb-[5px] text-center">
                <div className={`text-[13px] font-bold ${mix[q] === 0 ? 'text-ink-4' : 'text-ink'}`}>{fmtSets(mix[q])}</div>
                <div className="text-[7px] text-ink-3 tracking-[0.04em] mt-px">{QUALITY_LABELS[q]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* inline capture — the JIT rule made concrete */}
      <div className="mt-3 border-t border-line pt-2.5">
        {!logOpen ? (
          <button
            onClick={() => setLogOpen(true)}
            className="w-full flex items-center justify-center gap-[7px] min-h-[46px] border border-ink rounded-[3px] bg-ink text-white cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="text-[13px] font-bold tracking-[0.02em]">Log sets for {muscle}</span>
          </button>
        ) : (
          <div className="border border-ink rounded-[3px] px-2.5 pt-[9px] pb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold tracking-[0.1em]">LOG SETS — WHICH EXERCISE?</span>
              <span className="grow" />
              <button
                onClick={() => { setLogOpen(false); setPickedName(null); setSavedCount(null) }}
                aria-label="Close log flow"
                className="min-w-[44px] min-h-[30px] flex items-center justify-end cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {sources.length === 0 ? (
              <div className="mt-[7px] px-2.5 py-[9px] border border-dashed border-[#c9c9c7] rounded-[3px] text-[11px] text-ink-2 text-pretty">
                Nothing in your log has ever fed this muscle — there is no exercise to repeat. Pick one from the exercise list below.
              </div>
            ) : (
              <div className="flex flex-col gap-[5px] mt-[7px]">
                {sources.slice(0, 3).map(s => {
                  const isPicked = s.exercise === pickedName
                  return (
                    <button
                      key={s.exercise}
                      onClick={() => pick(s)}
                      className={`flex items-center gap-2 min-h-[46px] border border-ink rounded-[3px] px-2.5 py-[5px] text-left cursor-pointer ${
                        isPicked ? 'bg-ink text-white' : 'bg-white text-ink'
                      }`}
                    >
                      <span className="grow">
                        <span className="block text-[13px] font-bold">{s.exercise}</span>
                        <span className="block text-[9px] opacity-75">last {fmtDay(s.lastDate)} · {schemeLabel(s.lastSets)}</span>
                      </span>
                      <span className="text-[9px] font-bold tracking-[0.06em]">{isPicked ? 'PICKED' : 'REPEAT'}</span>
                    </button>
                  )
                })}
              </div>
            )}

            <button
              onClick={onSearchExercises}
              className="w-full flex items-center gap-1.5 min-h-[40px] mt-[5px] px-2.5 border border-chrome rounded-[3px] text-ink-2 cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" />
              </svg>
              <span className="text-[11px]">Something else — search the exercise list</span>
            </button>

            {pickedName && rows.length > 0 && (
              <div className="mt-2 border-t border-line pt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[10px] font-bold tracking-[0.08em]">{pickedName}</span>
                  <span className="text-[9px] text-ink-3">prefilled from last time — tap a number to change it</span>
                </div>
                <div className="flex flex-col gap-1 mt-1.5">
                  {rows.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12px]">
                      <span className="text-[9px] text-ink-3 tracking-[0.06em] w-[34px]">SET {i + 1}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={r.reps}
                        onChange={e => editRow(i, { reps: Math.max(0, Math.floor(+e.target.value || 0)) })}
                        className="font-bold border border-chrome rounded-[3px] px-2 py-[3px] w-[58px] text-center bg-white"
                        aria-label={`Set ${i + 1} reps`}
                      />
                      <span className="text-ink-3">reps ×</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        value={r.weight}
                        onChange={e => editRow(i, { weight: Math.max(0, +e.target.value || 0) })}
                        className="font-bold border border-chrome rounded-[3px] px-2 py-[3px] w-[58px] text-center bg-white"
                        aria-label={`Set ${i + 1} weight`}
                      />
                      <span className="text-ink-3">kg</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5 mt-2">
                  <button
                    onClick={() => setRows(rs => [...rs, { ...rs[rs.length - 1] }])}
                    className="grow flex items-center justify-center gap-[5px] min-h-[44px] border border-ink rounded-[3px] text-[12px] font-bold cursor-pointer"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" aria-hidden>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Same again
                  </button>
                  <button
                    onClick={save}
                    className="grow flex items-center justify-center min-h-[44px] border border-ink rounded-[3px] bg-ink text-white text-[12px] font-bold cursor-pointer"
                  >
                    Save {rows.length} sets
                  </button>
                </div>
                <div className="text-[10px] text-ink-2 mt-1.5 text-pretty">
                  {savedCount !== null
                    ? `${savedCount} sets saved to today's session — ${muscle} just re-shaded on the map.`
                    : `Save writes ${rows.length} sets to today's session. Reps are what classify them into an adaptation.`}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
