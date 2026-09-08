import { useAppStore } from '../../../store/app'
import { WATER_GOAL_ML, DONATION_SUPPRESSION } from '../../../constants/app'
import { today } from '../../../lib/utils'
import { BottomSheet, SheetHeader, Chip, Recent, StepperCapture } from './BottomSheet'

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
      <SheetHeader eyebrow={TITLES[kind]} onClose={onClose} className="mb-2" />
      {kind === 'water' && <WaterCapture />}
      {kind === 'weight' && <WeightCapture onClose={onClose} />}
      {kind === 'blood' && <BloodCapture onClose={onClose} />}
    </BottomSheet>
  )
}

function WaterCapture() {
  const { water, addWaterEntry, openEditModal } = useAppStore()
  const todayEntries = water.filter(w => w.date === today())
  const todayMl = todayEntries.reduce((s, w) => s + w.amountMl, 0)

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
      <Recent entries={todayEntries} label={e => `${e.amountMl} ml`} onEdit={e => openEditModal({ type: 'water', record: e })} />
      <div className="text-[9px] text-ink-3 mt-1.5">
        An FRS input, not a score — each tap logs immediately.
      </div>
    </div>
  )
}

function WeightCapture({ onClose }: { onClose: () => void }) {
  const { bodyweight, addBodyweightEntry, openEditModal } = useAppStore()
  // Store keeps bodyweight sorted newest-first; prefill from the last entry.
  const last = bodyweight[0]

  return (
    <StepperCapture
      initial={last?.weight ?? 80.0}
      unit="kg"
      steps={[-1, -0.1, +0.1, +1]}
      logLabel={kg => `Log ${kg} kg`}
      onLog={async kg => {
        await addBodyweightEntry({ date: today(), weight: kg })
        onClose()
      }}
      recent={
        <Recent
          entries={bodyweight.slice(0, 4)}
          label={e => `${e.date.slice(5)} · ${e.weight.toFixed(1)}`}
          onEdit={e => openEditModal({ type: 'bodyweight', record: e })}
        />
      }
      note={last
        ? `prefilled from ${last.date} (${last.weight.toFixed(1)} kg) — step to today, then log`
        : 'no entries yet — step to today, then log'}
    />
  )
}

function BloodCapture({ onClose }: { onClose: () => void }) {
  const { donations, addDonationEntry, openEditModal } = useAppStore()
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
      <Recent
        entries={donations.slice(0, 3)}
        label={e => `${e.date} · ${e.type}`}
        onEdit={e => openEditModal({ type: 'donation', record: e })}
      />
      <div className="text-[9px] text-ink-3 mt-2 text-pretty">
        A full donation holds training for {DONATION_SUPPRESSION.acuteHours} h and
        suppresses aerobic work for ~{DONATION_SUPPRESSION.aerobicTailDays} d
        (PLACEHOLDER) — it lands on the readiness gate, not on the map.
      </div>
    </div>
  )
}
