import type { SVGProps } from 'react'

// The SIGNAL icon set (design-system §7): stroke SVGs on a 24 viewBox,
// stroke-width 1.8, round caps and joins, no fills, currentColor. 18px in the
// nav, 13px inline. This module is the whole set — no icon font, no emoji in
// app chrome. Emoji inside *data* (exercise names, notes) are content and are
// left alone.

export type IconName =
  | 'home' | 'weights' | 'cardio' | 'program' | 'menu' | 'mobility'
  | 'adaptations' | 'profile' | 'admin' | 'assistant'
  | 'close' | 'trash' | 'edit' | 'chevronDown' | 'chevronUp' | 'plus' | 'check'
  | 'warmup' | 'sport' | 'recovery' | 'drag' | 'export' | 'import'
  | 'info' | 'list'

/** Path geometry only — the wrapper below carries every shared stroke rule. */
const PATHS: Record<IconName, string> = {
  // A roof over a doorway — the surface that answers without tapping.
  home: 'M3 10.5 12 3.5l9 7M5.5 9v11h13V9M10 20v-6h4v6',
  // A loaded barbell: sleeve, collar, bar.
  weights: 'M3 9v6M6.5 6.5v11M17.5 6.5v11M21 9v6M6.5 12h11',
  // Heart rate as a trace, not a heart — cardio is measured, not felt.
  cardio: 'M3 12h4l2.5-6 4 12 2.5-6h5',
  // A dated plan: a sheet with a bound top edge and ruled lines.
  program: 'M6 3.5h12a1.5 1.5 0 0 1 1.5 1.5v15a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V5A1.5 1.5 0 0 1 6 3.5ZM9 3.5v3M15 3.5v3M8 12h8M8 16h5',
  menu: 'M4 7h16M4 12h16M4 17h16',
  // A figure held in a lunge — one leg extended, one bent, arms reaching.
  mobility: 'M13.9 5.2a1.9 1.9 0 1 1-3.8 0 1.9 1.9 0 0 1 3.8 0M12 7.1v5.4M7.6 10.6 12 9.1l4.4 1.5M12 12.5 8 20M12 12.5l4 4.2-1 3.3',
  // Overlapping rings — the qualities read together, not alone.
  adaptations: 'M9.5 8.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM14.5 6.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z',
  profile: 'M12 3.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4.5 20.5c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6',
  admin: 'M4 7h10M18 7h2M4 17h2M10 17h10M16 4.5v5M8 14.5v5',
  // A speech frame — the assistant answers in words.
  assistant: 'M4.5 5.5h15v11h-9L6 20.5V16.5H4.5Z',
  close: 'M6 6l12 12M18 6 6 18',
  trash: 'M4 6.5h16M9.5 6.5V4h5v2.5M6.5 6.5 7.5 20h9l1-13.5M10.5 10v6M13.5 10v6',
  edit: 'M4 20h4l10.5-10.5a2 2 0 0 0-2.8-2.8L5 17.5ZM15 6.5l2.5 2.5',
  chevronDown: 'M6 9.5 12 15.5l6-6',
  chevronUp: 'M6 14.5 12 8.5l6 6',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5 10 17.5 19 7',
  // A flame — the warm-up block.
  warmup: 'M12 3C9 6.5 6.5 9.5 6.5 13.5a5.5 5.5 0 0 0 11 0c0-2.4-1.2-4.4-2.8-6-.3 2.1-1.3 3.2-2.4 3.2-1.3 0-2-1.3-1.7-3C10.9 6.2 11.4 4.6 12 3Z',
  // A ball — the sport block.
  sport: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17M12 3.5v4.2M20 9.6l-4 2.9M17 19.4l-1.5-4.6M7 19.4l1.5-4.6M4 9.6l4 2.9M12 7.7l4 2.8-1.5 4.3h-5L8 10.5Z',
  // A crescent — rest, the recovery block and the rest-day banner.
  recovery: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z',
  // A grip: two short rules. Narrower than `menu` so a drag handle never
  // reads as the hamburger it sits a few pixels away from.
  drag: 'M7 9.5h10M7 14.5h10',
  // Out of the tray, and into it — the two halves of the clipboard round-trip.
  export: 'M12 15V3.5M8.5 7 12 3.5 15.5 7M4.5 14v5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-5',
  import: 'M12 3.5V15M8.5 11.5 12 15l3.5-3.5M4.5 14v5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-5',
  // A ring with an i — "how to train it", the prescription behind a read.
  info: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17M12 11v5M12 7.6h.01',
  // Three ruled rows with a leading dot each — the ranked list.
  list: 'M8.5 7h11.5M8.5 12H20M8.5 17H20M4.5 7h.01M4.5 12h.01M4.5 17h.01',
}

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  /** Rendered size in px — 18 in the nav, 13 inline (§7). */
  size?: number
}

export function Icon({ name, size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
