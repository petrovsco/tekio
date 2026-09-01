import { useState } from 'react'
import { useAppStore } from '../../store/app'
import { Btn } from '../ui/Button'
import { Inp } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { Toggle } from '../ui/Fields'
import { today } from '../../lib/utils'

interface ExportPaneProps {
  onClose: () => void
}

const RANGE_OPTS = [
  { value: 'from', label: 'From a date' },
  { value: 'all', label: 'Everything' },
]

export function ExportPane({ onClose }: ExportPaneProps) {
  const store = useAppStore()
  const [fromDate, setFromDate] = useState(today())
  const [exportAll, setExportAll] = useState(false)

  const doExport = () => {
    const cutoff = exportAll ? '' : fromDate
    const f = <T extends { date: string }>(arr: T[]) => cutoff ? arr.filter(e => e.date >= cutoff) : arr

    const filtered = {
      weights: f(store.weights),
      bodyweight: f(store.bodyweight),
      cardio: f(store.cardio),
      mobility: f(store.mobility),
      sports: f(store.sports),
      donations: f(store.donations),
      water: f(store.water),
      sleep: f(store.sleep),
      sauna: f(store.sauna),
      cold: f(store.cold),
      programs: store.programs,
    }
    const json = JSON.stringify(filtered, null, 2)

    // Copy to clipboard
    const ta = document.createElement('textarea')
    ta.value = json
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    let ok = false
    try { ok = document.execCommand('copy') } catch { /* noop */ }
    document.body.removeChild(ta)

    store.setToast(ok
      ? `Copied ${filtered.weights.length} weight entries (${Math.round(json.length / 1024)}KB)`
      : 'Copy failed — try manual copy.'
    )
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Export data"
      footer={
        <div className="flex gap-2">
          <Btn onClick={doExport} className="flex-1">Copy to clipboard</Btn>
          <Btn onClick={onClose} variant="secondary" className="flex-1">Cancel</Btn>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs text-ink-2 leading-[1.4]">
          Copies your entries to the clipboard as JSON.
        </p>
        {/* A checkbox has no tone in this system; the range is a one-of-two
            choice, so it reads as the shared toggle (§8). */}
        <Toggle
          label="Range"
          options={RANGE_OPTS}
          value={exportAll ? 'all' : 'from'}
          onPick={v => setExportAll(v === 'all')}
        />
        {!exportAll && (
          <Inp label="From date" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        )}
      </div>
    </Modal>
  )
}
