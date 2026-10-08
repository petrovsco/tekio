import { useAppStore } from '../../../store/app'
import { DONATION_SUPPRESSION } from '../../../constants/app'
import { today, fmtDate } from '../../../lib/utils'
import { BottomSheet, SheetHeader, Chip, Recent, StepperCapture } from './BottomSheet'

// The two folded captures (WEIGHT / BLOOD) as one T2 bottom sheet
// (roadmap 018 unit 3, design-system §8). Blood is a readiness
// input, weight is a Home stat — none of them is a destination (doctrine P3).

export type FoldKind = 'weight' | 'blood'

interface FoldSheetProps {
  kind: FoldKind
  onClose: () => void
}

const TITLES: Record<FoldKind, string> = {
  weight: 'LOG WEIGHT',
  blood: 'LOG BLOOD',
}

export default function FoldSheet({ kind, onClose }: FoldSheetProps) {
  return (
    <BottomSheet onClose={onClose} label={TITLES[kind]}>
      <SheetHeader eyebrow={TITLES[kind]} onClose={onClose} className="mb-2" />
      {kind === 'weight' && <WeightCapture onClose={onClose} />}
      {kind === 'blood' && <BloodCapture onClose={onClose} />}
    </BottomSheet>
  )
}

function WeightCapture({ onClose }: { onClose: () => void }) {
  const bodyweight = useAppStore(s => s.bodyweight)
  const addBodyweightEntry = useAppStore(s => s.addBodyweightEntry)
  const openEditModal = useAppStore(s => s.openEditModal)
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
          label={e => `${fmtDate(e.date)} · ${e.weight.toFixed(1)}`}
          onEdit={e => openEditModal({ type: 'bodyweight', record: e })}
        />
      }
      note={last
        ? `prefilled from ${fmtDate(last.date)} (${last.weight.toFixed(1)} kg) — step to today, then log`
        : 'no entries yet — step to today, then log'}
    />
  )
}

function BloodCapture({ onClose }: { onClose: () => void }) {
  const donations = useAppStore(s => s.donations)
  const addDonationEntry = useAppStore(s => s.addDonationEntry)
  const openEditModal = useAppStore(s => s.openEditModal)
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
        label={e => `${fmtDate(e.date)} · ${e.type}`}
        onEdit={e => openEditModal({ type: 'donation', record: e })}
      />
      <div className="text-[9px] text-ink-3 mt-2 text-pretty">
        A full donation holds training for {DONATION_SUPPRESSION.acuteHours} h and
        suppresses aerobic work for ~{DONATION_SUPPRESSION.aerobicTailDays} d
        — it lands on the readiness gate, not on the map.
      </div>
    </div>
  )
}
