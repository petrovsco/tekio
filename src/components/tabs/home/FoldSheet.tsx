import { useState } from 'react'
import { useAppStore } from '../../../store/app'
import { WATER_GOAL_ML, DONATION_SUPPRESSION } from '../../../constants/app'
import { today } from '../../../lib/utils'
import { BottomSheet, SheetClose, Chip } from './BottomSheet'

// The three folded captures (WATER / WEIGHT / BLOOD) as one T2 bottom sheet
// (roadmap 018 unit 3, design-system §8). Water and blood are readiness
// inputs, weight is a Home stat — none of them is a destination (doctrine P3).

export type FoldKind = 'water' | 'weight' | 'blood'

interface FoldSheetProps {
  kind: FoldKind
  onClose: () => void
}

const TITLES: Record<FoldKind, string> = {
  water: 'LOG WATER',
  weight: 'LOG WEIGHT',
  blood: 'LOG BLOOD',
}

export default function FoldSheet({ kind, onClose }: FoldSheetProps) {
  return (
    <BottomSheet onClose={onClose} label={TITLES[kind]}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[9px] font-bold tracking-[0.14em] text-ink-3">{TITLES[kind]}</span>
        <span className="grow" />
        <SheetClose onClose={onClose} />
      </div>
      {kind === 'water' && <WaterCapture />}
      {kind === 'weight' && <WeightCapture onClose={onClose} />}
      {kind === 'blood' && <BloodCapture onClose={onClose} />}
    </BottomSheet>
  )
}

function WaterCapture() {
  const { water, addWaterEntry } = useAppStore()
  const todayMl = water
    .filter(w => w.date === today())
    .reduce((s, w) => s + w.amountMl, 0)

  return (
    <div>
      <div className="flex gap-1.5 flex-wrap">
        {[100, 250, 500].map(ml => (
          <Chip key={ml} onClick={() => addWaterEntry({ date: today(), amountMl: ml })}>
            +{ml} ml
          </Chip>
        ))}
      </div>
      <div className="text-[12px] font-semibold mt-2.5">
        today {(todayMl / 1000).toFixed(1)} L
        <span className="text-ink-2 font-normal"> · goal {(WATER_GOAL_ML / 1000).toFixed(1)} L</span>
      </div>
      <div className="text-[9px] text-ink-3 mt-1.5">
        An FRS input, not a score — each tap logs immediately.
      </div>
    </div>
  )
}

const roundTenth = (v: number): number => Math.round(v * 10) / 10

function WeightCapture({ onClose }: { onClose: () => void }) {
  const { bodyweight, addBodyweightEntry } = useAppStore()
  // Store keeps bodyweight sorted newest-first; prefill from the last entry.
  const [kg, setKg] = useState(() => bodyweight[0]?.weight ?? 80.0)
  const last = bodyweight[0]

  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className="text-[25px] font-bold tracking-[-0.02em]">{kg.toFixed(1)}</span>
        <span className="text-[11px] text-ink-2">kg</span>
      </div>
      <div className="flex gap-1.5 mt-2">
        {[-1, -0.1, +0.1, +1].map(step => (
          <Chip key={step} onClick={() => setKg(v => roundTenth(v + step))}>
            {step > 0 ? `+ ${step}` : `− ${Math.abs(step)}`}
          </Chip>
        ))}
      </div>
      <div className="mt-3">
        <Chip
          solid
          onClick={async () => {
            await addBodyweightEntry({ date: today(), weight: kg })
            onClose()
          }}
        >
          Log {kg.toFixed(1)} kg
        </Chip>
      </div>
      <div className="text-[9px] text-ink-3 mt-1.5">
        {last ? `prefilled from ${last.date} (${last.weight.toFixed(1)} kg) — step to today, then log` : 'no entries yet — step to today, then log'}
      </div>
    </div>
  )
}

function BloodCapture({ onClose }: { onClose: () => void }) {
  const { addDonationEntry } = useAppStore()
  return (
    <div>
      <Chip
        solid
        onClick={async () => {
          await addDonationEntry({ date: today(), type: 'Full Blood', notes: '' })
          onClose()
        }}
      >
        Full donation — today
      </Chip>
      <div className="text-[9px] text-ink-3 mt-2 text-pretty">
        A full donation holds training for {DONATION_SUPPRESSION.acuteHours} h and
        suppresses aerobic work for ~{DONATION_SUPPRESSION.aerobicTailDays} d
        (PLACEHOLDER) — it lands on the readiness gate, not on the map.
      </div>
    </div>
  )
}
