import { ADAPTATION_MAP, ADAPTATION_PRINCIPLE } from '../../../constants/adaptations'
import type { Adaptation } from '../../../types'
import { BottomSheet, SheetClose } from '../home/BottomSheet'
import { AdaptationRxTable } from '../home/AdaptationRx'

// "How to train it" for one adaptation (roadmap 031 §3a, §7 decision 5): the
// rx block summoned where the question is raised (P1) instead of parked in a
// collapsed guide at the bottom of the page. T2 — lazy, opened on intent.

interface RxSheetProps {
  quality: Adaptation
  onClose: () => void
}

export default function RxSheet({ quality, onClose }: RxSheetProps) {
  const meta = ADAPTATION_MAP[quality]
  return (
    <BottomSheet label={`How to train ${meta.label}`} onClose={onClose}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[9px] font-bold tracking-[0.14em] text-ink-3">HOW TO TRAIN IT</div>
          <h3 className="text-[19px] font-bold tracking-[-0.02em] leading-tight mt-0.5">{meta.label}</h3>
          <p className="text-xs text-ink-2 mt-0.5">{meta.summary}</p>
        </div>
        <SheetClose onClose={onClose} />
      </div>

      <div className="mt-3 border border-line rounded-[3px] px-2.5 py-2">
        <AdaptationRxTable rx={meta.rx} />
      </div>

      {/* 039 S4 (inventory D17): heavy strength work also builds power in the
          not-yet-strong, but the map never credits a strength set to power. */}
      {quality === 'power' && (
        <p className="text-xs leading-[1.4] text-ink-2 mt-2.5 text-pretty">
          If you already squat heavy, an empty power fill is a smaller gap than it looks: heavy strength sets also
          build power in the not-yet-strong (Cormie 2010). The map still counts velocity work only — that is the part
          that silently disappears from a lifter's week.
        </p>
      )}

      <div className="mt-3 pt-2.5 border-t border-hairline">
        <p className="text-[11px] leading-[1.4] text-ink-2 text-pretty">{ADAPTATION_PRINCIPLE}</p>
        {/* A taxonomy credit only — the blanket attribution was false for four of the
            protocols (039 S10, ledger D26); named protocols carry their author. */}
        <p className="text-[10px] leading-[1.4] text-ink-3 mt-2 text-pretty">
          Seven adaptations after Dr. Andy Galpin (Huberman Lab guest series, 2023). Each prescription is sourced
          separately; named protocols carry their author.
        </p>
      </div>
    </BottomSheet>
  )
}
