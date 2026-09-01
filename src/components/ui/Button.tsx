import { useState } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon } from './Icon'

// Control tones (design-system §8). Colour is not one of them: the accent has
// exactly one meaning (§1), so a destructive control cannot borrow it. The
// three tones are solid ink = the commit, outline = the reversible action, and
// a 2px ink border for the destructive commit — 2px being the weight §6
// reserves for true emphasis.
type Variant = 'primary' | 'secondary' | 'danger' | 'ss' | 'ghost'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-ink text-white border border-ink hover:opacity-90',
  secondary: 'bg-white text-ink border border-ink hover:bg-hairline',
  danger: 'bg-white text-ink border-2 border-ink hover:bg-hairline',
  // A superset save is still a commit; the old purple dies with 033.
  ss: 'bg-ink text-white border border-ink hover:opacity-90',
  ghost: 'border border-transparent text-ink-3 hover:text-ink',
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
  small?: boolean
}

export function Btn({ variant = 'primary', children, small, className = '', ...props }: BtnProps) {
  return (
    <button
      className={`${small ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-2 text-xs'} font-semibold rounded-[3px] cursor-pointer transition-opacity disabled:opacity-40 disabled:cursor-default ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface DelBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
  noConfirm?: boolean
}

export function DelBtn({ label = 'Delete', onClick, noConfirm = false, className = '', ...rest }: DelBtnProps) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    // The confirmation step is what makes this safe, so the pair reads with the
    // chip tones (§8): solid ink commits, outline backs out.
    return (
      <span className="inline-flex items-center gap-1">
        <button
          onClick={e => { setConfirming(false); onClick?.(e) }}
          className="px-2 py-0.5 text-[11px] font-semibold text-white bg-ink border border-ink rounded-[3px] cursor-pointer"
        >
          Yes
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-2 py-0.5 text-[11px] font-semibold text-ink border border-ink bg-white rounded-[3px] cursor-pointer"
        >
          No
        </button>
      </span>
    )
  }

  return (
    <button
      aria-label={label}
      onClick={noConfirm ? onClick : () => setConfirming(true)}
      className={`w-7 h-7 flex items-center justify-center text-ink-3 hover:text-ink rounded-[2px] cursor-pointer transition-colors ${className}`}
      {...rest}
    >
      <Icon name="trash" size={14} />
    </button>
  )
}

export function EditBtn({ label = 'Edit', className = '', ...props }: DelBtnProps) {
  return (
    <button
      aria-label={label}
      className={`w-7 h-7 flex items-center justify-center text-ink-3 hover:text-ink rounded-[2px] cursor-pointer transition-colors ${className}`}
      {...props}
    >
      <Icon name="edit" size={13} />
    </button>
  )
}
