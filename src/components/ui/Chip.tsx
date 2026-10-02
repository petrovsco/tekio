import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  children: ReactNode
  small?: boolean
}

/**
 * The SIGNAL chip (design-system §8): 11px / 600, 3px radius, 1px ink border.
 * Two tones — outline is the unselected / reversible state, solid ink is the
 * one that is chosen or commits. Square, not pill: 3px is the card radius and
 * chips sit on cards.
 */
export function Chip({ active, children, small, className = '', ...props }: ChipProps) {
  const tone = active
    ? 'bg-ink text-white border-ink'
    : 'bg-white text-ink-2 border-line hover:border-ink hover:text-ink'
  const size = small ? 'px-2 py-[3px] text-[10px]' : 'px-2.5 py-[5px] text-[11px]'

  return (
    <button
      className={`${size} font-semibold rounded-[3px] border cursor-pointer transition-colors ${tone} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
