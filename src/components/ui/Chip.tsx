import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { VariantGroup } from '../../lib/utils'
import type { DayOfWeek } from '../../types'

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

interface VariantChipsProps {
  group: VariantGroup
  /** Whether the variant (not the base) is the active day this week. */
  on: boolean
  onToggle: (dayOfWeek: DayOfWeek, variantActive: boolean) => void
}

/**
 * The base ⇄ variant choice for one weekday: two chips, exactly one selected.
 *
 * ProgramTab lists a row per weekday that has a variant, TodaysPlan shows only
 * today's, and the two rows differ in their wrapper and leading label — so each
 * caller keeps those and shares this pair (roadmap 048 B8).
 */
export function VariantChips({ group, on, onToggle }: VariantChipsProps) {
  return (
    <>
      <Chip active={!on} onClick={() => onToggle(group.weekday, false)} className="flex-1 truncate">
        {group.base?.name ?? 'Base'}
      </Chip>
      <Chip active={on} onClick={() => onToggle(group.weekday, true)} className="flex-1 truncate">
        {group.variant.name}
      </Chip>
    </>
  )
}
