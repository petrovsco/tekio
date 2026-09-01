import { FIELD_LABEL } from './Input'

// Field furniture shared by every capture form (design-system §§5, 8). These
// three started life inside EditModal (roadmap 026); the Cardio sweep (028)
// needed the same controls on the page itself, so they live here rather than
// existing twice and drifting apart.

/** The 9px uppercase tracked label that sits above a control without its own. */
export function FieldLabel({ children }: { children: string }) {
  return <p className={`${FIELD_LABEL} mb-1`}>{children}</p>
}

/** A one-of-N choice. Solid ink is the chosen option, outline the rest (§8). */
export function Toggle<T extends string | boolean>({ options, value, onPick, label }: {
  options: { value: T; label: string }[]
  value: T | ''
  onPick: (v: T) => void
  /** Omitted when the control is a mode switch rather than a labelled field. */
  label?: string
}) {
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="flex gap-1.5">
        {options.map(o => (
          <button
            key={String(o.value)}
            onClick={() => onPick(o.value)}
            className={`flex-1 py-2 rounded-[3px] text-[11px] font-semibold border cursor-pointer transition-colors ${
              value === o.value
                ? 'border-ink bg-ink text-white'
                : 'border-line bg-white text-ink-2 hover:border-ink hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const RATING_STEPS = [1, 2, 3, 4, 5]

/** A 1–5 rating as filled squares — the same polarity as the whole-body
 *  quality tiles (§4). Ink means "counted"; a star would need a colour. */
export function Rating({ label, value, onPick }: { label: string; value: number; onPick: (v: number) => void }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex gap-1.5 items-center">
        {RATING_STEPS.map(s => (
          <button
            key={s}
            aria-label={`${s} of 5`}
            onClick={() => onPick(value === s ? 0 : s)}
            className={`w-7 h-7 rounded-[2px] border cursor-pointer transition-colors ${
              s <= value ? 'bg-ink border-ink' : 'bg-white border-line hover:border-ink'
            }`}
          />
        ))}
        {value > 0 && <span className="text-[11px] text-ink-3 ml-1 tabular-nums">{value}/5</span>}
      </div>
    </div>
  )
}

/** The read-only rating, for a history row: the same squares at micro size. */
export function RatingRead({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-label={`Quality ${value} of 5`}>
      {RATING_STEPS.map(s => (
        <span
          key={s}
          className={`w-2 h-2 rounded-[1px] border ${s <= value ? 'bg-ink border-ink' : 'bg-white border-line'}`}
        />
      ))}
    </span>
  )
}
