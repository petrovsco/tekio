import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../store/app'
import { usePrefs } from '../../store/prefs'
import { today } from '../../lib/utils'
import { adaptationCoverage, weightSetsIn } from '../../lib/adaptations'
import {
  muscleQualityStates, muscleWindow, qualityStates, rankMuscleGaps,
  type MuscleQuality, type WholeBodyQuality,
} from '../../lib/fusedRead'
import { ADAPTATIONS, ADAPTATION_MAP } from '../../constants/adaptations'
import { MUSCLE_WINDOW_DAYS } from '../../constants/app'
import type { Adaptation } from '../../types'
import { Btn } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { GapMap, GAP_CUTOFF } from './home/GapMap'
import { EffortSpectrum, type SpectrumBand } from './adaptations/EffortSpectrum'
import { MAP_QUALITIES, QUALITY_PROSE, QUALITY_SHORT, SPECTRUM_QUALITIES } from './adaptations/labels'

// The Adaptations drill-down (roadmap 031): a second Home. One body map with a
// four-way quality toggle for the muscle-linked four, one effort spectrum for
// the whole-body three, and a header line for the whole window. Same rolling
// 14-day window as Home (031 §7 decision 1; 039 §6.6) — never the program cycle.
// The rx and the per-muscle detail are T2 sheets, one tap away on the read.

const RxSheet = lazy(() => import('./adaptations/RxSheet'))
const MuscleListSheet = lazy(() => import('./adaptations/MuscleListSheet'))
const MuscleSheet = lazy(() => import('./home/MuscleSheet'))

type OpenSheet = { rx: Adaptation } | { list: true } | { muscle: string }

interface AdaptationsTabProps {
  setTab: (t: string) => void
}

export function AdaptationsTab({ setTab }: AdaptationsTabProps) {
  const { weights, cardio, sports, exerciseMuscles, muscleGroups, exerciseAdaptations, adaptationTargets } = useAppStore()
  const { trackedMuscleGroupIds } = usePrefs()
  const date = today()
  const { from } = muscleWindow(date)

  // Default: hypertrophy — the quality Home's floor is grounded on (010 D10),
  // so the first picture is the one closest to Home's (031 §7 decision 3).
  const [quality, setQuality] = useState<MuscleQuality>('hypertrophy')
  const [sheet, setSheet] = useState<OpenSheet | null>(null)
  const prefetched = useRef(false)
  const prefetch = () => {
    if (prefetched.current) return
    prefetched.current = true
    import('./adaptations/RxSheet')
    import('./adaptations/MuscleListSheet')
    import('./home/MuscleSheet')
  }

  const coverage = useMemo(
    () => adaptationCoverage({
      weights, cardio, sports, exerciseMuscles, muscleGroups, from, date, windowDays: MUSCLE_WINDOW_DAYS,
      overrides: exerciseAdaptations, trackedMuscleIds: trackedMuscleGroupIds, targets: adaptationTargets,
    }),
    [weights, cardio, sports, exerciseMuscles, muscleGroups, from, date, exerciseAdaptations, trackedMuscleGroupIds, adaptationTargets],
  )

  const weeklyTarget = adaptationTargets[quality]?.weeklyMuscleTarget ?? ADAPTATION_MAP[quality].weeklyMuscleTarget
  const states = useMemo(
    () => muscleQualityStates(weights, exerciseMuscles, muscleGroups, quality, weeklyTarget, exerciseAdaptations, date),
    [weights, exerciseMuscles, muscleGroups, quality, weeklyTarget, exerciseAdaptations, date],
  )
  const gaps = useMemo(
    () => rankMuscleGaps(states).filter(m => m.fillFraction < GAP_CUTOFF),
    [states],
  )
  const wholeBody = useMemo(() => qualityStates(cardio, sports, date), [cardio, sports, date])

  const zeroData = weights.length === 0 && cardio.length === 0 && sports.length === 0
  const onTarget = ADAPTATIONS.filter(a => coverage[a.key].met).length
  // Each set once — the four lifting volumes overlap (039 §6.0); each session
  // once — a Garmin ride can feed two qualities (031 §7 decision 6).
  const liftingSets = weightSetsIn(weights, from, date)
  const inWindow = (d: string) => d >= from && d <= date
  const cardioSessions = cardio.filter(c => inWindow(c.date)).length + sports.filter(s => inWindow(s.date)).length

  const untouched = ADAPTATIONS.filter(a => coverage[a.key].volume === 0).map(a => QUALITY_PROSE[a.key])
  const short = ADAPTATIONS.filter(a => coverage[a.key].volume > 0 && !coverage[a.key].met).map(a => QUALITY_PROSE[a.key])
  const subParts: string[] = []
  if (untouched.length > 0) subParts.push(`Untouched: ${untouched.join(', ')}.`)
  if (short.length > 0) subParts.push(`Short: ${short.join(', ')}.`)
  const sub = subParts.length > 0 ? subParts.join(' ') : `Every quality on target in the last ${MUSCLE_WINDOW_DAYS} days.`

  const bands: SpectrumBand[] = SPECTRUM_QUALITIES.map(key => {
    const q = wholeBody.find(s => s.key === key)
    return {
      key,
      sessions: coverage[key].volume,
      target: coverage[key].sessionTarget,
      daysSince: q?.daysSince ?? null,
      stale: q?.stale ?? true,
    }
  })

  const openMuscle = (m: string) => setSheet({ muscle: m })

  return (
    <div className="text-ink" onPointerDown={prefetch}>
      {/* Header line — the only place the whole window gets one line (031 §7 decision 6) */}
      <div className="flex items-baseline justify-between">
        <span className="text-[9px] font-bold tracking-[0.16em] text-ink-3">LAST {MUSCLE_WINDOW_DAYS} DAYS</span>
        <span className="text-[11px] text-ink-2 tracking-[0.02em]">
          {liftingSets} lifting {liftingSets === 1 ? 'set' : 'sets'} · {cardioSessions} cardio {cardioSessions === 1 ? 'session' : 'sessions'}
        </span>
      </div>
      <p className="text-[19px] font-bold tracking-[-0.02em] leading-tight mt-1">
        {zeroData ? 'Nothing to read yet.' : `${onTarget} of ${ADAPTATIONS.length} on target`}
      </p>
      <p className="text-xs leading-[1.4] text-ink-2 mt-1 text-pretty">
        {zeroData
          ? (
            <>
              Nothing logged in the last {MUSCLE_WINDOW_DAYS} days.{' '}
              <button onClick={() => setTab('Weights')} className="text-signal font-semibold cursor-pointer">Log a session →</button>
            </>
          )
          : sub}
      </p>

      {/* Muscle-linked four — one map, four toggles (031 §3a) */}
      <div className="mt-3 bg-white border border-line rounded-[3px] px-2.5 pt-[7px] pb-1.5">
        <div className="flex items-baseline gap-1.5 mb-1.5">
          <span className="text-[9px] font-bold tracking-[0.14em] text-ink-3">MUSCLE-LINKED</span>
          <span className="text-[9px] text-ink-4">— {weeklyTarget}/wk per muscle · {MUSCLE_WINDOW_DAYS}-day window</span>
        </div>
        <div className="flex border border-ink rounded-[3px] overflow-hidden mb-2" role="tablist" aria-label="Muscle-linked quality">
          {MAP_QUALITIES.map((q, i) => (
            <button
              key={q}
              role="tab"
              aria-selected={q === quality}
              onClick={() => setQuality(q)}
              className={`grow basis-0 py-[6px] text-[9px] font-bold uppercase tracking-[0.06em] cursor-pointer ${
                i > 0 ? 'border-l border-ink' : ''
              } ${q === quality ? 'bg-ink text-white' : 'bg-white text-ink-2'}`}
            >
              {QUALITY_SHORT[q]}
            </button>
          ))}
        </div>
        <GapMap states={states} gaps={gaps} zeroData={zeroData} onPick={openMuscle} />
        <div className="flex items-center gap-1 mt-1 -mb-0.5">
          <Btn variant="ghost" small className="flex items-center gap-1.5 !px-1.5" onClick={() => setSheet({ rx: quality })}>
            <Icon name="info" size={13} /> How to train it
          </Btn>
          <Btn variant="ghost" small className="flex items-center gap-1.5 !px-1.5" onClick={() => setSheet({ list: true })}>
            <Icon name="list" size={13} /> All muscles
          </Btn>
        </div>
      </div>

      {/* Whole-body three — the effort spectrum (031 §3b) */}
      <div className="mt-2 bg-white border border-line rounded-[3px] px-2.5 pt-[7px] pb-1.5">
        <div className="flex items-baseline gap-1.5 mb-1.5">
          <span className="text-[9px] font-bold tracking-[0.14em] text-ink-3 shrink-0">WHOLE-BODY</span>
          <span className="text-[9px] text-ink-4">— by effort duration · {MUSCLE_WINDOW_DAYS}-day window · tap a band</span>
        </div>
        <EffortSpectrum bands={bands} zeroData={zeroData} onPick={(k: WholeBodyQuality) => setSheet({ rx: k })} />
      </div>

      <Suspense fallback={null}>
        {sheet && ('rx' in sheet
          ? <RxSheet quality={sheet.rx} onClose={() => setSheet(null)} />
          : 'list' in sheet
            ? (
              <MuscleListSheet
                quality={quality}
                states={states}
                weeklyTarget={weeklyTarget}
                onPick={openMuscle}
                onClose={() => setSheet(null)}
              />
            )
            : (
              <MuscleSheet
                muscle={sheet.muscle}
                onClose={() => setSheet(null)}
                onSearchExercises={() => { setSheet(null); setTab('Weights') }}
              />
            ))}
      </Suspense>
    </div>
  )
}
