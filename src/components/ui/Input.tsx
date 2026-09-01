import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react'

// SIGNAL fields (design-system §§2, 5, 6): white ground, 1px `line` border
// that goes ink on focus, 3px radius, 12px value, 9px uppercase tracked label.
export const FIELD =
  'w-full min-w-0 border border-line rounded-[3px] px-2.5 py-2 text-xs bg-white text-ink placeholder:text-ink-4 focus:outline-none focus:border-ink transition-colors'

export const FIELD_LABEL = 'text-[9px] font-bold uppercase tracking-[0.14em] text-ink-3'

interface InpProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Inp({ label, className = '', ...props }: InpProps) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      {label && <label className={FIELD_LABEL}>{label}</label>}
      <input className={`${FIELD} ${className}`} {...props} />
    </div>
  )
}

interface SelElProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
  children?: ReactNode
}

export function SelEl({ label, options, className = '', children, ...props }: SelElProps) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      {label && <label className={FIELD_LABEL}>{label}</label>}
      <select className={`${FIELD} ${className}`} {...props}>
        {children ?? options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
