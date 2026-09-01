import { useState } from 'react'
import { ADAPTATIONS, ADAPTATION_PRINCIPLE } from '../../../constants/adaptations'
import { Card } from '../../ui/Card'
import { AdaptationRxTable } from './AdaptationRx'

/** Collapsible "How to train each adaptation" reference (all seven). */
export function AdaptationGuide() {
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between text-left active:scale-[0.99] transition-transform"
      >
        <span className="text-xs font-semibold text-muted uppercase tracking-wide">
          📖 How to train each adaptation
        </span>
        <span className="text-muted text-xs">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-[11px] text-muted italic leading-snug">{ADAPTATION_PRINCIPLE}</p>
          {ADAPTATIONS.map(a => (
            <div key={a.key} className="rounded-lg p-2.5 bg-bg" style={{ borderLeft: `3px solid ${a.color}` }}>
              <p className="text-xs font-bold text-primary mb-1.5">
                {a.icon} {a.label} <span className="font-normal text-muted">· {a.summary}</span>
              </p>
              <AdaptationRxTable rx={a.rx} />
            </div>
          ))}
          <p className="text-[10px] text-muted italic">
            Based on the Huberman Lab × Dr. Andy Galpin guest series on physical adaptations.
          </p>
        </div>
      )}
    </Card>
  )
}
