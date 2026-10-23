import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../../store/app'
import {
  homeRead, homeView, today, lastNightDate, MUSCLE_WINDOW_DAYS, muscleShort, joinNames, type QualityTile,
} from '@tekio/core'
import { useReadRows } from '../../../hooks/useReadRows'
import { GapMap, RAMP } from './GapMap'
import { whileReloading } from '../../../lib/staleChunk'
import type { planPreview as PlanPreviewFn } from '../../../lib/planPreview'
import { Icon } from '../../ui/Icon'
import { SyncLine } from './SyncLine'
import { ReadinessGauge } from './ReadinessGauge'
import type { FoldKind } from './FoldSheet'
import type { WholeBodyQuality } from './QualitySheet'

// The fused Home read (roadmap 010/018, design-system.md, language SIGNAL).
// Everything here is T1: the whole five-second answer and nothing else — no
// charts, no lazy detail. The sheets below are T2: lazy chunks, prefetched on
// the first pointer-down anywhere on the surface.

const FoldSheet = lazy(() => import('./FoldSheet').then(whileReloading))
const MuscleSheet = lazy(() => import('./MuscleSheet').then(whileReloading))
const RecoverySheet = lazy(() => import('./RecoverySheet').then(whileReloading))
const QualitySheet = lazy(() => import('./QualitySheet').then(whileReloading))

type OpenSheet = { fold: FoldKind } | { muscle: string } | { recovery: true } | { quality: WholeBodyQuality }

const shortLower = (name: string): string => muscleShort(name).toLowerCase()

/** Bar tones on the readiness card; the gated inversion remaps them. */
const TONE = {
  ink: { normal: '#1a1a1a', gated: '#ffffff' },
  mid: { normal: '#8f8f8f', gated: '#a8a8a8' },
  accent: { normal: '#c2410c', gated: '#ffffff' },
  off: { normal: '#d6d6d4', gated: '#a8a8a8' },
} as const

/** A whole-body square's ink, from the state the view names. */
const TILE_FILL = (step: QualityTile['step']) => (step === null ? '#ffffff' : RAMP[step])
const TILE_EDGE: Record<QualityTile['edge'], string> = {
  blank: '#e2e2e0', accent: '#c2410c', ramp: '#c9c9c7', ink: '#1f1f1f',
}

export function HomeTab({ setTab }: { setTab: (t: string, muscle?: string) => void }) {
  const weights = useAppStore(s => s.weights)
  const bodyweight = useAppStore(s => s.bodyweight)
  const exerciseMuscles = useAppStore(s => s.exerciseMuscles)
  const muscleGroups = useAppStore(s => s.muscleGroups)

  const [sheet, setSheet] = useState<OpenSheet | null>(null)
  const prefetched = useRef(false)
  const prefetch = () => {
    if (prefetched.current) return
    prefetched.current = true
    import('./FoldSheet')
    import('./MuscleSheet')
    import('./RecoverySheet')
    import('./QualitySheet')
  }

  // The fused Home read, one call shared with the API (RFC 0094 step 2b), and
  // what Home prints of it, the same view the phone apps draw (RFC 0096).
  const rows = useReadRows()
  const date = today()
  const home = useMemo(() => homeRead(rows, date), [rows, date])
  const lastNight = lastNightDate()
  const view = useMemo(() => homeView(home, rows, lastNight, bodyweight[0] ?? null), [home, rows, lastNight, bodyweight])
  const { muscles: states, gaps, readiness: sys, coverage } = home
  const { readiness: card, qualities: missing } = view

  // RFC 0098's layer: today's open plan as an outline and one line. The fill,
  // the callouts, the verdict and the line above stay logged work only.
  // Loaded only on a day with an open plan (P1): the preview needs the
  // exercise catalogue, which would otherwise ride on Home's first paint.
  const plans = useAppStore(s => s.plans)
  const exerciseAliases = useAppStore(s => s.exerciseAliases)
  const hasOpenPlan = plans.some(p => p.date === date && !p.loggedAs)
  const [previewFn, setPreviewFn] = useState<{ run: typeof PlanPreviewFn } | null>(null)
  useEffect(() => {
    if (hasOpenPlan && !previewFn) import('../../../lib/planPreview').then(whileReloading).then(m => setPreviewFn({ run: m.planPreview }))
  }, [hasOpenPlan, previewFn])
  const preview = useMemo(
    () => previewFn?.run({ plans, weights, exerciseMuscles, aliases: exerciseAliases, muscleGroups, date }) ?? null,
    [previewFn, plans, weights, exerciseMuscles, exerciseAliases, muscleGroups, date],
  )
  const planLine = useMemo(() => {
    if (!preview) return null
    const closes = gaps.filter(g => preview.reached.has(g.name)).map(g => shortLower(g.name))
    const left = preview.gapsAfter.slice(0, 3).map(g => shortLower(g.name))
    const after = left.length ? `After it: ${joinNames(left)} still missing.` : 'After it, no muscle gap is left.'
    return closes.length
      ? `Today's plan reaches ${joinNames(closes)}. ${after}`
      : `Today's plan reaches no gap. ${after}`
  }, [preview, gaps])

  const gated = card.gated

  return (
    <div className="text-ink" onPointerDown={prefetch}>
      {/* Header */}
      <div className="flex items-center pb-2">
        <span className="text-[15px] font-bold tracking-[0.14em]">TEKIŌ</span>
        <SyncLine />
      </div>

      {/* Verdict — readiness gates the instruction; the sub names the top gap */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[9px] font-bold tracking-[0.16em] text-ink-3">TODAY</span>
        <span className="grow" />
        <span className="text-[11px] text-ink-2">{view.readinessLabel}</span>
      </div>
      <h2 className="font-serif text-[28px] leading-[1.12] font-bold tracking-[-0.01em] text-signal text-pretty">
        {view.verdict.text}
      </h2>
      <p className="text-xs leading-[1.4] text-ink-2 mt-1.5 text-pretty">{view.verdict.sub}</p>

      {/* Systemic gate — inverts to ink when the day is held; the gate changes
          the instruction, never the facts */}
      <button
        onClick={() => setSheet({ recovery: true })}
        aria-label="How readiness was read, and recovery inputs"
        className={`mt-3 block w-full text-left rounded-[3px] border border-ink cursor-pointer ${gated ? 'bg-ink text-white' : 'bg-white'}`}
      >
        <div className={`flex items-center gap-1.5 px-2.5 pt-[7px] pb-[5px] border-b ${gated ? 'border-invert-line' : 'border-line'}`}>
          <Icon name="heart" size={13} />
          <span className="text-[10px] font-bold tracking-[0.1em]">SYSTEMIC READINESS</span>
          {card.method && (
            <span className={`text-[9px] font-bold tracking-[0.1em] ${gated ? 'text-ink-4' : 'text-ink-3'}`}>
              · {card.method}
            </span>
          )}
          <span className="grow" />
          <span className="text-[13px] font-bold tracking-[0.06em]">{card.band}</span>
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
          {card.columns.map(col => (
            <div key={col.label} className="grow basis-0 pr-2">
              <div className={`text-[9px] tracking-[0.05em] mb-[3px] ${gated ? 'text-ink-4' : 'text-ink-3'}`}>{col.label}</div>
              <div className={`text-xs font-semibold ${col.ask && !gated ? 'text-signal' : ''}`}>{col.value}</div>
              <div className="mt-1">
                {col.gauge !== undefined ? (
                  <ReadinessGauge gauge={col.gauge} inverted={gated} />
                ) : (
                  <div className={`h-[3px] rounded-sm ${gated ? 'bg-invert-line' : 'bg-line'}`}>
                    <div
                      className="h-[3px] rounded-sm"
                      style={{ width: `${col.pct ?? 0}%`, background: TONE[col.tone][gated ? 'gated' : 'normal'] }}
                    />
                  </div>
                )}
              </div>
              {col.note && (
                <div className={`text-[10px] mt-[5px] ${gated ? 'text-ink-4' : 'text-ink-3'}`}>{col.note}</div>
              )}
            </div>
          ))}
        </div>
        {card.note && (
          <div className={`px-2.5 pb-[7px] -mt-0.5 text-[10px] ${gated ? 'text-ink-4' : 'text-ink-3'}`}>{card.note}</div>
        )}
      </button>
      {card.hint && <p className="text-[10px] leading-[1.35] text-ink-3 mt-1">{card.hint}</p>}

      {/* Gate banner — held days only */}
      {view.banner && (
        <div className="mt-2 px-2.5 py-[7px] bg-ink text-white rounded-[3px] flex items-center gap-[7px]">
          <Icon name="pause" size={13} className="shrink-0" />
          <span className="text-[11px] leading-[1.3] text-pretty">{view.banner}</span>
        </div>
      )}

      {/* What is missing = the map: ranked callouts on the body ARE the list.
          8px above, like the cards below — the 4px it gives back pays for the
          line's larger type, and Home stays one 900px screen (0082) */}
      <div className="mt-2 bg-white border border-line rounded-[3px] px-2.5 py-[7px]">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="text-[9px] font-bold tracking-[0.14em] text-ink-3">WHAT IS MISSING</span>
          <span className="text-[9px] text-ink-4">— ranked on the body · worst first</span>
        </div>
        <GapMap states={states} callouts={view.map.callouts} zeroData={view.zeroData} onPick={m => setSheet({ muscle: m })} planned={preview?.reached} />
        {planLine && <p className="text-[11px] leading-[1.35] text-ink-2 mt-1 text-pretty">{planLine}</p>}
        {/* the seven qualities by name — the sentence the Adaptations header
            prints, from one helper (062). Power is one name in it, not a line
            of its own: it is muscle-linked, so its zero lives here, on the
            muscle side, never in the cardio strip (P2). Body size, not a 9px
            note: it is the only thing on Home that answers §6's second
            question, and at 9px a cold read never reached it (0082). The
            untouched half leads, its names in the accent — the same red that edges
            an untouched whole-body tile below; the short names follow in ink-2.
            Both labels are the same ink semibold — only the names carry state */}
        <p className="text-xs leading-[1.4] mt-1 text-pretty">
          {missing.line ? (
            <span className={view.zeroData ? 'text-ink-2' : undefined}>{missing.line}</span>
          ) : (
            <>
              {missing.untouched && (
                <span className="font-semibold">
                  Untouched: <span className="text-signal">{missing.untouched}</span>.
                </span>
              )}
              {missing.untouched && missing.short && ' '}
              {missing.short && (
                <span>
                  <span className="font-semibold">Short:</span> <span className="text-ink-2">{missing.short}.</span>
                </span>
              )}
            </>
          )}
        </p>
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
            <Icon name="arrowRight" size={12} className="text-ink-2" />
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
          {view.wholeBody.map(q => (
            <button
              key={q.key}
              onClick={() => setSheet({ quality: q.key })}
              aria-label={`${q.name} ${coverage[q.key].unit}, last ${MUSCLE_WINDOW_DAYS} days`}
              className="border border-line rounded-sm px-[5px] pt-1 pb-[5px] text-left cursor-pointer"
            >
              <div className="flex items-center gap-1">
                <svg width="8" height="8" aria-hidden>
                  <rect x="0.5" y="0.5" width="7" height="7" rx="1" fill={TILE_FILL(q.step)} stroke={TILE_EDGE[q.edge]} />
                </svg>
                <span className="text-[9px] font-bold tracking-[0.02em]">{q.name}</span>
              </div>
              <div className="text-[9px] text-ink-2 mt-0.5">{q.note}</div>
            </button>
          ))}
        </div>
      </div>

      {/* The two folds as tappable stats (T2): weight and blood */}
      <div className="mt-2 flex gap-1.5">
        {view.folds.map(t => (
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
            ? <RecoverySheet sys={sys} onClose={() => setSheet(null)} onOpenProfile={() => { setSheet(null); setTab('Profile', 'readiness') }} />
            : 'quality' in sheet
              ? (
                <QualitySheet
                  quality={sheet.quality}
                  summary={coverage[sheet.quality]}
                  onClose={() => setSheet(null)}
                />
              )
              : (
              <MuscleSheet
                muscle={sheet.muscle}
                onClose={() => setSheet(null)}
              />
            ))}
      </Suspense>
    </div>
  )
}
