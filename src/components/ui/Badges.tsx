// Micro labels (design-system §5, 7–8px, 0.06–0.08em). Neither of these is
// urgency, so neither takes the accent (§1): a superset is a fact about the
// exercise and a deload is a fact about the cycle. Solid ink marks the label
// that changes what you do today; the outline marks the quieter one.

export function SSBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-[2px] rounded-[2px] bg-ink text-white text-[8px] font-bold uppercase tracking-[0.08em]">
      SS
    </span>
  )
}

export function DeloadBadge({ week }: { week?: number }) {
  return (
    <span className="inline-flex items-center px-[6px] py-[2px] rounded-[2px] border border-ink text-ink text-[8px] font-bold uppercase tracking-[0.08em]">
      {week ? `Deload · Wk ${week}` : 'Deload'}
    </span>
  )
}

/** A stated fact on a history row — provenance, a trainer, a match result.
 *  All of them are outline: none is an urgency (§1), and none changes what
 *  you do today, which is what the solid tone above is reserved for. */
export function MicroLabel({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center px-[6px] py-[2px] rounded-[2px] border border-line text-ink-2 text-[8px] font-bold uppercase tracking-[0.08em]">
      {children}
    </span>
  )
}
