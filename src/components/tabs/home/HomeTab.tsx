import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../../store/app'
import {
  muscleStates, rankMuscleGaps, qualityStates, systemicReadiness,
  donationStatus, waterStatus, fusedVerdict, powerSetCount, daysBetween,
  CYCLE_WINDOW_DAYS,
  type MuscleState, type SystemicReadiness, type DonationStatus, type FusedVerdict,
} from '../../../lib/fusedRead'
import { cycleInfo, today } from '../../../lib/utils'
import { CYCLE, RECOVER_DAYS, WATER_GOAL_ML, DONATION_SUPPRESSION } from '../../../constants/app'
import { GapMap, muscleShort, GAP_CUTOFF } from './GapMap'
import type { FoldKind } from './FoldSheet'

// The fused Home read (roadmap 010/018, design-system.md, language SIGNAL).
// Everything here is T1: the whole five-second answer and nothing else — no
// charts, no lazy detail. The sheets below are T2: lazy chunks, prefetched on
// the first pointer-down anywhere on the surface.

const FoldSheet = lazy(() => import('./FoldSheet'))
const MuscleSheet = lazy(() => import('./MuscleSheet'))

type OpenSheet = { fold: FoldKind } | { muscle: string }

const fmtSets = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1))

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
      const when = don.daysSince === 0 ? 'today' : `${don.daysSince} d ago`
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
    : 'Push. No gap this cycle.'
  const facts = gaps.slice(0, 2).map(m =>
    m.daysSince === null
      ? `${cap(shortLower(m.name))}: never trained this cycle.`
      : `${cap(shortLower(m.name))}: ${fmtSets(m.sets)} sets in ${CYCLE_WINDOW_DAYS} days.`)
  if (recoveringShorts.length > 0) {
    const who = recoveringShorts.length > 3 ? `${recoveringShorts.length} muscles` : joinNames(recoveringShorts)
    facts.push(`${cap(who)} still recovering (PLACEHOLDER: ${RECOVER_DAYS} days).`)
  } else if (minDaysSince !== null) {
    facts.push(`Nothing is sore — last stimulus ${minDaysSince === 0 ? 'today' : `${minDaysSince} d ago`}.`)
  }
  if (don.aerobicSuppressed && !don.acuteHold) {
    facts.push(`Blood: full donation ${don.daysSince} d ago — aerobic work is suppressed (PLACEHOLDER: ~${DONATION_SUPPRESSION.aerobicTailDays} d).`)
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

export function HomeTab({ setTab }: { setTab: (t: string) => void }) {
  const {
    weights, cardio, sports, sleep, donations, water, bodyweight, programs,
    exerciseMuscles, muscleGroups, exerciseAdaptations,
  } = useAppStore()

  const [sheet, setSheet] = useState<OpenSheet | null>(null)
  const prefetched = useRef(false)
  const prefetch = () => {
    if (prefetched.current) return
    prefetched.current = true
    import('./FoldSheet')
    import('./MuscleSheet')
  }

  const states = useMemo(
    () => muscleStates(weights, exerciseMuscles, muscleGroups),
    [weights, exerciseMuscles, muscleGroups],
  )
  const gaps = useMemo(
    () => rankMuscleGaps(states).filter(m => m.fillFraction < GAP_CUTOFF),
    [states],
  )
  const qualities = useMemo(() => qualityStates(cardio, sports), [cardio, sports])
  const sys = useMemo(() => systemicReadiness(sleep), [sleep])
  const don = useMemo(() => donationStatus(donations), [donations])
  const wat = useMemo(() => waterStatus(water), [water])
  const powerSets = useMemo(() => powerSetCount(weights, exerciseAdaptations), [weights, exerciseAdaptations])

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
      ? { label: 'BLOOD', value: don.daysSince === 0 ? 'today' : '1 d ago', pct: 8, tone: 'accent' }
      : don.aerobicSuppressed
        ? { label: 'BLOOD', value: `${don.daysSince} d ago`, pct: Math.round((100 * (don.daysSince ?? 0)) / DONATION_SUPPRESSION.aerobicTailDays), tone: 'accent' }
        : { label: 'BLOOD', value: 'clear', pct: 100, tone: 'ink' },
  ]

  const banner = gated
    ? verdict.cause === 'donation'
      ? `Full blood donation ${don.daysSince === 0 ? 'today' : `${don.daysSince} d ago`} — the 48 h acute window (PLACEHOLDER) holds today. The gaps below stay open.`
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

  const qualityTiles = ([
    { key: 'vo2max', name: 'VO₂MAX' },
    { key: 'anaerobic_capacity', name: 'ANAEROBIC' },
    { key: 'endurance', name: 'ENDURANCE' },
  ] as const).map(meta => {
    const q = qualities.find(s => s.key === meta.key)
    if (zeroData || !q) return { ...meta, note: '—', fill: '#ffffff', edge: '#e2e2e0' }
    return {
      ...meta,
      note: q.daysSince === null ? 'never' : `${q.daysSince} d ago`,
      // Same polarity as the map: trained fills with ink, untouched gets the accent edge.
      fill: q.stale ? '#ffffff' : '#1f1f1f',
      edge: q.stale ? '#c2410c' : '#1f1f1f',
    }
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
      <div className={`mt-3 rounded-[3px] border border-ink ${gated ? 'bg-ink text-white' : 'bg-white'}`}>
        <div className={`flex items-center gap-1.5 px-2.5 pt-[7px] pb-[5px] border-b ${gated ? 'border-invert-line' : 'border-line'}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 21s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.4-7 10-7 10z" />
          </svg>
          <span className="text-[10px] font-bold tracking-[0.1em]">SYSTEMIC READINESS</span>
          <span className="grow" />
          <span className="text-[17px] font-bold tracking-[-0.02em]">{sys.readiness ?? '—'}</span>
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
      </div>

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
        {/* power is muscle-linked, not whole-body — its zero lives on the muscle
            side, not in the cardio strip (P2) */}
        <div className="text-[9px] text-ink-2 mt-1">
          {zeroData
            ? 'POWER — no data yet'
            : `POWER — ${powerSets} sets, any muscle · muscle-linked, reads per muscle`}
        </div>
      </div>

      {/* Whole-body qualities — one state each, all cardio */}
      <div className="mt-2 bg-white border border-line rounded-[3px] px-2.5 pt-[7px] pb-2">
        <div className="flex items-baseline gap-1.5 mb-1.5">
          <span className="text-[9px] font-bold tracking-[0.14em] text-ink-3">WHOLE-BODY QUALITIES</span>
          <span className="text-[9px] text-ink-4">— all cardio · one state each</span>
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
