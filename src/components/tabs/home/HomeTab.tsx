import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../../store/app'
import { usePrefs } from '../../../store/prefs'
import {
  muscleStates, muscleWindow, rankMuscleGaps, qualityStates, systemicReadiness,
  donationStatus, waterStatus, fusedVerdict,
  type MuscleState, type SystemicReadiness, type DonationStatus, type FusedVerdict,
} from '../../../lib/fusedRead'
import { useHrMax } from '../../../hooks/useHrMax'
import { cycleInfo, today, daysBetween, fmtSets, fmtAgo } from '../../../lib/utils'
import { CYCLE, RECOVER_DAYS, WATER_GOAL_ML, DONATION_SUPPRESSION, MUSCLE_WINDOW_DAYS } from '../../../constants/app'
import { GapMap, muscleShort, RAMP, rampStep } from './GapMap'
import { adaptationCoverage, coverageState, GAP_CUTOFF } from '../../../lib/adaptations'
import { coverageLine } from '../adaptations/labels'
import type { FoldKind } from './FoldSheet'

// The fused Home read (roadmap 010/018, design-system.md, language SIGNAL).
// Everything here is T1: the whole five-second answer and nothing else — no
// charts, no lazy detail. The sheets below are T2: lazy chunks, prefetched on
// the first pointer-down anywhere on the surface.

const FoldSheet = lazy(() => import('./FoldSheet'))
const MuscleSheet = lazy(() => import('./MuscleSheet'))
const RecoverySheet = lazy(() => import('./RecoverySheet'))

type OpenSheet = { fold: FoldKind } | { muscle: string } | { recovery: true }

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

const joinNames = (names: string[]): string =>
  names.length <= 1 ? names[0] ?? '' : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

const shortLower = (name: string): string => muscleShort(name).toLowerCase()

/** The gated instruction plus the top gap as its reason — all editorial text
 *  for the verdict block lives here, the numbers come from the fused read. */
function verdictCopy(args: {
  zeroData: boolean
  verdict: FusedVerdict
  sys: SystemicReadiness
  don: DonationStatus
  gaps: MuscleState[]
  recoveringShorts: string[]
  minDaysSince: number | null
  isDeload: boolean
}): { text: string; sub: string } {
  const { zeroData, verdict, sys, don, gaps, recoveringShorts, minDaysSince, isDeload } = args

  if (zeroData) {
    return {
      text: 'Nothing logged yet.',
      sub: 'One session and this screen starts answering. Nothing here is guessed.',
    }
  }

  if (verdict.mode === 'hold') {
    const text = 'Hold. Walk or mobility only.'
    if (verdict.cause === 'donation') {
      const when = fmtAgo(don.daysSince)
      return { text, sub: `Full blood donation ${when} — the 48 h acute window (PLACEHOLDER) gates the day.` }
    }
    const parts = []
    if (sys.sleepScore != null) parts.push(`Sleep ${sys.sleepScore}`)
    if (sys.hrv != null) parts.push(`HRV ${sys.hrv}`)
    const facts = parts.length > 0 ? parts.join(' and ') : `Readiness ${sys.readiness}`
    return { text, sub: `${facts} — a bad night overrides the plan.` }
  }

  const names = gaps.slice(0, 2).map(m => shortLower(m.name))
  const list = joinNames(names)
  if (isDeload) {
    return {
      text: list ? `Deload week — ${list} at half volume.` : 'Deload week — half volume.',
      sub: `Week ${CYCLE} of the cycle. The gap stays the same; the volume cap is the only change.`,
    }
  }

  const text = list
    ? `Push. ${cap(list)} ${names.length > 1 ? 'are' : 'is'} the gap.`
    : `Push. No gap in the last ${MUSCLE_WINDOW_DAYS} days.`
  const facts = gaps.slice(0, 2).map(m =>
    m.daysSince === null
      ? `${cap(shortLower(m.name))}: never trained.`
      : `${cap(shortLower(m.name))}: ${fmtSets(m.sets)} sets in ${MUSCLE_WINDOW_DAYS} days.`)
  if (recoveringShorts.length > 0) {
    const who = recoveringShorts.length > 3 ? `${recoveringShorts.length} muscles` : joinNames(recoveringShorts)
    facts.push(`${cap(who)} still recovering (PLACEHOLDER: ${RECOVER_DAYS} days).`)
  } else if (minDaysSince !== null) {
    facts.push(`Nothing is sore — last stimulus ${fmtAgo(minDaysSince)}.`)
  }
  if (don.aerobicSuppressed && !don.acuteHold) {
    facts.push(`Blood: full donation ${fmtAgo(don.daysSince)} — aerobic work is suppressed (PLACEHOLDER: ~${DONATION_SUPPRESSION.aerobicTailDays} d).`)
  }
  return { text, sub: facts.join(' ') }
}

/** Bar tones on the readiness card; the gated inversion remaps them. */
const TONE = {
  ink: { normal: '#1a1a1a', gated: '#ffffff' },
  mid: { normal: '#8f8f8f', gated: '#a8a8a8' },
  accent: { normal: '#c2410c', gated: '#ffffff' },
  off: { normal: '#d6d6d4', gated: '#a8a8a8' },
} as const

interface GateCol {
  label: string
  value: string
  pct: number
  tone: keyof typeof TONE
}

export function HomeTab({ setTab }: { setTab: (t: string, muscle?: string) => void }) {
  const {
    weights, cardio, sports, sleep, donations, water, bodyweight, programs,
    exerciseMuscles, muscleGroups, exerciseAdaptations, adaptationTargets,
  } = useAppStore()
  const { trackedMuscleGroupIds } = usePrefs()

  const [sheet, setSheet] = useState<OpenSheet | null>(null)
  const prefetched = useRef(false)
  const prefetch = () => {
    if (prefetched.current) return
    prefetched.current = true
    import('./FoldSheet')
    import('./MuscleSheet')
    import('./RecoverySheet')
  }

  const states = useMemo(
    () => muscleStates(weights, exerciseMuscles, muscleGroups),
    [weights, exerciseMuscles, muscleGroups],
  )
  const gaps = useMemo(
    () => rankMuscleGaps(states).filter(m => m.fillFraction < GAP_CUTOFF),
    [states],
  )
  const { hrMax } = useHrMax()
  const qualities = useMemo(() => qualityStates(cardio, sports, undefined, hrMax), [cardio, sports, hrMax])
  const sys = useMemo(() => systemicReadiness(sleep), [sleep])
  const don = useMemo(() => donationStatus(donations), [donations])
  const wat = useMemo(() => waterStatus(water), [water])

  // The seven-quality coverage read, the same call the Adaptations tab makes
  // (roadmap 062): Home names every quality that is untouched or short, by
  // name, instead of a line hardcoded to power.
  const date = today()
  const { from } = muscleWindow(date)
  const coverage = useMemo(
    () => adaptationCoverage({
      weights, cardio, sports, exerciseMuscles, muscleGroups, from, date, windowDays: MUSCLE_WINDOW_DAYS,
      overrides: exerciseAdaptations, trackedMuscleIds: trackedMuscleGroupIds, targets: adaptationTargets, hrMax,
    }),
    [weights, cardio, sports, exerciseMuscles, muscleGroups, from, date, exerciseAdaptations, trackedMuscleGroupIds, adaptationTargets, hrMax],
  )
  const missingLine = coverageLine(coverage, MUSCLE_WINDOW_DAYS)

  const verdict = fusedVerdict(sys.readiness, don)
  const gated = verdict.mode === 'hold'
  const zeroData = weights.length === 0 && cardio.length === 0 && sports.length === 0

  const program = programs[0] ?? null
  const { week, isDeload, isComplete } = cycleInfo(program)
  const cycleLabel = !program
    ? 'No active program'
    : isComplete ? 'Cycle complete'
    : `Week ${week} of ${CYCLE}${isDeload ? ' · DELOAD' : ''}`

  const recoveringShorts = states.filter(s => s.leaf && s.recovering).map(s => shortLower(s.name))
  const minDaysSince = states.reduce<number | null>(
    (min, s) => (s.daysSince !== null && (min === null || s.daysSince < min) ? s.daysSince : min),
    null,
  )

  const { text: verdictText, sub: verdictSub } = verdictCopy({
    zeroData, verdict, sys, don, gaps, recoveringShorts, minDaysSince, isDeload,
  })

  const gateCols: GateCol[] = [
    sys.sleepScore != null
      ? { label: 'SLEEP', value: String(sys.sleepScore), pct: sys.sleepScore, tone: 'ink' }
      : { label: 'SLEEP', value: '—', pct: 0, tone: 'off' },
    sys.hrv != null
      ? { label: 'HRV', value: String(sys.hrv), pct: sys.hrvScore ?? 0, tone: 'ink' }
      : { label: 'HRV', value: '—', pct: 0, tone: 'off' },
    wat.daysSince === 0
      ? { label: 'WATER', value: `${(wat.lastDayMl / 1000).toFixed(1)} L`, pct: Math.min(100, Math.round((100 * wat.lastDayMl) / WATER_GOAL_ML)), tone: 'ink' }
      : wat.daysSince !== null
        ? { label: 'WATER', value: `${wat.daysSince}d old`, pct: 10, tone: 'mid' }
        : { label: 'WATER', value: '—', pct: 0, tone: 'off' },
    don.acuteHold
      ? { label: 'BLOOD', value: fmtAgo(don.daysSince), pct: 8, tone: 'accent' }
      : don.aerobicSuppressed
        ? { label: 'BLOOD', value: fmtAgo(don.daysSince), pct: Math.round((100 * (don.daysSince ?? 0)) / DONATION_SUPPRESSION.aerobicTailDays), tone: 'accent' }
        : { label: 'BLOOD', value: 'clear', pct: 100, tone: 'ink' },
  ]

  const banner = gated
    ? verdict.cause === 'donation'
      ? `Full blood donation ${fmtAgo(don.daysSince)} — the 48 h acute window (PLACEHOLDER) holds today. The gaps below stay open.`
      : `Readiness ${sys.readiness} is below the push threshold (PLACEHOLDER). The gaps below stay open — today just isn't the day to close them.`
    : null

  // The three folds as T2 stat tiles (unit 3): a readiness input each, never a
  // destination (P3). Tap reveals the capture sheet; the T1 read never reflows.
  const latestBw = bodyweight[0] ?? null
  const bwDays = latestBw ? daysBetween(latestBw.date, today()) : null
  const foldTiles: { kind: FoldKind; label: string; value: string; note: string; accent?: boolean }[] = [
    wat.daysSince === null
      ? { kind: 'water', label: 'WATER', value: '—', note: 'tap to log' }
      : wat.daysSince === 0
        ? { kind: 'water', label: 'WATER', value: `${(wat.lastDayMl / 1000).toFixed(1)} L`, note: 'today' }
        : { kind: 'water', label: 'WATER', value: `${(wat.lastDayMl / 1000).toFixed(1)} L`, note: `stale ${wat.daysSince}d`, accent: true },
    latestBw
      ? { kind: 'weight', label: 'WEIGHT', value: `${latestBw.weight.toFixed(1)} kg`, note: bwDays === 0 ? 'today' : bwDays === 1 ? 'yesterday' : `${bwDays} d ago` }
      : { kind: 'weight', label: 'WEIGHT', value: '—', note: 'tap to log' },
    don.acuteHold
      ? { kind: 'blood', label: 'BLOOD', value: don.daysSince === 0 ? 'today' : `${don.daysSince} d`, note: '48 h hold · PLACEHOLDER', accent: true }
      : don.aerobicSuppressed
        ? { kind: 'blood', label: 'BLOOD', value: `${don.daysSince} d`, note: 'aerobic tail · PLACEHOLDER', accent: true }
        : don.daysSince !== null
          ? { kind: 'blood', label: 'BLOOD', value: `${don.daysSince} d`, note: don.eligibleInDays > 0 ? `eligible in ${don.eligibleInDays} d` : 'eligible' }
          : { kind: 'blood', label: 'BLOOD', value: '—', note: 'tap to log' },
  ]

  // The square reads coverage, the note reads recency (roadmap 063). Both were
  // once thresholds: the square used QUALITY_STALENESS_DAYS (14/28/14) while
  // the line above it used the 14-day coverage window, so the same quality
  // could be a filled chip under "Untouched: anaerobic". The fill now comes
  // from the same `coverage` call the line makes — sessions ÷ the window's
  // target, on the map's ramp — so the two cannot disagree. `N d ago` stays
  // because it is the fact the line cannot state.
  const qualityTiles = ([
    { key: 'vo2max', name: 'VO₂MAX' },
    { key: 'anaerobic_capacity', name: 'ANAEROBIC' },
    { key: 'endurance', name: 'ENDURANCE' },
  ] as const).map(meta => {
    const q = qualities.find(s => s.key === meta.key)
    if (zeroData || !q) return { ...meta, note: '—', fill: '#ffffff', edge: '#e2e2e0' }
    const c = coverage[meta.key]
    const note = fmtAgo(q.daysSince)
    // Same polarity as the map: untouched is white with the accent edge, and
    // work accumulates ink. The word comes from `coverageState`, the same call
    // the line makes, so the ink band means exactly what the line means by "on
    // target" — a muscle reaches that at GAP_CUTOFF, a cardio quality only at
    // its whole session target, and reading the raw ramp here would ink a
    // square at 0.75 under a line still calling that quality short.
    const state = coverageState(c)
    if (state === 'untouched') return { ...meta, note, fill: '#ffffff', edge: '#c2410c' }
    const step = state === 'on_target'
      ? 3
      : Math.min(rampStep(c.sessionTarget > 0 ? c.volume / c.sessionTarget : 1), 2)
    return { ...meta, note, fill: RAMP[step], edge: step === 3 ? '#1f1f1f' : '#c9c9c7' }
  })

  return (
    <div className="text-ink" onPointerDown={prefetch}>
      {/* Header */}
      <div className="flex items-baseline justify-between pb-2">
        <span className="text-[15px] font-bold tracking-[0.14em]">TEKIŌ</span>
        <span className="text-[11px] text-ink-2 tracking-[0.04em]">{cycleLabel}</span>
      </div>

      {/* Verdict — readiness gates the instruction; the sub names the top gap */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[9px] font-bold tracking-[0.16em] text-ink-3">TODAY</span>
        <span className="grow" />
        <span className="text-[11px] text-ink-2">{sys.readiness === null ? 'no readiness data' : 'readiness'}</span>
      </div>
      <h2 className="font-serif text-[28px] leading-[1.12] font-bold tracking-[-0.01em] text-signal text-pretty">
        {verdictText}
      </h2>
      <p className="text-xs leading-[1.4] text-ink-2 mt-1.5 text-pretty">{verdictSub}</p>

      {/* Systemic gate — inverts to ink when the day is held; the gate changes
          the instruction, never the facts */}
      <button
        onClick={() => setSheet({ recovery: true })}
        aria-label="Log recovery inputs"
        className={`mt-3 block w-full text-left rounded-[3px] border border-ink cursor-pointer ${gated ? 'bg-ink text-white' : 'bg-white'}`}
      >
        <div className={`flex items-center gap-1.5 px-2.5 pt-[7px] pb-[5px] border-b ${gated ? 'border-invert-line' : 'border-line'}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 21s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.4-7 10-7 10z" />
          </svg>
          <span className="text-[10px] font-bold tracking-[0.1em]">SYSTEMIC READINESS</span>
          <span className="grow" />
          <span className="text-[17px] font-bold tracking-[-0.02em]">{sys.readiness ?? '—'}</span>
          {/* sauna / cold / manual sleep live behind this tap — the card that
              raises "can I push?" is where the input belongs (P1) */}
          <span
            aria-hidden
            className={`w-[15px] h-[15px] rounded-[2px] border flex items-center justify-center text-[11px] leading-none font-bold ${gated ? 'border-invert-line text-ink-4' : 'border-line text-ink-3'}`}
          >
            +
          </span>
        </div>
        <div className="flex px-2.5 pt-[7px] pb-2">
          {gateCols.map(col => (
            <div key={col.label} className="grow basis-0 pr-2">
              <div className={`text-[9px] tracking-[0.05em] mb-[3px] ${gated ? 'text-ink-4' : 'text-ink-3'}`}>{col.label}</div>
              <div className="text-xs font-semibold">{col.value}</div>
              <div className={`h-[3px] mt-1 rounded-sm ${gated ? 'bg-invert-line' : 'bg-line'}`}>
                <div
                  className="h-[3px] rounded-sm"
                  style={{ width: `${col.pct}%`, background: TONE[col.tone][gated ? 'gated' : 'normal'] }}
                />
              </div>
            </div>
          ))}
        </div>
      </button>

      {/* Gate banner — held days only */}
      {banner && (
        <div className="mt-2 px-2.5 py-[7px] bg-ink text-white rounded-[3px] flex items-center gap-[7px]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" className="shrink-0" aria-hidden>
            <path d="M9 6v12M15 6v12" />
          </svg>
          <span className="text-[11px] leading-[1.3] text-pretty">{banner}</span>
        </div>
      )}

      {/* What is missing = the map: ranked callouts on the body ARE the list */}
      <div className="mt-3 bg-white border border-line rounded-[3px] px-2.5 py-[7px]">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="text-[9px] font-bold tracking-[0.14em] text-ink-3">WHAT IS MISSING</span>
          <span className="text-[9px] text-ink-4">— ranked on the body · worst first</span>
        </div>
        <GapMap states={states} gaps={gaps} zeroData={zeroData} onPick={m => setSheet({ muscle: m })} />
        {/* the seven qualities by name — the sentence the Adaptations header
            prints, from one helper (062). Power is one name in it, not a line
            of its own: it is muscle-linked, so its zero lives here, on the
            muscle side, never in the cardio strip (P2) */}
        <div className="text-[9px] text-ink-2 mt-1 text-pretty">
          {zeroData ? 'ALL 7 QUALITIES — no data yet' : missingLine}
        </div>
        {/* The door (064). 062 kept both screens on the split "Home answers,
            Adaptations explains" — which only works if the answer can be
            walked to the explanation. Until now Adaptations lived in the
            hamburger menu and nothing on Home pointed at it. */}
        <button
          onClick={() => setTab('Adaptations')}
          className="mt-1.5 -mx-2.5 -mb-[7px] px-2.5 py-[7px] w-[calc(100%+1.25rem)] border-t border-line flex items-center justify-between text-left cursor-pointer"
        >
          <span className="text-[10px] text-ink-2">What to do about it</span>
          <span className="flex items-center gap-1 text-[9px] font-bold tracking-[0.06em] text-ink-3">
            ADAPTATIONS
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </button>
      </div>

      {/* Whole-body qualities — one state each, all cardio */}
      <div className="mt-2 bg-white border border-line rounded-[3px] px-2.5 pt-[7px] pb-2">
        <div className="flex items-baseline gap-1.5 mb-1.5">
          <span className="text-[9px] font-bold tracking-[0.14em] text-ink-3">WHOLE-BODY QUALITIES</span>
          <span className="text-[9px] text-ink-4">— all cardio · fill = {MUSCLE_WINDOW_DAYS} d coverage</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {qualityTiles.map(q => (
            <div key={q.key} className="border border-line rounded-sm px-[5px] pt-1 pb-[5px]">
              <div className="flex items-center gap-1">
                <svg width="8" height="8" aria-hidden>
                  <rect x="0.5" y="0.5" width="7" height="7" rx="1" fill={q.fill} stroke={q.edge} />
                </svg>
                <span className="text-[9px] font-bold tracking-[0.02em]">{q.name}</span>
              </div>
              <div className="text-[9px] text-ink-2 mt-0.5">{q.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Readiness inputs — the three folds as tappable stats (T2) */}
      <div className="mt-2 flex gap-1.5">
        {foldTiles.map(t => (
          <button
            key={t.kind}
            onClick={() => setSheet({ fold: t.kind })}
            className="grow basis-0 bg-white border border-line rounded-[3px] px-[7px] pt-1 pb-[5px] text-left cursor-pointer"
          >
            <div className="text-[8px] text-ink-3 tracking-[0.08em]">{t.label}</div>
            <div className="text-[13px] font-bold mt-px">{t.value}</div>
            <div className={`text-[8px] ${t.accent ? 'text-signal' : 'text-ink-3'}`}>{t.note}</div>
          </button>
        ))}
      </div>

      <Suspense fallback={null}>
        {sheet && ('fold' in sheet
          ? <FoldSheet kind={sheet.fold} onClose={() => setSheet(null)} />
          : 'recovery' in sheet
            ? <RecoverySheet onClose={() => setSheet(null)} />
            : (
              <MuscleSheet
                muscle={sheet.muscle}
                onClose={() => setSheet(null)}
                onSearchExercises={() => { setSheet(null); setTab('Weights') }}
                onOpenAdaptations={() => { setSheet(null); setTab('Adaptations', sheet.muscle) }}
              />
            ))}
      </Suspense>
    </div>
  )
}
