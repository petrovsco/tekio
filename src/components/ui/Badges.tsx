// Small uppercase tracked text (design-system §5) in both of its bands: the
// 7–8px bordered badges below, and the 9px section label above them. No badge
// is urgency, so none takes the accent (§1): a superset is a fact about the
// exercise. Solid ink marks the label that changes what you do today; the
// outline marks the quieter one.

/** The tighter of §5's two 9px section labels (0.10em; `FIELD_LABEL` in
 *  `ui/Input.tsx` is the 0.14em one). Six spans across five files were typing
 *  this string out. */
export const MICRO_LABEL = 'text-[9px] font-bold uppercase tracking-[0.10em] text-ink-3'

export function SSBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-[2px] rounded-[2px] bg-ink text-white text-[8px] font-bold uppercase tracking-[0.08em]">
      SS
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
