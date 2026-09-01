import type { ReactNode, HTMLAttributes } from 'react'

// SIGNAL surfaces (design-system §§2, 5, 6): white card, 1px `line` border,
// 3px radius, 7–10px padding. Section labels are 9px uppercase and tracked.

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`bg-white border border-line rounded-[3px] p-2.5 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function SecTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[9px] font-bold text-ink-3 uppercase tracking-[0.14em] mb-2 ${className}`}>
      {children}
    </p>
  )
}

export function EmptyMsg({ children }: { children: ReactNode }) {
  return <p className="text-xs text-ink-3 text-center py-6">{children}</p>
}
